import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// GET /api/points - get current user's points summary
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: points, error } = await supabase
    .from("points")
    .select("amount, reason, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const total = points?.reduce((sum, p) => sum + p.amount, 0) ?? 0;

  const breakdown = {
    pages: 0,
    finish_book: 0,
    streak_3: 0,
    streak_7: 0,
  };

  for (const p of points ?? []) {
    if (p.reason in breakdown) {
      breakdown[p.reason as keyof typeof breakdown] += p.amount;
    }
  }

  return NextResponse.json({ total, breakdown, history: points });
}
