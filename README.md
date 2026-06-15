# newer-recruit

A web-based army list builder for **Warhammer 40,000 (11th edition)** — inspired by [New Recruit](https://www.newrecruit.eu/).

> ⚠️ **11th edition is not released yet.** The builder currently uses the community **10th-edition** data from [BSData](https://github.com/BSData/wh40k-10e) (36 factions, ~1,140 datasheets, **Legends excluded**) so it's usable today. When BSData publishes 11th-edition catalogues, re-point the importer and regenerate — no app changes needed.

## Features (MVP)

- Pick a **faction** and **game size** (points limit).
- Browse a faction's complete **datasheet catalogue** (grouped by battlefield role) with stat profiles, weapon profiles, abilities, and keywords; add units to your list.
- Live **points total** against your limit, with a progress bar.
- **Validation**: points limit, enhancement rules (max per army, one per unit, Characters only), unique Epic Heroes.
- **Save** lists to your browser, **export**/**import** them as `.nr.json` files.

### Not yet (planned)
- Exact **per-unit-size pricing** and **wargear/loadout selection** (BattleScribe cost-modifier trees — Stage 2).
- **Detachments + enhancements** extracted from the data (Stage 2).
- Merging Space Marine **chapters** under one faction (currently separate catalogue entries).

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
  ../scripts/import-bsdata.mjs   # BSData (BattleScribe) -> generated JSON
  lib/
    roster.ts           # roster model, points totals, validation engine
    storage.ts          # localStorage CRUD + file export/import
    useBuilder.tsx      # client state (working roster + saved library)
  components/            # UI: catalog, roster panel, toolbar, validation, etc.
  app/                   # Next.js App Router (layout + page)
```

## Game data & the importer

Faction data is **generated** from the community [BSData](https://github.com/BSData/wh40k-10e)
BattleScribe catalogues (the same source New Recruit uses) by a build-time converter:

```bash
npm run import-data          # clones BSData into .bsdata-cache/ and regenerates
node scripts/import-bsdata.mjs <path-to-bsdata-checkout>   # or point at a local copy
```

It parses the `.gst`/`.cat` XML, resolves the BattleScribe entry/info link graph,
extracts datasheets (categories, model profiles, weapons, abilities, base points),
**excludes Legends**, and writes `src/data/generated/{factions.json,meta.json}`.
The app reads that JSON via the registry in `src/data/index.ts`.

To target **11th edition** when it ships: change `SOURCE_REPO` in
`scripts/import-bsdata.mjs` to the 11th-edition BSData repo and re-run `npm run import-data`.

The typed domain model lives in `src/data/types.ts`.

---

Fan project, unaffiliated with Games Workshop. Warhammer 40,000 is a trademark of Games Workshop Ltd.
