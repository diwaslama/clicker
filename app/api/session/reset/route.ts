import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ResetSessionRequest {
  userId: string;
}

interface ClicksTableClient {
  from: (table: "clicks") => {
    update: (values: { total_clicks: number }) => {
      eq: (
        column: "user_id",
        value: string
      ) => Promise<{ error: { message: string } | null }>;
    };
  };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isResetSessionRequest(value: unknown): value is ResetSessionRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  return isNonEmptyString(data.userId);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isResetSessionRequest(body)) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const clicksClient = supabase as unknown as ClicksTableClient;
  const { error } = await clicksClient
    .from("clicks")
    .update({ total_clicks: 0 })
    .eq("user_id", body.userId);

  if (error) {
    console.error("Failed to reset clicks:", error);
    return NextResponse.json({ error: "Failed to reset clicks" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
