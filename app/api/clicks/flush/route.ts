import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface FlushClicksRequest {
  userId: string;
  count: number;
}

function isValidFlushRequest(body: unknown): body is FlushClicksRequest {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const value = body as Record<string, unknown>;
  return (
    typeof value.userId === "string" &&
    typeof value.count === "number" &&
    Number.isInteger(value.count) &&
    value.count > 0
  );
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidFlushRequest(body)) {
    return NextResponse.json(
      { error: "userId (string) and count (positive integer) are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase.rpc("increment_clicks", {
    p_user_id: body.userId,
    p_amount: body.count,
  });

  if (error) {
    console.error("Failed to flush clicks:", error);
    return NextResponse.json({ error: "Failed to flush clicks" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
