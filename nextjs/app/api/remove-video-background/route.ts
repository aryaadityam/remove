import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;

const serverUrl = process.env.CAPWORDS_BG_SERVER_URL;

export async function POST(request: NextRequest) {
  if (!serverUrl) {
    return NextResponse.json(
      { error: "CAPWORDS_BG_SERVER_URL is not configured." },
      { status: 500 }
    );
  }

  const body = await request.arrayBuffer();
  const format = request.nextUrl.searchParams.get("format") ?? "webm";
  const background = request.nextUrl.searchParams.get("background") ?? "white";
  const upstreamUrl = new URL("/remove-video-background", serverUrl);
  upstreamUrl.searchParams.set("format", format);
  upstreamUrl.searchParams.set("background", background);

  const upstream = await fetch(upstreamUrl, {
    method: "POST",
    headers: {
      "content-type": request.headers.get("content-type") ?? "application/octet-stream",
      accept: format === "mp4" ? "video/mp4" : "video/webm"
    },
    body
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    return NextResponse.json(
      { error: text || `Remove video background failed: ${upstream.status}` },
      { status: upstream.status }
    );
  }

  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "video/webm",
      "cache-control": "no-store"
    }
  });
}
