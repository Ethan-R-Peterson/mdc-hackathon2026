import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { checkAndAwardBadges } from "@/lib/gamification";

// GET /api/reviews?bookId=X or ?userId=X
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const bookId = searchParams.get("bookId");
  const userId = searchParams.get("userId");

  if (bookId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, user:users(id, username, avatar_url)")
      .eq("book_id", bookId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (userId) {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, book:books(id, title, author, cover_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "bookId or userId required" }, { status: 400 });
}

// POST /api/reviews — create or update a review
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookId, rating, reviewText, hasSpoilers } = await request.json();

  if (!bookId || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Valid bookId and rating (1-5) required" }, { status: 400 });
  }

  if (reviewText && reviewText.length > 500) {
    return NextResponse.json({ error: "Review text must be 500 characters or less" }, { status: 400 });
  }

  // Verify user finished this book (bookId can be internal UUID or google_books_id)
  let { data: userBook } = await supabase
    .from("user_books")
    .select("id, status, book_id, book:books(id, title, google_books_id)")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .single();

  // If not found by internal ID, try google_books_id
  if (!userBook) {
    const { data: book } = await supabase
      .from("books")
      .select("id")
      .eq("google_books_id", bookId)
      .single();
    if (book) {
      const { data: ub } = await supabase
        .from("user_books")
        .select("id, status, book_id, book:books(id, title, google_books_id)")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .single();
      userBook = ub;
    }
  }

  if (!userBook || userBook.status !== "finished") {
    return NextResponse.json({ error: "You must finish the book before reviewing" }, { status: 400 });
  }

  // Use the actual internal book_id
  const actualBookId = userBook.book_id;

  // Check if review already exists
  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("user_id", user.id)
    .eq("book_id", actualBookId)
    .single();

  let review;
  if (existing) {
    const { data, error } = await supabase
      .from("reviews")
      .update({
        rating,
        review_text: reviewText?.trim() || null,
        has_spoilers: hasSpoilers ?? false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    review = data;
  } else {
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        user_id: user.id,
        book_id: actualBookId,
        rating,
        review_text: reviewText?.trim() || null,
        has_spoilers: hasSpoilers ?? false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    review = data;

    // Award 10 points for first review
    await supabase.from("points").insert({
      user_id: user.id,
      amount: 10,
      reason: "review",
      reference_id: review.id,
    });

    // Feed events
    const bookTitle = (userBook.book as unknown as { title: string })?.title ?? "a book";
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      await supabase.from("feed_events").insert(
        memberships.map((m) => ({
          user_id: user.id,
          group_id: m.group_id,
          event_type: "reviewed_book",
          metadata: {
            bookTitle,
            rating,
            hasReview: !!reviewText?.trim(),
          },
        }))
      );

      // Check for new badges
      const newBadges = await checkAndAwardBadges(supabase, user.id);
      if (newBadges.length > 0) {
        const badgeFeedEvents = newBadges.flatMap((badge) =>
          memberships.map((m) => ({
            user_id: user.id,
            group_id: m.group_id,
            event_type: "earned_badge" as const,
            metadata: { badgeName: badge.name },
          }))
        );
        await supabase.from("feed_events").insert(badgeFeedEvents);
      }
    }
  }

  return NextResponse.json(review, { status: existing ? 200 : 201 });
}
