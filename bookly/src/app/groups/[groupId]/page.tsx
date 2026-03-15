"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import FeedItem from "@/components/FeedItem";
import LeaderboardRow from "@/components/LeaderboardRow";
import Spinner from "@/components/Spinner";
import { useFeed } from "@/hooks/useFeed";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useQuery } from "@tanstack/react-query";
import type { Group } from "@/types";

export default function GroupDetailPage() {
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
  const {
    data: feedPages,
    isLoading: feedLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useFeed(groupId);
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(groupId);

  const feedEvents = feedPages?.pages.flat() ?? [];

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {group?.name ?? "Group"}
          </h1>
          {group?.description && (
            <p className="text-gray-500 mt-1">{group.description}</p>
          )}
          {group?.invite_code && (
            <p className="text-sm text-gray-400 mt-1">
              Invite code:{" "}
              <span className="font-mono font-medium text-indigo-600">
                {group.invite_code}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900">Leaderboard</h2>
                <Link
                  href={`/groups/${groupId}/leaderboard`}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  View full
                </Link>
              </div>
              {lbLoading ? (
                <Spinner className="py-4" />
              ) : leaderboard && leaderboard.length > 0 ? (
                leaderboard
                  .slice(0, 5)
                  .map((entry, i) => (
                    <LeaderboardRow
                      key={entry.id}
                      entry={entry}
                      rank={i + 1}
                    />
                  ))
              ) : (
                <p className="text-sm text-gray-400">
                  No points yet. Start reading!
                </p>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">
                Activity Feed
              </h2>
              {feedLoading ? (
                <Spinner className="py-4" />
              ) : feedEvents.length > 0 ? (
                <>
                  {feedEvents.map((event) => (
                    <FeedItem key={event.id} event={event} />
                  ))}
                  {hasNextPage && (
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="mt-4 w-full py-2 text-sm text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                    >
                      {isFetchingNextPage ? "Loading..." : "Load more"}
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">
                  No activity yet. Be the first to log some pages!
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
