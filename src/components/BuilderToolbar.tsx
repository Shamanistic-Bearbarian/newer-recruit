"use client";

// Top-of-builder controls: editable name + faction/points limit, the
// detachment list (11e allows several within the DP budget), the running
// points / DP / enhancement bars, and Save / Export / Close actions.

import { useState } from "react";
import { FACTIONS, GAME_SIZES, factionDetachments, gameSizeForPoints } from "@/data";
import {
  enhancementsUsed,
  rosterDetachments,
  rosterDpUsed,
  rosterPoints,
  type Roster,
} from "@/lib/roster";
import { useBuilder } from "@/lib/useBuilder";
import { rosterToFileBlob, suggestedFileName } from "@/lib/storage";

function downloadRoster(roster: Roster) {
  const url = URL.createObjectURL(rosterToFileBlob(roster));
  const a = document.createElement("a");
  a.href = url;
  a.download = suggestedFileName(roster);
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function BuilderToolbar({ roster }: { roster: Roster }) {
  const {
    setName,
    setFaction,
    addDetachment,
    removeDetachment,
    setPointsLimit,
    saveCurrentToLibrary,
    clearCurrent,
  } = useBuilder();
  const [savedFlash, setSavedFlash] = useState(false);

  const total = rosterPoints(roster);
  const pct = Math.min(100, Math.round((total / roster.pointsLimit) * 100));
  const over = total > roster.pointsLimit;
  const size = gameSizeForPoints(roster.pointsLimit);

  const allDetachments = factionDetachments(roster.factionId);
  const selected = rosterDetachments(roster);
  const selectedIds = new Set(roster.detachmentIds);
  const addable = allDetachments.filter((d) => !selectedIds.has(d.id));
  const dpUsed = rosterDpUsed(roster);
  const enhUsed = enhancementsUsed(roster);

  function onSave() {
    saveCurrentToLibrary();
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  return (
    <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={roster.name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-[12rem] flex-1 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-lg font-semibold text-slate-100 focus:border-emerald-500 focus:outline-none"
          aria-label="List name"
        />
        <button
          onClick={onSave}
          className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          {savedFlash ? "Saved ✓" : "Save"}
        </button>
        <button
          onClick={() => downloadRoster(roster)}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Export
        </button>
        <button
          onClick={clearCurrent}
          className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Close
        </button>
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-1 text-slate-400">
          Faction
          <select
            value={roster.factionId}
            onChange={(e) => setFaction(e.target.value)}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            {FACTIONS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1 text-slate-400">
          Limit
          <select
            value={roster.pointsLimit}
            onChange={(e) => setPointsLimit(Number(e.target.value))}
            className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
          >
            {GAME_SIZES.map((g) => (
              <option key={g.id} value={g.points}>
                {g.name} ({g.points})
              </option>
            ))}
          </select>
        </label>
      </div>

      {allDetachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-slate-400">Detachments:</span>
          {selected.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200"
            >
              {d.name}
              {d.dp != null ? ` · ${d.dp} DP` : ""}
              <button
                onClick={() => removeDetachment(d.id)}
                aria-label={`Remove ${d.name}`}
                className="ml-1 text-slate-400 hover:text-rose-300"
              >
                ×
              </button>
            </span>
          ))}
          {addable.length > 0 && (
            <select
              value=""
              onChange={(e) => e.target.value && addDetachment(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-100"
            >
              <option value="">+ Add detachment…</option>
              {addable.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                  {d.dp != null ? ` (${d.dp} DP)` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <span className="text-slate-400">Points</span>
          <span
            className={`font-mono font-semibold ${
              over ? "text-rose-400" : "text-emerald-400"
            }`}
          >
            {total} / {roster.pointsLimit}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full ${over ? "bg-rose-500" : "bg-emerald-500"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex gap-4 text-xs text-slate-400">
          <span className={dpUsed > size.dp ? "text-rose-400" : ""}>
            Detachment Points: {dpUsed} / {size.dp}
          </span>
          <span className={enhUsed > size.enhancements ? "text-rose-400" : ""}>
            Enhancements: {enhUsed} / {size.enhancements}
          </span>
        </div>
      </div>
    </div>
  );
}
