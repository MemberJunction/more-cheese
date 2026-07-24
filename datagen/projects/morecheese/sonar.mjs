// Sonar — engagement scoring residue over the member spine (bizapps-sonar,
// __mj_BizAppsSonar). One model, six factors, quarterly recompute history.
//
// DERIVE, NEVER INVENT: every raw factor value is computed from facts other packs already
// generated, evaluated in a window relative to each snapshot date. The scores therefore
// ride the same hidden engagement dial (θ) as the rest of the world — rank-ordering is
// honest (Bob lands below Elena because his activity really declined), and the validator
// re-derives every number from the same packs.

import { rng } from '../../engine/rng.mjs';

const DAY = 86400000;
const r2 = (x) => Math.round(x * 100) / 100;
const r4 = (x) => Math.round(x * 10000) / 10000;
const ts = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');

export function buildSonar(cfg, { people, events, registrations, learning, programs, money, committees, forms }) {
  const { R, seed, release } = cfg;
  const S = R.sonar;
  const releaseMs = release.getTime();

  // ---------- definitions (model, version, bands, windows, factors) ----------
  const staffOwner = S.model.ownerStaffKey;
  const createdAt = ts(releaseMs - S.model.createdDaysBeforeRelease * DAY + 10 * 3600000);
  const publishedAt = ts(releaseMs - S.model.publishedDaysBeforeRelease * DAY + 14 * 3600000);
  const model = {
    ModelKey: S.model.key, Name: S.model.name, Slug: S.model.slug, Description: S.model.description,
    AnchorEntityName: S.model.anchorEntityName, Status: S.model.status,
    CombineStrategy: S.model.combineStrategy, RecomputeMode: S.model.recomputeMode,
    RecomputeCron: S.model.recomputeCron, TrendWindowDays: S.model.trendWindowDays,
    OwnerStaffKey: staffOwner, EffectiveFrom: createdAt,
  };
  const configSnapshot = JSON.stringify({
    slug: S.model.slug, scale: [0, 100], combine: S.model.combineStrategy,
    factors: S.factors.map((f) => ({ slug: f.slug, weight: f.weight, cap: f.cap ?? null, invert: !!f.invert, windowMonths: f.windowMonths })),
    bands: S.bands.map((b) => ({ label: b.label, min: b.min, max: b.max })),
  });
  const version = {
    VersionKey: `${S.model.key}:1`, ModelKey: S.model.key, VersionNumber: 1, VersionLabel: 'v1',
    ConfigSnapshotJSON: configSnapshot, ChangeSummary: 'Initial published configuration.',
    PublishedByStaffKey: staffOwner, PublishedAt: publishedAt, IsCurrent: true,
  };
  const bandSet = { BandSetKey: 'engagement-bands', Name: 'MoreCheese Engagement Bands', AnchorEntityName: S.model.anchorEntityName, Description: 'Qualitative engagement bands for the member score.' };
  const bands = S.bands.map((b) => ({
    BandKey: b.key, BandSetKey: bandSet.BandSetKey, Label: b.label, MinScore: b.min, MaxScore: b.max,
    Severity: b.severity, ColorHex: b.color, IsTerminal: false, Description: b.description,
  }));
  const timeWindows = S.timeWindows.map((w) => ({
    WindowKey: w.key, Name: w.name, WindowType: w.windowType, LengthMonths: w.lengthMonths,
  }));
  const factors = S.factors.map((f) => ({
    FactorKey: f.key, Name: f.name, Slug: f.slug, Description: f.description, ModelKey: S.model.key,
    AnchorEntityName: S.model.anchorEntityName, FactorType: 'Declarative',
    SourceEntityName: f.sourceEntityName, Aggregation: f.aggregation,
    WindowKey: f.windowKey, RawDataType: 'Number', NormalizationMethod: 'MinMax',
    NormalizationParamsJSON: JSON.stringify(f.cap != null ? { cap: f.cap, invert: !!f.invert } : { scale: f.scale }),
    OutputMin: 0, OutputMax: 100, HigherIsBetter: !f.invert, PromotionState: 'Approved',
  }));
  const modelFactors = S.factors.map((f, i) => ({
    ModelFactorKey: `${S.model.key}:${f.key}`, ModelKey: S.model.key, FactorKey: f.key,
    Weight: f.weight, WeightMode: 'Additive', MissingDataPolicy: 'NeutralMidpoint',
    IsRequired: false, DisplayLabel: f.displayLabel, DisplayOrder: i + 1,
  }));
  const relatedEntities = S.factors.map((f) => ({
    RelatedKey: `${S.model.key}:${f.alias}`, ModelKey: S.model.key, EntityName: f.sourceEntityName,
    Alias: f.alias, RelationshipPath: f.relationshipPath, JoinType: 'Left',
  }));
  const auditEvents = [
    { AuditKey: `${S.model.key}:create`, ModelKey: S.model.key, EntityChanged: 'ScoreModel', ChangeType: 'Create', StaffKey: staffOwner, ChangedAt: createdAt },
    { AuditKey: `${S.model.key}:publish`, ModelKey: S.model.key, EntityChanged: 'ScoreModelVersion', ChangeType: 'Publish', StaffKey: staffOwner, ChangedAt: publishedAt },
  ];

  // ---------- per-member fact indexes (dates in ms, one pass over each pack) ----------
  const eventDate = new Map(events.map((e) => [e.EventKey, new Date(e.Date).getTime()]));
  const idx = new Map(); // member → { att: [ms], comm: [{s,e}], learn: [ms], payfail: [ms], nps: [{t,v}], adv: [ms] }
  const of = (m) => { let v = idx.get(m); if (!v) { v = { att: [], comm: [], learn: [], payfail: [], nps: [], adv: [] }; idx.set(m, v); } return v; };
  for (const r of registrations) if (r.Attended) of(r.MemberNumber).att.push(eventDate.get(r.EventKey));
  for (const cm of committees.memberships) of(cm.MemberNumber).comm.push({
    s: new Date(cm.StartDate).getTime(), e: cm.EndDate ? new Date(cm.EndDate).getTime() : Infinity,
  });
  for (const en of learning.enrollments) of(en.MemberNumber).learn.push(new Date(en.EnrolledOn).getTime());
  for (const mc of programs.memberCertifications) of(mc.MemberNumber).learn.push(new Date(mc.EnrolledOn).getTime());
  const orderMember = new Map(money.orders.map((o) => [o.OrderKey, o.MemberNumber]));
  for (const p of money.payments) if (p.Status === 'Failed' || p.Status === 'Denied') {
    const m = orderMember.get(p.OrderKey); if (m) of(m).payfail.push(new Date(p.PaymentDate).getTime());
  }
  const respMember = new Map(forms.formResponses.filter((x) => x.MemberNumber).map((x) => [x.ResponseKey, x]));
  for (const a of forms.formAnswers) {
    if (a.QuestionKey !== 'post-conf-survey:nps' || a.NumericValue == null) continue;
    const resp = respMember.get(a.ResponseKey); if (!resp) continue;
    of(resp.MemberNumber).nps.push({ t: new Date(resp.SubmittedAt).getTime(), v: a.NumericValue });
  }
  for (const a of programs.advocacyActions) of(a.MemberNumber).adv.push(new Date(a.ActionDate).getTime());

  // ---------- factor evaluation at a snapshot ----------
  const monthsMs = (m) => m * 30.44 * DAY;
  const evalFactor = (f, m, asOf) => {
    const d = idx.get(m) ?? { att: [], comm: [], learn: [], payfail: [], nps: [], adv: [] };
    const from = f.windowMonths ? asOf - monthsMs(f.windowMonths) : -Infinity;
    const inWin = (t) => t > from && t <= asOf;
    switch (f.key) {
      case 'event-attendance': return { raw: d.att.filter(inWin).length, had: true };
      case 'committee-service': return { raw: d.comm.filter((c) => c.s <= asOf && asOf <= c.e).length, had: true };
      case 'learning-activity': return { raw: d.learn.filter(inWin).length, had: true };
      case 'payment-health': return { raw: d.payfail.filter(inWin).length, had: true };
      case 'survey-sentiment': {
        const vals = d.nps.filter((x) => inWin(x.t)).map((x) => x.v);
        return vals.length ? { raw: vals.reduce((a, b) => a + b, 0) / vals.length, had: true } : { raw: null, had: false };
      }
      case 'advocacy-participation': return { raw: d.adv.filter(inWin).length, had: true };
      default: return { raw: null, had: false };
    }
  };
  const normalize = (f, raw, had) => {
    if (!had || raw == null) return S.neutralMidpoint;
    let n = f.cap != null ? (Math.min(raw, f.cap) / f.cap) * 100 : raw * (f.scale ?? 1); // survey: 0-10 × scale 10 → 0-100
    if (f.invert) n = 100 - n;
    return Math.max(0, Math.min(100, n));
  };
  const bandFor = (score) => bands.find((b) => score < b.MaxScore || b.MaxScore === 100) ?? bands[bands.length - 1];

  const scoreAt = (m, asOf) => {
    const parts = S.factors.map((f) => {
      const { raw, had } = evalFactor(f, m, asOf);
      const norm = r2(normalize(f, raw, had));
      return { f, raw, had, norm, weighted: r2(norm * f.weight / 100) };
    });
    const total = r2(parts.reduce((a, p) => a + p.weighted, 0));
    const withData = parts.filter((p) => p.had).length;
    return { parts, total, completeness: r4(withData / parts.length) };
  };

  // ---------- snapshots → scores, contributions, history, transitions, runs ----------
  const offsets = S.snapshots.offsetsDaysBeforeRelease; // oldest → newest, last = current
  const snapDates = offsets.map((d) => releaseMs - d * DAY + S.runs.hourUtc * 3600000);
  const members = people.map((p) => p.MemberNumber);
  const personName = new Map(people.map((p) => [p.MemberNumber, `${p.FirstName} ${p.LastName}`]));

  const scores = [];
  const contributions = [];
  const history = [];
  const transitions = [];
  const perSnap = []; // [{member → {total, band}}] per snapshot
  for (let si = 0; si < snapDates.length; si++) {
    const asOf = snapDates[si];
    const snap = new Map();
    for (const m of members) {
      const s = scoreAt(m, asOf);
      snap.set(m, s);
      history.push({
        HistKey: `${m}:${si}`, ModelKey: S.model.key, VersionKey: version.VersionKey,
        AnchorEntityName: S.model.anchorEntityName, MemberNumber: m,
        NormalizedScore: s.total, BandKey: bandFor(s.total).BandKey,
        AsOfDate: ts(asOf), ComputedAt: ts(asOf + 15 * 60000),
        DataCompleteness: s.completeness, Confidence: r4(0.5 + 0.5 * s.completeness),
      });
      if (si > 0) {
        const prev = perSnap[si - 1].get(m);
        const from = bandFor(prev.total).BandKey;
        const to = bandFor(s.total).BandKey;
        if (from !== to) transitions.push({
          TransKey: `${m}:${si}`, ModelKey: S.model.key, MemberNumber: m,
          FromBandKey: from, ToBandKey: to,
          Direction: s.total > prev.total ? 'Improving' : 'Worsening',
          OccurredAt: ts(asOf + 15 * 60000), RunKey: `run:${si}`, Handled: false,
        });
      }
    }
    perSnap.push(snap);
  }

  const cur = perSnap[perSnap.length - 1];
  const prev = perSnap[perSnap.length - 2];
  const asOfCur = snapDates[snapDates.length - 1];
  for (const m of members) {
    const s = cur.get(m);
    const p = prev.get(m);
    const delta = r2(s.total - p.total);
    const sorted = [...s.parts].sort((a, b) => b.weighted - a.weighted);
    scores.push({
      ScoreKey: `score:${m}`, ModelKey: S.model.key, VersionKey: version.VersionKey,
      AnchorEntityName: S.model.anchorEntityName, MemberNumber: m,
      RawScore: s.total, NormalizedScore: s.total, BandKey: bandFor(s.total).BandKey,
      PreviousNormalizedScore: p.total, PreviousBandKey: bandFor(p.total).BandKey,
      Delta: delta, TrendDirection: Math.abs(delta) < S.flatDeltaThreshold ? 'Flat' : delta > 0 ? 'Up' : 'Down',
      TrendSlope: r4(delta / offsets[offsets.length - 2]),
      Confidence: r4(0.5 + 0.5 * s.completeness), DataCompleteness: s.completeness,
      ComputedAt: ts(asOfCur + 15 * 60000), AsOfDate: ts(asOfCur), IsStale: false,
      NextRecomputeAt: ts(asOfCur + 7 * DAY),
      ExplanationSummary: `${personName.get(m)}: strongest signal ${sorted[0].f.displayLabel.toLowerCase()}; weakest ${sorted[sorted.length - 1].f.displayLabel.toLowerCase()}.`,
    });
    for (const part of s.parts) {
      const prevPart = p.parts.find((x) => x.f.key === part.f.key);
      contributions.push({
        ContribKey: `${m}:${part.f.key}`, ScoreKey: `score:${m}`,
        ModelFactorKey: `${S.model.key}:${part.f.key}`, FactorKey: part.f.key,
        RawValue: part.raw == null ? null : r4(part.raw), NormalizedValue: part.norm,
        WeightedContribution: part.weighted,
        PercentOfTotal: s.total > 0 ? r4(part.weighted / s.total) : null,
        ContributionDelta: r2(part.weighted - prevPart.weighted),
        HadData: part.had, MissingDataApplied: !part.had,
      });
    }
  }

  const runs = snapDates.map((asOf, si) => {
    const r = rng(seed, `sonar-run:${si}`);
    const changed = si === 0 ? members.length : members.filter((m) => perSnap[si].get(m).total !== perSnap[si - 1].get(m).total).length;
    const trans = transitions.filter((t) => t.RunKey === `run:${si}`).length;
    return {
      RunKey: `run:${si}`, ModelKey: S.model.key, VersionKey: version.VersionKey,
      TriggerType: si === snapDates.length - 1 ? 'Scheduled' : 'Backfill', Scope: 'FullPopulation',
      StartedAt: ts(asOf), CompletedAt: ts(asOf + 15 * 60000), Status: 'Succeeded',
      RecordsScored: members.length, RecordsChanged: changed, BandTransitions: trans,
      DurationMs: 600000 + r.int(0, 300) * 1000, CostUnitsConsumed: r2(members.length * S.runs.costUnitsPerRecord),
    };
  });

  return { model, version, bandSet, bands, timeWindows, factors, modelFactors, relatedEntities, auditEvents, scores, contributions, history, transitions, runs };
}
