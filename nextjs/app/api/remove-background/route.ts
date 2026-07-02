import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const serverUrl = process.env.CAPWORDS_BG_SERVER_URL;

export async function POST(request: NextRequest) {
  if (!serverUrl) {
    return NextResponse.json(
      { error: "CAPWORDS_BG_SERVER_URL is not configured." },
      { status: 500 }
    );
  }

  const body = await request.arrayBuffer();
  const upstream = await fetch(new URL("/remove-background", serverUrl), {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/octet-stream",
      accept: "image/png"
    },
    body
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: text || `Remove background failed: ${upstream.status}` },
      { status: upstream.status }
    );
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      "content-type": "image/png",
      "cache-control": "no-store"
    }
  });
}
