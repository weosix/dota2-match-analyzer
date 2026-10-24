"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import type { MatchDetails, MatchPlayer, TeamName } from "@/lib/matches";
import { ItemTimeline } from "@/components/item-timeline";
import { NetWorthChart } from "@/components/net-worth-chart";

function duration(seconds: number) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`; }
function date(timestamp: number) { return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(timestamp * 1000)); }
function number(value: number | null) { return value === null ? "—" : value.toLocaleString("en-US"); }
function matchClock(seconds: number) { const safe = Math.max(0, seconds); return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, "0")}`; }

function ItemIcon({ item }: { item: MatchPlayer["items"][number] }) {
  return item.image ? <Image src={item.image} alt={item.name} title={item.name} width={32} height={32} className="h-8 w-8 rounded object-cover" /> : <span title={item.name} className="flex h-8 w-8 items-center justify-center rounded bg-slate-800 text-[9px] text-slate-400">{item.name.slice(0, 2)}</span>;
}

function PlayerRow({ player }: { player: MatchPlayer }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-t border-slate-800/80 first:border-0">
      <button type="button" onClick={() => setExpanded(!expanded)} aria-expanded={expanded} className="scoreboard-player-row grid w-full grid-cols-[minmax(190px,1.5fr)_90px_90px_90px_100px_110px_1fr_20px] items-center gap-3 px-5 py-3 text-left text-sm transition hover:bg-slate-800/40">
        <span className="flex min-w-0 items-center gap-3">
          {player.hero?.image ? <Image src={player.hero.image} alt="" width={36} height={36} className="h-9 w-9 rounded object-cover" /> : <span className="h-9 w-9 rounded bg-slate-800" />}
          <span className="min-w-0"><strong className="block truncate font-medium text-slate-100">{player.name ?? "Anonymous player"}</strong><small className="block truncate text-xs text-slate-500">{player.hero?.localizedName ?? "Hero unavailable"}{player.level ? ` · Level ${player.level}` : ""}</small></span>
        </span>
        <span className="font-mono text-slate-200">{player.kills}/{player.deaths}/{player.assists}</span>
        <span className="font-mono text-slate-300">{number(player.goldPerMinute)}</span>
        <span className="font-mono text-slate-300">{number(player.experiencePerMinute)}</span>
        <span className="font-mono text-slate-300">{number(player.netWorth)}</span>
        <span className="font-mono text-slate-300">{number(player.lastHits)}</span>
        <span className="flex gap-1">{player.items.slice(0, 6).map((item) => <ItemIcon key={item.id} item={item} />)}</span>
        <span className="text-slate-500">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && <div className="grid gap-5 border-t border-slate-800/60 bg-slate-950/30 px-5 py-5 pl-[4.25rem] sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="label">Performance</p><p className="detail">K/D/A <b>{player.kills} / {player.deaths} / {player.assists}</b></p><p className="detail">Level <b>{player.level ?? "—"}</b></p><p className="detail">Denies <b>{number(player.denies)}</b></p></div>
        <div><p className="label">Economy</p><p className="detail">GPM <b>{number(player.goldPerMinute)}</b></p><p className="detail">XPM <b>{number(player.experiencePerMinute)}</b></p><p className="detail">Gold spent <b>{number(player.goldSpent)}</b></p></div>
        <div><p className="label">Impact</p><p className="detail">Hero damage <b>{number(player.heroDamage)}</b></p><p className="detail">Tower damage <b>{number(player.towerDamage)}</b></p><p className="detail">Healing <b>{number(player.heroHealing)}</b></p></div>
        <div><p className="label">Final items</p><div className="flex flex-wrap gap-2">{player.items.length ? player.items.map((item) => <span key={item.id} className="flex items-center gap-2 rounded bg-slate-800/70 p-1 text-xs text-slate-300"><ItemIcon item={item} /> <span className="hidden xl:inline">{item.name}</span></span>) : <span className="text-sm text-slate-500">No item data</span>}</div></div><div className="sm:col-span-2 lg:col-span-4"><p className="label">Purchase timings</p>{player.itemPurchases.length ? <div className="mt-2 flex flex-wrap gap-2">{player.itemPurchases.map((purchase, index) => <span key={`${purchase.time}-${purchase.item?.id ?? "unknown"}-${index}`} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/60 px-2 py-1 text-xs text-slate-300"><span className="font-mono text-cyan-300">{purchase.time < 0 ? `-${matchClock(Math.abs(purchase.time))}` : matchClock(purchase.time)}</span>{purchase.item ? <><ItemIcon item={purchase.item} /><span>{purchase.item.name}</span></> : <span>Unknown item</span>}</span>)}</div> : <p className="mt-2 text-sm text-slate-500">Not available from the current data source.</p>}</div>
      </div>}
    </div>
  );
}

function TeamPanel({ team, players, won, score }: { team: TeamName; players: MatchPlayer[]; won: boolean; score: number }) {
  const radiant = team === "Radiant";
  return <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60"><div className={`flex items-center justify-between border-b px-5 py-4 ${radiant ? "border-emerald-400/20" : "border-rose-400/20"}`}><div className="flex items-center gap-3"><span className={`h-2.5 w-2.5 rounded-full ${radiant ? "bg-emerald-400" : "bg-rose-400"}`} /><div><h2 className="font-semibold">{team}</h2><p className="text-xs text-slate-500">{won ? "Victory" : "Defeat"}</p></div></div><strong className="text-2xl">{score}</strong></div><div className="hidden grid-cols-[minmax(190px,1.5fr)_90px_90px_90px_100px_110px_1fr_20px] gap-3 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 md:grid"><span>Player</span><span>K/D/A</span><span>GPM</span><span>XPM</span><span>Net worth</span><span>Last hits</span><span>Items</span><span /></div>{players.map((player) => <PlayerRow key={player.playerSlot} player={player} />)}</section>;
}

export default function Home() {
  const [matchId, setMatchId] = useState(""); const [match, setMatch] = useState<MatchDetails | null>(null); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function analyze(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setMatch(null); const id = matchId.trim(); if (!/^\d{1,20}$/.test(id)) { setError("Enter a Match ID containing digits only."); return; } setLoading(true); try { const response = await fetch(`/api/matches/${id}`); const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not load this match."); setMatch(data); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Could not load this match."); } finally { setLoading(false); } }
  const radiant = match?.players.filter((player) => player.team === "Radiant") ?? []; const dire = match?.players.filter((player) => player.team === "Dire") ?? [];
  return <main className="min-h-screen bg-[#080d18] text-slate-100"><div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:py-9"><header className="mb-10 flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded bg-cyan-400 text-xs font-black text-slate-950">D2</span><span className="font-semibold tracking-tight">Match Lens</span></div><span className="text-xs text-slate-600">Live match analytics</span></header><section className="mb-10 flex flex-col justify-between gap-6 border-b border-slate-800 pb-10 lg:flex-row lg:items-end"><div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Dota 2 match analytics</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Analyze a match</h1><p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">A compact view of the result, scoreboard, economy, and player impact.</p></div><form onSubmit={analyze} className="flex w-full max-w-xl gap-2"><label htmlFor="match-id" className="sr-only">Enter Dota 2 Match ID</label><input id="match-id" inputMode="numeric" value={matchId} onChange={(event) => setMatchId(event.target.value)} placeholder="Enter Match ID" className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400" /><button disabled={loading} className="h-11 rounded-lg bg-cyan-400 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-60">{loading ? "Loading…" : "Analyze"}</button></form></section>{error && <p role="alert" className="mb-6 rounded-lg border border-rose-400/20 bg-rose-400/5 px-4 py-3 text-sm text-rose-300">{error}</p>}{loading && <div role="status" className="mb-6 rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-5 text-sm text-slate-400">Loading match data and player constants…</div>}{match && <section className="space-y-5"><div className="mb-3 flex items-center justify-between"><p className="text-xs text-slate-500">Data source: <span className={match.source === "STRATZ" ? "text-cyan-300" : "text-slate-300"}>{match.source}</span></p>{match.source === "OpenDota" && <p className="text-xs text-amber-300/80">Timeline data requires STRATZ access</p>}</div><div className="grid gap-2 sm:grid-cols-4"><div className="stat"><span>Result</span><b className={match.radiantWin ? "text-emerald-300" : "text-rose-300"}>{match.radiantWin ? "Radiant Victory" : "Dire Victory"}</b></div><div className="stat"><span>Duration</span><b>{duration(match.duration)}</b></div><div className="stat"><span>Played</span><b className="text-base">{date(match.startTime)}</b></div><div className="stat"><span>Match ID</span><b className="truncate font-mono text-base">{match.matchId}</b></div></div><TeamPanel team="Radiant" players={radiant} won={match.radiantWin} score={match.radiantScore} /><TeamPanel team="Dire" players={dire} won={!match.radiantWin} score={match.direScore} /><section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"><div className="mb-4"><h2 className="font-semibold">Net worth</h2><p className="mt-1 text-sm text-slate-500">Per-minute player net worth</p></div><NetWorthChart players={match.players} /></section><section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"><div className="mb-4"><h2 className="font-semibold">Item purchase timeline</h2><p className="mt-1 text-sm text-slate-500">Purchases reported during the match</p></div><ItemTimeline players={match.players} /></section></section>}</div></main>;
}
