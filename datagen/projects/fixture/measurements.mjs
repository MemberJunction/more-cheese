// HOW TO MEASURE THIS PROJECT'S ONE ENFORCED TARGET.
//
// The engine derives the band, the standard-error cushion and the message from the declaration
// (`outings.params.participation` = { target, tolerance, se }). All a project supplies is which
// rows count, over what pool — the one thing an engine cannot know.
//
// THE DENOMINATOR IS THE WHOLE JOB, and this is the mistake the docs warn about twice: the target
// is PER YEAR, over that year's eligible pool. Measured over the whole roster's lifetime it would
// read far higher and look broken while being correct.

/** no targets are gated by bespoke checks here — this project has no bespoke checks at all */
export const gatedElsewhere = new Set();

/** @type {Record<string, (ctx: { load: (pack: string, table: string) => any[], R: any }) => {observed: number, of?: number, detail?: string} | null>} */
export const measurements = {
  'outings.params.participation': ({ load, R }) => {
    const members = load('circle', 'members');
    const outings = load('circle', 'outings');
    const went = new Set(outings.map((o) => `${o.MemberNumber}:${o.Year}`));
    const years = [...new Set(outings.map((o) => o.Year))];
    let pool = 0, joined = 0;
    for (const y of years) {
      const eligible = members.filter((m) => m.JoinYear <= y);
      pool += eligible.length;
      joined += eligible.filter((m) => went.has(`${m.MemberNumber}:${y}`)).length;
    }
    return pool ? { observed: joined / pool, of: pool, detail: `${years.length} years, ${pool} member-years` } : null;
  },
};
