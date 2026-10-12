import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import type { IMetadataProvider } from '@memberjunction/core';
import type { OrganizationStaffMember } from '@mj-biz-apps/common-ng';
import {
    BuildStaffMembershipContribution,
    LatestRenewalScores,
    MoreCheeseStaffContributor,
    QuotedIDs,
    type StaffMembershipData,
} from './organization-staff-membership.contributor';

const A = 'AAAAAAAA-0000-0000-0000-000000000001';
const B = 'BBBBBBBB-0000-0000-0000-000000000002';
const C = 'CCCCCCCC-0000-0000-0000-000000000003';
const ORG = 'EA49DA78-B450-54CB-B49D-A4CBBBFD73A5';
const staff: OrganizationStaffMember[] = [
    { PersonID: A, Name: 'Ana', Title: null, StartDate: null },
    { PersonID: B, Name: 'Ben', Title: null, StartDate: null },
    { PersonID: C, Name: 'Cy', Title: null, StartDate: null },
];
const membership = (id: string, status: 'Current' | 'Lapsed' | 'Never Purchased', tier: string | null) => ({
    PersonID: id, MembershipStatus: status, MembershipTier: tier, MembershipExpiresOn: null, LastMembershipPurchaseDate: null, MembershipPurchaseCount: 1,
});

describe('BuildStaffMembershipContribution', () => {
    const data: StaffMembershipData = {
        Memberships: [membership(A, 'Current', 'Individual'), membership(B.toLowerCase(), 'Lapsed', 'SmallBusiness')],
        Certifications: [{ PersonID: A, Status: 'Awarded' }, { PersonID: A, Status: 'Awarded' }, { PersonID: B, Status: 'Expired' }, { PersonID: C, Status: 'InProgress' }],
        Competition: [{ Result: 'Gold' }, { Result: 'None' }, { Result: 'Bronze' }],
        Attendances: [{ PersonID: A }],
        RenewalScores: new Map([[A, 0.72], [B, 0.31]]),
    };
    const res = BuildStaffMembershipContribution(staff, data);

    it('rolls up current members, certifications held, competition, attendance and renewal outlook', () => {
        expect(res.Figures).toEqual([
            { Label: 'Current members', Value: 1, Icon: 'fa-solid fa-cheese', Detail: 'of 3 staff · 1 lapsed', Tone: 'none' },
            { Label: 'Certifications held', Value: 2, Icon: 'fa-solid fa-certificate', Detail: '1 expired' },
            { Label: 'Competition entries', Value: 3, Icon: 'fa-solid fa-trophy', Detail: '2 medals' },
            { Label: 'Conference attendances', Value: 1, Icon: 'fa-solid fa-ticket' },
            { Label: 'Avg AI renewal probability', Value: '52%', Icon: 'fa-solid fa-wand-magic-sparkles', Detail: '2 of 3 staff scored' },
        ]);
    });

    it('gives each person a membership, AI renewal and certification cell; non-members read "Not a member"', () => {
        expect(res.Columns.map(c => c.Header)).toEqual(['Membership', 'AI renewal', 'Certs']);
        expect(res.Cells.get(A)).toEqual({
            membership: { Text: 'Current', Tone: 'success', Title: 'Individual' },
            renewal: { Text: '72%', Tone: 'success' },
            certs: { Text: '2', Tone: undefined },
        });
        expect(res.Cells.get(B)).toEqual({
            membership: { Text: 'Lapsed', Tone: 'error', Title: 'SmallBusiness' },
            renewal: { Text: '31%', Tone: 'error' },
            certs: { Text: '0', Tone: 'muted' },
        });
        expect(res.Cells.get(C)).toEqual({
            membership: { Text: 'Not a member', Tone: 'muted' },
            renewal: { Text: 'Not scored', Tone: 'muted' },
            certs: { Text: '0', Tone: 'muted' },
        });
    });

    it('shows an unknown average (em dash) when nobody is scored, and warns when lapsed outnumber current', () => {
        const none = BuildStaffMembershipContribution(staff, { ...data, Memberships: [membership(A, 'Lapsed', null), membership(B, 'Lapsed', null)], RenewalScores: new Map() });
        expect(none.Figures[0].Tone).toBe('warn');
        expect(none.Figures[4].Value).toBeNull();
        expect(none.Figures[4].Detail).toBe('0 of 3 staff scored');
    });
});

