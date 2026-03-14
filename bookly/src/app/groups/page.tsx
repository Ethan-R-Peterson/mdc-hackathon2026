"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import GroupCard from "@/components/GroupCard";
import { useGroups, useCreateGroup, useJoinGroup } from "@/hooks/useGroups";

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const createGroup = useCreateGroup();
  const joinGroup = useJoinGroup();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createGroup.mutateAsync({ name, description });
      setName("");
      setDescription("");
      setShowCreate(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await joinGroup.mutateAsync(inviteCode);
      setInviteCode("");
      setShowJoin(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to join group");
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Groups</h1>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowJoin(!showJoin);
                setShowCreate(false);
                setError(null);
              }}
              className="px-4 py-2 text-sm border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Join Group
            </button>
            <button
              onClick={() => {
                setShowCreate(!showCreate);
                setShowJoin(false);
                setError(null);
              }}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Create Group
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Create Group Form */}
        {showCreate && (
          <form
            onSubmit={handleCreate}
            className="mb-6 bg-white rounded-xl border border-gray-200 p-5 space-y-3"
          >
            <h2 className="font-semibold text-gray-900">Create a New Group</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Group name"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              disabled={createGroup.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {createGroup.isPending ? "Creating..." : "Create"}
            </button>
          </form>
        )}

        {/* Join Group Form */}
        {showJoin && (
          <form
            onSubmit={handleJoin}
            className="mb-6 bg-white rounded-xl border border-gray-200 p-5 space-y-3"
          >
            <h2 className="font-semibold text-gray-900">Join a Group</h2>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Enter invite code"
              required
              maxLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none uppercase"
            />
            <button
              type="submit"
              disabled={joinGroup.isPending}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {joinGroup.isPending ? "Joining..." : "Join"}
            </button>
          </form>
        )}

        {/* Groups List */}
        {isLoading ? (
          <p className="text-gray-500">Loading groups...</p>
        ) : groups && groups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">
              No groups yet. Create one or join with an invite code!
            </p>
          </div>
        )}
      </main>
    </>
  );
}
