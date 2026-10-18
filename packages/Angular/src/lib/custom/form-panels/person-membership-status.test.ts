import { describe, it, expect, vi } from 'vitest';
import type { IMetadataProvider } from '@memberjunction/core';
import { FormatMembershipStatus, LoadMembershipForPerson, MEMBERSHIP_STATUS_QUERY } from './membership-data';

describe('FormatMembershipStatus — the "Membership Status" stored query row on the member page', () => {
  it('shows a Current member in green with tier and expiry', () => {
    const res = FormatMembershipStatus({
      MembershipStatus: 'Current',
      MembershipTier: 'Individual',
      MembershipExpiresOn: '2027-10-07T00:00:00.000Z',
      LastMembershipPurchaseDate: '2026-10-07T00:00:00.000Z',
      MembershipPurchaseCount: 4,
    });
    expect(res).not.toBeNull();
    expect(res!.Status).toBe('Current');
    expect(res!.PillClass).toBe('active');
    expect(res!.Detail).toBe('Individual · expires Oct 7, 2027');
    expect(res!.Tooltip).toBe('Last membership purchase Oct 7, 2026 · 4 membership purchases');
  });

  it('shows a Lapsed member in red with the date it lapsed', () => {
    const res = FormatMembershipStatus({
      MembershipStatus: 'Lapsed',
      MembershipTier: 'SmallBusiness',
      MembershipExpiresOn: '2025-07-23T00:00:00.000Z',
      LastMembershipPurchaseDate: '2024-07-23T00:00:00.000Z',
      MembershipPurchaseCount: 1,
    });
    expect(res!.Status).toBe('Lapsed');
    expect(res!.PillClass).toBe('risk-high');
    expect(res!.Detail).toBe('SmallBusiness · lapsed Jul 23, 2025');
    expect(res!.Tooltip).toBe('Last membership purchase Jul 23, 2024 · 1 membership purchase');
  });

  it('shows Never Purchased in grey with no tier or dates', () => {
    const res = FormatMembershipStatus({
      MembershipStatus: 'Never Purchased',
      MembershipTier: null,
      MembershipExpiresOn: null,
      LastMembershipPurchaseDate: null,
      MembershipPurchaseCount: 0,
    });
    expect(res!.Status).toBe('Never Purchased');
    expect(res!.PillClass).toBe('ended');
    expect(res!.Detail).toBe('No membership purchase on file');
    expect(res!.Tooltip).toBe('No qualifying annual membership purchase');
  });

  it('returns null when there is no row (query missing or person not a member)', () => {
    expect(FormatMembershipStatus(null)).toBeNull();
  });
});

describe('LoadMembershipForPerson — membership status comes from the stored query', () => {
  const PERSON = 'AAAAAAAA-0000-0000-0000-000000000001';
  const profile = { ID: 'P1', MemberNumber: 'ICF-100289', Segment: 'Individual', Region: 'NA', CountryName: null, City: 'X', State: 'Y', JoinDate: '2020-01-01', OrganizationID: null, Organization: null };

  function fakeProvider(runQuery: ReturnType<typeof vi.fn>): IMetadataProvider {
    return {
      RunView: vi.fn().mockImplementation(async (params: { EntityName: string }) =>
        params.EntityName === 'MoreCheese: Member Profiles'
          ? { Success: true, Results: [profile] }
          : { Success: true, Results: [] }),
      RunQuery: runQuery,
      EntityByName: (name: string) => ({ SchemaName: '__mj', BaseView: name === 'MJ: Process Runs' ? 'vwProcessRuns' : 'vwRecordProcesses' }),
    } as unknown as IMetadataProvider;
  }

  it('runs "Membership Status" filtered to this person and maps the row', async () => {
    const runQuery = vi.fn().mockResolvedValue({
      Success: true,
      Results: [{ MembershipStatus: 'Current', MembershipTier: 'Individual', MembershipExpiresOn: '2027-10-07T00:00:00.000Z', LastMembershipPurchaseDate: '2026-10-07T00:00:00.000Z', MembershipPurchaseCount: 2 }],
    });
    const res = await LoadMembershipForPerson(PERSON, fakeProvider(runQuery));
    expect(runQuery).toHaveBeenCalledTimes(1);
    expect(runQuery.mock.calls[0][0]).toEqual({ QueryName: MEMBERSHIP_STATUS_QUERY, Parameters: { PersonID: PERSON } });
    expect(MEMBERSHIP_STATUS_QUERY).toBe('Membership Status');
    expect(res.MembershipStatus?.Status).toBe('Current');
    expect(res.Profile?.MemberNumber).toBe('ICF-100289');
  });

  it('still loads the panel when the query fails (status hidden, nothing else lost)', async () => {
    const runQuery = vi.fn().mockResolvedValue({ Success: false, Results: [], ErrorMessage: 'Query not found' });
    const res = await LoadMembershipForPerson(PERSON, fakeProvider(runQuery));
    expect(res.MembershipStatus).toBeNull();
    expect(res.Profile?.MemberNumber).toBe('ICF-100289');
  });

  it('still loads the panel when the query throws', async () => {
    const runQuery = vi.fn().mockRejectedValue(new Error('network'));
    const res = await LoadMembershipForPerson(PERSON, fakeProvider(runQuery));
    expect(res.MembershipStatus).toBeNull();
    expect(res.Profile?.MemberNumber).toBe('ICF-100289');
  });

  it('falls back to Orders entity views without warning when the stored query is not yet in the server query cache', async () => {
    const runQuery = vi.fn().mockResolvedValue({
      Success: false,
      Results: [],
      ErrorMessage: "Query 'Membership Status' not found",
    });
    const views: Record<string, { SchemaName: string; BaseView: string }> = {
      'MJ: Process Runs': { SchemaName: '__mj', BaseView: 'vwProcessRuns' },
      'MJ: Record Processes': { SchemaName: '__mj', BaseView: 'vwRecordProcesses' },
      'MJ_BizApps_Orders: Order Headers': { SchemaName: '__mj_BizAppsOrders', BaseView: 'vwOrderHeaders' },
      'MJ_BizApps_Orders: Order Lines': { SchemaName: '__mj_BizAppsOrders', BaseView: 'vwOrderLines' },
      'MJ_BizApps_Orders: Products': { SchemaName: '__mj_BizAppsOrders', BaseView: 'vwProducts' },
    };
    const provider = {
      RunView: vi.fn().mockImplementation(async (params: { EntityName: string }) => {
        if (params.EntityName === 'MoreCheese: Member Profiles') {
          return { Success: true, Results: [profile] };
        }
        if (params.EntityName === 'MJ_BizApps_Orders: Order Headers') {
          return {
            Success: true,
            Results: [{ ID: 'OH-1', BillToPersonID: PERSON, OrderDate: '2026-10-07T00:00:00.000Z' }],
          };
        }
        return { Success: true, Results: [] };
      }),
      RunViews: vi.fn().mockResolvedValue([
        { Success: true, Results: [{ OrderHeaderID: 'OH-1', ProductID: 'PROD-1' }] },
        { Success: true, Results: [{ ID: 'PROD-1', SKU: 'MEM-Individual' }] },
      ]),
      RunQuery: runQuery,
      EntityByName: (name: string) => views[name],
    } as unknown as IMetadataProvider;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const res = await LoadMembershipForPerson(PERSON, provider);
    expect(warnSpy).not.toHaveBeenCalled();
    expect(res.MembershipStatus?.Status).toBe('Current');
    expect(res.MembershipStatus?.Detail).toContain('Individual');
    warnSpy.mockRestore();
  });
});

