import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendations";

// GET /api/recommendations
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const recommendations = await getRecommendations(supabase, user.id);
    return NextResponse.json(recommendations);
  } catch {
    return NextResponse.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
