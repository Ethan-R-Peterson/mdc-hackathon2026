"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useLogPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { userBookId: string; pagesRead: number }) => {
      const res = await fetch("/api/reading-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to log pages");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBooks"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
