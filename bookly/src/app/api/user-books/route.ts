import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/user-books - list current user's books
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("user_books")
    .select("*, book:books(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST /api/user-books - start reading a book
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { google_books_id, title, author, cover_url, page_count, genre, description, rating, ratings_count } =
    await request.json();

  if (!google_books_id || !title) {
    return NextResponse.json({ error: "Book data is required" }, { status: 400 });
  }

  // Upsert book into cache (ignore if already exists)
  const { data: existingBook } = await supabase
    .from("books")
    .select("id")
    .eq("google_books_id", google_books_id)
    .single();

  let bookId: string;

  if (existingBook) {
    bookId = existingBook.id;
  } else {
    const { data: newBook, error: bookError } = await supabase
      .from("books")
      .insert({
        google_books_id,
        title,
        author: author ?? null,
        cover_url: cover_url ?? null,
        page_count: page_count ?? null,
        genre: genre ?? null,
        description: description ?? null,
        rating: rating ?? null,
        ratings_count: ratings_count ?? null,
      })
      .select("id")
      .single();

    if (bookError) return NextResponse.json({ error: bookError.message }, { status: 500 });
    bookId = newBook.id;
  }

  // Check if user already has this book
  const { data: existingUserBook } = await supabase
    .from("user_books")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .single();

  if (existingUserBook) {
    return NextResponse.json(
      { error: `You've already ${existingUserBook.status === "finished" ? "finished" : "started"} this book` },
      { status: 409 }
    );
  }

  // Create user_book
  const { data: userBook, error: ubError } = await supabase
    .from("user_books")
    .insert({
      user_id: user.id,
      book_id: bookId,
      status: "reading",
      current_page: 0,
    })
    .select("*, book:books(*)")
    .single();

  if (ubError) return NextResponse.json({ error: ubError.message }, { status: 500 });

  // Create feed events for all user's groups
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (memberships && memberships.length > 0) {
    await supabase.from("feed_events").insert(
      memberships.map((m) => ({
        user_id: user.id,
        group_id: m.group_id,
        event_type: "started_book",
        metadata: { bookTitle: title },
      }))
    );
  }

  return NextResponse.json(userBook, { status: 201 });
}
