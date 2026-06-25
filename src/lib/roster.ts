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
  /** Wargear item name -> quantity taken (each adds the item's points). */
  wargear?: Record<string, number>;
  /** For a Leader/Support unit, the instanceId of the unit it is attached to. */
  attachedTo?: string;
};

export type Roster = {
  id: string;
  name: string;
  factionId: string;
  /** Selected detachments (11e allows several within the DP budget). */
  detachmentIds: string[];
  pointsLimit: number;
  units: RosterUnit[];
  /** Epoch millis of last edit. */
  updatedAt: number;
};

/** A 3 DP detachment is army-defining: it can't be combined and needs ≥2000 pts. */
export const EXCLUSIVE_DP = 3;
export const EXCLUSIVE_DP_MIN_POINTS = 2000;

/** Migrate older single-detachment rosters to the detachmentIds array. */
export function migrateRoster(r: Roster & { detachmentId?: string }): Roster {
  if (Array.isArray(r.detachmentIds)) return r;
  const ids = r.detachmentId ? [r.detachmentId] : [];
  const { detachmentId: _drop, ...rest } = r;
  void _drop;
  return { ...rest, detachmentIds: ids };
}

export function rosterDetachments(roster: Roster): Detachment[] {
  return roster.detachmentIds
    .map((id) => getDetachment(id))
    .filter((d): d is Detachment => !!d);
}

export function rosterDpUsed(roster: Roster): number {
  return rosterDetachments(roster).reduce((sum, d) => sum + (d.dp ?? 0), 0);
}

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

/** Points added by the unit's selected wargear items. */
export function unitWargearPoints(u: RosterUnit): number {
  const ds = getDatasheet(u.datasheetId);
  if (!ds?.wargear || !u.wargear) return 0;
  return ds.wargear.reduce(
    (sum, w) => sum + (u.wargear?.[w.name] ?? 0) * w.points,
    0
  );
}

export function unitPoints(u: RosterUnit): number {
  const ds = getDatasheet(u.datasheetId);
  if (!ds) return 0;
  const size = ds.sizes[u.sizeIndex] ?? ds.sizes[0];
  const base = size?.points ?? 0;
  const enh = u.enhancementId ? getEnhancement(u.enhancementId) : undefined;
  return base + (enh?.points ?? 0) + unitWargearPoints(u);
}

/** Units in the roster that this Leader/Support may attach to. */
export function eligibleAttachTargets(
  roster: Roster,
  u: RosterUnit
): RosterUnit[] {
  const ds = getDatasheet(u.datasheetId);
  if (!ds?.attachRole || !ds.attachTo?.length) return [];
  return roster.units.filter((t) => {
    if (t.instanceId === u.instanceId) return false;
    const tds = getDatasheet(t.datasheetId);
    return !!tds && ds.attachTo!.includes(tds.name);
  });
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
  const ds = getDatasheet(u.datasheetId);
  // Epic Heroes can never take an enhancement.
  if (!ds || ds.isEpicHero) return [];
  // Enhancements from any of the selected detachments are available.
  return rosterDetachments(roster)
    .flatMap((d) => d.enhancements)
    .filter((e) => {
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
  const detachments = rosterDetachments(roster);
  const detachmentIdSet = new Set(detachments.map((d) => d.id));
  const size = gameSizeForPoints(roster.pointsLimit);

  if (!faction) {
    errors.push({ level: "error", message: "No faction selected." });
  }
  const factionHasDetachments = (faction?.detachments.length ?? 0) > 0;
  if (factionHasDetachments && detachments.length === 0) {
    errors.push({ level: "error", message: "No detachment selected." });
  }
  for (const d of detachments) {
    if (d.factionId !== roster.factionId) {
      errors.push({
        level: "error",
        message: `Detachment "${d.name}" does not belong to this faction.`,
      });
    }
  }
  if (new Set(roster.detachmentIds).size !== roster.detachmentIds.length) {
    errors.push({
      level: "error",
      message: "The same detachment is selected more than once.",
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

  // Detachment Points: total cost must fit the battle-size budget.
  const dpUsed = rosterDpUsed(roster);
  if (dpUsed > size.dp) {
    errors.push({
      level: "error",
      message: `Detachments cost ${dpUsed} DP, over the ${size.dp} DP budget for ${size.name}.`,
    });
  }
  // A 3 DP detachment is army-defining: it must be the only one and needs ≥2000 pts.
  const exclusive = detachments.find((d) => (d.dp ?? 0) >= EXCLUSIVE_DP);
  if (exclusive && detachments.length > 1) {
    errors.push({
      level: "error",
      message: `"${exclusive.name}" (${exclusive.dp} DP) can't be combined with another detachment.`,
    });
  }
  if (exclusive && roster.pointsLimit < EXCLUSIVE_DP_MIN_POINTS) {
    errors.push({
      level: "error",
      message: `"${exclusive.name}" (${exclusive.dp} DP) can only be used at ${EXCLUSIVE_DP_MIN_POINTS}+ points.`,
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
    if (detachmentIdSet.size > 0 && !detachmentIdSet.has(enh.detachmentId)) {
      errors.push({
        level: "error",
        message: `Enhancement "${enh.name}" is not from a selected detachment.`,
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

  // Leader / Support attachment rules.
  const byInstance = new Map(roster.units.map((u) => [u.instanceId, u]));
  const attachCounts = new Map<string, { leader: number; support: number }>();
  for (const u of roster.units) {
    if (!u.attachedTo) continue;
    const ds = getDatasheet(u.datasheetId);
    const label = ds?.name ?? u.datasheetId;
    if (!ds?.attachRole) {
      errors.push({
        level: "error",
        message: `${label} is attached to a unit but is not a Leader or Support.`,
      });
      continue;
    }
    const target = byInstance.get(u.attachedTo);
    if (!target) {
      errors.push({
        level: "error",
        message: `${label} is attached to a unit no longer in the list.`,
      });
      continue;
    }
    const targetDs = getDatasheet(target.datasheetId);
    if (ds.attachTo?.length && targetDs && !ds.attachTo.includes(targetDs.name)) {
      errors.push({
        level: "error",
        message: `${label} cannot attach to ${targetDs.name}.`,
      });
    }
    const c = attachCounts.get(u.attachedTo) ?? { leader: 0, support: 0 };
    c[ds.attachRole]++;
    attachCounts.set(u.attachedTo, c);
  }
  for (const [tid, c] of attachCounts) {
    const tname = getDatasheet(byInstance.get(tid)!.datasheetId)?.name ?? tid;
    if (c.leader > 1) {
      errors.push({
        level: "error",
        message: `${tname} has ${c.leader} Leaders attached (max 1).`,
      });
    }
    if (c.support > 1) {
      errors.push({
        level: "error",
        message: `${tname} has ${c.support} Support units attached (max 1).`,
      });
    }
  }
  // Support characters must be attached to a unit.
  for (const u of roster.units) {
    const ds = getDatasheet(u.datasheetId);
    if (ds?.attachRole === "support" && !u.attachedTo) {
      errors.push({
        level: "error",
        message: `${ds.name} (Support) must be attached to a unit.`,
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
  detachmentIds?: string[];
  pointsLimit: number;
}): Roster {
  return {
    id: uid("roster"),
    name: params.name?.trim() || "Untitled List",
    factionId: params.factionId,
    detachmentIds: params.detachmentIds ?? [],
    pointsLimit: params.pointsLimit,
    units: [],
    updatedAt: Date.now(),
  };
}

export function newRosterUnit(datasheetId: string, sizeIndex = 0): RosterUnit {
  return { instanceId: uid("u"), datasheetId, sizeIndex };
}
