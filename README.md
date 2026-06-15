# newer-recruit

A web-based army list builder for **Warhammer 40,000 (11th edition)** — inspired by [New Recruit](https://www.newrecruit.eu/).

> ⚠️ **11th edition is not released yet.** Until official data exists, this app ships with clearly-marked **placeholder** unit data (`DATA_IS_PLACEHOLDER = true`) so the builder can be developed and tested. None of the bundled stats, points, or rules represent real game rules.

## Features (MVP)

- Pick a **faction**, **detachment**, and **game size** (points limit).
- Browse a faction's **datasheets** (grouped by battlefield role) with full stat/weapon/ability profiles, and add units to your list.
- Choose **unit sizes** and attach **enhancements** to eligible Characters.
- Live **points total** vs. limit, with a progress bar.
- **Validation**: points limit, detachment selection, enhancement rules (max per army, one per unit, Characters only), unique Epic Heroes.
- **Save** lists to your browser, **export**/**import** them as `.nr.json` files.

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
    factions/           # one file per faction (PLACEHOLDER data today)
  lib/
    roster.ts           # roster model, points totals, validation engine
    storage.ts          # localStorage CRUD + file export/import
    useBuilder.tsx      # client state (working roster + saved library)
  components/            # UI: catalog, roster panel, toolbar, validation, etc.
  app/                   # Next.js App Router (layout + page)
```

## Adding / replacing game data

All game data is plain typed TypeScript under `src/data/factions/`. To add a faction:

1. Create `src/data/factions/<faction>.ts` exporting a `Faction` (see `types.ts`).
2. Import it in `src/data/index.ts` and add it to the `FACTIONS` array.

When official 11th edition data is available, replace the placeholder faction files
with real data and set `DATA_IS_PLACEHOLDER = false` in `src/data/index.ts`.

### Planned: BattleScribe import

New Recruit reads community-maintained [BattleScribe](https://github.com/BSData)
`.cat`/`.gst` catalogs. A future importer can map that format into the `Faction`
types here, letting the builder load community data once it exists for 11th edition.

---

Fan project, unaffiliated with Games Workshop. Warhammer 40,000 is a trademark of Games Workshop Ltd.
