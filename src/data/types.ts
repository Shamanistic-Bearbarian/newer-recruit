// Domain model for the army-list builder.
//
// NOTE: Warhammer 40,000 11th edition is not released. The shapes below are a
// clean, edition-agnostic model we control. All concrete values that ship in
// `src/data/factions/*` are PLACEHOLDER data for development only and do not
// represent real game rules. When official 11th edition data exists it can be
// mapped into these types (a BattleScribe importer is a planned extension).

/** A datasheet stat line (the WH40k "characteristics" row). */
export type StatLine = {
  /** Movement, kept as a display string e.g. `6"`. */
  m: string;
  /** Toughness. */
  t: number;
  /** Save, display string e.g. `3+`. */
  sv: string;
  /** Wounds. */
  w: number;
  /** Leadership, display string e.g. `6+`. */
  ld: string;
  /** Objective Control. */
  oc: number;
  /** Optional invulnerable save, e.g. `4+`. */
  invuln?: string;
};

export type WeaponKind = "Ranged" | "Melee";

export type Weapon = {
  name: string;
  kind: WeaponKind;
  /** Range, ranged weapons only, e.g. `24"`. Melee weapons omit this. */
  range?: string;
  /** Attacks, display string e.g. `2` or `D6`. */
  a: string;
  /** Ballistic/Weapon Skill, display string e.g. `3+`. */
  skill: string;
  /** Strength. */
  s: string;
  /** Armour Penetration, e.g. `-1`. */
  ap: string;
  /** Damage, display string e.g. `1` or `D3`. */
  d: string;
  /** Weapon abilities, e.g. `Assault`, `Lethal Hits`. */
  keywords?: string[];
};

export type ModelProfile = {
  name: string;
  stats: StatLine;
};

/** A selectable unit size and its points cost. */
export type SizeOption = {
  /** Number of models in the unit at this size. */
  models: number;
  /** Points cost for the unit at this size. */
  points: number;
};

export type BattlefieldRole =
  | "Epic Hero"
  | "Character"
  | "Battleline"
  | "Infantry"
  | "Mounted"
  | "Beast"
  | "Vehicle"
  | "Monster"
  | "Dedicated Transport"
  | "Fortification"
  | "Other";

export type Ability = {
  name: string;
  text: string;
};

export type Datasheet = {
  id: string;
  name: string;
  factionId: string;
  /** Primary battlefield role; a {@link BattlefieldRole} but typed loosely to
   * accept any category coming from imported data. */
  role: string;
  /** Full keyword list, e.g. `["Infantry","Character","Imperium"]`. */
  keywords: string[];
  models: ModelProfile[];
  weapons: Weapon[];
  abilities: Ability[];
  /** Available unit sizes with points. Always at least one entry. */
  sizes: SizeOption[];
  /** Optional wargear items with a per-item points cost (added per item taken). */
  wargear?: { name: string; points: number }[];
  /** Whether this unit attaches to others as a Leader or Support character. */
  attachRole?: "leader" | "support";
  /** Units this Leader/Support can attach to (by name). */
  attachTo?: string[];
  /** Unique named character — at most one per army. */
  isEpicHero?: boolean;
  /** Can be given an Enhancement (CHARACTER units that aren't Epic Heroes). */
  isCharacter?: boolean;
  /**
   * True when the stat/weapon/ability profile is sourced from the 10th-edition
   * datasheet (which carries over unchanged into 11th). Points/detachments are
   * always 11th edition. Absent for brand-new 11th-edition units that don't yet
   * have a datasheet in the dataset.
   */
  provisional?: boolean;
};

export type Enhancement = {
  id: string;
  name: string;
  detachmentId: string;
  points: number;
  text: string;
  /**
   * If set, the enhancement may only be given to a unit whose keywords include
   * ALL of these. Omitted means any eligible CHARACTER.
   */
  requiresKeywords?: string[];
};

export type Detachment = {
  id: string;
  factionId: string;
  name: string;
  /** Detachment Points cost (11th edition), or null if not stated. */
  dp?: number | null;
  /** Force Disposition / primary objective, if stated. */
  objective?: string | null;
  rule: Ability;
  enhancements: Enhancement[];
};

export type Faction = {
  id: string;
  name: string;
  description?: string;
  datasheets: Datasheet[];
  detachments: Detachment[];
};

/** A standard game size / points bracket and its army-construction limits. */
export type GameSize = {
  id: string;
  name: string;
  points: number;
  /** Detachment Points budget (sum of chosen detachments' DP must not exceed). */
  dp: number;
  /** Maximum number of Enhancements in the army. */
  enhancements: number;
  /** Max copies of any one datasheet (the "rule of two"). */
  unitCopyLimit: number;
  /** Max copies of a Battleline datasheet (the "rule of four"). */
  battlelineCopyLimit: number;
};
