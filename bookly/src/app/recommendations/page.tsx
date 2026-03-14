"use client";

import Navbar from "@/components/Navbar";
import BookSearchResult from "@/components/BookSearchResult";
import { useRecommendations } from "@/hooks/useRecommendations";

export default function RecommendationsPage() {
  const { data: recommendations, isLoading } = useRecommendations();

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Recommended For You
        </h1>
        <p className="text-gray-500 mb-6">
          Based on your reading history, genres, and what your groups are
          reading.
        </p>

        {isLoading && <p className="text-gray-500">Finding books for you...</p>}

        {recommendations && recommendations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendations.map((book) => (
              <BookSearchResult
                key={book.id}
                book={{
                  google_books_id: book.google_books_id,
                  title: book.title,
                  author: book.author,
                  cover_url: book.cover_url,
                  page_count: book.page_count,
                  genre: book.genre,
                  description: book.description,
                  rating: book.rating,
                  ratings_count: book.ratings_count,
                }}
              />
            ))}
          </div>
        ) : (
          !isLoading && (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">
                No recommendations yet. Start reading some books and join a
                group to get personalized suggestions!
              </p>
            </div>
          )
        )}
      </main>
    </>
  );
}
