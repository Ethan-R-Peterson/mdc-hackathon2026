import type { SupabaseClient } from "@supabase/supabase-js";
import type { Book } from "@/types";
import { searchGoogleBooks } from "@/lib/google-books";

interface ScoredBook extends Book {
  score: number;
}

/**
 * Recommendation scoring weights:
 *
 * genre_match       (3x) - book's genre matches a genre the user has read
 * author_match      (4x) - book's author matches an author the user or their group has read
 * similar_length    (1x) - page count within 20% of user's average
 * group_popularity  (3x) - normalized count of group members reading this book
 * global_popularity (1x) - normalized count of all users reading this book
 * rating            (2x) - Google Books average rating normalized to 0-1 (rating / 5)
 * ratings_count     (1x) - log-scaled review count normalized 0-1
 *
 * Max theoretical score: 3 + 4 + 1 + 3 + 1 + 2 + 1 = 15
 */
export async function getRecommendations(
  supabase: SupabaseClient,
  userId: string
): Promise<ScoredBook[]> {
  // 1. Get user's books (for genre, author matching + exclusion)
  const { data: userBooks } = await supabase
    .from("user_books")
    .select("book_id, book:books(genre, page_count, author)")
    .eq("user_id", userId);

  const readBookIds = new Set(userBooks?.map((ub) => ub.book_id) ?? []);

  // User's genres, authors, and average page count
  const userGenres = new Set<string>();
  const userAuthors = new Set<string>();
  let totalPages = 0;
  let pageCountBooks = 0;

  for (const ub of userBooks ?? []) {
    const book = ub.book as unknown as {
      genre: string | null;
      page_count: number | null;
      author: string | null;
    } | null;
    if (book?.genre) userGenres.add(book.genre);
    if (book?.author) {
      // Split comma-separated authors and add each
      for (const a of book.author.split(",")) {
        userAuthors.add(a.trim().toLowerCase());
      }
    }
    if (book?.page_count) {
      totalPages += book.page_count;
      pageCountBooks++;
    }
  }

  const avgPageCount = pageCountBooks > 0 ? totalPages / pageCountBooks : 300;

  // 2. Get user's group member IDs
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", userId);

  const groupIds = myMemberships?.map((m) => m.group_id) ?? [];

  let groupMemberIds: string[] = [];
  if (groupIds.length > 0) {
    const { data: groupMembers } = await supabase
      .from("group_members")
      .select("user_id")
      .in("group_id", groupIds);

    groupMemberIds = [
      ...new Set(
        (groupMembers ?? [])
          .map((gm) => gm.user_id)
          .filter((id) => id !== userId)
      ),
    ];
  }

  // 3. Get books read by group members (group popularity + group authors)
  const groupBookCounts: Record<string, number> = {};
  const groupAuthors = new Set<string>();

  if (groupMemberIds.length > 0) {
    const { data: groupUserBooks } = await supabase
      .from("user_books")
      .select("book_id, book:books(author)")
      .in("user_id", groupMemberIds);

    for (const gub of groupUserBooks ?? []) {
      groupBookCounts[gub.book_id] =
        (groupBookCounts[gub.book_id] ?? 0) + 1;
      const book = gub.book as unknown as { author: string | null } | null;
      if (book?.author) {
        for (const a of book.author.split(",")) {
          groupAuthors.add(a.trim().toLowerCase());
        }
      }
    }
  }

  // Combined known authors (user + group)
  const knownAuthors = new Set([...userAuthors, ...groupAuthors]);

  // 4. Get all books with global popularity counts
  const { data: allUserBooks } = await supabase
    .from("user_books")
    .select("book_id");

  const globalBookCounts: Record<string, number> = {};
  for (const aub of allUserBooks ?? []) {
    globalBookCounts[aub.book_id] =
      (globalBookCounts[aub.book_id] ?? 0) + 1;
  }

  // 5. Get candidate books from DB
  const { data: dbBooks } = await supabase
    .from("books")
    .select("*")
    .limit(200);

  let candidateBooks = (dbBooks ?? []).filter((b) => !readBookIds.has(b.id));

  // If not enough local candidates, fetch from Google Books based on
  // the user's genres and authors, cache them, and add to the pool
  if (candidateBooks.length < 10) {
    const searchTerms: string[] = [];
    for (const genre of userGenres) searchTerms.push(genre);
    for (const author of userAuthors) searchTerms.push(author);
    if (searchTerms.length === 0) searchTerms.push("popular fiction");

    // Search up to 3 terms to get a diverse pool
    const fetchedBooks: typeof candidateBooks = [];
    for (const term of searchTerms.slice(0, 3)) {
      try {
        const volumes = await searchGoogleBooks(term);
        for (const v of volumes) {
          if (!v.volumeInfo.title) continue;
          // Skip if already in DB
          const existsInDb = (dbBooks ?? []).some(
            (b) => b.google_books_id === v.id
          );
          const existsInFetched = fetchedBooks.some(
            (b) => b.google_books_id === v.id
          );
          if (existsInDb || existsInFetched) continue;

          const bookData = {
            google_books_id: v.id,
            title: v.volumeInfo.title,
            author: v.volumeInfo.authors?.join(", ") ?? null,
            cover_url: v.volumeInfo.imageLinks?.thumbnail ?? null,
            page_count: v.volumeInfo.pageCount ?? null,
            genre: v.volumeInfo.categories?.[0] ?? null,
            description: v.volumeInfo.description ?? null,
            rating: v.volumeInfo.averageRating ?? null,
            ratings_count: v.volumeInfo.ratingsCount ?? null,
          };

          // Cache in DB
          const { data: inserted } = await supabase
            .from("books")
            .upsert(bookData, { onConflict: "google_books_id" })
            .select()
            .single();

          if (inserted) {
            fetchedBooks.push(inserted);
          }
        }
      } catch {
        // Ignore search failures, continue with what we have
      }
    }

    candidateBooks = [...candidateBooks, ...fetchedBooks].filter(
      (b) => !readBookIds.has(b.id)
    );
  }

  if (candidateBooks.length === 0) return [];

  // Normalization values
  const maxGroupPop = Math.max(1, ...Object.values(groupBookCounts));
  const maxGlobalPop = Math.max(1, ...Object.values(globalBookCounts));
  const maxRatingsCount = Math.max(
    1,
    ...candidateBooks.map((b) => b.ratings_count ?? 0)
  );
  // Use log scale for ratings count so a book with 10k reviews doesn't
  // completely dominate one with 500
  const logMaxRatings = Math.log(maxRatingsCount + 1);

  // 6. Score candidates
  const scored: ScoredBook[] = candidateBooks
    .filter((book) => !readBookIds.has(book.id))
    .map((book) => {
      // Genre match (0 or 1)
      const genreMatch =
        book.genre && userGenres.has(book.genre) ? 1 : 0;

      // Author match (0 or 1) — matches if any of the book's authors
      // appear in the user's or group's reading history
      let authorMatch = 0;
      if (book.author) {
        const bookAuthors = book.author
          .split(",")
          .map((a: string) => a.trim().toLowerCase());
        if (bookAuthors.some((a: string) => knownAuthors.has(a))) {
          authorMatch = 1;
        }
      }

      // Similar length (0 or 1)
      const similarLength =
        book.page_count &&
        Math.abs(book.page_count - avgPageCount) / avgPageCount <= 0.2
          ? 1
          : 0;

      // Group popularity (0-1, normalized)
      const groupPop = (groupBookCounts[book.id] ?? 0) / maxGroupPop;

      // Global popularity (0-1, normalized)
      const globalPop = (globalBookCounts[book.id] ?? 0) / maxGlobalPop;

      // Rating (0-1, rating/5)
      const ratingScore = book.rating != null ? book.rating / 5 : 0;

      // Ratings count (0-1, log-normalized)
      const ratingsCountScore =
        book.ratings_count != null && book.ratings_count > 0
          ? Math.log(book.ratings_count + 1) / logMaxRatings
          : 0;

      const score =
        3 * genreMatch +
        4 * authorMatch +
        1 * similarLength +
        3 * groupPop +
        1 * globalPop +
        2 * ratingScore +
        1 * ratingsCountScore;

      return { ...book, score };
    });

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 10);
}
