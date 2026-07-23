// Date arithmetic, dependency-free (extracted so compile.mjs can import the generation
// pipeline without a config↔world import cycle).

export const DAY = 86400000;
export const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(d.getTime() + n * DAY);
export const addYears = (d, n) => new Date(Date.UTC(d.getUTCFullYear() + n, d.getUTCMonth(), d.getUTCDate()));
export const endOfYear = (y) => new Date(Date.UTC(y, 11, 31));
export const parseDate = (s) => new Date(`${s}T00:00:00Z`);
