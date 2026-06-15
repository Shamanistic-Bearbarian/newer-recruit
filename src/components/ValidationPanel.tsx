"use client";

import type { ValidationResult } from "@/lib/roster";

export default function ValidationPanel({
  result,
}: {
  result: ValidationResult;
}) {
  const { errors, warnings, ok } = result;

  if (ok && warnings.length === 0) {
    return (
      <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
        ✓ List is valid.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errors.map((e, i) => (
        <div
          key={`e-${i}`}
          className="rounded-lg border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200"
        >
          ✕ {e.message}
        </div>
      ))}
      {warnings.map((w, i) => (
        <div
          key={`w-${i}`}
          className="rounded-lg border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-200"
        >
          ⚠ {w.message}
        </div>
      ))}
    </div>
  );
}
