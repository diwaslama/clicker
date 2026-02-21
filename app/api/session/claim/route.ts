import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface ClaimSessionRequest {
  anonUserId: string;
  authUserId: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isClaimSessionRequest(value: unknown): value is ClaimSessionRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  return isNonEmptyString(data.anonUserId) && isNonEmptyString(data.authUserId);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isClaimSessionRequest(body)) {
    return NextResponse.json(
      { error: "anonUserId and authUserId are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("users")
    .update({ auth_user_id: body.authUserId, is_anonymous: false })
    .eq("id", body.anonUserId);

  if (error) {
    console.error("Failed to claim anonymous session:", error);
    return NextResponse.json({ error: "Failed to claim session" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
