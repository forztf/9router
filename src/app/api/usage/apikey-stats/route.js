import { NextResponse } from "next/server";
import { getApiKeyStats } from "@/lib/usageDb";

const VALID_PERIODS = new Set(["24h", "7d", "30d", "60d"]);

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7d";

    if (!VALID_PERIODS.has(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const stats = await getApiKeyStats(period);
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[API] Failed to get apikey stats:", error);
    return NextResponse.json({ error: "Failed to fetch apikey stats" }, { status: 500 });
  }
}
