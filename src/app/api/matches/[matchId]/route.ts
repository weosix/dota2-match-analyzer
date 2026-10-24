import { NextResponse } from "next/server";

import { normalizeConstants, normalizeMatch } from "@/lib/matches";
import { getStratzMatch } from "@/lib/stratz";

const OPENDOTA_URL = "https://api.opendota.com/api";
const MATCHES_URL = `${OPENDOTA_URL}/matches`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;

  if (!/^\d{1,20}$/.test(matchId)) {
    return NextResponse.json(
      { error: "Match ID must contain only digits." },
      { status: 400 },
    );
  }

  try {
    const [heroesResponse, itemsResponse] = await Promise.all([
      fetch(`${OPENDOTA_URL}/constants/heroes`, { next: { revalidate: 86400 } }),
      fetch(`${OPENDOTA_URL}/constants/items`, { next: { revalidate: 86400 } }),
    ]);
    const constants = heroesResponse.ok && itemsResponse.ok
      ? normalizeConstants(await heroesResponse.json(), await itemsResponse.json())
      : undefined;

    if (process.env.STRATZ_API_TOKEN) {
      try {
        const stratzMatch = await getStratzMatch(matchId, constants);
        if (stratzMatch) return NextResponse.json(stratzMatch);
      } catch (error) {
        console.error("STRATZ match request failed; falling back to OpenDota.", error);
      }
    }

    const response = await fetch(`${MATCHES_URL}/${matchId}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 },
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: "Match was not found in OpenDota." },
        { status: 404 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "OpenDota is temporarily unavailable. Please try again." },
        { status: 502 },
      );
    }

    const matchData = await response.json();
    const match = normalizeMatch(matchData, constants);

    if (!match) {
      return NextResponse.json(
        { error: "OpenDota returned incomplete match data." },
        { status: 502 },
      );
    }

    return NextResponse.json(match);
  } catch {
    return NextResponse.json(
      { error: "Could not connect to OpenDota. Please try again." },
      { status: 502 },
    );
  }
}
