import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface RenameSessionRequest {
  userId: string;
  displayName: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRenameSessionRequest(value: unknown): value is RenameSessionRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  return isNonEmptyString(data.userId) && isNonEmptyString(data.displayName);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRenameSessionRequest(body)) {
    return NextResponse.json(
      { error: "userId and displayName are required" },
      { status: 400 }
    );
  }

  const normalizedDisplayName = body.displayName.trim();
  if (normalizedDisplayName.length < 1 || normalizedDisplayName.length > 20) {
    return NextResponse.json(
      { error: "displayName must be 1-20 non-whitespace characters" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id")
    .ilike("display_name", normalizedDisplayName)
    .single();

  if (existingUserError && existingUserError.code !== "PGRST116") {
    console.error("Failed to check display name uniqueness:", existingUserError);
    return NextResponse.json({ error: "Failed to rename session" }, { status: 500 });
  }

  if (existingUser && existingUser.id !== body.userId) {
    return NextResponse.json(
      { error: "That name is already taken" },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name: normalizedDisplayName })
    .eq("id", body.userId);

  if (error) {
    console.error("Failed to rename display name:", error);
    return NextResponse.json({ error: "Failed to rename session" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, displayName: normalizedDisplayName });
}
