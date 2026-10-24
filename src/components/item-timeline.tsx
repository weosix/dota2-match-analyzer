"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

import type { MatchPlayer, TeamName } from "@/lib/matches";

function clock(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`;
}

export function ItemTimeline({ players }: { players: MatchPlayer[] }) {
  const [team, setTeam] = useState<"All" | TeamName>("All");
  const [playerSlot, setPlayerSlot] = useState("All");
  const items = useMemo(() => players
    .filter((player) => team === "All" || player.team === team)
    .filter((player) => playerSlot === "All" || String(player.playerSlot) === playerSlot)
    .flatMap((player) => player.itemPurchases.map((purchase, index) => ({ player, purchase, index })))
    .sort((a, b) => a.purchase.time - b.purchase.time), [players, playerSlot, team]);
  const hasPurchases = players.some((player) => player.itemPurchases.length > 0);
  const maxDuration = Math.max(1, ...players.flatMap((player) => player.itemPurchases.map(({ time }) => time)), 1800);

  return <div className="space-y-4"><div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="timeline-team">Filter team</label><select id="timeline-team" value={team} onChange={(event) => setTeam(event.target.value as "All" | TeamName)} className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300"><option>All</option><option>Radiant</option><option>Dire</option></select><label className="sr-only" htmlFor="timeline-player">Filter player</label><select id="timeline-player" value={playerSlot} onChange={(event) => setPlayerSlot(event.target.value)} className="max-w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300"><option value="All">All players</option>{players.map((player) => <option key={player.playerSlot} value={player.playerSlot}>{player.hero?.localizedName ?? player.name ?? `Player ${player.playerSlot + 1}`}</option>)}</select></div>{!hasPurchases ? <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-5 py-10 text-center text-sm text-slate-500">Item purchase timings are not available for this match.</div> : !items.length ? <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-5 py-10 text-center text-sm text-slate-500">No purchases match the selected filters.</div> : <div className="space-y-2">{players.filter((player) => team === "All" || player.team === team).filter((player) => playerSlot === "All" || String(player.playerSlot) === playerSlot).map((player) => {
    const purchases = player.itemPurchases;
    if (!purchases.length) return null;
    return <div key={player.playerSlot} className="grid grid-cols-[minmax(120px,180px)_1fr] items-start gap-3 rounded-md border border-slate-800/70 bg-slate-900/30 p-3 sm:grid-cols-[minmax(150px,220px)_1fr]"><div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{player.hero?.localizedName ?? player.name ?? `Player ${player.playerSlot + 1}`}</p><p className={`text-[10px] ${player.team === "Radiant" ? "text-emerald-300" : "text-rose-300"}`}>{player.team}</p></div><div className="relative min-h-12"><div className="absolute inset-x-0 top-5 h-px bg-slate-800" />{purchases.map((purchase, index) => {
      const item = purchase.item;
      const left = Math.max(0, Math.min(100, (purchase.time / maxDuration) * 100));
      return <button key={`${player.playerSlot}-${purchase.time}-${item?.id ?? "unknown"}-${index}`} type="button" title={`${clock(purchase.time)} · ${item?.name ?? `Item ${item?.id ?? "unavailable"}`}`} className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-1 rounded px-1 py-0.5 text-[9px] text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-1 focus:ring-cyan-400" style={{ left: `${left}%` }}><span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded bg-slate-800">{item?.image ? <Image src={item.image} alt="" width={28} height={28} className="h-7 w-7 object-cover" /> : <span>?</span>}</span><span className="whitespace-nowrap font-mono">{clock(purchase.time)}</span></button>;
    })}</div></div>;
  })}</div>}<p className="text-xs text-slate-600">Purchase times are reported by STRATZ in match seconds; negative times indicate pre-game purchases.</p></div>;
}
