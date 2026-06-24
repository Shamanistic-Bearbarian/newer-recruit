# newer-recruit

A web-based army list builder for **Warhammer 40,000 (11th edition)** — inspired by [New Recruit](https://www.newrecruit.eu/).

> ℹ️ **11th-edition data.** Points, detachments, enhancements and wargear costs
> come from the official **Munitorum Field Manual** (via
> [`BSData/wh40k-11e-mfm`](https://github.com/BSData/wh40k-11e-mfm), 30 factions).
> **Datasheets** (stat lines, weapon profiles, abilities) carry over unchanged
> from 10th edition, so they're taken from 10th-edition
> [BSData](https://github.com/BSData/wh40k-10e), matched by unit name (~99%).
> The remaining ~1% are brand-new 11th-edition units that don't have a datasheet
> in the dataset yet (shown with points/detachment data only).

## Features (MVP)

- Pick a **faction**, **detachment** (with Detachment Points), and **game size**.
- Browse a faction's complete **datasheet catalogue** (grouped by battlefield role): real 11th-edition **per-size points**, plus provisional 10e stat/weapon/ability profiles and wargear-option costs.
- Attach **enhancements** (real 11e, per detachment) to eligible Characters.
- Live **points total** against your limit, with a progress bar.
- **Validation**: points limit, detachment selection, enhancement rules (max per army, one per unit, Characters only), unique Epic Heroes.
- **Save** lists to your browser, **export**/**import** them as `.nr.json` files.

### Not yet (planned)
- Datasheets for the ~1% of **brand-new 11th-edition units** (no 10e equivalent to carry over).
- **Wargear/loadout selection** affecting points (costs are displayed, not yet selectable).
- **Detachment Points budget** enforcement, and requisition-threshold pricing tiers.
- Merging Space Marine **chapters** under one faction.

Lists are stored locally in the browser (`localStorage`) — no account or server required.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4**
- State via React context + reducer (`src/lib/useBuilder.tsx`); persistence in `localStorage`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build + type-check
npm run lint
```

## Project layout

```
src/
  data/
    types.ts            # the typed domain model (factions, datasheets, etc.)
    index.ts            # data registry + lookups (getFaction/getDatasheet/…)
    generated/          # factions.json + meta.json (produced by the importer)
  ../scripts/import-mfm.mjs      # MFM (11e points) + 10e profiles -> generated JSON
  ../scripts/import-bsdata.mjs   # BSData (BattleScribe) parser/builder (10e)
  lib/
    roster.ts           # roster model, points totals, validation engine
    storage.ts          # localStorage CRUD + file export/import
    useBuilder.tsx      # client state (working roster + saved library)
  components/            # UI: catalog, roster panel, toolbar, validation, etc.
  app/                   # Next.js App Router (layout + page)
```

## Game data & the importers

Faction data is **generated** into `src/data/generated/{factions.json,meta.json}`,
which the app reads via the registry in `src/data/index.ts`:

```bash
npm run import-data       # 11th edition: MFM points + provisional 10e profiles
npm run import-data-10e   # 10th-edition-only dataset (full real datasheets)
```

`scripts/import-mfm.mjs` (the default) clones the two source repos into
`.bsdata-cache/`, then:

1. Reads the **Munitorum Field Manual** YAML (`BSData/wh40k-11e-mfm`) for the real
   11th-edition unit list, per-size points, wargear costs, detachments
   (with Detachment Points) and enhancements. Legends are excluded.
2. Parses **10th-edition BSData** `.gst`/`.cat` XML (`scripts/import-bsdata.mjs`,
   reused as a library) to recover stat lines, weapon profiles and abilities,
   and matches them to 11e units **by name** (~93% coverage). Borrowed profiles
   are flagged `provisional: true`.

When an 11th-edition **datasheet catalogue** is published, add a parser for it (or
point step 2 at it) so profiles are native rather than provisional.

The typed domain model lives in `src/data/types.ts`.

---

Fan project, unaffiliated with Games Workshop. Warhammer 40,000 is a trademark of Games Workshop Ltd.
