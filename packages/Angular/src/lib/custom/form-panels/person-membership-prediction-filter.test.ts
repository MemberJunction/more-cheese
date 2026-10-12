import { describe, it, expect, vi } from 'vitest';
import type { IMetadataProvider, RunViewParams } from '@memberjunction/core';
import {
    LoadMembershipForPerson,
    PredictionDetailFilter,
    PREDICTION_HISTORY_ROWS,
    PREDICTION_WORK_TYPE,
    type MembershipStatusRow,
} from './membership-data';

const PERSON = 'AAAAAAAA-0000-0000-0000-000000000001';
const profile = { ID: 'P1', MemberNumber: 'ICF-100289', Segment: 'Individual', Region: 'NA', CountryName: null, City: 'X', State: 'Y', JoinDate: '2020-01-01', OrganizationID: null, Organization: null, RenewalProbability: null, RenewalStatus: null, RenewalScoredAt: null };

/** One `MJ: Process Run Details` row plus the WorkType of the Record Process its run belongs to. */
interface StoredDetail {
    ID: string;
    CompletedAt: string;
    ResultPayload: string | null;
    WorkType: 'ML Model' | 'FieldRules' | 'Action';
}

const PREDICTION_PAYLOAD = JSON.stringify({ output: { score: 0.82, class: 'Renewed', target: 'Renewal Risk' } });

/**
 * A stand-in for the database behind RunViews: it honours the parts of the detail filter the panel
 * relies on (the ML Model process join and the payload guard), then orders and caps like SQL would.
 */
function fakeProvider(details: StoredDetail[], statusRow: MembershipStatusRow | null): { provider: IMetadataProvider; runView: ReturnType<typeof vi.fn> } {
    const runView = vi.fn().mockImplementation(async (params: RunViewParams) => {
        if (params.EntityName === 'MoreCheese: Member Profiles') return { Success: true, Results: [profile] };
        const filter = params.ExtraFilter ?? '';
        let rows = details.filter(() => filter.includes(`'${PERSON}'`));
        if (filter.includes(`rp.WorkType = '${PREDICTION_WORK_TYPE}'`)) rows = rows.filter(d => d.WorkType === 'ML Model');
        if (filter.includes('ResultPayload IS NOT NULL')) rows = rows.filter(d => d.ResultPayload != null);
        rows = [...rows].sort((a, b) => b.CompletedAt.localeCompare(a.CompletedAt)).slice(0, params.MaxRows ?? rows.length);
        return { Success: true, Results: rows.map(r => ({ ID: r.ID, CompletedAt: r.CompletedAt, ResultPayload: r.ResultPayload })) };
    });
    const runQuery = vi.fn().mockResolvedValue({ Success: true, Results: statusRow ? [statusRow] : [] });
    return { provider: { RunView: runView, RunQuery: runQuery } as unknown as IMetadataProvider, runView };
}

const CURRENT: MembershipStatusRow = { MembershipStatus: 'Current', MembershipTier: 'Individual', MembershipExpiresOn: '2027-10-07T00:00:00.000Z', LastMembershipPurchaseDate: '2026-10-07T00:00:00.000Z', MembershipPurchaseCount: 3 };
const LAPSED: MembershipStatusRow = { MembershipStatus: 'Lapsed', MembershipTier: 'Individual', MembershipExpiresOn: '2025-07-23T00:00:00.000Z', LastMembershipPurchaseDate: '2024-07-23T00:00:00.000Z', MembershipPurchaseCount: 1 };
const NEVER: MembershipStatusRow = { MembershipStatus: 'Never Purchased', MembershipTier: null, MembershipExpiresOn: null, LastMembershipPurchaseDate: null, MembershipPurchaseCount: 0 };

/** One older Predictive Studio prediction, then a dozen newer Sonar rescore rows with no payload. */
function predictionBuriedUnderSonarRescores(): StoredDetail[] {
    const rows: StoredDetail[] = [{ ID: 'PRED-1', CompletedAt: '2026-09-01T10:00:00.000Z', ResultPayload: PREDICTION_PAYLOAD, WorkType: 'ML Model' }];
    for (let i = 0; i < 12; i++) {
        rows.push({ ID: `SONAR-${i}`, CompletedAt: `2026-10-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`, ResultPayload: null, WorkType: 'FieldRules' });
    }
    return rows;
}

