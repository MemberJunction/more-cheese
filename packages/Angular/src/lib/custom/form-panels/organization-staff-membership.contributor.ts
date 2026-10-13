import { RunQuery, RunView, type IMetadataProvider, type IRunQueryProvider } from '@memberjunction/core';
import { RegisterClass } from '@memberjunction/global';
import {
    OrganizationStaffContributor,
    type OrganizationStaffMember,
    type OrganizationStaffRequest,
    type StaffCell,
    type StaffContribution,
    type StaffFigure,
} from '@mj-biz-apps/common-ng';
import { MEMBERSHIP_STATUS_QUERY, ParseRunDetailItem, PREDICTION_ROWS_FILTER, type MembershipStatusRow } from './membership-data';

/** One "Membership Status" query row, with the person it belongs to. */
export interface StaffMembershipRow extends MembershipStatusRow {
    PersonID: string;
}

/** The raw rows the More Cheese staff figures are built from. */
export interface StaffMembershipData {
    Memberships: StaffMembershipRow[];
    Certifications: { PersonID: string; Status: string }[];
    Competition: { Result: string | null }[];
    /** Valid conference attendances (Attended registration on a Confirmed, unrefunded order). */
    Attendances: { PersonID: string }[];
    /** Latest renewal probability per person (0–1), from the Member Renewal Risk model's runs. */
    RenewalScores: Map<string, number>;
}

const STATUS_TONE: Record<MembershipStatusRow['MembershipStatus'], StaffCell['Tone']> = {
    'Current': 'success',
    'Lapsed': 'error',
    'Never Purchased': 'muted',
};

