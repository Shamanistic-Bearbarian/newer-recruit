// Local persistence for rosters, plus file export/import. Browser-only;
// every function guards against running on the server.

import { migrateRoster, type Roster } from "@/lib/roster";

const SAVED_KEY = "nr:rosters";
const CURRENT_KEY = "nr:current";
const EXPORT_VERSION = 1;

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or serialization failure — silently ignore for the MVP.
  }
}

// --- Saved roster library ---------------------------------------------------

export function loadSavedRosters(): Roster[] {
  const list = readJson<Roster[]>(SAVED_KEY, []);
  if (!Array.isArray(list)) return [];
  return list.map(migrateRoster).sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Insert or update a roster in the saved library (by id). */
export function upsertRoster(roster: Roster): Roster[] {
  const list = loadSavedRosters().filter((r) => r.id !== roster.id);
  list.unshift({ ...roster, updatedAt: Date.now() });
  writeJson(SAVED_KEY, list);
  return loadSavedRosters();
}

export function deleteRoster(id: string): Roster[] {
  const list = loadSavedRosters().filter((r) => r.id !== id);
  writeJson(SAVED_KEY, list);
  return list;
}

// --- Working roster (autosaved draft) ---------------------------------------

export function loadCurrentRoster(): Roster | null {
  const r = readJson<Roster | null>(CURRENT_KEY, null);
  return r ? migrateRoster(r) : null;
}

export function saveCurrentRoster(roster: Roster | null): void {
  writeJson(CURRENT_KEY, roster);
}

// --- File export / import ---------------------------------------------------

type RosterFile = {
  app: "newer-recruit";
  version: number;
  roster: Roster;
};

export function rosterToFileBlob(roster: Roster): Blob {
  const payload: RosterFile = {
    app: "newer-recruit",
    version: EXPORT_VERSION,
    roster,
  };
  return new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
}

export function suggestedFileName(roster: Roster): string {
  const safe = roster.name.replace(/[^a-z0-9-_ ]/gi, "").trim() || "list";
  return `${safe}.nr.json`;
}

/** Parse a roster from an exported file's text. Throws on invalid input. */
export function parseRosterFile(text: string): Roster {
  const data = JSON.parse(text) as Partial<RosterFile> & { roster?: Roster };
  const roster = data.roster;
  if (
    !roster ||
    typeof roster !== "object" ||
    typeof roster.factionId !== "string" ||
    !Array.isArray(roster.units)
  ) {
    throw new Error("This file does not contain a valid newer-recruit list.");
  }
  return migrateRoster(roster);
}
