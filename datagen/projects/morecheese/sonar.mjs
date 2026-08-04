// Sonar — engagement score MODEL DEFINITION over the member spine (bizapps-sonar).
//
// Sonar is a LIVE scoring engine: its FactorCompiler compiles each factor into SQL and
// computes the scores itself. So this pack ships DEFINITIONS ONLY — model, published
// version, bands, related entities, factors, and their weights — and lets Sonar recompute
// the scores/contributions/history after install. (An earlier version pre-computed 23k
// score rows; that both failed to compile and couldn't match what Sonar produces.)
//
// The factors mirror the shape of the working demo models: Declarative + Count over a
// single-hop related entity, RelationshipPath '[]' (the compiler auto-resolves the FK path
// to the People anchor), MinMax normalization (Sonar derives min/max over the population),
// equal additive weights, WeightedSum. Engagement = breadth/volume of real participation;
// a declining member (fewer registrations/enrollments/etc.) scores below an active one
// because Sonar counts the actual rows — honest by construction, no pre-pinned scores.

const ts = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
const DAY = 86400000;

export function buildSonar(cfg) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, release } = cfg;
  const S = R.sonar;
  const releaseMs = release.getTime();
  const createdAt = ts(releaseMs - S.params.model.createdDaysBeforeRelease * DAY + 10 * 3600000);
  const publishedAt = ts(releaseMs - S.params.model.publishedDaysBeforeRelease * DAY + 14 * 3600000);

  const bandSet = {
    BandSetKey: 'engagement-bands', Name: 'MoreCheese Engagement Bands',
    AnchorEntityName: S.params.model.anchorEntityName, Description: 'Qualitative engagement bands for the member score.',
  };
  const bands = S.catalog.bands.map((b) => ({
    BandKey: b.key, BandSetKey: bandSet.BandSetKey, Label: b.label, MinScore: b.min, MaxScore: b.max,
    Severity: b.severity, ColorHex: b.color, IsTerminal: false, Description: b.description,
  }));

  const model = {
    ModelKey: S.params.model.key, Name: S.params.model.name, Slug: S.params.model.slug, Description: S.params.model.description,
    AnchorEntityName: S.params.model.anchorEntityName, Status: S.params.model.status, CombineStrategy: 'WeightedSum',
    // a model becomes effective when its configuration is published, never before
    OwnerStaffKey: S.params.model.ownerStaffKey, EffectiveFrom: publishedAt,
  };
  const version = {
    VersionKey: `${S.params.model.key}:1`, ModelKey: S.params.model.key, VersionNumber: 1, VersionLabel: 'v1',
    // the snapshot must REPRODUCE the model: hardcoding aggregation 'Count' contradicted
    // the Recency factor, and omitting normalization/window/missing-data policy meant the
    // published config couldn't rebuild what actually runs
    ConfigSnapshotJSON: JSON.stringify({
      slug: S.params.model.slug, combine: 'WeightedSum', scale: [0, 100],
      factors: S.catalog.factors.map((f) => ({
        slug: f.slug, source: f.sourceEntityName, aggregation: f.aggregation, weight: f.weight,
        aggregateField: f.aggregateFieldName ?? null, window: f.windowKey ?? null,
        normalization: 'Percentile', missingData: 'Zero', higherIsBetter: f.higherIsBetter !== false,
      })),
      bands: S.catalog.bands.map((b) => ({ label: b.label, min: b.min, max: b.max })),
    }),
    ChangeSummary: 'Initial published configuration.', PublishedByStaffKey: S.params.model.ownerStaffKey,
    PublishedAt: publishedAt, IsCurrent: true,
  };

  // reusable Rolling windows; a factor's window date column comes from Factor.DateField
  const timeWindows = S.catalog.timeWindows.map((w) => ({
    WindowKey: w.key, Name: w.name, WindowType: w.windowType, LengthMonths: w.lengthMonths ?? null, LengthDays: w.lengthDays ?? null,
  }));

  // one related entity + one factor + one model-factor per configured signal
  const relatedEntities = S.catalog.factors.map((f) => ({
    RelatedKey: `${S.params.model.key}:${f.alias}`, ModelKey: S.params.model.key, EntityName: f.sourceEntityName,
    Alias: f.alias, RelationshipPath: '[]', JoinType: 'Left', // [] → compiler auto-resolves the FK path to the anchor
  }));
  const factors = S.catalog.factors.map((f) => ({
    FactorKey: f.key, Name: f.name, Slug: f.slug, Description: f.description, ModelKey: S.params.model.key,
    AnchorEntityName: S.params.model.anchorEntityName, FactorType: 'Declarative',
    SourceRelatedKey: `${S.params.model.key}:${f.alias}`, SourceEntityName: f.sourceEntityName,
    Aggregation: f.aggregation ?? 'Count', AggregateFieldName: f.aggregateFieldName ?? null,
    DateField: f.dateField ?? null, WindowKey: f.windowKey ?? null,
    // Percentile spreads the population by rank (MinMax compressed everything to the bottom
    // because counts are long-tailed); verified live against the FactorCompiler.
    NormalizationMethod: 'Percentile', HigherIsBetter: f.higherIsBetter ?? true, PromotionState: 'Approved',
  }));
  const modelFactors = S.catalog.factors.map((f, i) => ({
    ModelFactorKey: `${S.params.model.key}:${f.key}`, ModelKey: S.params.model.key, FactorKey: f.key,
    // missing→Zero: absence of an activity is a LOW engagement signal (NeutralMidpoint wrongly
    // credited inactive members to the middle band).
    Weight: f.weight, WeightMode: 'Additive', MissingDataPolicy: 'Zero',
    IsRequired: false, DisplayLabel: f.displayLabel, DisplayOrder: i + 1,
  }));

  // ── shape ── assemble the named tables this domain owns
  return { bandSet, bands, model, version, timeWindows, relatedEntities, factors, modelFactors };
}
