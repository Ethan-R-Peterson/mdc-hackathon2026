"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Group } from "@/types";

export function useGroups() {
  return useQuery<Group[]>({
    queryKey: ["groups"],
    queryFn: async () => {
      const res = await fetch("/api/groups");
      if (!res.ok) throw new Error("Failed to fetch groups");
      return res.json();
    },
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create group");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useJoinGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to join group");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
