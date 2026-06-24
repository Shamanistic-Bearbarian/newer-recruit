// Converts community BSData BattleScribe catalogues (.gst/.cat) into the clean
// JSON our app consumes (src/data/generated/factions.json).
//
// Source: https://github.com/BSData/wh40k-10e (10th edition — used until 11th
// edition data is published; re-point SOURCE_REPO when it is).
//
// Usage:
//   node scripts/import-bsdata.mjs [path-to-bsdata-checkout]
// If no path is given, the repo is cloned/updated into .bsdata-cache/.
//
// Stage 1 scope: factions -> categories (roles + keywords) -> datasheets with
// stat profiles, weapons, abilities, and base points. Legends are excluded.
// Per-size pricing, wargear-option trees and detachments are later stages.

import { XMLParser } from "fast-xml-parser";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SOURCE_REPO = "https://github.com/BSData/wh40k-10e.git";
const EDITION = "Warhammer 40,000 — 10th edition (BSData)";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outDir = join(projectRoot, "src", "data", "generated");

// --- locate / fetch source --------------------------------------------------

function resolveSourceDir() {
  const arg = process.argv[2];
  if (arg) {
    if (!existsSync(arg)) throw new Error(`Source dir not found: ${arg}`);
    return arg;
  }
  const cache = join(projectRoot, ".bsdata-cache", "wh40k-10e");
  if (existsSync(join(cache, "Warhammer 40,000.gst"))) {
    console.log("Using cached BSData at", cache);
    return cache;
  }
  console.log("Cloning BSData into", cache, "…");
  mkdirSync(dirname(cache), { recursive: true });
  execSync(`git clone --depth 1 ${SOURCE_REPO} "${cache}"`, { stdio: "inherit" });
  return cache;
}

// --- XML parsing ------------------------------------------------------------

const ALWAYS_ARRAY = new Set([
  "publication", "costType", "profileType", "characteristicType",
  "categoryEntry", "categoryLink", "profile", "characteristic",
  "selectionEntry", "selectionEntryGroup", "entryLink", "infoLink",
  "cost", "constraint", "modifier", "rule", "catalogueLink", "association",
]);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  textNodeName: "text",
  isArray: (name) => ALWAYS_ARRAY.has(name),
});

const arr = (x) => (Array.isArray(x) ? x : x == null ? [] : [x]);

// --- global id indexes (for entryLink / infoLink resolution) ----------------

const profileIndex = new Map(); // id -> profile node (typeName + characteristics)
const entryIndex = new Map(); // id -> selectionEntry / selectionEntryGroup node
const ruleIndex = new Map(); // id -> rule node

function indexNode(node) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const v of node) indexNode(v);
    return;
  }
  if (node.id) {
    if (node.typeName !== undefined && node.characteristics) {
      profileIndex.set(node.id, node);
    } else if (node.description !== undefined && node.typeName === undefined) {
      ruleIndex.set(node.id, node);
    } else {
      // selectionEntry / selectionEntryGroup / shared entries
      entryIndex.set(node.id, node);
    }
  }
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (v && typeof v === "object") indexNode(v);
  }
}

// --- datasheet extraction ---------------------------------------------------

function charMap(profile) {
  const m = {};
  for (const c of arr(profile.characteristics?.characteristic)) {
    m[c.name] = (c.text ?? "").toString().trim();
  }
  return m;
}

