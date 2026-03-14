"use client";

import type { LeaderboardEntry } from "@/types";

export default function LeaderboardRow({
  entry,
  rank,
}: {
  entry: LeaderboardEntry;
  rank: number;
}) {
  const medalColors: Record<number, string> = {
    1: "text-yellow-500",
    2: "text-gray-400",
    3: "text-amber-600",
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <span
        className={`w-6 text-center font-bold text-sm ${medalColors[rank] ?? "text-gray-400"}`}
      >
        {rank}
      </span>
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600 shrink-0">
        {entry.username[0]?.toUpperCase() ?? "?"}
      </div>
      <span className="flex-1 font-medium text-sm text-gray-900">
        {entry.username}
      </span>
      <span className="text-sm font-semibold text-indigo-600">
        {entry.total_points} pts
      </span>
    </div>
  );
}
