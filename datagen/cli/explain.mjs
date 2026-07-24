// Renders the composed+compiled ruleset as plain English → ruleset/RULESET.md
// Usage: node explain.mjs [--project morecheese]
//
// The interpretability contract: anyone should be able to READ the recipe without knowing
// what a log-odds is. Effects are stated in percentage points (computed from the compiled
// βs over a reference population), with the authored form and evidence beside each.
// Auto-generated — regenerate after any module change; never edit by hand.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadRuleset, loadProject, projectDir } from '../engine/config.mjs';
import { describeEffectPts } from '../engine/compile.mjs';

const PROJECT = process.argv.includes('--project') ? process.argv[process.argv.indexOf('--project') + 1] : 'morecheese';
const { hooks } = await loadProject(PROJECT);
const R = await loadRuleset(undefined, PROJECT);

const HUMAN = {
  tenure: ['Longer-tenured members renew more', 'per extra “standard deviation” of tenure'],
  engagement: ['Engaged members renew more', 'per step of the hidden engagement dial'],
  autoRenew: ['Auto-renew members stick around', 'vs members who renew by hand'],
  employerEvent: ['Employer trouble drives churn', 'when a member’s employer dissolves / is acquired / cuts the program (causal arrow 1.15)'],
  enthusiastTier: ['The enthusiast tier churns hardest', 'hobbyists vs professional tiers'],
  covidYear: ['COVID years dent renewal', 'regime gate, 2020–2021'],
};

const lines = [];
const P = (s = '') => lines.push(s);

