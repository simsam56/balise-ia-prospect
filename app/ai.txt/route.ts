import { NextResponse } from "next/server";

import { AI_MANIFEST_TEXT } from "@/lib/ai-manifest";

export async function GET() {
  return new NextResponse(AI_MANIFEST_TEXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
