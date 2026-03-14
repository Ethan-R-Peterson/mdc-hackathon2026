import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { awardPagePoints, awardFinishBonus, updateStreak } from "@/lib/points";

// POST /api/reading-logs - log pages read
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userBookId, pagesRead } = await request.json();

  // --- Validation ---

  if (!userBookId || !pagesRead) {
    return NextResponse.json({ error: "userBookId and pagesRead are required" }, { status: 400 });
  }

  // TODO: restore for production
  // if (pagesRead < 1 || pagesRead > 100) {
  //   return NextResponse.json({ error: "Pages must be between 1 and 100" }, { status: 400 });
  // }
  if (pagesRead < 1) {
    return NextResponse.json({ error: "Pages must be at least 1" }, { status: 400 });
  }

  // Verify the user_book exists and belongs to this user
  const { data: userBook, error: ubError } = await supabase
    .from("user_books")
    .select("*, book:books(*)")
    .eq("id", userBookId)
    .eq("user_id", user.id)
    .single();

  if (ubError || !userBook) {
    return NextResponse.json({ error: "Book not found" }, { status: 404 });
  }

  if (userBook.status === "finished") {
    return NextResponse.json({ error: "This book is already finished" }, { status: 400 });
  }

  // Check page count doesn't exceed book total
  if (userBook.book?.page_count) {
    const newPage = userBook.current_page + pagesRead;
    if (newPage > userBook.book.page_count) {
      return NextResponse.json(
        { error: `Only ${userBook.book.page_count - userBook.current_page} pages remaining in this book` },
        { status: 400 }
      );
    }
  }

  // TODO: restore for production
  // // 1-hour cooldown between logs
  // const { data: lastLog } = await supabase
  //   .from("reading_logs")
  //   .select("logged_at")
  //   .eq("user_id", user.id)
  //   .order("logged_at", { ascending: false })
  //   .limit(1)
  //   .single();
  //
  // if (lastLog) {
  //   const lastLogTime = new Date(lastLog.logged_at).getTime();
  //   const oneHourAgo = Date.now() - 60 * 60 * 1000;
  //   if (lastLogTime > oneHourAgo) {
  //     const minutesLeft = Math.ceil((lastLogTime - oneHourAgo) / 60000);
  //     return NextResponse.json(
  //       { error: `Please wait ${minutesLeft} minute${minutesLeft === 1 ? "" : "s"} before logging again` },
  //       { status: 429 }
  //     );
  //   }
  // }
  //
  // // Max 5 logs per day
  // const todayStart2 = new Date();
  // todayStart2.setHours(0, 0, 0, 0);
  //
  // const { count: todayLogCount } = await supabase
  //   .from("reading_logs")
  //   .select("*", { count: "exact", head: true })
  //   .eq("user_id", user.id)
  //   .gte("logged_at", todayStart2.toISOString());
  //
  // if ((todayLogCount ?? 0) >= 5) {
  //   return NextResponse.json(
  //     { error: "Maximum 5 logs per day reached" },
  //     { status: 429 }
  //   );
  // }

  // --- Create the log ---

  const { data: log, error: logError } = await supabase
    .from("reading_logs")
    .insert({
      user_id: user.id,
      user_book_id: userBookId,
      pages_read: pagesRead,
    })
    .select()
    .single();

  if (logError) return NextResponse.json({ error: logError.message }, { status: 500 });

  // --- Update current_page ---

  const newPage = userBook.current_page + pagesRead;
  const isFinished = userBook.book?.page_count ? newPage >= userBook.book.page_count : false;

  await supabase
    .from("user_books")
    .update({
      current_page: newPage,
      ...(isFinished ? { status: "finished", finished_at: new Date().toISOString() } : {}),
    })
    .eq("id", userBookId);

  // --- Award points ---

  const pointsAwarded = await awardPagePoints(supabase, user.id, pagesRead, log.id);

  // --- Update streak ---

  const { streakDays, bonus: streakBonus } = await updateStreak(supabase, user.id);

  // --- Finish bonus ---

  let finishBonus = 0;
  if (isFinished) {
    await awardFinishBonus(supabase, user.id, userBookId);
    finishBonus = 50;
  }

  // --- Feed events ---

  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  if (memberships && memberships.length > 0) {
    const bookTitle = userBook.book?.title ?? "a book";

    // Log pages event
    const feedEvents: { user_id: string; group_id: string; event_type: string; metadata: Record<string, unknown> }[] = memberships.map((m) => ({
      user_id: user.id,
      group_id: m.group_id,
      event_type: "logged_pages",
      metadata: { bookTitle, pages: pagesRead, points: pointsAwarded },
    }));

    // Finish event
    if (isFinished) {
      feedEvents.push(
        ...memberships.map((m) => ({
          user_id: user.id,
          group_id: m.group_id,
          event_type: "finished_book" as const,
          metadata: { bookTitle },
        }))
      );
    }

    // Streak milestone event
    if (streakBonus > 0) {
      feedEvents.push(
        ...memberships.map((m) => ({
          user_id: user.id,
          group_id: m.group_id,
          event_type: "streak" as const,
          metadata: { streakDays, points: streakBonus },
        }))
      );
    }

    await supabase.from("feed_events").insert(feedEvents);
  }

  return NextResponse.json({
    log,
    pointsAwarded,
    streakDays,
    streakBonus,
    finishBonus,
    isFinished,
    newPage,
  });
}
