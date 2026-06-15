// Read-only display of a datasheet's profiles, weapons and abilities.

import type { Datasheet } from "@/data/types";

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center rounded bg-slate-800 px-2 py-1 min-w-[2.75rem]">
      <span className="text-[0.6rem] uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  );
}

export default function DatasheetView({ datasheet }: { datasheet: Datasheet }) {
  return (
    <div className="space-y-3 text-slate-200">
      {datasheet.models.map((m) => (
        <div key={m.name} className="space-y-1">
          {datasheet.models.length > 1 && (
            <div className="text-xs font-medium text-slate-300">{m.name}</div>
          )}
          <div className="flex flex-wrap gap-1">
            <StatCell label="M" value={m.stats.m} />
            <StatCell label="T" value={m.stats.t} />
            <StatCell label="Sv" value={m.stats.sv} />
            <StatCell label="W" value={m.stats.w} />
            <StatCell label="Ld" value={m.stats.ld} />
            <StatCell label="OC" value={m.stats.oc} />
            {m.stats.invuln && <StatCell label="Inv" value={m.stats.invuln} />}
          </div>
        </div>
      ))}

      {datasheet.weapons.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400">
              <tr>
                <th className="py-1 pr-2 font-medium">Weapon</th>
                <th className="px-1 font-medium">Rng</th>
                <th className="px-1 font-medium">A</th>
                <th className="px-1 font-medium">Sk</th>
                <th className="px-1 font-medium">S</th>
                <th className="px-1 font-medium">AP</th>
                <th className="px-1 font-medium">D</th>
              </tr>
            </thead>
            <tbody>
              {datasheet.weapons.map((w, i) => (
                <tr key={`${w.name}-${i}`} className="border-t border-slate-800">
                  <td className="py-1 pr-2">
                    <span className="text-slate-100">{w.name}</span>
                    {w.keywords?.length ? (
                      <span className="block text-[0.65rem] text-slate-400">
                        [{w.keywords.join(", ")}]
                      </span>
                    ) : null}
                  </td>
                  <td className="px-1">{w.range ?? "Melee"}</td>
                  <td className="px-1">{w.a}</td>
                  <td className="px-1">{w.skill}</td>
                  <td className="px-1">{w.s}</td>
                  <td className="px-1">{w.ap}</td>
                  <td className="px-1">{w.d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {datasheet.abilities.length > 0 && (
        <ul className="space-y-1 text-xs">
          {datasheet.abilities.map((a) => (
            <li key={a.name}>
              <span className="font-semibold text-slate-100">{a.name}:</span>{" "}
              <span className="text-slate-300">{a.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1">
        {datasheet.keywords.map((k) => (
          <span
            key={k}
            className="rounded-full bg-slate-800 px-2 py-0.5 text-[0.65rem] text-slate-400"
          >
            {k}
          </span>
        ))}
      </div>
    </div>
  );
}
