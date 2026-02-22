import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface DeleteSessionRequest {
  userId: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isDeleteSessionRequest(value: unknown): value is DeleteSessionRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const data = value as Record<string, unknown>;
  return isNonEmptyString(data.userId);
}

export async function DELETE(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isDeleteSessionRequest(body)) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: existingUser, error: existingUserError } = await adminClient
    .from("users")
    .select("auth_user_id")
    .eq("id", body.userId)
    .maybeSingle<{ auth_user_id: string | null }>();

  if (existingUserError) {
    console.error("Failed to fetch user before deletion:", existingUserError);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }

  const authUserId = existingUser?.auth_user_id ?? null;

  const { error: clicksDeleteError } = await adminClient
    .from("clicks")
    .delete()
    .eq("user_id", body.userId);

  if (clicksDeleteError) {
    console.error("Failed to delete clicks row:", clicksDeleteError);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }

  const { error: usersDeleteError } = await adminClient
    .from("users")
    .delete()
    .eq("id", body.userId);

  if (usersDeleteError) {
    console.error("Failed to delete users row:", usersDeleteError);
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
  }

  if (authUserId !== null) {
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(authUserId);

    if (authDeleteError) {
      console.error("Failed to delete auth user:", authDeleteError);
      return NextResponse.json({ error: "Failed to delete session" }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
