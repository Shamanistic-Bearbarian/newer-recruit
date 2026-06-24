// Roster model + the list-building engine: points totals and validation.
//
// Validation implements 11th-edition "Muster Armies" rules: a per-battle-size
// Detachment Points budget, enhancement cap and the rule-of-two/four, plus
// enhancement and Epic Hero restrictions. The numeric limits live in
// GAME_SIZES (src/data/index.ts) so they are easy to correct.

import type { Datasheet, Detachment, Enhancement, Faction } from "@/data/types";
import {
  getDatasheet,
  getDetachment,
  getEnhancement,
  getFaction,
  gameSizeForPoints,
} from "@/data";

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

// An "Upgrade"-tagged enhancement may go on non-Character units, and counts as
// a single enhancement choice even if shared across units. The MFM marks these
// with "(Upgrade)" in the name.
export function isUpgradeEnhancement(enh: Enhancement | undefined): boolean {
  return !!enh && /\(upgrade\)/i.test(enh.name);
}

function isBattleline(ds: Datasheet): boolean {
  return ds.role === "Battleline" || ds.keywords.includes("Battleline");
}

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

/**
 * Number of enhancement *choices* used. A normal enhancement counts per unit;
 * an Upgrade enhancement counts once no matter how many units share it.
 */
export function enhancementsUsed(roster: Roster): number {
  let normal = 0;
  const upgradeIds = new Set<string>();
  for (const u of roster.units) {
    if (!u.enhancementId) continue;
    const enh = getEnhancement(u.enhancementId);
    if (isUpgradeEnhancement(enh)) upgradeIds.add(u.enhancementId);
    else normal++;
  }
  return normal + upgradeIds.size;
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
  // Epic Heroes can never take an enhancement.
  if (!detachment || !ds || ds.isEpicHero) return [];
  return detachment.enhancements.filter((e) => {
    // Normal enhancements: Characters only. Upgrade enhancements: any unit.
    if (!isUpgradeEnhancement(e) && !ds.isCharacter) return false;
    if (e.requiresKeywords?.length) {
      return e.requiresKeywords.every((k) => ds.keywords.includes(k));
    }
    return true;
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

  const size = gameSizeForPoints(roster.pointsLimit);

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

  // Detachment Points budget (single detachment for now; multi-detachment TBD).
  if (detachment && detachment.dp != null && detachment.dp > size.dp) {
    errors.push({
      level: "error",
      message: `Detachment "${detachment.name}" costs ${detachment.dp} DP, over the ${size.dp} DP budget for ${size.name}.`,
    });
  }

  // Enhancement cap (per battle size).
  const enhCount = enhancementsUsed(roster);
  if (enhCount > size.enhancements) {
    errors.push({
      level: "error",
      message: `Too many enhancements: ${enhCount} (max ${size.enhancements} at ${size.name}).`,
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
    if (ds?.isEpicHero) {
      errors.push({
        level: "error",
        message: `${label} is an Epic Hero and cannot take an enhancement.`,
      });
    } else if (ds && !ds.isCharacter && !isUpgradeEnhancement(enh)) {
      errors.push({
        level: "error",
        message: `${label} cannot take "${enh.name}" — only Characters can (this is not an Upgrade enhancement).`,
      });
    }
    if (detachment && enh.detachmentId !== detachment.id) {
      errors.push({
        level: "error",
        message: `Enhancement "${enh.name}" is not from the selected detachment.`,
      });
    }
    // Normal enhancements are once-per-army; Upgrade enhancements may be shared
    // across up to 3 units (checked separately below).
    if (!isUpgradeEnhancement(enh)) {
      if (seenEnhancements.has(enh.id)) {
        errors.push({
          level: "error",
          message: `Enhancement "${enh.name}" is used more than once (each may be taken once).`,
        });
      }
      seenEnhancements.add(enh.id);
    }
  }

  // Upgrade enhancements: at most 3 units may share one.
  const upgradeUse = new Map<string, number>();
  for (const u of roster.units) {
    const enh = u.enhancementId ? getEnhancement(u.enhancementId) : undefined;
    if (isUpgradeEnhancement(enh)) {
      upgradeUse.set(u.enhancementId!, (upgradeUse.get(u.enhancementId!) ?? 0) + 1);
    }
  }
  for (const [id, count] of upgradeUse) {
    if (count > 3) {
      errors.push({
        level: "error",
        message: `Upgrade "${getEnhancement(id)?.name ?? id}" is on ${count} units (max 3).`,
      });
    }
  }

  // Rule of two/four: max copies of any datasheet (Epic Heroes handled below).
  const copies = new Map<string, number>();
  for (const u of roster.units) {
    const ds = getDatasheet(u.datasheetId);
    if (!ds || ds.isEpicHero) continue;
    copies.set(ds.id, (copies.get(ds.id) ?? 0) + 1);
  }
  for (const [id, count] of copies) {
    const ds = getDatasheet(id)!;
    const limit = isBattleline(ds) ? size.battlelineCopyLimit : size.unitCopyLimit;
    if (count > limit) {
      errors.push({
        level: "error",
        message: `${ds.name}: ${count} copies, max ${limit}${
          isBattleline(ds) ? " (Battleline)" : ""
        }.`,
      });
    }
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
