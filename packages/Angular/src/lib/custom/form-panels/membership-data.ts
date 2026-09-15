import { RunView, type IMetadataProvider, type RunViewResult } from '@memberjunction/core';

/** One `MoreCheese: Membership Periods` row as returned by a simple RunView. */
export interface MembershipPeriodRow {
    ID: string;
    PeriodKey: string;
    MembershipTier: string;
    DuesAmount: number;
    StartDate: string;
    EndDate: string;
    RenewalDate: string;
    Status: string;
    AutoRenew: boolean;
    CancellationDate: string | null;
    CancellationReason: string | null;
}

/** One `MoreCheese: Member Profiles` row as returned by a simple RunView. */
export interface MemberProfileRow {
    ID: string;
    MemberNumber: string;
    Segment: string;
    Region: string;
    CountryName: string | null;
    City: string;
    State: string;
    JoinDate: string;
    OrganizationID: string | null;
    Organization: string | null;
}

export interface PersonMembership {
    Profile: MemberProfileRow | null;
    Periods: MembershipPeriodRow[];
}

const PROFILE_FIELDS = ['ID', 'MemberNumber', 'Segment', 'Region', 'CountryName', 'City', 'State', 'JoinDate', 'OrganizationID', 'Organization'];
const PERIOD_FIELDS = ['ID', 'PeriodKey', 'MembershipTier', 'DuesAmount', 'StartDate', 'EndDate', 'RenewalDate', 'Status', 'AutoRenew', 'CancellationDate', 'CancellationReason'];

function Quote(value: string): string {
    return value.replace(/'/g, "''");
}

function ViewOf(provider?: IMetadataProvider): RunView {
    return provider ? RunView.FromMetadataProvider(provider) : new RunView();
}

function ResultsOrThrow<T>(result: RunViewResult<T>, what: string): T[] {
    if (!result.Success) {
        throw new Error(result.ErrorMessage || `Could not load ${what}.`);
    }
    return result.Results ?? [];
}

/**
 * Loads the More Cheese membership picture for one person in a single batch:
 * the member profile (at most one) and every membership period, newest first.
 */
export async function LoadMembershipForPerson(personID: string, provider?: IMetadataProvider): Promise<PersonMembership> {
    const filter = `PersonID = '${Quote(personID)}'`;
    const [profiles, periods] = await ViewOf(provider).RunViews([
        { EntityName: 'MoreCheese: Member Profiles', ExtraFilter: filter, Fields: PROFILE_FIELDS, ResultType: 'simple' },
        { EntityName: 'MoreCheese: Membership Periods', ExtraFilter: filter, OrderBy: 'StartDate DESC', Fields: PERIOD_FIELDS, ResultType: 'simple' },
    ]);
    const profileRows = ResultsOrThrow(profiles as RunViewResult<MemberProfileRow>, 'the member profile');
    const periodRows = ResultsOrThrow(periods as RunViewResult<MembershipPeriodRow>, 'membership periods');
    return { Profile: profileRows[0] ?? null, Periods: periodRows };
}

/** The period that best describes "now": an open one if there is one, otherwise the most recent. */
export function CurrentPeriod(periods: readonly MembershipPeriodRow[]): MembershipPeriodRow | null {
    const open = periods.find((p) => p.Status === 'Active' || p.Status === 'PendingRenewal');
    return open ?? periods[0] ?? null;
}

/** Whole days from today to the given date; negative when the date has passed. */
export function DaysUntil(date: string | null | undefined): number | null {
    if (!date) return null;
    const target = new Date(date).getTime();
    if (Number.isNaN(target)) return null;
    return Math.round((target - Date.now()) / 86_400_000);
}
