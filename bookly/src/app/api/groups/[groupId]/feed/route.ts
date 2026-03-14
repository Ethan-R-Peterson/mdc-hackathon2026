import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/groups/[groupId]/feed - get group activity feed
export async function GET(
  request: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { groupId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "20");
  const offset = parseInt(url.searchParams.get("offset") || "0");

  const { data, error } = await supabase
    .from("feed_events")
    .select("*, user:users(id, username, avatar_url)")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
