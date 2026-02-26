import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface LeaderboardEntry {
  user_id: string;
  total_clicks: number;
}

function isNonEmptyString(value: string | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const city = searchParams.get("city");

  if (!isNonEmptyString(userId) || !isNonEmptyString(city)) {
    return NextResponse.json(
      { error: "userId and city are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data: currentUserRow, error: currentUserError } = await supabase
    .from("leaderboard")
    .select("user_id, total_clicks")
    .eq("user_id", userId)
    .eq("city", city)
    .maybeSingle<LeaderboardEntry>();

  if (currentUserError) {
    console.error("Failed to fetch current user rank data:", currentUserError);
    return NextResponse.json({ error: "Failed to fetch rank" }, { status: 500 });
  }

  const totalClicks = currentUserRow?.total_clicks ?? 0;

  const { count: higherCount, error: higherCountError } = await supabase
    .from("users")
    .select("id, clicks!inner(total_clicks)", { count: "exact", head: true })
    .eq("city", city)
    .eq("is_anonymous", false)
    .gt("clicks.total_clicks", totalClicks);

  if (higherCountError) {
    console.error("Failed to fetch users ahead count:", higherCountError);
    return NextResponse.json({ error: "Failed to fetch rank" }, { status: 500 });
  }

  const { data: nextAboveRow, error: nextAboveError } = await supabase
    .from("leaderboard")
    .select("total_clicks")
    .eq("city", city)
    .gt("total_clicks", totalClicks)
    .order("total_clicks", { ascending: true })
    .limit(1)
    .maybeSingle<Pick<LeaderboardEntry, "total_clicks">>();

  if (nextAboveError) {
    console.error("Failed to fetch next rank clicks:", nextAboveError);
    return NextResponse.json({ error: "Failed to fetch rank" }, { status: 500 });
  }

  const safeHigherCount = higherCount ?? 0;
  const rank = safeHigherCount + 1;
  const nextRankClicks = nextAboveRow?.total_clicks ?? null;
  const clicksToClimb =
    nextRankClicks === null ? null : nextRankClicks - totalClicks;

  return NextResponse.json({
    rank,
    totalClicks,
    nextRankClicks,
    clicksToClimb,
  });
}
