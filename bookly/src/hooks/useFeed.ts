"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import type { FeedEvent } from "@/types";

const PAGE_SIZE = 15;

export function useFeed(groupId: string) {
  return useInfiniteQuery<FeedEvent[]>({
    queryKey: ["feed", groupId],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(
        `/api/groups/${groupId}/feed?limit=${PAGE_SIZE}&offset=${pageParam}`
      );
      if (!res.ok) throw new Error("Failed to fetch feed");
      return res.json();
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined;
      return allPages.reduce((total, page) => total + page.length, 0);
    },
  });
}
