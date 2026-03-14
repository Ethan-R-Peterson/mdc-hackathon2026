import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/groups/[groupId]/leaderboard
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get group members
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("user_id")
    .eq("group_id", groupId);

  if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 });

  const memberIds = members?.map((m) => m.user_id) ?? [];
  if (memberIds.length === 0) return NextResponse.json([]);

  // Get points for all members
  const { data: points, error: pointsError } = await supabase
    .from("points")
    .select("user_id, amount")
    .in("user_id", memberIds);

  if (pointsError) return NextResponse.json({ error: pointsError.message }, { status: 500 });

  // Get user profiles
  const { data: users } = await supabase
    .from("users")
    .select("id, username, avatar_url")
    .in("id", memberIds);

  // Aggregate points per user
  const pointsByUser: Record<string, number> = {};
  for (const p of points ?? []) {
    pointsByUser[p.user_id] = (pointsByUser[p.user_id] ?? 0) + p.amount;
  }

  const leaderboard = (users ?? [])
    .map((u) => ({
      id: u.id,
      username: u.username,
      avatar_url: u.avatar_url,
      total_points: pointsByUser[u.id] ?? 0,
    }))
    .sort((a, b) => b.total_points - a.total_points);

  return NextResponse.json(leaderboard);
}
