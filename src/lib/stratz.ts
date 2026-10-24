import type { Constants, ItemPurchase, MatchDetails, MatchPlayer, NetWorthPoint } from "@/lib/matches";

const STRATZ_URL = "https://api.stratz.com/graphql";

const MATCH_QUERY = `
  query MatchAnalyzer($matchId: Long!) {
    match(id: $matchId) {
      id
      durationSeconds
      didRadiantWin
      startDateTime
      radiantKills
      direKills
      players {
        playerSlot
        isRadiant
        steamAccount { name }
        hero { id displayName }
        kills deaths assists
        numLastHits numDenies
        goldPerMinute experiencePerMinute
        networth level heroDamage towerDamage heroHealing goldSpent
        stats {
          networthPerMinute
          itemPurchases { time itemId }
        }
      }
    }
  }
`;

type StratzResponse = {
  data?: {
    match?: {
      id: number | string;
      durationSeconds: number;
      didRadiantWin: boolean;
      startDateTime: number;
      radiantKills: number;
      direKills: number;
      players: Array<{
        playerSlot: number;
        isRadiant: boolean;
        steamAccount?: { name?: string | null } | null;
        hero?: { id?: number; displayName?: string } | null;
        kills: number;
        deaths: number;
        assists: number;
        numLastHits: number;
        numDenies: number;
        goldPerMinute: number;
        experiencePerMinute: number;
        networth: number;
        level: number;
        heroDamage: number;
        towerDamage: number;
        heroHealing: number;
        goldSpent: number;
        stats?: {
          networthPerMinute?: number[] | null;
          itemPurchases?: Array<{ time: number; itemId: number }> | null;
        } | null;
      }>;
    } | null;
  };
  errors?: Array<{ message: string }>;
};

function makeNetWorthTimeline(values: number[] | null | undefined): NetWorthPoint[] {
  if (!values?.length) return [];
  return values.flatMap((value, minute) =>
    Number.isFinite(value) ? [{ minute, value }] : [],
  );
}

export async function getStratzMatch(matchId: string, constants?: Constants): Promise<MatchDetails | null> {
  const token = process.env.STRATZ_API_TOKEN;
  if (!token) return null;

  const response = await fetch(STRATZ_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: MATCH_QUERY, variables: { matchId } }),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseType = response.headers.get("content-type") ?? "unknown";
    throw new Error(`STRATZ request failed with status ${response.status} (${responseType}).`);
  }

  const result = (await response.json()) as StratzResponse;
  if (result.errors?.length) {
    throw new Error("STRATZ could not provide match analytics.");
  }

  const data = result.data?.match;
  if (!data || !Array.isArray(data.players) || data.players.length !== 10) return null;

  const players: MatchPlayer[] = data.players.map((player) => {
    const purchases: ItemPurchase[] = (player.stats?.itemPurchases ?? [])
      .filter((event) => Number.isFinite(event.time) && Number.isFinite(event.itemId))
      .map((event) => ({ time: event.time, item: constants?.items[event.itemId] ?? null }))
      .sort((a, b) => a.time - b.time);
    const heroId = player.hero?.id ?? 0;
    const heroConstant = constants?.heroes[heroId] ?? null;
    const hero = heroConstant
      ? { ...heroConstant, localizedName: player.hero?.displayName ?? heroConstant.localizedName }
      : player.hero?.displayName
        ? { id: heroId, name: player.hero.displayName, localizedName: player.hero.displayName, image: null }
        : null;

    return {
      playerSlot: player.playerSlot,
      team: player.isRadiant ? "Radiant" as const : "Dire" as const,
      name: player.steamAccount?.name ?? null,
      hero,
      kills: player.kills,
      deaths: player.deaths,
      assists: player.assists,
      lastHits: player.numLastHits,
      denies: player.numDenies,
      goldPerMinute: player.goldPerMinute,
      experiencePerMinute: player.experiencePerMinute,
      netWorth: player.networth,
      level: player.level,
      heroDamage: player.heroDamage,
      towerDamage: player.towerDamage,
      heroHealing: player.heroHealing,
      goldSpent: player.goldSpent,
      items: [],
      netWorthTimeline: makeNetWorthTimeline(player.stats?.networthPerMinute),
      itemPurchases: purchases,
    };
  }).sort((a, b) => a.playerSlot - b.playerSlot);

  return {
    source: "STRATZ",
    matchId: Number(data.id),
    duration: data.durationSeconds,
    startTime: data.startDateTime,
    radiantWin: data.didRadiantWin,
    radiantScore: data.radiantKills,
    direScore: data.direKills,
    players,
  };
}
