"use client";

import Navbar from "@/components/Navbar";
import { useUserBooks } from "@/hooks/useBooks";
import Link from "next/link";

export default function MyBooksPage() {
  const { data: userBooks, isLoading } = useUserBooks();

  const reading = userBooks?.filter((ub) => ub.status === "reading") ?? [];
  const finished = userBooks?.filter((ub) => ub.status === "finished") ?? [];

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
          <Link
            href="/books"
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Find Books
          </Link>
        </div>

        {isLoading && <p className="text-gray-500">Loading...</p>}

        {/* Currently Reading */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Currently Reading ({reading.length})
        </h2>
        {reading.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {reading.map((ub) => (
              <div
                key={ub.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4"
              >
                {ub.book?.cover_url ? (
                  <img
                    src={ub.book.cover_url}
                    alt={ub.book.title}
                    className="w-16 h-24 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs shrink-0">
                    No cover
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {ub.book?.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {ub.book?.author}
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>
                        Page {ub.current_page}/{ub.book?.page_count ?? "?"}
                      </span>
                      <span>
                        {ub.book?.page_count
                          ? Math.round(
                              (ub.current_page / ub.book.page_count) * 100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{
                          width: `${ub.book?.page_count ? Math.min(100, (ub.current_page / ub.book.page_count) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center mb-8">
            <p className="text-gray-500">
              No books in progress.{" "}
              <Link href="/books" className="text-indigo-600 hover:underline">
                Search for one!
              </Link>
            </p>
          </div>
        )}

        {/* Finished */}
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Finished ({finished.length})
        </h2>
        {finished.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {finished.map((ub) => (
              <div
                key={ub.id}
                className="bg-white rounded-xl border border-gray-200 p-4 flex gap-4 opacity-75"
              >
                {ub.book?.cover_url ? (
                  <img
                    src={ub.book.cover_url}
                    alt={ub.book.title}
                    className="w-16 h-24 object-cover rounded shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs shrink-0">
                    No cover
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {ub.book?.title}
                  </h3>
                  <p className="text-xs text-gray-500 truncate">
                    {ub.book?.author}
                  </p>
                  <span className="inline-block mt-2 text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
                    Finished
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">No finished books yet.</p>
        )}
      </main>
    </>
  );
}
