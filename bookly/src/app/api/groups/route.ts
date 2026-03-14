import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/groups - list user's groups
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("group_members")
    .select("group_id, groups(*)")
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const groups = data?.map((gm) => gm.groups) ?? [];
  return NextResponse.json(groups);
}

// POST /api/groups - create a new group
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await request.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }

  // Generate a 6-char invite code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { data: group, error } = await supabase
    .from("groups")
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      invite_code: inviteCode,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Auto-join the creator to the group
  await supabase.from("group_members").insert({
    group_id: group.id,
    user_id: user.id,
  });

  return NextResponse.json(group, { status: 201 });
}