describe('PredictionDetailFilter — member page reads only Predictive Studio prediction rows', () => {
    it('restricts to the given records, a non-null payload, and ML Model record-process runs', () => {
        expect(PREDICTION_WORK_TYPE).toBe('ML Model');
        expect(PredictionDetailFilter([PERSON, 'P1'])).toBe(
            `RecordID IN ('${PERSON}', 'P1') AND ResultPayload IS NOT NULL`
            + ' AND ProcessRunID IN (SELECT pr.ID FROM [__mj].[vwProcessRuns] pr'
            + ' INNER JOIN [__mj].[vwRecordProcesses] rp ON rp.ID = pr.RecordProcessID'
            + " WHERE rp.WorkType = 'ML Model')",
        );
    });

    it('escapes quotes in the person ID', () => {
        expect(PredictionDetailFilter(["x'y"])).toContain("RecordID IN ('x''y')");
    });
});

describe('LoadMembershipForPerson — other processes cannot push the prediction out', () => {
    it('sends the prediction filter for the person and its member profile, newest first, capped at 10 rows', async () => {
        const { provider, runView } = fakeProvider([], CURRENT);
        await LoadMembershipForPerson(PERSON, provider);
        const detailParams = runView.mock.calls[1][0] as RunViewParams;
        expect(detailParams.EntityName).toBe('MJ: Process Run Details');
        expect(detailParams.ExtraFilter).toBe(PredictionDetailFilter([PERSON, 'P1']));
        expect(detailParams.OrderBy).toBe('CompletedAt DESC');
        expect(detailParams.MaxRows).toBe(PREDICTION_HISTORY_ROWS);
        expect(PREDICTION_HISTORY_ROWS).toBe(10);
    });

    it('still shows the prediction when 12 newer Sonar rescore rows exist for the same person', async () => {
        const { provider } = fakeProvider(predictionBuriedUnderSonarRescores(), CURRENT);
        const res = await LoadMembershipForPerson(PERSON, provider);
        expect(res.History.map(h => h.id)).toEqual(['PRED-1']);
        expect(res.RenewalPrediction?.RiskText).toBe('High (82%)');
        expect(res.RenewalPrediction?.PillClass).toBe('risk-low');
        expect(res.Prediction?.RiskText).toBe('High (82%)');
    });
});

describe('LoadMembershipForPerson — renewal card for non-members', () => {
    it('shows "Not a member" (not "Not Scored") when the person never bought a membership', async () => {
        const { provider } = fakeProvider([], NEVER);
        const res = await LoadMembershipForPerson(PERSON, provider);
        expect(res.MembershipStatus?.Status).toBe('Never Purchased');
        expect(res.RenewalPrediction?.RiskText).toBe('Not a member');
        expect(res.RenewalPrediction?.PillClass).toBe('ended');
        expect(res.RenewalPrediction?.Score).toBeNull();
        expect(res.RenewalPrediction?.Tooltip).toBe('No membership purchase on file, so there is no membership to renew.');
        expect(res.Prediction?.RiskText).toBe('Not a member');
    });

    it('shows "Not a member" even if a stale prediction row exists for a non-member', async () => {
        const { provider } = fakeProvider(predictionBuriedUnderSonarRescores(), NEVER);
        const res = await LoadMembershipForPerson(PERSON, provider);
        expect(res.RenewalPrediction?.RiskText).toBe('Not a member');
        expect(res.History).toHaveLength(1);
    });

    it('keeps "Not Scored" for a lapsed member with no prediction (they can renew)', async () => {
        const { provider } = fakeProvider([], LAPSED);
        const res = await LoadMembershipForPerson(PERSON, provider);
        expect(res.RenewalPrediction?.RiskText).toBe('Not Scored');
    });

    it('keeps "Not Scored" when the membership status is unknown', async () => {
        const { provider } = fakeProvider([], null);
        const res = await LoadMembershipForPerson(PERSON, provider);
        expect(res.MembershipStatus).toBeNull();
        expect(res.RenewalPrediction?.RiskText).toBe('Not Scored');
    });
});
