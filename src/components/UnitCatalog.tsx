"use client";

// Browseable list of a faction's datasheets, grouped by battlefield role,
// each addable to the current roster.

import { useState } from "react";
import { factionDatasheets } from "@/data";
import type { BattlefieldRole, Datasheet } from "@/data/types";
import { useBuilder } from "@/lib/useBuilder";
import DatasheetView from "@/components/DatasheetView";

// Preferred ordering; any role not listed is appended alphabetically so no
// units are ever hidden from the catalog.
const ROLE_ORDER: BattlefieldRole[] = [
  "Epic Hero",
  "Character",
  "Battleline",
  "Infantry",
  "Mounted",
  "Beast",
  "Vehicle",
  "Monster",
  "Dedicated Transport",
  "Fortification",
  "Other",
];

function orderedRoles(roles: string[]): string[] {
  const known = ROLE_ORDER.filter((r) => roles.includes(r));
  const extra = roles
    .filter((r) => !ROLE_ORDER.includes(r as BattlefieldRole))
    .sort();
  return [...known, ...extra];
}

function CatalogRow({ ds }: { ds: Datasheet }) {
  const { addUnit } = useBuilder();
  const [open, setOpen] = useState(false);
  const minPoints = Math.min(...ds.sizes.map((s) => s.points));

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60">
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 text-left"
          aria-expanded={open}
        >
          <span className="font-medium text-slate-100">{ds.name}</span>
          <span className="ml-2 text-xs text-slate-400">
            from {minPoints} pts
          </span>
        </button>
        <button
          onClick={() => addUnit(ds.id)}
          className="rounded-md bg-emerald-600 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-500"
        >
          + Add
        </button>
      </div>
      {open && (
        <div className="border-t border-slate-800 p-3">
          <DatasheetView datasheet={ds} />
        </div>
      )}
    </div>
  );
}

export default function UnitCatalog({ factionId }: { factionId: string }) {
  const [query, setQuery] = useState("");
  const all = factionDatasheets(factionId);
  const filtered = query
    ? all.filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
    : all;

  const roles = orderedRoles([...new Set(filtered.map((d) => d.role))]);
  const byRole = roles
    .map((role) => ({
      role,
      units: filtered.filter((d) => d.role === role),
    }))
    .filter((g) => g.units.length > 0);

  return (
    <div className="space-y-3">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search units…"
        className="w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
      />
      {byRole.length === 0 && (
        <p className="text-sm text-slate-400">No units match.</p>
      )}
      {byRole.map((group) => (
        <div key={group.role} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {group.role}
          </h3>
          <div className="space-y-2">
            {group.units.map((ds) => (
              <CatalogRow key={ds.id} ds={ds} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
