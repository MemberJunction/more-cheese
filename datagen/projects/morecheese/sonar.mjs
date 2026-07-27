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
  const { R, release } = cfg;
  const S = R.sonar;
  const releaseMs = release.getTime();
  const createdAt = ts(releaseMs - S.model.createdDaysBeforeRelease * DAY + 10 * 3600000);
  const publishedAt = ts(releaseMs - S.model.publishedDaysBeforeRelease * DAY + 14 * 3600000);

  const bandSet = {
    BandSetKey: 'engagement-bands', Name: 'MoreCheese Engagement Bands',
    AnchorEntityName: S.model.anchorEntityName, Description: 'Qualitative engagement bands for the member score.',
  };
  const bands = S.bands.map((b) => ({
    BandKey: b.key, BandSetKey: bandSet.BandSetKey, Label: b.label, MinScore: b.min, MaxScore: b.max,
    Severity: b.severity, ColorHex: b.color, IsTerminal: false, Description: b.description,
  }));

  const model = {
    ModelKey: S.model.key, Name: S.model.name, Slug: S.model.slug, Description: S.model.description,
    AnchorEntityName: S.model.anchorEntityName, Status: S.model.status, CombineStrategy: 'WeightedSum',
    OwnerStaffKey: S.model.ownerStaffKey, EffectiveFrom: createdAt,
  };
  const version = {
    VersionKey: `${S.model.key}:1`, ModelKey: S.model.key, VersionNumber: 1, VersionLabel: 'v1',
    ConfigSnapshotJSON: JSON.stringify({
      slug: S.model.slug, combine: 'WeightedSum', scale: [0, 100],
      factors: S.factors.map((f) => ({ slug: f.slug, source: f.sourceEntityName, aggregation: 'Count', weight: f.weight })),
      bands: S.bands.map((b) => ({ label: b.label, min: b.min, max: b.max })),
    }),
    ChangeSummary: 'Initial published configuration.', PublishedByStaffKey: S.model.ownerStaffKey,
    PublishedAt: publishedAt, IsCurrent: true,
  };

  // one related entity + one factor + one model-factor per configured signal
  const relatedEntities = S.factors.map((f) => ({
    RelatedKey: `${S.model.key}:${f.alias}`, ModelKey: S.model.key, EntityName: f.sourceEntityName,
    Alias: f.alias, RelationshipPath: '[]', JoinType: 'Left', // [] → compiler auto-resolves the FK path to the anchor
  }));
  const factors = S.factors.map((f) => ({
    FactorKey: f.key, Name: f.name, Slug: f.slug, Description: f.description, ModelKey: S.model.key,
    AnchorEntityName: S.model.anchorEntityName, FactorType: 'Declarative',
    SourceRelatedKey: `${S.model.key}:${f.alias}`, SourceEntityName: f.sourceEntityName,
    Aggregation: 'Count', NormalizationMethod: 'MinMax', HigherIsBetter: true, PromotionState: 'Approved',
  }));
  const modelFactors = S.factors.map((f, i) => ({
    ModelFactorKey: `${S.model.key}:${f.key}`, ModelKey: S.model.key, FactorKey: f.key,
    Weight: f.weight, WeightMode: 'Additive', MissingDataPolicy: 'ModelDefault',
    IsRequired: false, DisplayLabel: f.displayLabel, DisplayOrder: i + 1,
  }));

  return { bandSet, bands, model, version, relatedEntities, factors, modelFactors };
}
