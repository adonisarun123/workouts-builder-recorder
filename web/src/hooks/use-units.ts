"use client";

import { useCallback, useEffect, useState } from "react";
import { readUnitsPreference, type UnitsPreference, writeUnitsPreference } from "@/lib/units";

export function useUnits() {
  const [units, setUnitsState] = useState<UnitsPreference>("imperial");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnitsState(readUnitsPreference());
    setReady(true);
    const onChange = () => setUnitsState(readUnitsPreference());
    window.addEventListener("workoutos-units-change", onChange as EventListener);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("workoutos-units-change", onChange as EventListener);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const setUnits = useCallback((u: UnitsPreference) => {
    writeUnitsPreference(u);
    setUnitsState(u);
  }, []);

  return { units, setUnits, ready };
}
