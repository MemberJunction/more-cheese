import { describe, it, expect } from 'vitest';
import { FormatPredictionInfo, FormatHistoryDate, ParseRunDetailItem, FormatRegressionValue } from './membership-data';

describe('PersonMembershipComponent — Predictive Studio Prediction Resolution', () => {
  it('returns Not Scored when there is no prediction on file', () => {
    const res = FormatPredictionInfo(null, null, null);
    expect(res.Score).toBeNull();
    expect(res.Class).toBeNull();
    expect(res.RiskText).toBe('Not Scored');
    expect(res.PillClass).toBe('ended');
    expect(res.TopDriver).toBeNull();
    expect(res.Tooltip).toContain('has not been executed');
  });

  it('formats high renewal probabilities correctly (≥60%)', () => {
    const res = FormatPredictionInfo(0.85, 'Renewing', [{ name: 'HighLMSCompletion', importance: 0.8 }], 'Member Retention Model', '2026-09-20');
    expect(res.Score).toBe(0.85);
    expect(res.RiskText).toBe('High (85%)');
    expect(res.PillClass).toBe('risk-low');
    expect(res.TopDriver).toBe('HighLMSCompletion');
    expect(res.Tooltip).toContain('Member Retention Model');
    expect(res.Tooltip).toContain('85% Renewal Probability');
    expect(res.Tooltip).toContain('2026-09-20');
  });

  it('formats medium renewal probabilities correctly (40-59%)', () => {
    const res = FormatPredictionInfo(0.48, null, [{ name: 'OrderFrequencyDrop', importance: 0.5 }], 'Member Churn Model');
    expect(res.Score).toBe(0.48);
    expect(res.RiskText).toBe('Medium (48%)');
    expect(res.PillClass).toBe('risk-med');
    expect(res.TopDriver).toBe('OrderFrequencyDrop');
  });

  it('formats low renewal probabilities correctly (<40%)', () => {
    const res = FormatPredictionInfo(0.15, 'NonRenewing', [{ name: 'InactivityDays', importance: 0.9 }], 'Member Churn Model');
    expect(res.Score).toBe(0.15);
    expect(res.RiskText).toBe('Low (15%)');
    expect(res.PillClass).toBe('risk-high');
    expect(res.TopDriver).toBe('InactivityDays');
  });

  it('normalizes percentage inputs > 1 correctly', () => {
    const res = FormatPredictionInfo(92, 'Renewed', [{ name: 'ZeroOrders', importance: 0.7 }]);
    expect(res.RiskText).toBe('High (92%)');
    expect(res.PillClass).toBe('risk-low');
  });

  it('calculates driver relative percentages correctly against top driver', () => {
    const drivers = [
      { name: 'TenureDays', importance: 0.20 },
      { name: 'DaysSinceLastEvent', importance: 0.10 },
      { name: 'TotalOrderSpend', importance: 0.05 },
    ];
    const res = FormatPredictionInfo(0.12, 'Renewed', drivers);
    expect(res.Drivers).toHaveLength(3);
    expect(res.Drivers[0].name).toBe('TenureDays');
    expect(res.Drivers[0].relativePct).toBe(100);
    expect(res.Drivers[1].name).toBe('DaysSinceLastEvent');
    expect(res.Drivers[1].relativePct).toBe(50);
    expect(res.Drivers[2].name).toBe('TotalOrderSpend');
    expect(res.Drivers[2].relativePct).toBe(25);
  });

  it('handles empty or null drivers list gracefully', () => {
    const res = FormatPredictionInfo(0.20, 'Renewed', null);
    expect(res.Drivers).toEqual([]);
    expect(res.TopDriver).toBeNull();
  });
});

describe('FormatHistoryDate', () => {
  it('returns em-dash for null or empty dates', () => {
    expect(FormatHistoryDate(null)).toBe('—');
    expect(FormatHistoryDate('')).toBe('—');
    expect(FormatHistoryDate(undefined)).toBe('—');
  });

  it('formats valid ISO strings correctly', () => {
    const res = FormatHistoryDate('2026-09-20T16:26:20.180Z');
    expect(res).not.toBe('—');
    expect(res).toContain('2026');
  });
});

