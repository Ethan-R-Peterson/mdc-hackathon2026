"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useUserBooks } from "@/hooks/useBooks";
import { useLogPages } from "@/hooks/useReadingLogs";

export default function LogPage() {
  const { data: userBooks, isLoading } = useUserBooks();
  const logPages = useLogPages();

  const [selectedBookId, setSelectedBookId] = useState("");
  const [pages, setPages] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const readingBooks = userBooks?.filter((ub) => ub.status === "reading") ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const pagesRead = parseInt(pages);
    if (!selectedBookId) {
      setError("Please select a book");
      return;
    }
    if (isNaN(pagesRead) || pagesRead < 1) {
      setError("Pages must be at least 1");
      return;
    }

    try {
      const result = await logPages.mutateAsync({
        userBookId: selectedBookId,
        pagesRead,
      });

      let msg = `Logged ${pagesRead} pages! +${result.pointsAwarded} points.`;
      if (result.streakBonus > 0) {
        msg += ` Streak bonus: +${result.streakBonus} pts!`;
      }
      if (result.isFinished) {
        msg += ` Book finished! +${result.finishBonus} pts!`;
      }
      if (result.streakDays > 0) {
        msg += ` (${result.streakDays}-day streak)`;
      }

      setSuccess(msg);
      setPages("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to log pages");
    }
  }

  const selectedBook = readingBooks.find((ub) => ub.id === selectedBookId);

  return (
    <>
      <Navbar />
      <main className="max-w-xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Log Pages</h1>

        {isLoading ? (
          <p className="text-gray-500">Loading your books...</p>
        ) : readingBooks.length === 0 ? (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">
              No books in progress. Start reading a book first!
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
          >
            {/* Book Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Book
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select a book...</option>
                {readingBooks.map((ub) => (
                  <option key={ub.id} value={ub.id}>
                    {ub.book?.title} (page {ub.current_page}/
                    {ub.book?.page_count ?? "?"})
                  </option>
                ))}
              </select>
            </div>

            {/* Progress indicator */}
            {selectedBook && selectedBook.book?.page_count && (
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>
                    Page {selectedBook.current_page} of{" "}
                    {selectedBook.book.page_count}
                  </span>
                  <span>
                    {Math.round(
                      (selectedBook.current_page /
                        selectedBook.book.page_count) *
                        100
                    )}
                    % complete
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (selectedBook.current_page / selectedBook.book.page_count) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {/* Pages Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pages Read
              </label>
              <input
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                placeholder="1-100"
                min={1}
                max={9999}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <p className="text-xs text-gray-400 mt-1">
                Max 100 pages per log. 1hr cooldown between logs. 5 logs per
                day.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={logPages.isPending}
              className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {logPages.isPending ? "Logging..." : "Log Pages"}
            </button>
          </form>
        )}
      </main>
    </>
  );
}
