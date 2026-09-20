import { describe, it, expect } from 'vitest';
import { FormatPredictionInfo } from './membership-data';

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
});
