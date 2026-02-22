import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface CreateSessionRequest {
  display_name: string;
  city: string;
}

interface CreateSessionResponse {
  id: string;
  display_name: string | null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateSessionRequest;
  const { display_name, city } = body;

  if (!display_name || !city) {
    return NextResponse.json(
      { error: "display_name and city are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("users")
    .insert({
      display_name,
      city,
      is_anonymous: true,
    })
    .select("id, display_name")
    .single();

  if (error) {
    console.error("Failed to create anonymous user:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  const response: CreateSessionResponse = {
    id: data.id,
    display_name: data.display_name,
  };

  return NextResponse.json(response);
}