function num(v) {
  const n = Number(String(v ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function extractDatasheet(root) {
  const models = [];
  const weapons = [];
  const abilities = [];
  const seenModel = new Set();
  const seenWeapon = new Set();
  const seenAbility = new Set();
  const visited = new Set();

  // `weaponsOnly` is set once traversal crosses an entryLink: wargear options
  // (weapons) are collected, but abilities/unit profiles found down those
  // branches belong to the shared upgrade/Crusade system, not this datasheet.
  const addProfile = (p, weaponsOnly) => {
    const c = charMap(p);
    if (weaponsOnly && p.typeName !== "Ranged Weapons" && p.typeName !== "Melee Weapons") {
      return;
    }
    switch (p.typeName) {
      case "Unit": {
        if (seenModel.has(p.name)) break;
        seenModel.add(p.name);
        models.push({
          name: p.name,
          stats: {
            m: c.M ?? "-", t: num(c.T), sv: c.SV ?? "-",
            w: num(c.W), ld: c.LD ?? "-", oc: num(c.OC),
          },
        });
        break;
      }
      case "Ranged Weapons":
      case "Melee Weapons": {
        const key = p.name + (c.Range ?? "") + (c.A ?? "");
        if (seenWeapon.has(key)) break;
        seenWeapon.add(key);
        const ranged = p.typeName === "Ranged Weapons";
        weapons.push({
          name: p.name,
          kind: ranged ? "Ranged" : "Melee",
          range: ranged ? c.Range : undefined,
          a: c.A ?? "-",
          skill: (ranged ? c.BS : c.WS) ?? "-",
          s: c.S ?? "-", ap: c.AP ?? "0", d: c.D ?? "-",
          keywords: c.Keywords && c.Keywords !== "-"
            ? c.Keywords.split(",").map((k) => k.trim()).filter(Boolean)
            : undefined,
        });
        break;
      }
      case "Abilities": {
        if (seenAbility.has(p.name)) break;
        seenAbility.add(p.name);
        abilities.push({ name: p.name, text: c.Description ?? "" });
        break;
      }
    }
  };

  // entryLink names that lead into shared systems rather than this datasheet's
  // wargear, and would pollute it.
  const SKIP_LINKS = new Set(["Crusade"]);

  const recurse = (node, depth, weaponsOnly) => {
    if (!node || depth > 14) return;
    for (const p of arr(node.profiles?.profile)) addProfile(p, weaponsOnly);
    for (const il of arr(node.infoLinks?.infoLink)) {
      if (il.type === "profile") {
        const p = profileIndex.get(il.targetId);
        if (p) addProfile(p, weaponsOnly);
      }
    }
    for (const el of arr(node.entryLinks?.entryLink)) {
      if (!el.targetId || visited.has(el.targetId)) continue;
      if (SKIP_LINKS.has(el.name)) continue;
      visited.add(el.targetId);
      const t = entryIndex.get(el.targetId);
      // Crossing an entryLink: collect weapons only beyond this point.
      if (t) recurse(t, depth + 1, true);
    }
    for (const se of arr(node.selectionEntries?.selectionEntry)) {
      if (se.id) {
        if (visited.has(se.id)) continue;
        visited.add(se.id);
      }
      recurse(se, depth + 1, weaponsOnly);
    }
    for (const g of arr(node.selectionEntryGroups?.selectionEntryGroup)) {
      recurse(g, depth + 1, weaponsOnly);
    }
  };

  recurse(root, 0, false);

  // Categories from the datasheet root.
  let role = "Other";
  const keywords = [];
  for (const cl of arr(root.categoryLinks?.categoryLink)) {
    const name = (cl.name ?? "").replace(/^Faction:\s*/, "");
    if (!name || name === "Configuration") continue;
    if (cl.primary === "true") role = cl.name;
    keywords.push(name);
  }

  const points = num(
    arr(root.costs?.cost).find((c) => c.name === "pts")?.value
  );

  return {
    id: root.id,
    name: root.name,
    role,
    keywords: [...new Set(keywords)],
    models,
    weapons,
    abilities,
    // Stage 1: single entry at the datasheet's base points cost.
    sizes: [{ models: 0, points }],
    isEpicHero: keywords.includes("Epic Hero") || undefined,
    isCharacter: keywords.includes("Character") || undefined,
  };
}

// --- main -------------------------------------------------------------------

export function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Parse every .gst/.cat in a checkout and populate the global id indexes. */
function parseAndIndex(srcDir) {
  const files = readdirSync(srcDir).filter(
    (f) => f.endsWith(".cat") || f.endsWith(".gst")
  );
  console.log(`Parsing ${files.length} BSData files & indexing ids…`);
  const parsed = [];
  for (const f of files) {
    const obj = parser.parse(readFileSync(join(srcDir, f), "utf-8"));
    parsed.push(obj);
    indexNode(obj);
  }
  console.log(
    `Indexed: ${profileIndex.size} profiles, ${entryIndex.size} entries, ${ruleIndex.size} rules.`
  );
  return parsed;
}

/** Extract the datasheets defined directly in one catalogue. */
function catalogueDatasheets(cat) {
  const datasheets = [];
  const roots = [
    ...arr(cat.selectionEntries?.selectionEntry),
    ...arr(cat.entryLinks?.entryLink)
      .map((el) => entryIndex.get(el.targetId))
      .filter(Boolean),
  ];
  for (const root of roots) {
    if (root.type !== "unit" && root.type !== "model") continue;
    if ((root.name ?? "").includes("[Legends]")) continue;
    const ds = extractDatasheet(root);
    if (ds.models.length === 0 && ds.weapons.length === 0) continue;
    datasheets.push({ ...ds, factionId: slug(cat.name) });
  }
  return datasheets;
}

/**
 * Build the faction array (does not write files). Skips Library catalogues —
 * their datasheets are reached via {@link buildAllDatasheets} instead.
 */
export function buildTenth(srcDir) {
  const factions = [];
  for (const obj of parseAndIndex(srcDir)) {
    const cat = obj.catalogue;
    if (!cat || cat.library === "true") continue;
    const datasheets = catalogueDatasheets(cat);
    if (datasheets.length === 0) continue;
    datasheets.sort((a, b) => a.name.localeCompare(b.name));
    factions.push({ id: slug(cat.name), name: cat.name, datasheets, detachments: [] });
  }
  factions.sort((a, b) => a.name.localeCompare(b.name));
  return factions;
}

/**
 * Every unit datasheet across ALL catalogues, including shared Library files
 * (which is where some factions — Daemons, Knights — keep their datasheets).
 * Used by the MFM importer to borrow profiles by unit name.
 */
export function buildAllDatasheets(srcDir) {
  const all = [];
  for (const obj of parseAndIndex(srcDir)) {
    if (obj.catalogue) all.push(...catalogueDatasheets(obj.catalogue));
  }
  return all;
}

function main() {
  const factions = buildTenth(resolveSourceDir());
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "factions.json"), JSON.stringify(factions));
  const totalDs = factions.reduce((n, f) => n + f.datasheets.length, 0);
  writeFileSync(
    join(outDir, "meta.json"),
    JSON.stringify(
      {
        edition: EDITION,
        source: SOURCE_REPO,
        generatedAt: new Date().toISOString(),
        factionCount: factions.length,
        datasheetCount: totalDs,
      },
      null,
      2
    )
  );
  console.log(`\nWrote ${factions.length} factions, ${totalDs} datasheets.`);
}

// Run standalone (writes a 10th-edition-only dataset) only when invoked directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
