import { createClient } from "@/lib/supabase/server";
import { searchGoogleBooks } from "@/lib/google-books";
import { NextResponse } from "next/server";

// GET /api/books/search?q=...
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query?.trim()) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  try {
    const volumes = await searchGoogleBooks(query);

    const results = volumes
      .filter((v) => v.volumeInfo.title)
      .map((v) => ({
        google_books_id: v.id,
        title: v.volumeInfo.title,
        author: v.volumeInfo.authors?.join(", ") ?? null,
        cover_url: v.volumeInfo.imageLinks?.thumbnail ?? null,
        page_count: v.volumeInfo.pageCount ?? null,
        genre: v.volumeInfo.categories?.[0] ?? null,
        description: v.volumeInfo.description ?? null,
        rating: v.volumeInfo.averageRating ?? null,
        ratings_count: v.volumeInfo.ratingsCount ?? null,
      }));

    return NextResponse.json(results);
  } catch {
    return NextResponse.json({ error: "Failed to search books" }, { status: 500 });
  }
}
