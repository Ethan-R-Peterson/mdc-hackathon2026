"use client";

import { useQuery } from "@tanstack/react-query";
import type { Book } from "@/types";

interface ScoredBook extends Book {
  score: number;
}

export function useRecommendations() {
  return useQuery<ScoredBook[]>({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const res = await fetch("/api/recommendations");
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      return res.json();
    },
  });
}
