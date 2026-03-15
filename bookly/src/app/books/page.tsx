"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import BookSearchResult from "@/components/BookSearchResult";
import Spinner from "@/components/Spinner";
import { useBookSearch } from "@/hooks/useBooks";

export default function BooksPage() {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: results, isLoading } = useBookSearch(searchTerm);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchTerm(query.trim());
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Books</h1>

        <form onSubmit={handleSearch} className="flex gap-2 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, or ISBN..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
        </form>

        {isLoading && <Spinner className="py-12" />}

        {results && results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {results.map((book: { google_books_id: string; title: string; author: string | null; cover_url: string | null; page_count: number | null; genre: string | null; description: string | null; rating: number | null; ratings_count: number | null }) => (
              <BookSearchResult key={book.google_books_id} book={book} />
            ))}
          </div>
        )}

        {results && results.length === 0 && searchTerm && (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">
              No books found for &quot;{searchTerm}&quot;
            </p>
          </div>
        )}
      </main>
    </>
  );
}
