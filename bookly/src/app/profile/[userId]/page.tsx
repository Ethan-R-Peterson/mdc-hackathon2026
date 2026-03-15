"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Spinner from "@/components/Spinner";
import ReviewCard from "@/components/ReviewCard";
import { useProfile, useUpdateProfile } from "@/hooks/useProfile";
import { useUserReviews } from "@/hooks/useReviews";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { data, isLoading } = useProfile(userId);
  const { data: reviews } = useUserReviews(userId);
  const updateProfile = useUpdateProfile();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
  }, []);

  useEffect(() => {
    if (data?.profile) {
      setUsername(data.profile.username ?? "");
      setBio(data.profile.bio ?? "");
      setIsPublic(data.profile.is_public);
    }
  }, [data?.profile]);

  const isOwner = currentUserId === userId;

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Spinner className="py-12" />
      </>
    );
  }

  if (!data?.profile) {
    return (
      <>
        <Navbar />
        <main className="max-w-xl mx-auto px-4 py-8 text-center text-gray-500">
          User not found.
        </main>
      </>
    );
  }

  const { profile, stats, recentBooks, badges } = data;

  async function handleSave() {
    await updateProfile.mutateAsync({ userId, username, bio, is_public: isPublic });
    setEditing(false);
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="relative mb-8">
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl" />
          <div className="relative pt-12 px-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 rounded-full bg-white border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-indigo-600 shrink-0">
                {profile.username?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0 pt-6">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                  {profile.username}
                </h1>
            {!editing ? (
              <>
                {profile.bio && (
                  <p className="text-sm text-gray-500 mt-1">{profile.bio}</p>
                )}
                {isOwner && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-xs text-indigo-600 hover:underline mt-1"
                  >
                    Edit Profile
                  </button>
                )}
              </>
            ) : (
              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  maxLength={30}
                  placeholder="Username"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="Write a short bio..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                />
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  Public profile
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={updateProfile.isPending}
                    className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 hover:shadow-md disabled:opacity-50 transition-all duration-200"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>

        {/* Private profile notice */}
        {!stats && !isOwner && (
          <div className="bg-gray-50/50 rounded-xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-4xl mb-3">{"\u{1F512}"}</p>
            <p className="text-gray-500">This profile is private.</p>
          </div>
        )}

        {stats && (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
              {[
                { label: "Points", value: stats.totalPoints },
                { label: "Books Read", value: stats.booksRead },
                { label: "Reading", value: stats.booksInProgress },
                { label: "Reviews", value: stats.reviewCount },
                { label: "Streak", value: `${stats.currentStreak}d` },
                { label: "Best Streak", value: `${stats.longestStreak}d` },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-3 text-center"
                >
                  <div className="text-lg font-bold text-gray-900">
                    {s.value}
                  </div>
                  <div className="text-xs text-gray-400">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-3">
                  Badges
                </h2>
                <div className="flex flex-wrap gap-2">
                  {badges.map((ub) => (
                    <div
                      key={ub.id}
                      className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-3 py-1.5 shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                      title={ub.badge?.description}
                    >
                      <span className="text-lg">
                        {ub.badge?.icon
                          ? String.fromCodePoint(parseInt(ub.badge.icon, 16))
                          : ""}
                      </span>
                      <span className="text-xs font-medium text-amber-700">
                        {ub.badge?.name}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Recent books */}
            {recentBooks.length > 0 && (
              <section className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-3">
                  Books
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {recentBooks.map((ub) => (
                    <div
                      key={ub.id}
                      className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-3 flex gap-3"
                    >
                      {ub.book?.cover_url ? (
                        <img
                          src={ub.book.cover_url}
                          alt={ub.book.title}
                          className="w-10 h-14 object-cover rounded-lg shadow-md shrink-0 hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gray-100 rounded-lg shadow-sm shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {ub.book?.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {ub.book?.author}
                        </p>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${
                            ub.status === "finished"
                              ? "bg-emerald-50 text-emerald-600"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          {ub.status === "finished" ? "Done" : "Reading"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight mb-3">
                  Reviews
                </h2>
                <div className="bg-white rounded-xl shadow-sm px-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
