export const UNITS_STORAGE_KEY = "workoutos_units";
export type UnitsPreference = "imperial" | "metric";

export function readUnitsPreference(): UnitsPreference {
  if (typeof window === "undefined") return "imperial";
  try {
    const v = localStorage.getItem(UNITS_STORAGE_KEY);
    return v === "metric" ? "metric" : "imperial";
  } catch {
    return "imperial";
  }
}

export function writeUnitsPreference(u: UnitsPreference) {
  try {
    localStorage.setItem(UNITS_STORAGE_KEY, u);
    window.dispatchEvent(new CustomEvent("workoutos-units-change", { detail: u }));
  } catch {
    /* ignore */
  }
}

export function massUnitLabel(u: UnitsPreference) {
  return u === "metric" ? "kg" : "lb";
}

export function lengthUnitLabel(u: UnitsPreference) {
  return u === "metric" ? "cm" : "in";
}

export function weightStepKg(u: UnitsPreference) {
  return u === "metric" ? 2.5 : 5;
}
