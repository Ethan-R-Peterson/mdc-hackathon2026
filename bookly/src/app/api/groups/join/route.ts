import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// POST /api/groups/join - join a group by invite code
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await request.json();
  if (!inviteCode?.trim()) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  // Use security definer function to look up group by invite code
  // (bypasses RLS so non-members can find the group to join)
  const { data: group, error: groupError } = await supabase.rpc(
    "find_group_by_invite_code",
    { code: inviteCode.trim().toUpperCase() }
  );

  if (groupError || !group || group.length === 0) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  const foundGroup = group[0];

  // Check if already a member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", foundGroup.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already a member of this group" }, { status: 409 });
  }

  // Join
  const { error } = await supabase.from("group_members").insert({
    group_id: foundGroup.id,
    user_id: user.id,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(foundGroup, { status: 201 });
}
