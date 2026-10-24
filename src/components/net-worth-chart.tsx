"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { MatchPlayer } from "@/lib/matches";

const COLORS = ["#54d6b0", "#a3e635", "#34d399", "#2dd4bf", "#86efac", "#fb7185", "#fda4af", "#f97373", "#e87979", "#c084fc"];
type Row = { minute: number; [key: string]: number };

export function NetWorthChart({ players }: { players: MatchPlayer[] }) {
  const playersWithTimeline = players.filter((player) => player.netWorthTimeline.length > 0);
  const [visibleSlots, setVisibleSlots] = useState<number[]>(playersWithTimeline.map((player) => player.playerSlot));
  const rows = useMemo(() => {
    const byMinute = new Map<number, Row>();
    for (const player of playersWithTimeline) {
      for (const point of player.netWorthTimeline) {
        const row = byMinute.get(point.minute) ?? { minute: point.minute };
        row[String(player.playerSlot)] = point.value;
        byMinute.set(point.minute, row);
      }
    }
    return [...byMinute.values()].sort((a, b) => a.minute - b.minute);
  }, [playersWithTimeline]);

  function toggle(slot: number) {
    setVisibleSlots((current) => current.includes(slot) ? current.filter((value) => value !== slot) : [...current, slot]);
  }

  if (!rows.length) return <div className="rounded-lg border border-slate-800 bg-slate-900/30 px-5 py-10 text-center text-sm text-slate-500">Net worth timeline is not available for this match.</div>;

  return <div className="space-y-4"><div className="flex flex-wrap gap-x-4 gap-y-2">{playersWithTimeline.map((player, index) => <button key={player.playerSlot} type="button" onClick={() => toggle(player.playerSlot)} aria-pressed={visibleSlots.includes(player.playerSlot)} className={`flex items-center gap-2 text-xs transition ${visibleSlots.includes(player.playerSlot) ? "text-slate-200" : "text-slate-600"}`}><span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index] }} />{player.hero?.localizedName ?? player.name ?? `Player ${player.playerSlot + 1}`}</button>)}</div><div className="h-[300px] w-full sm:h-[360px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}><CartesianGrid stroke="#1e293b" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="minute" type="number" domain={[0, "dataMax"]} tickFormatter={(value) => `${value}m`} stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><YAxis width={62} tickFormatter={(value) => `${Math.round(value / 1000)}k`} stroke="#64748b" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 8, color: "#e2e8f0" }} labelFormatter={(minute) => `${minute}:00`} formatter={(value, name) => { const player = playersWithTimeline.find((entry) => String(entry.playerSlot) === String(name)); return [Number(value).toLocaleString("en-US"), player?.hero?.localizedName ?? player?.name ?? "Player"]; }} />{playersWithTimeline.map((player, index) => visibleSlots.includes(player.playerSlot) && <Line key={player.playerSlot} type="linear" dataKey={String(player.playerSlot)} name={String(player.playerSlot)} stroke={COLORS[index]} strokeWidth={1.8} dot={false} activeDot={{ r: 4, strokeWidth: 1, stroke: "#080d18" }} connectNulls={false} isAnimationActive={false} />)}</LineChart></ResponsiveContainer></div><p className="text-xs text-slate-600">Source: STRATZ networthPerMinute. Points represent the API’s per-minute samples.</p></div>;
}
