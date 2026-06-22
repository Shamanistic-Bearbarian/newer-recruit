"use client";

// Shown when there is no working roster: create a new list, or open / import
// an existing one from the saved library.

import { useRef, useState } from "react";
import { FACTIONS, GAME_SIZES, factionDetachments, getFaction } from "@/data";
import { rosterPoints } from "@/lib/roster";
import { useBuilder } from "@/lib/useBuilder";
import { parseRosterFile } from "@/lib/storage";

export default function StartScreen() {
  const { startNewList, saved, loadList, deleteSaved } = useBuilder();
  const [name, setName] = useState("");
  const [factionId, setFactionId] = useState(FACTIONS[0]?.id ?? "");
  const detachments = factionDetachments(factionId);
  const [detachmentId, setDetachmentId] = useState(detachments[0]?.id ?? "");
  const [pointsLimit, setPointsLimit] = useState(GAME_SIZES[2]?.points ?? 2000);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onFactionChange(id: string) {
    setFactionId(id);
    setDetachmentId(factionDetachments(id)[0]?.id ?? "");
  }

  async function onImportFile(file: File) {
    setImportError(null);
    try {
      const roster = parseRosterFile(await file.text());
      loadList(roster);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Could not import file.");
    }
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">
          Start a new list
        </h2>
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="text-slate-400">List name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My new list"
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="text-slate-400">Faction</span>
            <select
              value={factionId}
              onChange={(e) => onFactionChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              {FACTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>

          {detachments.length > 0 && (
            <label className="block text-sm">
              <span className="text-slate-400">Detachment</span>
              <select
                value={detachmentId}
                onChange={(e) => setDetachmentId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
              >
                {detachments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.dp != null ? ` (${d.dp} DP)` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-sm">
            <span className="text-slate-400">Game size</span>
            <select
              value={pointsLimit}
              onChange={(e) => setPointsLimit(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100"
            >
              {GAME_SIZES.map((g) => (
                <option key={g.id} value={g.points}>
                  {g.name} — {g.points} pts
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() =>
              startNewList({ name, factionId, detachmentId, pointsLimit })
            }
            disabled={!factionId}
            className="mt-2 w-full rounded-md bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            Create list
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Your lists</h2>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
          >
            Import…
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImportFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {importError && (
          <p className="mb-3 rounded-md border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
            {importError}
          </p>
        )}

        {saved.length === 0 ? (
          <p className="text-sm text-slate-400">
            No saved lists yet. Create one, or import a <code>.nr.json</code> file.
          </p>
        ) : (
          <ul className="space-y-2">
            {saved.map((r) => {
              const faction = getFaction(r.factionId);
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 p-2"
                >
                  <button
                    onClick={() => loadList(r)}
                    className="flex-1 text-left"
                  >
                    <span className="block font-medium text-slate-100">
                      {r.name}
                    </span>
                    <span className="block text-xs text-slate-400">
                      {faction?.name ?? r.factionId} · {rosterPoints(r)}/
                      {r.pointsLimit} pts · {r.units.length} units
                    </span>
                  </button>
                  <button
                    onClick={() => deleteSaved(r.id)}
                    className="rounded-md border border-rose-800 px-2 py-1 text-xs text-rose-300 hover:bg-rose-950/50"
                  >
                    Delete
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