P('# The MoreCheese Ruleset, in plain English');
P();
P(`> **Auto-generated** from \`ruleset/modules/\` by \`explain.mjs\` — do not edit by hand.`);
P(`> Ruleset v${R.version}. Effects below are shown in **percentage points**, computed from the`);
P('> compiled effect sizes over a reference population. The JSON stays the executable truth;');
P('> this page is its readable rendering.');
P();
P('## The world');
P();
P(`- **${R.scale.members} members** (the demo scope; tests run a 500-member pilot via --n), history from ${R.history.startYear}, flagship conference every July ${R.history.conferenceDay}.`);
P(`- Geography: ${R.geography.mix.map(([k, w]) => `${(w * 100).toFixed(0)}% ${k}`).join(' · ')} — members cluster in real dairy-belt cities with real coordinates.`);
P(`- Organizations: about 1 per ${Math.round(1 / R.orgs.ratioToMembers)} members; ${(R.orgs.producerShare * 100).toFixed(0)}% are producers; each year ~${(R.orgs.lifecycleEventRatePerYear * 100).toFixed(0)}% of orgs hit a lifecycle event (dissolved / acquired / program cut) — the fuel for employer-driven churn stories.`);
P(`- Renewal cycles: ${((1 - R.cohorts.anniversaryShare) * 100).toFixed(0)}% calendar-year (everyone expires Dec 31) + ${(R.cohorts.anniversaryShare * 100).toFixed(0)}% anniversary cohort *(D6 assumption, pending ratification)*.`);
P(`- Two **hidden dials** per member — engagement and affluence, correlated ${R.latents.copulaRho} — never stored; everything visible flows from them. Engagement **drifts**: a stable anchor (${(R.latents.engagementDrift.anchorShare * 100).toFixed(0)}% of the variance) plus a slow yearly wander, so members rise and fade — and decline precedes lapse.`);
P(`- Eras: COVID (${R.regimes.covid.years.join('/')}) dents renewal by ${R.regimes.covid.renewalLogitShift} on the dial, halves event volume, and makes the conference virtual — applied to the baseline (tide, not boats), so it can't be calibrated away.`);
P(`- Membership tiers (the affluence dial made visible): ${R.membership.tiers.list.map((t) => `${t.name} $${t.dues}`).join(' · ')} — org-backed members climb tiers as affluence rises.`);
P();
P('## The renewal rules');
P();
P(`The population averages **${(R.membership.renewalTarget * 100).toFixed(0)}% renewal** (±${(R.membership.renewalTolerance * 100).toFixed(0)}pt check tolerance), wandering the ${R.membership.yearlyBand.map((x) => (x * 100).toFixed(0) + '%').join('–')} band year to year — on purpose (real data is lumpy; too-smooth fails the build). The grace period is ${R.membership.gracePeriodMonths} months; a lapse past grace gets a termination date.`);
P();
P('Who differs, and by how much:');
P();
P('| Rule | Effect (percentage points) | Authored as | Evidence |');
P('|---|---|---|---|');
for (const [k, a] of Object.entries(R.membership.arrows)) {
  const [title] = HUMAN[k] ?? [k];
  const [, detail] = HUMAN[k] ?? ['', ''];
  let eff = '';
  if (k === 'covidYear') {
    eff = `${a.logitShift} on the dial (a few points off that year's renewal)`;
  } else {
    const d = describeEffectPts(R, k, hooks);
    eff = d.kind === 'group'
      ? `**${d.pts > 0 ? '+' : ''}${d.pts.toFixed(1)}pt** ${detail} (the group lands at ~${d.groupRate.toFixed(0)}%)`
      : `**${d.pts > 0 ? '+' : ''}${d.pts.toFixed(1)}pt** ${detail}`;
  }
  const authored = a.compiledFrom ?? 'beta';
  P(`| ${title} | ${eff} | ${a.liftPts != null ? `"+${a.liftPts} points" (human form)` : a.groupTarget != null ? `"lands at ${(a.groupTarget * 100).toFixed(0)}%" (human form)` : authored.startsWith('strength') ? `"${a.strength}" (qualitative form)` : `β ${a.beta ?? a.logitShift} (expert form)`} → compiled β ${a.beta ?? a.logitShift} | ${a.evidence ?? a.note ?? ''} |`);
}
P();
P('## The event rules');
P();
P(`- ~${R.events.perYear.workshops} workshops + ${R.events.perYear.webinars} webinars a year, plus the flagship conference (**${(R.events.conference.memberAttendanceTarget * 100).toFixed(0)}% of members attend**; virtual in ${R.regimes.covid.years.join("/")}).`);
P(`- Registration volume rides the engagement dial (over-dispersed — a vocal minority does most of it); COVID years run at ${(R.regimes.covid.eventVolumeMultiplier * 100).toFixed(0)}% volume.`);
P(`- No-shows: **${(R.events.noShow.paidInPerson.target * 100).toFixed(0)}%** on paid in-person, **${(R.events.noShow.freeWebinar.target * 100).toFixed(0)}%** on free webinars — engaged members ghost less.`);
P(`- International members attend the flagship less (the distance arrow).`);
P();
P('## The money rules');
P();
P(`Every billable fact becomes an **order** (one renewal order per membership cycle — the posted order IS the bill, no invoices, per bizapps-orders' design) and usually a **payment**, timed by the DECLARED payment profiles (orders.paymentProfiles):`);
P();
P(`- Event registrations: **card at checkout** — paid the same day, always.`);
P(`- Auto-pay dues: land **on the due date** (a ~${(R.orders.paymentProfiles.autopay.lateShare * 100).toFixed(0)}% failed-card tail retries a few days late).`);
P(`- Manual dues: most pay early or on time; ~${(R.orders.paymentProfiles.manual.lateShare * 100).toFixed(0)}% pay late inside the grace window.`);
P(`- Business tiers pay on **net-${R.orders.paymentProfiles.netTerms.termsDays} terms**: ~${(R.orders.paymentProfiles.netTerms.lateShare * 100).toFixed(0)}% pay late (median ~${R.orders.paymentProfiles.netTerms.late.medianDays} days — the sourced Atradius/CRF curve, thin tail).`);
P(`- A payment dated after release day *hasn't happened yet* — those orders sit Unpaid or Overdue (real A/R aging), and every pending-renewal member carries an **open renewal order** (the outreach queue).`);
P();
P('## The platform-residue rules (pack: platform)');
P();
P('The `__mj` core gets **usage residue** so the instance reads as lived-in — application data only, never entity definitions (CodeGen owns those). Two laws govern the pack:');
P();
P('1. **Derive, never invent** — every `RecordChange` audit row mirrors a timeline fact another pack generated (issue resolutions at their exact `ResolvedAt`, task completions, hero profile/period creation, the stale-employer relationship edits). A gate re-derives every timestamp and count.');
P('2. **True transcripts** — seeded Skip conversations carry `{N:FACT}` tokens the generator replaces with numbers **computed from the same build**, so every claim is true for the seed that shipped it (gated: no unresolved tokens).');
P();
P(`- ${R.platform.staff.length} staff personas own everything (\`@${R.platform.emailDomain}\` — reserved .example TLD, never deliverable). Demos log in AS a staff persona (team ruling 2026-07-23).`);
P(`- ${R.platform.sharedViews.length} shared saved views (\`IsShared=1\`, visible to every viewer) with real column layouts (GridState mirrors what Explorer writes; gate requires ≥3 visible columns); ${R.platform.queries.length} Approved+Reusable queries — these double as Skip's entry points.`);
P(`- Per-persona residue: ${R.platform.conversations.length} conversations, favorites on the flagship personas, a renewal-outreach list that equals the pending-renewal member set EXACTLY (gated), ${R.platform.notifications.length} notifications.`);
P();
P('## The engagement-score rules (pack: sonar)');
P();
P(`One Sonar model — **${R.sonar.model.name}** (\`${R.sonar.model.slug}\`, ${R.sonar.model.status}) — scores every member on the ${R.sonar.model.anchorEntityName} spine. Constraints are concise and gated:`);
P();
P(`- **Weights sum to exactly 100**: ${R.sonar.factors.map((f) => `${f.name.toLowerCase()} ${f.weight}`).join(' · ')}.`);
P(`- **Bands tile 0..100 with no gaps**: ${R.sonar.bands.map((b) => `${b.label} ${b.min}–${b.max}`).join(' · ')}.`);
P(`- **Factors derive from generated facts** in windows relative to each snapshot date — nothing is invented: ${R.sonar.factors.map((f) => `${f.name} (${f.cap != null ? `cap ${f.cap}${f.invert ? ', inverted' : ''}` : `0–10 ×${f.scale}`}${f.windowMonths ? `, ${f.windowMonths}m window` : ', as-of'})`).join('; ')}. Missing data → neutral midpoint ${R.sonar.neutralMidpoint} (flagged, never silent).`);
P(`- **Quarterly recompute history**: snapshots at ${R.sonar.snapshots.offsetsDaysBeforeRelease.join('/')} days before release; the previous snapshot feeds Delta/Trend (|Δ| < ${R.sonar.flatDeltaThreshold} reads Flat); band crossings become first-class ScoreBandTransition rows tied to their recompute run.`);
P('- **Internal consistency is gated per score**: factor contributions sum to the score, delta/trend/band agree, history = members × snapshots, transitions = history band changes, run totals reconcile.');
P('- **The signal is honest**: scores ride the same hidden engagement dial as everything else — active members outscore lapsed ones (gated ≥3pt gap) and the flagship contrast holds at every seed (Elena ≥ Bob + 10, Bob never Engaged). Because the score is derived, Sonar\'s live recompute over this data should land in the same neighborhood — the engineered proof for the scoring story.');
P();
P('## Scenarios');
P();
P('A scenario is a **parameter overlay on the same causal model** (`ruleset/scenarios/`): `--scenario decliningOrg` rebuilds the whole world at ~78% renewal with hobbyists bleeding hardest — calibrated to real craft-food decline curves. The compiler re-solves every human-authored effect against the scenario\'s targets; the validator judges against them too. Same machinery, different universe, deterministic.');
P();
P('## The pinned people (heroes)');
P();
for (const h of R.heroes) {
  P(`- **${h.first} ${h.last}** (\`${h.memberNumber}\`) — ${h.segment}, ${h.city}. Pins: ${JSON.stringify(h.pins)}.`);
}
P();
P('## How to author a rule (the three vocabularies)');
P();
P('```jsonc');
P('"autoRenew":      { "liftPts": 12 }          // human: "+12 points vs the others"');
P('"enthusiastTier": { "groupTarget": 0.65 }    // human: "this group lands at 65%"');
P('"someArrow":      { "strength": "med", "sign": "+" }  // workshop: qualitative band');
P('"tenure":         { "beta": 0.55 }           // expert: log-odds per 1 SD');
P('```');
P();
P('The compiler solves human forms into βs — including an **empirical refinement pass** that');
P('runs the real generator on a reference world and adjusts until the stated effect is what');
P('the data actually shows. You write the sentence; the machine makes it true.');
P();

writeFileSync(join(projectDir(PROJECT), 'ruleset/RULESET.md'), lines.join('\n'));
console.log(`plain-English rendering → ${join(projectDir(PROJECT), 'ruleset/RULESET.md')}`);
