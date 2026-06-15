// Roster model + the list-building engine: points totals and validation.
//
// Validation rules below follow the GENERAL structure of recent WH40k army
// construction (10th ed style), used as a sensible placeholder until 11th
// edition is released. They are intentionally centralised here so they are easy
// to update when real rules exist.

import type { Datasheet, Detachment, Enhancement, Faction } from "@/data/types";
import { getDatasheet, getDetachment, getEnhancement, getFaction } from "@/data";

/** A unit instance placed into a roster. */
export type RosterUnit = {
  /** Unique id within the roster. */
  instanceId: string;
  datasheetId: string;
  /** Index into the datasheet's `sizes` array. */
  sizeIndex: number;
  /** Optional enhancement attached to this unit. */
  enhancementId?: string;
};

export type Roster = {
  id: string;
  name: string;
  factionId: string;
  detachmentId?: string;
  pointsLimit: number;
  units: RosterUnit[];
  /** Epoch millis of last edit. */
  updatedAt: number;
};

// --- Construction limits (placeholder values, easy to change) ---------------
export const MAX_ENHANCEMENTS_PER_ARMY = 3;
export const MAX_ENHANCEMENTS_PER_UNIT = 1;

// --- Lookups for a roster unit ----------------------------------------------

export function unitDatasheet(u: RosterUnit): Datasheet | undefined {
  return getDatasheet(u.datasheetId);
}

export function unitPoints(u: RosterUnit): number {
  const ds = getDatasheet(u.datasheetId);
  if (!ds) return 0;
  const size = ds.sizes[u.sizeIndex] ?? ds.sizes[0];
  const base = size?.points ?? 0;
  const enh = u.enhancementId ? getEnhancement(u.enhancementId) : undefined;
  return base + (enh?.points ?? 0);
}

export function rosterPoints(roster: Roster): number {
  return roster.units.reduce((sum, u) => sum + unitPoints(u), 0);
}

export function enhancementsUsed(roster: Roster): number {
  return roster.units.filter((u) => u.enhancementId).length;
}

// --- Validation -------------------------------------------------------------

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
};

export type ValidationResult = {
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  ok: boolean;
};

/**
 * Returns enhancements that may legally be attached to a given roster unit,
 * for the roster's currently-selected detachment.
 */
export function eligibleEnhancements(
  roster: Roster,
  u: RosterUnit
): Enhancement[] {
  const detachment = roster.detachmentId
    ? getDetachment(roster.detachmentId)
    : undefined;
  const ds = getDatasheet(u.datasheetId);
  if (!detachment || !ds || !ds.isCharacter || ds.isEpicHero) return [];
  return detachment.enhancements.filter((e) => {
    if (!e.requiresKeywords?.length) return true;
    return e.requiresKeywords.every((k) => ds.keywords.includes(k));
  });
}

export function validateRoster(roster: Roster): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const faction: Faction | undefined = getFaction(roster.factionId);
  const detachment: Detachment | undefined = roster.detachmentId
    ? getDetachment(roster.detachmentId)
    : undefined;

  if (!faction) {
    errors.push({ level: "error", message: "No faction selected." });
  }
  // Detachments are only required for factions that define them (Stage 2 data).
  const factionHasDetachments = (faction?.detachments.length ?? 0) > 0;
  if (factionHasDetachments && !detachment) {
    errors.push({ level: "error", message: "No detachment selected." });
  } else if (detachment && detachment.factionId !== roster.factionId) {
    errors.push({
      level: "error",
      message: `Detachment "${detachment.name}" does not belong to this faction.`,
    });
  }

  const total = rosterPoints(roster);
  if (total > roster.pointsLimit) {
    errors.push({
      level: "error",
      message: `Over points limit: ${total} / ${roster.pointsLimit} (by ${
        total - roster.pointsLimit
      }).`,
    });
  }

  if (roster.units.length === 0) {
    warnings.push({ level: "warning", message: "Roster is empty." });
  }

  // Enhancement rules.
  const enhCount = enhancementsUsed(roster);
  if (enhCount > MAX_ENHANCEMENTS_PER_ARMY) {
    errors.push({
      level: "error",
      message: `Too many enhancements: ${enhCount} (max ${MAX_ENHANCEMENTS_PER_ARMY}).`,
    });
  }

  const seenEnhancements = new Set<string>();
  for (const u of roster.units) {
    if (!u.enhancementId) continue;
    const ds = getDatasheet(u.datasheetId);
    const enh = getEnhancement(u.enhancementId);
    const label = ds?.name ?? u.datasheetId;

    if (!enh) {
      errors.push({
        level: "error",
        message: `${label} has an unknown enhancement.`,
      });
      continue;
    }
    if (ds && (!ds.isCharacter || ds.isEpicHero)) {
      errors.push({
        level: "error",
        message: `${label} cannot take an enhancement (only non-Epic-Hero Characters can).`,
      });
    }
    if (detachment && enh.detachmentId !== detachment.id) {
      errors.push({
        level: "error",
        message: `Enhancement "${enh.name}" is not from the selected detachment.`,
      });
    }
    if (seenEnhancements.has(enh.id)) {
      errors.push({
        level: "error",
        message: `Enhancement "${enh.name}" is used more than once (each may be taken once).`,
      });
    }
    seenEnhancements.add(enh.id);
  }

  // Epic Heroes are unique.
  const epicCounts = new Map<string, number>();
  for (const u of roster.units) {
    const ds = getDatasheet(u.datasheetId);
    if (ds?.isEpicHero) {
      epicCounts.set(ds.id, (epicCounts.get(ds.id) ?? 0) + 1);
    }
  }
  for (const [id, count] of epicCounts) {
    if (count > 1) {
      const ds = getDatasheet(id);
      errors.push({
        level: "error",
        message: `${ds?.name ?? id} is an Epic Hero and may only be taken once (found ${count}).`,
      });
    }
  }

  return { errors, warnings, ok: errors.length === 0 };
}

// --- Factory / id helpers ---------------------------------------------------

function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

export function newRoster(params: {
  name?: string;
  factionId: string;
  detachmentId?: string;
  pointsLimit: number;
}): Roster {
  return {
    id: uid("roster"),
    name: params.name?.trim() || "Untitled List",
    factionId: params.factionId,
    detachmentId: params.detachmentId,
    pointsLimit: params.pointsLimit,
    units: [],
    updatedAt: Date.now(),
  };
}

export function newRosterUnit(datasheetId: string, sizeIndex = 0): RosterUnit {
  return { instanceId: uid("u"), datasheetId, sizeIndex };
}
