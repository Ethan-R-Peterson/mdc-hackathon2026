"use client";

import type { FeedEvent } from "@/types";

function formatEvent(event: FeedEvent): string {
  const meta = event.metadata as Record<string, unknown>;
  switch (event.event_type) {
    case "started_book":
      return `started reading "${meta.bookTitle}"`;
    case "logged_pages":
      return `logged ${meta.pages} pages in "${meta.bookTitle}" (+${meta.points} pts)`;
    case "finished_book":
      return `finished "${meta.bookTitle}" (+50 pts)`;
    case "streak":
      return `hit a ${meta.streakDays}-day streak! (+${meta.points} pts)`;
    default:
      return "did something";
  }
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function FeedItem({ event }: { event: FeedEvent }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-600 shrink-0">
        {event.user?.username?.[0]?.toUpperCase() ?? "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{event.user?.username ?? "User"}</span>{" "}
          {formatEvent(event)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {timeAgo(event.created_at)}
        </p>
      </div>
    </div>
  );
}
