export type TeamName = "Radiant" | "Dire";

export type HeroInfo = {
  id: number;
  name: string;
  localizedName: string;
  image: string | null;
};

export type ItemInfo = {
  id: number;
  name: string;
  image: string | null;
  cost: number | null;
};

export type NetWorthPoint = {
  minute: number;
  value: number;
};

export type ItemPurchase = {
  time: number;
  item: ItemInfo | null;
};

export type MatchPlayer = {
  playerSlot: number;
  team: TeamName;
  name: string | null;
  hero: HeroInfo | null;
  kills: number;
  deaths: number;
  assists: number;
  lastHits: number;
  denies: number;
  goldPerMinute: number;
  experiencePerMinute: number;
  netWorth: number | null;
  level: number | null;
  heroDamage: number | null;
  towerDamage: number | null;
  heroHealing: number | null;
  goldSpent: number | null;
  items: ItemInfo[];
  netWorthTimeline: NetWorthPoint[];
  itemPurchases: ItemPurchase[];
};

export type MatchDetails = {
  source: "STRATZ" | "OpenDota";
  matchId: number;
  duration: number;
  startTime: number;
  radiantWin: boolean;
  radiantScore: number;
  direScore: number;
  players: MatchPlayer[];
};

type OpenDotaPlayer = {
  player_slot?: number;
  personaname?: string | null;
  name?: string | null;
  hero_id?: number;
  kills?: number;
  deaths?: number;
  assists?: number;
  last_hits?: number;
  denies?: number;
  gold_per_min?: number;
  xp_per_min?: number;
  net_worth?: number;
  level?: number;
  hero_damage?: number;
  tower_damage?: number;
  hero_healing?: number;
  gold_spent?: number;
  item_0?: number;
  item_1?: number;
  item_2?: number;
  item_3?: number;
  item_4?: number;
  item_5?: number;
};

type OpenDotaMatch = {
  match_id?: number;
  duration?: number;
  start_time?: number;
  radiant_win?: boolean;
  radiant_score?: number;
  dire_score?: number;
  players?: OpenDotaPlayer[];
};

type OpenDotaHero = {
  id?: number;
  localized_name?: string;
  img?: string;
};

type OpenDotaItem = {
  id?: number;
  dname?: string;
  img?: string;
  cost?: number;
};

export type Constants = {
  heroes: Record<number, HeroInfo>;
  items: Record<number, ItemInfo>;
};

function assetUrl(path: string | undefined) {
  return path ? `https://cdn.cloudflare.steamstatic.com${path}` : null;
}

export function normalizeConstants(
  heroesData: Record<string, OpenDotaHero>,
  itemsData: Record<string, OpenDotaItem>,
): Constants {
  const heroes: Record<number, HeroInfo> = {};
  const items: Record<number, ItemInfo> = {};

  for (const [key, hero] of Object.entries(heroesData)) {
    const id = Number(key);
    if (!Number.isFinite(id) || !hero.localized_name) continue;
    heroes[id] = {
      id,
      name: hero.localized_name,
      localizedName: hero.localized_name,
      image: assetUrl(hero.img),
    };
  }

  for (const [key, item] of Object.entries(itemsData)) {
    const id = Number(item.id ?? key);
    if (!Number.isFinite(id) || !item.dname) continue;
    items[id] = {
      id,
      name: item.dname,
      image: assetUrl(item.img),
      cost: typeof item.cost === "number" ? item.cost : null,
    };
  }

  return { heroes, items };
}

export function normalizeMatch(data: OpenDotaMatch, constants?: Constants): MatchDetails | null {
  if (
    typeof data.match_id !== "number" ||
    typeof data.duration !== "number" ||
    typeof data.start_time !== "number" ||
    typeof data.radiant_win !== "boolean" ||
    !Array.isArray(data.players)
  ) {
    return null;
  }

  const players = data.players
    .filter((player) => typeof player.player_slot === "number")
    .map((player) => {
      const playerSlot = player.player_slot as number;
      const itemIds = [player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5]
        .filter((item): item is number => typeof item === "number" && item > 0);

      return {
        playerSlot,
        team: playerSlot < 128 ? "Radiant" as const : "Dire" as const,
        name: player.personaname ?? player.name ?? null,
        hero: constants?.heroes[player.hero_id ?? 0] ?? null,
        kills: player.kills ?? 0,
        deaths: player.deaths ?? 0,
        assists: player.assists ?? 0,
        lastHits: player.last_hits ?? 0,
        denies: player.denies ?? 0,
        goldPerMinute: player.gold_per_min ?? 0,
        experiencePerMinute: player.xp_per_min ?? 0,
        netWorth: player.net_worth ?? null,
        level: player.level ?? null,
        heroDamage: player.hero_damage ?? null,
        towerDamage: player.tower_damage ?? null,
        heroHealing: player.hero_healing ?? null,
        goldSpent: player.gold_spent ?? null,
        items: itemIds.map((id) => constants?.items[id]).filter((item): item is ItemInfo => Boolean(item)),
        netWorthTimeline: [],
        itemPurchases: [],
      };
    })
    .sort((a, b) => a.playerSlot - b.playerSlot);

  if (players.length !== 10) return null;

  return {
    source: "OpenDota",
    matchId: data.match_id,
    duration: data.duration,
    startTime: data.start_time,
    radiantWin: data.radiant_win,
    radiantScore: data.radiant_score ?? 0,
    direScore: data.dire_score ?? 0,
    players,
  };
}
