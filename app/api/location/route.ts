import { NextResponse } from "next/server";

interface IpApiResponse {
  status?: string;
  regionName?: string;
  city?: string;
}

interface LocationResponse {
  allowed: boolean;
  city: string | null;
}

const DENY_RESPONSE: LocationResponse = {
  allowed: false,
  city: null,
};

function getIpFromHeaders(request: Request): string | null {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && cfIp.trim().length > 0) {
    return cfIp.trim();
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) {
    return null;
  }

  const firstIp = forwardedFor.split(",")[0]?.trim();
  return firstIp && firstIp.length > 0 ? firstIp : null;
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ allowed: true, city: "Brisbane" });
  }

  const ip = getIpFromHeaders(request);
  if (!ip) {
    return NextResponse.json(DENY_RESPONSE);
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,regionName,city`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      return NextResponse.json(DENY_RESPONSE);
    }

    const data = (await response.json()) as IpApiResponse;

    if (data.status !== "success" || data.regionName !== "Queensland") {
      return NextResponse.json(DENY_RESPONSE);
    }

    return NextResponse.json({
      allowed: true,
      city: data.city ?? null,
    } satisfies LocationResponse);
  } catch {
    return NextResponse.json(DENY_RESPONSE);
  }
}