function CountBy<T>(rows: T[], key: (row: T) => string): Map<string, number> {
    const counts = new Map<string, number>();
    for (const row of rows) {
        const k = key(row).toUpperCase();
        counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
}

/** Headline figures: current members, certifications held, competition entries, conference attendance, renewal outlook. */
function BuildFigures(staff: OrganizationStaffMember[], data: StaffMembershipData): StaffFigure[] {
    const current = data.Memberships.filter(m => m.MembershipStatus === 'Current').length;
    const lapsed = data.Memberships.filter(m => m.MembershipStatus === 'Lapsed').length;
    const held = data.Certifications.filter(c => c.Status === 'Awarded').length;
    const expired = data.Certifications.filter(c => c.Status === 'Expired').length;
    const medals = data.Competition.filter(c => c.Result != null && c.Result !== 'None').length;
    const scores = [...data.RenewalScores.values()];
    const avg = scores.length > 0 ? Math.round(100 * scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    return [
        { Label: 'Current members', Value: current, Icon: 'fa-solid fa-cheese', Detail: `of ${staff.length} staff · ${lapsed} lapsed`, Tone: lapsed > current ? 'warn' : 'none' },
        { Label: 'Certifications held', Value: held, Icon: 'fa-solid fa-certificate', Detail: expired > 0 ? `${expired} expired` : undefined },
        { Label: 'Competition entries', Value: data.Competition.length, Icon: 'fa-solid fa-trophy', Detail: `${medals} medal${medals === 1 ? '' : 's'}` },
        { Label: 'Conference attendances', Value: data.Attendances.length, Icon: 'fa-solid fa-ticket' },
        { Label: 'Avg AI renewal probability', Value: avg == null ? null : `${avg}%`, Icon: 'fa-solid fa-wand-magic-sparkles', Detail: `${scores.length} of ${staff.length} staff scored` },
    ];
}

/** Per-person cells: membership status, AI renewal probability, certifications held. */
function BuildCells(staff: OrganizationStaffMember[], data: StaffMembershipData): Map<string, Record<string, StaffCell>> {
    const statusByPerson = new Map(data.Memberships.map(m => [m.PersonID.toUpperCase(), m]));
    const certs = CountBy(data.Certifications.filter(c => c.Status === 'Awarded'), c => c.PersonID);
    const cells = new Map<string, Record<string, StaffCell>>();
    for (const member of staff) {
        const key = member.PersonID.toUpperCase();
        const status = statusByPerson.get(key);
        const score = data.RenewalScores.get(key);
        cells.set(key, {
            membership: status
                ? { Text: status.MembershipStatus, Tone: STATUS_TONE[status.MembershipStatus], Title: status.MembershipTier ?? undefined }
                : { Text: 'Not a member', Tone: 'muted' },
            renewal: score == null
                ? { Text: 'Not scored', Tone: 'muted' }
                : { Text: `${Math.round(score * 100)}%`, Tone: score >= 0.6 ? 'success' : score >= 0.4 ? 'warn' : 'error' },
            certs: { Text: String(certs.get(key) ?? 0), Tone: certs.has(key) ? undefined : 'muted' },
        });
    }
    return cells;
}

/** More Cheese's contribution to the Staff section, from already-loaded rows (pure; unit-tested). */
export function BuildStaffMembershipContribution(staff: OrganizationStaffMember[], data: StaffMembershipData): StaffContribution {
    return {
        Figures: BuildFigures(staff, data),
        Columns: [
            { Key: 'membership', Header: 'Membership' },
            { Key: 'renewal', Header: 'AI renewal' },
            { Key: 'certs', Header: 'Certs' },
        ],
        Cells: BuildCells(staff, data),
    };
}

/**
 * Latest classification (renewal) score per person from Predictive Studio run details, newest first.
 * `personOf` maps each scored record's upper-cased ID (a Person or one of its Member Profiles) to its
 * upper-cased PersonID; without it, each row is keyed by its own RecordID.
 */
export function LatestRenewalScores(rows: { ID: string; RecordID: string; CompletedAt: string | null; ResultPayload: string | null }[], personOf?: Map<string, string>): Map<string, number> {
    const scores = new Map<string, number>();
    for (const row of rows) {
        const recordKey = row.RecordID.toUpperCase();
        const key = personOf?.get(recordKey) ?? recordKey;
        if (scores.has(key)) continue;
        const item = ParseRunDetailItem(row);
        if (item?.problemType === 'classification' && item.score != null) {
            scores.set(key, item.score > 1 ? item.score / 100 : item.score);
        }
    }
    return scores;
}

const UUID_SHAPE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `'A','B'` for an ExtraFilter IN list; refuses anything that is not a UUID. */
export function QuotedIDs(ids: string[]): string {
    return ids.map(id => {
        if (!UUID_SHAPE.test(id)) throw new Error(`Not a UUID: ${id}`);
        return `'${id}'`;
    }).join(',');
}

function IsRunQueryProvider(provider: IMetadataProvider): provider is IMetadataProvider & IRunQueryProvider {
    return typeof (provider as Partial<IRunQueryProvider>).RunQuery === 'function';
}

/** Valid registrations only: Confirmed order, not a refund, not refunded (same rule as "Member Event Attendance"). */
const VALID_ATTENDANCE = `AttendanceStatus = 'Attended' AND OrderHeaderID IN (SELECT oh.ID FROM [__mj_BizAppsOrders].[vwOrderHeaders] oh WHERE oh.Status = 'Confirmed' AND oh.ReversesOrderHeaderID IS NULL AND NOT EXISTS (SELECT 1 FROM [__mj_BizAppsOrders].[vwOrderHeaders] r WHERE r.ReversesOrderHeaderID = oh.ID AND r.Status = 'Confirmed')) AND ReversesOrderLineID IS NULL`;

/** Adds membership, certification, competition, attendance and AI renewal figures to Common's Staff section. */
@RegisterClass(OrganizationStaffContributor, 'more-cheese-membership')
export class MoreCheeseStaffContributor extends OrganizationStaffContributor {
    public readonly Key = 'more-cheese-membership';
    public readonly Label = 'Membership figures';
    public override readonly Priority = 100;

    public async Load(request: OrganizationStaffRequest): Promise<StaffContribution> {
        const ids = QuotedIDs(request.Staff.map(s => s.PersonID));
        const org = QuotedIDs([request.OrganizationID]);
        const provider = request.Provider;
        const rv = provider ? RunView.FromMetadataProvider(provider) : new RunView();
        const rq = provider && IsRunQueryProvider(provider) ? new RunQuery(provider) : new RunQuery();
        const [views, status] = await Promise.all([
            rv.RunViews([
                { EntityName: 'MoreCheese: Member Certifications', ExtraFilter: `PersonID IN (${ids})`, Fields: ['PersonID', 'Status'], ResultType: 'simple' },
                { EntityName: 'MoreCheese: Competition Entries', ExtraFilter: `OrganizationID = ${org}`, Fields: ['Result'], ResultType: 'simple' },
                { EntityName: 'MJ_BizApps_Orders: Event Order Lines', ExtraFilter: `PersonID IN (${ids}) AND ${VALID_ATTENDANCE}`, Fields: ['PersonID'], ResultType: 'simple' },
                { EntityName: 'MoreCheese: Member Profiles', ExtraFilter: `PersonID IN (${ids})`, Fields: ['ID', 'PersonID'], ResultType: 'simple' },
            ]),
            rq.RunQuery({ QueryName: MEMBERSHIP_STATUS_QUERY, Parameters: { OrganizationID: request.OrganizationID } }),
        ]);
        const failed = views.find(v => !v.Success);
        if (failed) throw new Error(failed.ErrorMessage || 'Could not read membership figures.');
        if (!status.Success) throw new Error(`"${MEMBERSHIP_STATUS_QUERY}" query failed: ${status.ErrorMessage}`);

        // Predictions are recorded against whichever record the model scored: the Person, or its
        // Member Profile (Member Renewal Risk scores profiles). Read both and credit each to the person.
        const profiles = views[3].Results as { ID: string; PersonID: string }[];
        const personOf = new Map<string, string>(request.Staff.map(s => [s.PersonID.toUpperCase(), s.PersonID.toUpperCase()]));
        for (const p of profiles) personOf.set(p.ID.toUpperCase(), p.PersonID.toUpperCase());
        const scored = QuotedIDs([...request.Staff.map(s => s.PersonID), ...profiles.map(p => p.ID)]);
        const details = await rv.RunView<{ ID: string; RecordID: string; CompletedAt: string | null; ResultPayload: string | null }>({
            EntityName: 'MJ: Process Run Details',
            ExtraFilter: `RecordID IN (${scored}) AND ${PREDICTION_ROWS_FILTER}`,
            OrderBy: 'CompletedAt DESC',
            Fields: ['ID', 'RecordID', 'CompletedAt', 'ResultPayload'],
            ResultType: 'simple',
        });
        if (!details.Success) throw new Error(details.ErrorMessage || 'Could not read renewal predictions.');

        return BuildStaffMembershipContribution(request.Staff, {
            Memberships: (status.Results ?? []) as StaffMembershipRow[],
            Certifications: views[0].Results as { PersonID: string; Status: string }[],
            Competition: views[1].Results as { Result: string | null }[],
            Attendances: views[2].Results as { PersonID: string }[],
            RenewalScores: LatestRenewalScores(details.Results ?? [], personOf),
        });
    }
}
