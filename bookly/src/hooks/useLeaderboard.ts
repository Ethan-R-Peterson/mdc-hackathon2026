"use client";

import { useQuery } from "@tanstack/react-query";
import type { LeaderboardEntry } from "@/types";

export function useLeaderboard(groupId: string) {
  return useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", groupId],
    queryFn: async () => {
      const res = await fetch(`/api/groups/${groupId}/leaderboard`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      return res.json();
    },
  });
}
