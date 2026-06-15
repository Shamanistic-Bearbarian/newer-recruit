"use client";

import { useMemo } from "react";
import { useBuilder } from "@/lib/useBuilder";
import { validateRoster } from "@/lib/roster";
import StartScreen from "@/components/StartScreen";
import BuilderToolbar from "@/components/BuilderToolbar";
import UnitCatalog from "@/components/UnitCatalog";
import RosterPanel from "@/components/RosterPanel";
import ValidationPanel from "@/components/ValidationPanel";

export default function Home() {
  const { hydrated, current } = useBuilder();

  const validation = useMemo(
    () => (current ? validateRoster(current) : null),
    [current]
  );

  if (!hydrated) {
    return <p className="py-20 text-center text-slate-500">Loading…</p>;
  }

  if (!current) {
    return <StartScreen />;
  }

  return (
    <div className="space-y-4">
      <BuilderToolbar roster={current} />
      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Catalog
          </h2>
          <UnitCatalog factionId={current.factionId} />
        </section>
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Roster
          </h2>
          {validation && <ValidationPanel result={validation} />}
          <RosterPanel roster={current} />
        </section>
      </div>
    </div>
  );
}
