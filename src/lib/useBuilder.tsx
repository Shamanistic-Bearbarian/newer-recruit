"use client";

// Client-side state for the list builder: the working roster plus the saved
// library, wired to localStorage. Exposed through React context.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  newRoster,
  newRosterUnit,
  type Roster,
  type RosterUnit,
} from "@/lib/roster";
import {
  deleteRoster,
  loadCurrentRoster,
  loadSavedRosters,
  saveCurrentRoster,
  upsertRoster,
} from "@/lib/storage";
import { getDetachment, getFaction } from "@/data";

type Action =
  | { type: "hydrate"; current: Roster | null }
  | { type: "newList"; roster: Roster }
  | { type: "load"; roster: Roster }
  | { type: "clear" }
  | { type: "setName"; name: string }
  | { type: "setFaction"; factionId: string }
  | { type: "addDetachment"; detachmentId: string }
  | { type: "removeDetachment"; detachmentId: string }
  | { type: "setPointsLimit"; pointsLimit: number }
  | { type: "addUnit"; datasheetId: string }
  | { type: "removeUnit"; instanceId: string }
  | { type: "setUnitSize"; instanceId: string; sizeIndex: number }
  | {
      type: "setUnitEnhancement";
      instanceId: string;
      enhancementId: string | undefined;
    }
  | { type: "setUnitWargear"; instanceId: string; item: string; qty: number }
  | {
      type: "setUnitAttachment";
      instanceId: string;
      targetInstanceId: string | undefined;
    };

function touch(roster: Roster): Roster {
  return { ...roster, updatedAt: Date.now() };
}

function mapUnit(
  roster: Roster,
  instanceId: string,
  fn: (u: RosterUnit) => RosterUnit
): Roster {
  return touch({
    ...roster,
    units: roster.units.map((u) => (u.instanceId === instanceId ? fn(u) : u)),
  });
}

function reducer(state: Roster | null, action: Action): Roster | null {
  switch (action.type) {
    case "hydrate":
      return action.current;
    case "newList":
    case "load":
      return action.roster;
    case "clear":
      return null;
  }

  if (!state) return state;

  switch (action.type) {
    case "setName":
      return touch({ ...state, name: action.name });
    case "setFaction": {
      if (action.factionId === state.factionId) return state;
      // Faction change invalidates detachments + units.
      return touch({
        ...state,
        factionId: action.factionId,
        detachmentIds: [],
        units: [],
      });
    }
    case "addDetachment":
      if (state.detachmentIds.includes(action.detachmentId)) return state;
      return touch({
        ...state,
        detachmentIds: [...state.detachmentIds, action.detachmentId],
      });
    case "removeDetachment": {
      // Removing a detachment clears any enhancements it provided.
      const removedEnh = new Set(
        getDetachment(action.detachmentId)?.enhancements.map((e) => e.id) ?? []
      );
      return touch({
        ...state,
        detachmentIds: state.detachmentIds.filter(
          (id) => id !== action.detachmentId
        ),
        units: state.units.map((u) =>
          u.enhancementId && removedEnh.has(u.enhancementId)
            ? { ...u, enhancementId: undefined }
            : u
        ),
      });
    }
    case "setPointsLimit":
      return touch({ ...state, pointsLimit: action.pointsLimit });
    case "addUnit":
      return touch({
        ...state,
        units: [...state.units, newRosterUnit(action.datasheetId)],
      });
    case "removeUnit":
      return touch({
        ...state,
        units: state.units
          .filter((u) => u.instanceId !== action.instanceId)
          // Detach any characters that were attached to the removed unit.
          .map((u) =>
            u.attachedTo === action.instanceId
              ? { ...u, attachedTo: undefined }
              : u
          ),
      });
    case "setUnitSize":
      return mapUnit(state, action.instanceId, (u) => ({
        ...u,
        sizeIndex: action.sizeIndex,
      }));
    case "setUnitEnhancement":
      return mapUnit(state, action.instanceId, (u) => ({
        ...u,
        enhancementId: action.enhancementId,
      }));
    case "setUnitWargear":
      return mapUnit(state, action.instanceId, (u) => {
        const wargear = { ...(u.wargear ?? {}) };
        if (action.qty > 0) wargear[action.item] = action.qty;
        else delete wargear[action.item];
        return { ...u, wargear };
      });
    case "setUnitAttachment":
      return mapUnit(state, action.instanceId, (u) => ({
        ...u,
        attachedTo: action.targetInstanceId,
      }));
    default:
      return state;
  }
}

