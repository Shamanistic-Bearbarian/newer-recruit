"use client";

// The working roster: each placed unit with its size, enhancement, wargear and
// Leader/Support attachment controls, per-unit points, and a remove action.

import { useState } from "react";
import { getDatasheet } from "@/data";
import {
  eligibleAttachTargets,
  eligibleEnhancements,
  unitPoints,
  unitWargearPoints,
  type Roster,
  type RosterUnit,
} from "@/lib/roster";
import { useBuilder } from "@/lib/useBuilder";
import DatasheetView from "@/components/DatasheetView";

/** Display name for a roster unit, numbered when duplicates exist. */
function unitLabel(roster: Roster, u: RosterUnit): string {
  const name = getDatasheet(u.datasheetId)?.name ?? u.datasheetId;
  const sameName = roster.units.filter(
    (x) => getDatasheet(x.datasheetId)?.name === name
  );
  if (sameName.length <= 1) return name;
  const idx = sameName.findIndex((x) => x.instanceId === u.instanceId);
  return `${name} #${idx + 1}`;
}

function UnitRow({ roster, unit }: { roster: Roster; unit: RosterUnit }) {
  const {
    setUnitSize,
    setUnitEnhancement,
    setUnitWargear,
    setUnitAttachment,
    removeUnit,
  } = useBuilder();
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
  const attachTargets = eligibleAttachTargets(roster, unit);
  const wargearPts = unitWargearPoints(unit);

  return (
    <li className="rounded-lg border border-slate-800 bg-slate-900/60">
      <div className="flex flex-wrap items-center gap-2 p-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-left font-medium text-slate-100"
          aria-expanded={open}
        >
          {ds.name}
          {ds.attachRole && (
            <span className="ml-2 text-[0.65rem] uppercase tracking-wide text-sky-400">
              {ds.attachRole}
            </span>
          )}
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
                  {s.models > 0 ? `${s.models} models — ` : ""}
                  {s.points} pts
                </option>
              ))}
            </select>
          </label>
        )}

        {ds.isCharacter && !ds.isEpicHero && enhancements.length > 0 && (
          <label className="flex items-center gap-1 text-xs text-slate-400">
            Enhancement
            <select
              value={unit.enhancementId ?? ""}
              onChange={(e) =>
                setUnitEnhancement(unit.instanceId, e.target.value || undefined)
              }
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
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

        {ds.attachRole && (
          <label className="flex items-center gap-1 text-xs text-slate-400">
            Attach to
            <select
              value={unit.attachedTo ?? ""}
              onChange={(e) =>
                setUnitAttachment(unit.instanceId, e.target.value || undefined)
              }
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-100"
            >
              <option value="">
                {attachTargets.length ? "Not attached" : "No eligible unit"}
              </option>
              {attachTargets.map((t) => (
                <option key={t.instanceId} value={t.instanceId}>
                  {unitLabel(roster, t)}
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

      {ds.wargear && ds.wargear.length > 0 && (
        <div className="border-t border-slate-800/70 px-2 py-2">
          <div className="mb-1 text-[0.65rem] uppercase tracking-wide text-slate-500">
            Wargear {wargearPts > 0 ? `(+${wargearPts} pts)` : ""}
          </div>
          <div className="flex flex-wrap gap-2">
            {ds.wargear.map((w) => (
              <label
                key={w.name}
                className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300"
              >
                <input
                  type="number"
                  min={0}
                  value={unit.wargear?.[w.name] ?? 0}
                  onChange={(e) =>
                    setUnitWargear(
                      unit.instanceId,
                      w.name,
                      Math.max(0, Number(e.target.value) || 0)
                    )
                  }
                  className="w-12 rounded border border-slate-700 bg-slate-950 px-1 py-0.5 text-slate-100"
                />
                {w.name}{" "}
                <span className="text-slate-500">+{w.points}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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
