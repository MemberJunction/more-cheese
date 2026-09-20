import { describe, it, expect } from 'vitest';
import { FormatPredictionInfo, FormatHistoryDate, ParseRunDetailItem } from './membership-data';

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

  it('formats low risk probabilities correctly (≤25%)', () => {
    const res = FormatPredictionInfo(0.15, 'Renewing', [{ name: 'HighLMSCompletion', importance: 0.8 }], 'Member Retention Model', '2026-09-20');
    expect(res.Score).toBe(0.15);
    expect(res.RiskText).toBe('Low (15%)');
    expect(res.PillClass).toBe('risk-low');
    expect(res.TopDriver).toBe('HighLMSCompletion');
    expect(res.Tooltip).toContain('Member Retention Model');
    expect(res.Tooltip).toContain('2026-09-20');
  });

  it('formats medium risk probabilities correctly (26-60%)', () => {
    const res = FormatPredictionInfo(0.48, null, [{ name: 'OrderFrequencyDrop', importance: 0.5 }], 'Member Churn Model');
    expect(res.Score).toBe(0.48);
    expect(res.RiskText).toBe('Medium (48%)');
    expect(res.PillClass).toBe('risk-med');
    expect(res.TopDriver).toBe('OrderFrequencyDrop');
  });

  it('formats high risk probabilities correctly (>60%)', () => {
    const res = FormatPredictionInfo(0.85, 'NonRenewing', [{ name: 'InactivityDays', importance: 0.9 }], 'Member Churn Model');
    expect(res.Score).toBe(0.85);
    expect(res.RiskText).toBe('High (85%)');
    expect(res.PillClass).toBe('risk-high');
    expect(res.TopDriver).toBe('InactivityDays');
  });

  it('normalizes percentage inputs > 1 correctly', () => {
    const res = FormatPredictionInfo(92, 'Lapsed', [{ name: 'ZeroOrders', importance: 0.7 }]);
    expect(res.RiskText).toBe('High (92%)');
    expect(res.PillClass).toBe('risk-high');
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
    expect(item!.score).toBe(0.013);
    expect(item!.predictedClass).toBe('Renewed');
    expect(item!.riskText).toBe('Low (1%)');
    expect(item!.pillClass).toBe('risk-low');
    expect(item!.topDriver).toBe('TenureDays');
    expect(item!.drivers).toHaveLength(2);
    expect(item!.drivers[0].name).toBe('TenureDays');
    expect(item!.drivers[0].relativePct).toBe(100);
    expect(item!.rawPayload).toContain('E93F0238-6902-4521-87D9-FE9A1201B001'); // formatted JSON
  });
});