type BuilderContextValue = {
  hydrated: boolean;
  current: Roster | null;
  saved: Roster[];
  startNewList: (params: {
    name?: string;
    factionId: string;
    detachmentIds?: string[];
    pointsLimit: number;
  }) => void;
  loadList: (roster: Roster) => void;
  clearCurrent: () => void;
  setName: (name: string) => void;
  setFaction: (factionId: string) => void;
  addDetachment: (detachmentId: string) => void;
  removeDetachment: (detachmentId: string) => void;
  setPointsLimit: (pointsLimit: number) => void;
  addUnit: (datasheetId: string) => void;
  removeUnit: (instanceId: string) => void;
  setUnitSize: (instanceId: string, sizeIndex: number) => void;
  setUnitEnhancement: (instanceId: string, enhancementId?: string) => void;
  setUnitWargear: (instanceId: string, item: string, qty: number) => void;
  setUnitAttachment: (instanceId: string, targetInstanceId?: string) => void;
  saveCurrentToLibrary: () => void;
  deleteSaved: (id: string) => void;
};

const BuilderContext = createContext<BuilderContextValue | null>(null);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [current, dispatch] = useReducer(reducer, null);
  const [saved, setSaved] = useState<Roster[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted state on mount. This must run in an effect (not a lazy
  // initializer) so the first client render matches the server-rendered HTML
  // and there is no hydration mismatch; localStorage is unavailable on the
  // server. The synchronous setState here is intentional for that reason.
  useEffect(() => {
    // Drop a persisted working roster whose faction no longer exists (e.g. a
    // draft from an earlier dataset), so we land cleanly on the start screen.
    const loaded = loadCurrentRoster();
    const valid = loaded && getFaction(loaded.factionId) ? loaded : null;
    dispatch({ type: "hydrate", current: valid });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadSavedRosters());
    setHydrated(true);
  }, []);

  // Persist the working roster whenever it changes (after hydration).
  useEffect(() => {
    if (hydrated) saveCurrentRoster(current);
  }, [current, hydrated]);

  const value = useMemo<BuilderContextValue>(
    () => ({
      hydrated,
      current,
      saved,
      startNewList: (params) =>
        dispatch({ type: "newList", roster: newRoster(params) }),
      loadList: (roster) => dispatch({ type: "load", roster }),
      clearCurrent: () => dispatch({ type: "clear" }),
      setName: (name) => dispatch({ type: "setName", name }),
      setFaction: (factionId) => dispatch({ type: "setFaction", factionId }),
      addDetachment: (detachmentId) =>
        dispatch({ type: "addDetachment", detachmentId }),
      removeDetachment: (detachmentId) =>
        dispatch({ type: "removeDetachment", detachmentId }),
      setPointsLimit: (pointsLimit) =>
        dispatch({ type: "setPointsLimit", pointsLimit }),
      addUnit: (datasheetId) => dispatch({ type: "addUnit", datasheetId }),
      removeUnit: (instanceId) => dispatch({ type: "removeUnit", instanceId }),
      setUnitSize: (instanceId, sizeIndex) =>
        dispatch({ type: "setUnitSize", instanceId, sizeIndex }),
      setUnitEnhancement: (instanceId, enhancementId) =>
        dispatch({ type: "setUnitEnhancement", instanceId, enhancementId }),
      setUnitWargear: (instanceId, item, qty) =>
        dispatch({ type: "setUnitWargear", instanceId, item, qty }),
      setUnitAttachment: (instanceId, targetInstanceId) =>
        dispatch({ type: "setUnitAttachment", instanceId, targetInstanceId }),
      saveCurrentToLibrary: () => {
        if (current) setSaved(upsertRoster(current));
      },
      deleteSaved: (id) => setSaved(deleteRoster(id)),
    }),
    [hydrated, current, saved]
  );

  return (
    <BuilderContext.Provider value={value}>{children}</BuilderContext.Provider>
  );
}

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within a BuilderProvider");
  return ctx;
}