describe('ParseRunDetailItem', () => {
  it('returns null for empty payload', () => {
    expect(ParseRunDetailItem({ ID: '1', CompletedAt: null, ResultPayload: null })).toBeNull();
  });

  it('returns null for invalid JSON payload', () => {
    expect(ParseRunDetailItem({ ID: '1', CompletedAt: null, ResultPayload: 'invalid{' })).toBeNull();
  });

  it('correctly parses wrapped ML output payload', () => {
    const payload = JSON.stringify({
      output: {
        modelId: 'E93F0238-6902-4521-87D9-FE9A1201B001',
        target: 'Renewal Risk',
        problemType: 'classification',
        score: 0.013,
        class: 'Renewed',
        drivers: [
          { feature: 'TenureDays', value: 0.1717 },
          { feature: 'DaysSinceLastEvent', value: 0.148 },
        ],
        scoredAt: '2026-09-20T16:26:19.562Z',
      },
    });

    const item = ParseRunDetailItem({
      ID: 'RUN-DETAIL-001',
      CompletedAt: '2026-09-20T16:26:20.180Z',
      ResultPayload: payload,
    });

    expect(item).not.toBeNull();
    expect(item!.id).toBe('RUN-DETAIL-001');
    expect(item!.score).toBeCloseTo(0.987);
    expect(item!.predictedClass).toBe('Renewed');
    expect(item!.riskText).toBe('High (99%)');
    expect(item!.pillClass).toBe('risk-low');
    expect(item!.topDriver).toBe('TenureDays');
    expect(item!.drivers).toHaveLength(2);
    expect(item!.drivers[0].name).toBe('TenureDays');
    expect(item!.drivers[0].relativePct).toBe(100);
    expect(item!.rawPayload).toContain('E93F0238-6902-4521-87D9-FE9A1201B001'); // formatted JSON
  });

  it('respects pre-evaluated outcome metadata fields from payload when present', () => {
    const payload = JSON.stringify({
      output: {
        score: 0.92,
        class: 'Active',
        status: 'Very Safe',
        band: 'super-safe',
        badgeColor: 'green',
        icon: 'fa-star',
        scoreLabel: 'Retention Likelihood',
        statusLabel: 'Health Level',
      },
    });

    const item = ParseRunDetailItem({
      ID: 'RUN-DETAIL-002',
      CompletedAt: '2026-09-20T17:00:00.000Z',
      ResultPayload: payload,
    });

    expect(item).not.toBeNull();
    expect(item!.riskText).toBe('Very Safe (92%)');
    expect(item!.pillClass).toBe('risk-low');
    expect(item!.badgeColor).toBe('green');
    expect(item!.icon).toBe('fa-star');
  });

  it('correctly parses regression payload with continuous score and label-based drivers', () => {
    const payload = JSON.stringify({
      output: {
        modelId: 'DAB40DD7-AD2A-4DAC-A117-96D56CB6CE6B',
        target: 'CustomerActualLTV',
        problemType: 'regression',
        score: 11253.8,
        class: 'High Value',
        status: 'High Value',
        band: 'high',
        badgeColor: 'green',
        icon: 'fa-arrow-trend-up',
        scoreLabel: 'Predicted Customer LTV',
        statusLabel: 'LTV Tier',
        drivers: [
          { label: 'Total Orders', value: 74, up: true },
          { label: 'Customer Tenure Days', value: 2700, up: true },
          { label: 'First Order Gross', value: 830, up: true },
        ],
        scoredAt: '2026-09-20T23:33:26.260Z',
      },
    });

    const item = ParseRunDetailItem({
      ID: 'RUN-DETAIL-003',
      CompletedAt: '2026-09-20T23:33:26.336Z',
      ResultPayload: payload,
    });

    expect(item).not.toBeNull();
    expect(item!.id).toBe('RUN-DETAIL-003');
    expect(item!.problemType).toBe('regression');
    expect(item!.score).toBe(11253.8);
    expect(item!.predictedClass).toBe('High Value');
    expect(item!.displayValue).toBe('$11,254');
    expect(item!.riskText).toBe('High Value ($11,254)');
    expect(item!.pillClass).toBe('risk-low');
    expect(item!.badgeColor).toBe('green');
    expect(item!.icon).toBe('fa-arrow-trend-up');
    expect(item!.scoreLabel).toBe('Predicted Customer LTV');
    expect(item!.modelName).toBe('Predicted Customer LTV');
    expect(item!.topDriver).toBe('Total Orders');
    expect(item!.drivers).toHaveLength(3);
    expect(item!.drivers[0].name).toBe('Total Orders');
  });

  it('pins both sides of the score > 100 regression heuristic boundary', () => {
    // Side 1: score > 100 with explicit problemType: 'classification' must NOT be treated as regression
    const classificationPayload = JSON.stringify({
      output: {
        score: 150,
        problemType: 'classification',
        target: 'Engagement Score',
      },
    });
    const classItem = ParseRunDetailItem({
      ID: 'RUN-DETAIL-004',
      CompletedAt: '2026-09-20T23:40:00.000Z',
      ResultPayload: classificationPayload,
    });
    expect(classItem).not.toBeNull();
    expect(classItem!.problemType).toBe('classification');
    expect(classItem!.displayValue).not.toContain('$');
    expect(classItem!.displayValue).toBe('100%');

    // Side 2: score > 100 without problemType: 'classification' is inferred as continuous regression
    const inferredRegressionPayload = JSON.stringify({
      output: {
        score: 150,
        target: 'Customer Spend',
      },
    });
    const regItem = ParseRunDetailItem({
      ID: 'RUN-DETAIL-005',
      CompletedAt: '2026-09-20T23:41:00.000Z',
      ResultPayload: inferredRegressionPayload,
    });
    expect(regItem).not.toBeNull();
    expect(regItem!.problemType).toBe('regression');
    expect(regItem!.displayValue).toBe('$150');

    // Boundary check: score <= 100 without problemType stays classification
    const scoreUnder100Payload = JSON.stringify({
      output: {
        score: 85,
        target: 'Engagement Score',
      },
    });
    const boundaryItem = ParseRunDetailItem({
      ID: 'RUN-DETAIL-006',
      CompletedAt: '2026-09-20T23:42:00.000Z',
      ResultPayload: scoreUnder100Payload,
    });
    expect(boundaryItem).not.toBeNull();
    expect(boundaryItem!.problemType).toBe('classification');
    expect(boundaryItem!.displayValue).toBe('85%');
  });
});

describe('FormatRegressionValue', () => {
  it('formats currency values with dollar signs and commas', () => {
    expect(FormatRegressionValue(11253.8, 'Predicted Customer LTV')).toBe('$11,254');
    expect(FormatRegressionValue(400.05, 'Predicted Customer LTV')).toBe('$400');
    expect(FormatRegressionValue(0, 'Customer LTV')).toBe('$0');
  });

  it('formats non-currency continuous numbers appropriately', () => {
    expect(FormatRegressionValue(42, 'Score')).toBe('42');
    expect(FormatRegressionValue(3.1415, 'Index')).toBe('3.14');
  });
});

