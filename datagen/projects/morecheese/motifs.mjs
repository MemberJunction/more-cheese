// Motifs — repeatable story templates stamped onto crowd members (feedback 2026-07-16).
//
// Heroes are one-off authored people; motifs are ARCHETYPES: "a member whose employer
// collapsed and who lapsed the next cycle", declared once with a count, instantiated
// across the crowd through the same pin plumbing heroes already use (_lapseYear,
// _thetaPath). Every stamped instance is recorded in the registry (out/motifs.json,
// harness-private) so demos can point at guaranteed stories.
//
// Runs BEFORE the renewal unroll — the pins must exist when the decisions roll. Members
// with a pinned outcome (_lapseYear) are excluded from renewalEvents, exactly like
// heroes, so authored facts never leak into arrow-recovery training data.

import { rng } from '../../engine/rng.mjs';
import { parseDate } from '../../engine/dates.mjs';

export function applyMotifs(cfg, people, orgs) {
  const { R, seed, release } = cfg;
  const M = R.motifs;
  const releaseYear = release.getUTCFullYear();
  const orgByKey = new Map(orgs.map((o) => [o.OrgKey, o]));
  const crowd = people.filter((p) => !p._hero);
  const registry = [];
  const meta = {};

  const stamp = (name, pool, k, apply) => {
    const r = rng(seed, `motif:${name}`);
    const picked = [];
    const idx = new Set();
    while (idx.size < Math.min(k, pool.length)) idx.add(r.int(0, pool.length - 1));
    for (const i of idx) picked.push(pool[i]);
    for (const p of picked) {
      p._motif = name;
      const params = apply(p, r);
      registry.push({ MotifKey: `${name}:${p.MemberNumber}`, Motif: name, MemberNumber: p.MemberNumber, ...params });
    }
    meta[name] = { declared: k, pool: pool.length, stamped: picked.length };
  };

  // employerCollapseLapse: renew through the collapse year, lapse the next cycle
  stamp('employerCollapseLapse',
    crowd.filter((p) => {
      const ev = p.OrgKey && orgByKey.get(p.OrgKey)?.LifecycleEvent;
      return ev && ev.kind === 'Dissolved' && parseDate(p.JoinDate).getUTCFullYear() < ev.year && ev.year <= releaseYear - 2 && !p._motif;
    }),
    M.employerCollapseLapse.count,
    (p) => {
      const evYear = orgByKey.get(p.OrgKey).LifecycleEvent.year;
      p._lapseYear = evYear + 1;
      return { EmployerOrgKey: p.OrgKey, DissolvedYear: evYear, LapseYear: p._lapseYear };
    });

  // authored engagement arcs: a linear theta ramp across the member's covered years.
  // A rising star's renewals are PINNED — their authored low early theta would otherwise
  // lapse them before the ramp expresses. A fade is left unpinned: rising renewal risk
  // is the point of the story.
  const arc = (name, renewPinned) => stamp(name,
    crowd.filter((p) => parseDate(p.JoinDate).getUTCFullYear() <= releaseYear - 4 && !p._motif && p._lapseYear == null),
    M[name].count,
    (p) => {
      const y0 = parseDate(p.JoinDate).getUTCFullYear();
      const { startTheta, endTheta } = M[name];
      const path = {};
      for (let y = y0; y <= releaseYear; y++) path[y] = +(startTheta + (endTheta - startTheta) * ((y - y0) / (releaseYear - y0))).toFixed(4);
      p._thetaPath = path;
      if (renewPinned) p._renewAlways = true;
      return { StartYear: y0, StartTheta: startTheta, EndTheta: endTheta, RenewPinned: !!renewPinned };
    });
  arc('risingStar', true);
  arc('quietFade', false);

  return { registry, meta };
}
