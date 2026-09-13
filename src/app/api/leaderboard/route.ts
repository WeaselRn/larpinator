import type { NextRequest } from "next/server";
import { errorMessage, jsonError, jsonOk } from "@/lib/api";
import { getLeaderboard, isBoardKey } from "@/lib/leaderboard";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const boardParam = url.searchParams.get("board");
    const board = isBoardKey(boardParam) ? boardParam : "global";
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 25) || 25, 3), 100);

    const rows = await getLeaderboard(board, limit);
    return jsonOk({ board, rows });
  } catch (err) {
    return jsonError(errorMessage(err), 500);
  }
}
