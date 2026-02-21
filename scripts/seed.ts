import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const isCleanup = process.argv.includes("--cleanup");

interface LeaderboardRow {
  display_name: string | null;
  city: string | null;
  total_clicks: number;
}

function randomFourDigit(): number {
  return Math.floor(1000 + Math.random() * 9000);
}

function randomClicks(): number {
  return Math.floor(100 + Math.random() * 49900);
}

async function cleanup(): Promise<void> {
  console.log("Cleaning up seed data (is_anonymous=true, display_name LIKE 'Clicker #%')...");

  const { data, error } = await supabase
    .from("users")
    .delete()
    .eq("is_anonymous", true)
    .like("display_name", "Clicker #%")
    .select("id");

  if (error) {
    console.error("Cleanup failed:", error);
    process.exit(1);
  }

  const count = data?.length ?? 0;
  console.log(`Deleted ${count} user(s).`);
}

async function seed(): Promise<void> {
  console.log("Seeding 15 users with random click counts...\n");

  for (let i = 0; i < 15; i++) {
    const displayName = `Clicker #${randomFourDigit()}`;

    const { data: user, error: insertError } = await supabase
      .from("users")
      .insert({
        display_name: displayName,
        city: "Brisbane",
        is_anonymous: true,
      })
      .select("id")
      .single();

    if (insertError || !user) {
      console.error(`Failed to insert ${displayName}:`, insertError ?? "No user returned");
      process.exit(1);
    }

    const userId = user.id;
    const clickCount = randomClicks();

    const { error: rpcError } = await supabase.rpc("increment_clicks", {
      p_user_id: userId,
      p_amount: clickCount,
    });

    if (rpcError) {
      console.error(`Failed to increment clicks for ${displayName}:`, rpcError);
      process.exit(1);
    }

    console.log(`  ${displayName} (${userId}) → ${clickCount} clicks`);
  }

  console.log("\nQuerying leaderboard (top 10)...\n");

  const { data: leaderboard, error: viewError } = await supabase
    .from("leaderboard")
    .select("display_name, city, total_clicks")
    .order("total_clicks", { ascending: false })
    .limit(10)
    .returns<LeaderboardRow[]>();

  if (viewError) {
    console.error("Failed to query leaderboard:", viewError);
    process.exit(1);
  }

  (leaderboard ?? []).forEach((row, idx) => {
    console.log(`  ${idx + 1}. ${row.display_name} (${row.city}) — ${row.total_clicks} clicks`);
  });

  console.log("\nDone.");
}

async function main(): Promise<void> {
  if (isCleanup) {
    await cleanup();
  } else {
    await seed();
  }
}

main();
