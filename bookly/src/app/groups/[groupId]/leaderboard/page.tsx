"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import LeaderboardRow from "@/components/LeaderboardRow";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useQuery } from "@tanstack/react-query";
import type { Group } from "@/types";

export default function LeaderboardPage() {
  const { groupId } = useParams<{ groupId: string }>();

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });

  const group = groups?.find((g) => g.id === groupId);
  const { data: leaderboard, isLoading } = useLeaderboard(groupId);

  // Find the current user's rank
  const topUser = leaderboard?.[0];

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href={`/groups/${groupId}`}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              &larr; Back to {group?.name ?? "group"}
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Leaderboard
            </h1>
          </div>
        </div>

        {/* Top player highlight */}
        {topUser && topUser.total_points > 0 && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl p-6 text-white mb-6">
            <p className="text-sm text-indigo-100 mb-1">Top Reader</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold">
                {topUser.username[0]?.toUpperCase() ?? "?"}
              </div>
              <div>
                <p className="text-xl font-bold">{topUser.username}</p>
                <p className="text-indigo-100">
                  {topUser.total_points} points
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Full leaderboard */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : leaderboard && leaderboard.length > 0 ? (
            leaderboard.map((entry, i) => (
              <LeaderboardRow key={entry.id} entry={entry} rank={i + 1} />
            ))
          ) : (
            <p className="text-sm text-gray-400">
              No points yet. Start reading!
            </p>
          )}
        </div>
      </main>
    </>
  );
}
