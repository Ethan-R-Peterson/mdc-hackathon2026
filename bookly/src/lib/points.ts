import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Awards page points (1 per page, max 100 page-points per calendar day).
 * Returns the number of points actually awarded.
 */
export async function awardPagePoints(
  supabase: SupabaseClient,
  userId: string,
  pagesRead: number,
  referenceId: string
): Promise<number> {
  // Get total page points earned today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayPoints } = await supabase
    .from("points")
    .select("amount")
    .eq("user_id", userId)
    .eq("reason", "pages")
    .gte("created_at", todayStart.toISOString());

  const earnedToday = todayPoints?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
  const remaining = Math.max(0, 100 - earnedToday);
  const pointsToAward = Math.min(pagesRead, remaining);

  if (pointsToAward > 0) {
    await supabase.from("points").insert({
      user_id: userId,
      amount: pointsToAward,
      reason: "pages",
      reference_id: referenceId,
    });
  }

  return pointsToAward;
}

/**
 * Awards the +50 finish book bonus.
 */
export async function awardFinishBonus(
  supabase: SupabaseClient,
  userId: string,
  userBookId: string
): Promise<void> {
  await supabase.from("points").insert({
    user_id: userId,
    amount: 50,
    reason: "finish_book",
    reference_id: userBookId,
  });
}

/**
 * Updates streak and awards streak bonuses if milestones are hit.
 * A streak day = calendar day with >= 10 pages logged.
 * Returns any streak bonus awarded (0, 20, or 50).
 */
export async function updateStreak(
  supabase: SupabaseClient,
  userId: string
): Promise<{ streakDays: number; bonus: number }> {
  const today = new Date().toISOString().split("T")[0];

  // Get total pages logged today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: todayLogs } = await supabase
    .from("reading_logs")
    .select("pages_read")
    .eq("user_id", userId)
    .gte("logged_at", todayStart.toISOString());

  const todayPages = todayLogs?.reduce((sum, l) => sum + l.pages_read, 0) ?? 0;

  if (todayPages < 10) {
    // Not enough pages today for a streak day
    const { data: profile } = await supabase
      .from("users")
      .select("current_streak")
      .eq("id", userId)
      .single();
    return { streakDays: profile?.current_streak ?? 0, bonus: 0 };
  }

  // Get current profile
  const { data: profile } = await supabase
    .from("users")
    .select("current_streak, longest_streak, last_read_date")
    .eq("id", userId)
    .single();

  if (!profile) return { streakDays: 0, bonus: 0 };

  // Already counted today
  if (profile.last_read_date === today) {
    return { streakDays: profile.current_streak, bonus: 0 };
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak: number;
  if (profile.last_read_date === yesterdayStr) {
    newStreak = profile.current_streak + 1;
  } else {
    newStreak = 1;
  }

  const newLongest = Math.max(newStreak, profile.longest_streak);

  await supabase
    .from("users")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_read_date: today,
    })
    .eq("id", userId);

  // Check streak milestones
  let bonus = 0;
  if (newStreak === 3) {
    bonus = 20;
    await supabase.from("points").insert({
      user_id: userId,
      amount: 20,
      reason: "streak_3",
    });
  } else if (newStreak === 7) {
    bonus = 50;
    await supabase.from("points").insert({
      user_id: userId,
      amount: 50,
      reason: "streak_7",
    });
  }

  return { streakDays: newStreak, bonus };
}
