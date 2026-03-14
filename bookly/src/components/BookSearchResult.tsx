"use client";

import { useStartReading } from "@/hooks/useBooks";
import { useState } from "react";

interface BookResult {
  google_books_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  page_count: number | null;
  genre: string | null;
  description: string | null;
  rating: number | null;
  ratings_count: number | null;
}

function StarRating({
  rating,
  count,
}: {
  rating: number;
  count: number | null;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => {
          const fill = Math.min(1, Math.max(0, rating - (star - 1)));
          return (
            <div key={star} className="relative w-4 h-4">
              <svg
                className="w-4 h-4 text-gray-200"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <svg
                  className="w-4 h-4 text-amber-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>
      <span className="text-xs text-gray-500">
        {rating.toFixed(1)}
        {count != null && (
          <span className="text-gray-400"> ({count.toLocaleString()})</span>
        )}
      </span>
    </div>
  );
}

export default function BookSearchResult({ book }: { book: BookResult }) {
  const startReading = useStartReading();
  const [started, setStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setError(null);
    try {
      await startReading.mutateAsync(book);
      setStarted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed");
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4">
      {book.cover_url ? (
        <img
          src={book.cover_url}
          alt={book.title}
          className="w-20 h-28 object-cover rounded shrink-0"
        />
      ) : (
        <div className="w-20 h-28 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs shrink-0">
          No cover
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 truncate">{book.title}</h3>
        {book.author && (
          <p className="text-sm text-gray-500 truncate">{book.author}</p>
        )}
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
          {book.page_count && <span>{book.page_count} pages</span>}
          {book.genre && <span>{book.genre}</span>}
        </div>
        {book.rating != null && (
          <div className="mt-1.5">
            <StarRating rating={book.rating} count={book.ratings_count} />
          </div>
        )}
        {book.description && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {book.description}
          </p>
        )}
        <div className="mt-3">
          {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
          {started ? (
            <span className="text-sm text-emerald-600 font-medium">
              Added to your books!
            </span>
          ) : (
            <button
              onClick={handleStart}
              disabled={startReading.isPending}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {startReading.isPending ? "Adding..." : "Start Reading"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
