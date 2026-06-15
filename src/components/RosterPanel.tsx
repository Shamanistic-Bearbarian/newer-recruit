"use client";

// The working roster: each placed unit with its size + enhancement controls,
// per-unit points, and a remove action.

import { useState } from "react";
import { getDatasheet } from "@/data";
import {
  eligibleEnhancements,
  unitPoints,
  type Roster,
  type RosterUnit,
} from "@/lib/roster";
import { useBuilder } from "@/lib/useBuilder";
import DatasheetView from "@/components/DatasheetView";

function UnitRow({ roster, unit }: { roster: Roster; unit: RosterUnit }) {
  const { setUnitSize, setUnitEnhancement, removeUnit } = useBuilder();
  const [open, setOpen] = useState(false);
  const ds = getDatasheet(unit.datasheetId);
  if (!ds) {
    return (
      <li className="rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-sm text-rose-200">
        Unknown unit ({unit.datasheetId}){" "}
        <button
          onClick={() => removeUnit(unit.instanceId)}
          className="ml-2 underline"
        >
          remove
        </button>
      </li>
    );
  }

  const enhancements = eligibleEnhancements(roster, unit);

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/60">
      <div className="flex flex-wrap items-center gap-2 p-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-left font-medium text-slate-100"
          aria-expanded={open}
        >
          {ds.name}
        </button>
        <span className="ml-auto font-mono text-sm text-emerald-400">
          {unitPoints(unit)} pts
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 px-2 pb-2">
        {ds.sizes.length > 1 && (
          <label className="flex items-center gap-1 text-xs text-slate-400">
            Size
            <select
              value={unit.sizeIndex}
              onChange={(e) =>
                setUnitSize(unit.instanceId, Number(e.target.value))
              }
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            >
              {ds.sizes.map((s, i) => (
                <option key={i} value={i}>
                  {s.models} models — {s.points} pts
                </option>
              ))}
            </select>
          </label>
        )}

        {ds.isCharacter && !ds.isEpicHero && (
          <label className="flex items-center gap-1 text-xs text-slate-400">
            Enhancement
            <select
              value={unit.enhancementId ?? ""}
              onChange={(e) =>
                setUnitEnhancement(unit.instanceId, e.target.value || undefined)
              }
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
              disabled={enhancements.length === 0}
            >
              <option value="">None</option>
              {enhancements.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} (+{e.points})
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          onClick={() => removeUnit(unit.instanceId)}
          className="ml-auto rounded-md border border-rose-800 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/50"
        >
          Remove
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-800 p-3">
          <DatasheetView datasheet={ds} />
        </div>
      )}
    </li>
  );
}

export default function RosterPanel({ roster }: { roster: Roster }) {
  if (roster.units.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
        No units yet. Add units from the catalog on the left.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {roster.units.map((u) => (
        <UnitRow key={u.instanceId} roster={roster} unit={u} />
      ))}
    </ul>
  );
}
