"use client";

// Top-of-builder controls: editable name + faction/detachment/points limit,
// the running points bar, and Save / Export / New actions.

import { useState } from "react";
import { FACTIONS, GAME_SIZES, factionDetachments, getDetachment } from "@/data";
import { rosterPoints, type Roster } from "@/lib/roster";
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
    setDetachment,
    setPointsLimit,
    saveCurrentToLibrary,
    clearCurrent,
  } = useBuilder();
  const [savedFlash, setSavedFlash] = useState(false);

  const total = rosterPoints(roster);
  const pct = Math.min(100, Math.round((total / roster.pointsLimit) * 100));
  const over = total > roster.pointsLimit;
  const detachments = factionDetachments(roster.factionId);
  const detachmentValid =
    roster.detachmentId && getDetachment(roster.detachmentId);

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
        {detachments.length > 0 && (
          <label className="flex items-center gap-1 text-slate-400">
            Detachment
            <select
              value={detachmentValid ? roster.detachmentId : ""}
              onChange={(e) => setDetachment(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            >
              <option value="" disabled>
                Select…
              </option>
              {detachments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
        )}
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
      </div>
    </div>
  );
}
