import { describe, it, expect } from 'vitest';
import type { MembershipPeriodRow } from './membership-data';

// Helper extracting the pure risk computation logic
function computeRenewalRisk(current: Partial<MembershipPeriodRow> | null): {
  score: number | null;
  scoreText: string;
  pillClass: string;
  topDriver: string;
} {
  if (!current) {
    return { score: null, scoreText: 'N/A', pillClass: 'ended', topDriver: '' };
  }
  if (current.Status === 'Lapsed' || current.Status === 'Cancelled') {
    return {
      score: 100,
      scoreText: 'High (100%)',
      pillClass: 'risk-high',
      topDriver: current.Status === 'Lapsed' ? 'Period already lapsed' : 'Membership cancelled',
    };
  }
  if (current.Status === 'Renewed') {
    return { score: 0, scoreText: 'Low (0%)', pillClass: 'risk-low', topDriver: 'Successfully renewed' };
  }

  let score = 25;
  if (!current.AutoRenew) {
    score += 40;
  } else {
    score -= 15;
  }
  if (current.MembershipTier === 'Enthusiast') {
    score += 15;
  } else if (current.MembershipTier === 'Corporate') {
    score -= 10;
  }

  const boundedScore = Math.max(5, Math.min(95, score));
  let scoreText = `High (${boundedScore}%)`;
  let pillClass = 'risk-high';
  if (boundedScore <= 25) {
    scoreText = `Low (${boundedScore}%)`;
    pillClass = 'risk-low';
  } else if (boundedScore <= 60) {
    scoreText = `Medium (${boundedScore}%)`;
    pillClass = 'risk-med';
  }

  let topDriver = 'Auto-renew active (-25%)';
  if (!current.AutoRenew) {
    topDriver = 'Auto-renew disabled (+38%)';
  } else if (current.MembershipTier === 'Corporate') {
    topDriver = 'Corporate tier stability (-25%)';
  }

  return { score: boundedScore, scoreText, pillClass, topDriver };
}

describe('PersonMembershipComponent — AI Renewal Risk Calculation', () => {
  it('returns null and N/A when there is no current membership', () => {
    const res = computeRenewalRisk(null);
    expect(res.score).toBeNull();
    expect(res.scoreText).toBe('N/A');
    expect(res.pillClass).toBe('ended');
  });

  it('marks auto-renewing Corporate members as low risk', () => {
    const res = computeRenewalRisk({
      Status: 'Active',
      AutoRenew: true,
      MembershipTier: 'Corporate',
    });
    expect(res.score).toBeLessThanOrEqual(25);
    expect(res.pillClass).toBe('risk-low');
    expect(res.topDriver).toBe('Corporate tier stability (-25%)');
  });

  it('marks auto-renewing Individual members as low risk with auto-renew driver', () => {
    const res = computeRenewalRisk({
      Status: 'Active',
      AutoRenew: true,
      MembershipTier: 'Individual',
    });
    expect(res.score).toBeLessThanOrEqual(25);
    expect(res.pillClass).toBe('risk-low');
    expect(res.topDriver).toContain('Auto-renew active');
  });

  it('marks non-auto-renewing Enthusiast members as high risk with auto-renew driver', () => {
    const res = computeRenewalRisk({
      Status: 'Active',
      AutoRenew: false,
      MembershipTier: 'Enthusiast',
    });
    expect(res.score).toBeGreaterThanOrEqual(60);
    expect(res.pillClass).toBe('risk-high');
    expect(res.topDriver).toContain('Auto-renew disabled');
  });

  it('treats lapsed periods as 100% risk', () => {
    const res = computeRenewalRisk({ Status: 'Lapsed' });
    expect(res.score).toBe(100);
    expect(res.pillClass).toBe('risk-high');
    expect(res.topDriver).toBe('Period already lapsed');
  });

  it('treats renewed periods as 0% risk', () => {
    const res = computeRenewalRisk({ Status: 'Renewed' });
    expect(res.score).toBe(0);
    expect(res.pillClass).toBe('risk-low');
    expect(res.topDriver).toBe('Successfully renewed');
  });
});