describe('LatestRenewalScores', () => {
    const payload = (score: number) => JSON.stringify({ output: { score, class: 'Renewed', problemType: 'classification', target: 'RenewalNextYear' } });
    it('keeps only the newest classification score per person', () => {
        const scores = LatestRenewalScores([
            { ID: '1', RecordID: A.toLowerCase(), CompletedAt: '2026-10-05', ResultPayload: payload(0.8) },
            { ID: '2', RecordID: A, CompletedAt: '2026-09-01', ResultPayload: payload(0.2) },
            { ID: '3', RecordID: B, CompletedAt: '2026-10-05', ResultPayload: null },
        ]);
        expect(scores.get(A)).toBe(0.8);
        expect(scores.has(B)).toBe(false);
    });
});

describe('QuotedIDs', () => {
    it('quotes UUIDs and refuses anything else', () => {
        expect(QuotedIDs([A, B])).toBe(`'${A}','${B}'`);
        expect(() => QuotedIDs(["x' OR 1=1 --"])).toThrow('Not a UUID');
    });
});

describe('MoreCheeseStaffContributor.Load', () => {
    it('reads the Membership Status query by organization and the four views for the staff', async () => {
        const runViews = vi.fn().mockResolvedValue([
            { Success: true, Results: [] }, { Success: true, Results: [] }, { Success: true, Results: [] }, { Success: true, Results: [] },
        ]);
        const runQuery = vi.fn().mockResolvedValue({ Success: true, Results: [membership(A, 'Current', 'Individual')] });
        const provider = { RunViews: runViews, RunQuery: runQuery } as unknown as IMetadataProvider;
        const res = await new MoreCheeseStaffContributor().Load({ OrganizationID: ORG, Staff: staff.slice(0, 1), Provider: provider });
        expect(runQuery.mock.calls[0][0]).toEqual({ QueryName: 'Membership Status', Parameters: { OrganizationID: ORG } });
        const views = runViews.mock.calls[0][0];
        expect(views.map((v: { EntityName: string }) => v.EntityName)).toEqual([
            'MoreCheese: Member Certifications', 'MoreCheese: Competition Entries', 'MJ_BizApps_Orders: Event Order Lines', 'MJ: Process Run Details',
        ]);
        expect(views[1].ExtraFilter).toBe(`OrganizationID = '${ORG}'`);
        expect(views[2].ExtraFilter).toContain(`PersonID IN ('${A}') AND AttendanceStatus = 'Attended'`);
        expect(views[2].ExtraFilter).toContain(`oh.Status = 'Confirmed'`);
        // Only Predictive Studio (ML Model) prediction rows, so another process's runs cannot pass as a score.
        expect(views[3].ExtraFilter).toBe(
            `RecordID IN ('${A}') AND ResultPayload IS NOT NULL`
            + ' AND ProcessRunID IN (SELECT pr.ID FROM [__mj].[vwProcessRuns] pr'
            + ' INNER JOIN [__mj].[vwRecordProcesses] rp ON rp.ID = pr.RecordProcessID'
            + " WHERE rp.WorkType = 'ML Model')",
        );
        expect(res.Cells.get(A)?.['membership'].Text).toBe('Current');
    });

    it('throws when the Membership Status query fails, so the Staff section can name it', async () => {
        const provider = {
            RunViews: vi.fn().mockResolvedValue([{ Success: true, Results: [] }, { Success: true, Results: [] }, { Success: true, Results: [] }, { Success: true, Results: [] }]),
            RunQuery: vi.fn().mockResolvedValue({ Success: false, ErrorMessage: 'Query not found', Results: [] }),
        } as unknown as IMetadataProvider;
        await expect(new MoreCheeseStaffContributor().Load({ OrganizationID: ORG, Staff: staff.slice(0, 1), Provider: provider })).rejects.toThrow('Query not found');
    });
});
