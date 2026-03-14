"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserBook } from "@/types";

export function useBookSearch(query: string) {
  return useQuery({
    queryKey: ["bookSearch", query],
    queryFn: async () => {
      const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: query.length >= 2,
  });
}

export function useUserBooks() {
  return useQuery<UserBook[]>({
    queryKey: ["userBooks"],
    queryFn: async () => {
      const res = await fetch("/api/user-books");
      if (!res.ok) throw new Error("Failed to fetch books");
      return res.json();
    },
  });
}

export function useStartReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bookData: {
      google_books_id: string;
      title: string;
      author: string | null;
      cover_url: string | null;
      page_count: number | null;
      genre: string | null;
      description: string | null;
      rating: number | null;
      ratings_count: number | null;
    }) => {
      const res = await fetch("/api/user-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to start reading");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBooks"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
