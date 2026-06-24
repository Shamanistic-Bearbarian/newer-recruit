// Game-data registry: the single source of truth the app reads from.
//
// Faction data is generated from the community BSData BattleScribe catalogues
// by `scripts/import-bsdata.mjs` into `generated/factions.json`. Regenerate
// with `npm run import-data`.

import type {
  Datasheet,
  Detachment,
  Enhancement,
  Faction,
  GameSize,
} from "@/data/types";
import factionsData from "@/data/generated/factions.json";
import metaData from "@/data/generated/meta.json";

export const META = metaData as {
  edition: string;
  sources: { points: string; provisionalProfiles: string };
  generatedAt: string;
  factionCount: number;
  datasheetCount: number;
  detachmentCount: number;
  /** % of datasheets whose stat/weapon profile was borrowed from 10th edition. */
  profileCoveragePct: number;
};

/** Bundled data is real, not invented placeholders. */
export const DATA_IS_PLACEHOLDER = false;

export const FACTIONS = factionsData as unknown as Faction[];

/**
 * Battle sizes and their 11th-edition army-construction limits.
 *
 * Values are from the 11th-edition Core Rules ("Muster Armies") as reported by
 * post-launch sources; Onslaught's DP/enhancement figures are the least certain.
 * TODO: verify every number against the official free Core Rules PDF
 * (warhammer-community.com). They are centralised here so corrections are a
 * one-line edit. The rule-of-two/four (max 2 copies of a datasheet, 4 for
 * Battleline) is a core rule applied at every size.
 */
export const GAME_SIZES: GameSize[] = [
  {
    id: "incursion",
    name: "Incursion",
    points: 1000,
    dp: 2,
    enhancements: 2,
    unitCopyLimit: 2,
    battlelineCopyLimit: 4,
  },
  {
    id: "strike-force",
    name: "Strike Force",
    points: 2000,
    dp: 3,
    enhancements: 4,
    unitCopyLimit: 2,
    battlelineCopyLimit: 4,
  },
  {
    id: "onslaught",
    name: "Onslaught",
    points: 3000,
    dp: 4,
    enhancements: 6,
    unitCopyLimit: 2,
    battlelineCopyLimit: 4,
  },
];

export const DEFAULT_GAME_SIZE =
  GAME_SIZES.find((g) => g.id === "strike-force") ?? GAME_SIZES[0];

/** The battle size matching a points limit, or the default if none matches. */
export function gameSizeForPoints(points: number): GameSize {
  return GAME_SIZES.find((g) => g.points === points) ?? DEFAULT_GAME_SIZE;
}

// --- Pre-built lookup maps --------------------------------------------------

const factionById = new Map<string, Faction>();
const datasheetById = new Map<string, Datasheet>();
const detachmentById = new Map<string, Detachment>();
const enhancementById = new Map<string, Enhancement>();

for (const faction of FACTIONS) {
  factionById.set(faction.id, faction);
  for (const ds of faction.datasheets) datasheetById.set(ds.id, ds);
  for (const det of faction.detachments) {
    detachmentById.set(det.id, det);
    for (const enh of det.enhancements) enhancementById.set(enh.id, enh);
  }
}

export function getFaction(id: string): Faction | undefined {
  return factionById.get(id);
}

export function getDatasheet(id: string): Datasheet | undefined {
  return datasheetById.get(id);
}

export function getDetachment(id: string): Detachment | undefined {
  return detachmentById.get(id);
}

export function getEnhancement(id: string): Enhancement | undefined {
  return enhancementById.get(id);
}

export function factionDatasheets(factionId: string): Datasheet[] {
  return getFaction(factionId)?.datasheets ?? [];
}

export function factionDetachments(factionId: string): Detachment[] {
  return getFaction(factionId)?.detachments ?? [];
}
