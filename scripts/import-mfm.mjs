// Builds the app's data for Warhammer 40,000 **11th edition**.
//
// 11th edition data sources, today:
//   - Points / detachments / enhancements / wargear: official Munitorum Field
//     Manual, scraped to YAML by https://github.com/BSData/wh40k-11e-mfm
//   - Datasheet PROFILES (stats, weapons, abilities, keywords): NOT yet
//     published for 11th edition. Until a wh40k-11e catalogue exists, we borrow
//     10th-edition profiles (BSData wh40k-10e) matched by unit name, and flag
//     them `provisional: true`. These are reference only and may be wrong.
//
// Usage: node scripts/import-mfm.mjs
//   Clones/uses .bsdata-cache/{wh40k-11e-mfm,wh40k-10e}; writes
//   src/data/generated/{factions.json,meta.json}.

import { parse as parseYaml } from "yaml";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTenth, slug } from "./import-bsdata.mjs";

const MFM_REPO = "https://github.com/BSData/wh40k-11e-mfm.git";
const TENTH_REPO = "https://github.com/BSData/wh40k-10e.git";
const EDITION = "Warhammer 40,000 — 11th edition";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const outDir = join(projectRoot, "src", "data", "generated");
const cacheDir = join(projectRoot, ".bsdata-cache");

function ensureRepo(name, url, sentinel) {
  const dir = join(cacheDir, name);
  if (existsSync(join(dir, sentinel))) return dir;
  console.log(`Cloning ${url} → ${dir} …`);
  mkdirSync(cacheDir, { recursive: true });
  execSync(`git clone --depth 1 ${url} "${dir}"`, { stdio: "inherit" });
  return dir;
}

/** Normalise a unit name for matching across data sources. */
function norm(name) {
  return name
    .toLowerCase()
    .replace(/[‘’ʼ']/g, "") // curly/straight apostrophes
    .replace(/\bw\/\b/g, "with")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function main() {
  const mfmDir = ensureRepo("wh40k-11e-mfm", MFM_REPO, join("data", "meta.yaml"));
  const tenthDir = ensureRepo("wh40k-10e", TENTH_REPO, "Warhammer 40,000.gst");

  // 10th-edition profiles, indexed by normalised unit name (for borrowing).
  const tenth = buildTenth(tenthDir);
  const profileByName = new Map();
  for (const f of tenth) {
    for (const ds of f.datasheets) {
      const key = norm(ds.name);
      if (!profileByName.has(key)) profileByName.set(key, ds);
    }
  }
  console.log(`Indexed ${profileByName.size} 10e profiles for borrowing.`);

  const dataDir = join(mfmDir, "data");
  const files = readdirSync(dataDir).filter(
    (f) => f.endsWith(".yaml") && f !== "meta.yaml"
  );

  let matched = 0;
  let total = 0;
  const factions = [];

  for (const file of files) {
    const fac = parseYaml(readFileSync(join(dataDir, file), "utf-8"));
    const factionId = fac.slug;

    const detachments = (fac.detachments ?? []).map((d) => {
      const detId = `${factionId}-${slug(d.name)}`;
      return {
        id: detId,
        factionId,
        name: d.name,
        dp: d.dp ?? null,
        objective: d.objective ?? null,
        rule: {
          name: "Force Disposition",
          text: d.objective ?? "",
        },
        enhancements: (d.enhancements ?? []).map((e) => ({
          id: `${detId}-${slug(e.name)}`,
          name: e.name,
          detachmentId: detId,
          points: e.points,
          text: "",
        })),
      };
    });

    const datasheets = [];
    for (const u of fac.units ?? []) {
      if (u.legends === true) continue;
      total++;

      // Base pricing tier ("Your Unit Costs"); requisition-threshold tiers are
      // a later refinement.
      const baseCosts = (u.pricing?.[0]?.costs ?? []).filter((c) => !c.addon);
      const sizes = baseCosts.length
        ? baseCosts.map((c) => ({ models: c.models, points: c.points }))
        : [{ models: 0, points: u.pricing?.[0]?.costs?.[0]?.points ?? 0 }];

      const profile = profileByName.get(norm(u.name));
      if (profile) matched++;
      const isLeader = u.role === "leader";

      datasheets.push({
        id: `${factionId}-${slug(u.name)}`,
        name: u.name,
        factionId,
        role: profile?.role ?? (isLeader ? "Character" : "Other"),
        keywords: profile?.keywords ?? [],
        models: profile?.models ?? [],
        weapons: profile?.weapons ?? [],
        abilities: profile?.abilities ?? [],
        sizes,
        wargear: (u.wargear ?? []).map((w) => ({ name: w.item, points: w.points })),
        attachTo: u.attachTo,
        isEpicHero: profile?.isEpicHero,
        isCharacter:
          profile?.isCharacter || isLeader || undefined,
        provisional: profile ? true : undefined,
      });
    }

    if (datasheets.length === 0 && detachments.length === 0) continue;
    datasheets.sort((a, b) => a.name.localeCompare(b.name));
    detachments.sort((a, b) => a.name.localeCompare(b.name));
    factions.push({ id: factionId, name: fac.name, datasheets, detachments });
  }

  factions.sort((a, b) => a.name.localeCompare(b.name));

  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "factions.json"), JSON.stringify(factions));
  const totalDs = factions.reduce((n, f) => n + f.datasheets.length, 0);
  const totalDet = factions.reduce((n, f) => n + f.detachments.length, 0);
  const coverage = total ? Math.round((matched / total) * 100) : 0;
  writeFileSync(
    join(outDir, "meta.json"),
    JSON.stringify(
      {
        edition: EDITION,
        sources: { points: MFM_REPO, provisionalProfiles: TENTH_REPO },
        generatedAt: new Date().toISOString(),
        factionCount: factions.length,
        datasheetCount: totalDs,
        detachmentCount: totalDet,
        profileCoveragePct: coverage,
      },
      null,
      2
    )
  );

  console.log(
    `\nWrote ${factions.length} factions, ${totalDs} datasheets, ${totalDet} detachments.`
  );
  console.log(
    `Profile coverage (borrowed from 10e): ${matched}/${total} (${coverage}%).`
  );
}

main();
