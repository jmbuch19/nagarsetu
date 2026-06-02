// City ordering for the pickers + directory filter. The community is
// Gujarat-rooted and India-centric with a global diaspora, so plain
// alphabetical-by-country (the DB default) buried Ahmedabad below Australia /
// Bahrain. This orders by usage instead:
//   tier 0 — India · Gujarat   (Ahmedabad, Rajkot, … — the heartland)
//   tier 1 — India · elsewhere (Mumbai, Delhi, Bengaluru, …)
//   tier 2 — rest of the world (grouped by country)
// Each tier is alphabetical (by state then city; by country first for the
// diaspora). Because the directory filter groups options by country in array
// order, feeding it a list sorted this way also puts the "India" optgroup
// first with Gujarat cities at the top.

export type CityOrderFields = {
  name: string;
  state: string | null;
  country: string | null;
};

export function sortCities<T extends CityOrderFields>(cities: T[]): T[] {
  const tier = (c: T): number => {
    if (c.country === "India") return c.state === "Gujarat" ? 0 : 1;
    return 2;
  };
  return [...cities].sort((a, b) => {
    const ta = tier(a);
    const tb = tier(b);
    if (ta !== tb) return ta - tb;
    // Diaspora: group by country before state/city.
    if (ta === 2) {
      const ca = a.country ?? "";
      const cb = b.country ?? "";
      if (ca !== cb) return ca.localeCompare(cb);
    }
    const sa = a.state ?? "";
    const sb = b.state ?? "";
    if (sa !== sb) return sa.localeCompare(sb);
    return a.name.localeCompare(b.name);
  });
}
