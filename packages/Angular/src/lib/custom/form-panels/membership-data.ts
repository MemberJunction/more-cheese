import { Metadata, RunQuery, RunView, type IMetadataProvider, type IRunQueryProvider, type RunViewResult } from '@memberjunction/core';

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
    /** Latest Member Renewal Risk score materialized on the profile by the scoring Record Process (0-1). */
    RenewalProbability: number | null;
    /** Band label of that score (e.g. "High"). */
    RenewalStatus: string | null;
    /** When the profile was last scored. */
    RenewalScoredAt: string | null;
}

/** Predictive Studio feature attribution driver. */
export interface PredictionDriver {
    name: string;
    importance: number;
    relativePct: number;
}

/** Predictive Studio prediction details resolved for a person. */
export interface PersonPredictionInfo {
    Score: number | null;
    Class: string | null;
    DisplayValue: string;
    RiskText: string;
    PillClass: 'risk-low' | 'risk-med' | 'risk-high' | 'ended';
    BadgeColor?: string;
    Icon?: string;
    ScoreLabel?: string;
    StatusLabel?: string;
    ProblemType?: 'classification' | 'regression';
    TopDriver: string | null;
    Drivers: PredictionDriver[];
    Tooltip: string;
    ScoredAt: string | null;
    ModelName: string;
}

/** Historical scoring run record for a person. */
export interface PredictionHistoryItem {
    id: string;
    completedAt: string | null;
    formattedDate: string;
    score: number | null;
    predictedClass: string | null;
    displayValue: string;
    riskText: string;
    pillClass: 'risk-low' | 'risk-med' | 'risk-high' | 'ended';
    badgeColor?: string;
    icon?: string;
    modelName: string;
    scoreLabel?: string;
    statusLabel?: string;
    problemType?: 'classification' | 'regression';
    target?: string;
    topDriver: string | null;
    drivers: PredictionDriver[];
    rawPayload: string | null;
}

/**
 * One row of the "Membership Status" stored query (Skip/Memberships/Roster). That query is the
 * single definition of Current / Lapsed / Never Purchased; the panel only displays it.
 */
export interface MembershipStatusRow {
    MembershipStatus: 'Current' | 'Lapsed' | 'Never Purchased';
    MembershipTier: string | null;
    MembershipExpiresOn: string | null;
    LastMembershipPurchaseDate: string | null;
    MembershipPurchaseCount: number;
}

/** Membership status as shown on the member page. */
export interface MembershipStatusInfo {
    Status: MembershipStatusRow['MembershipStatus'];
    PillClass: 'active' | 'risk-high' | 'ended';
    Detail: string;
    Tooltip: string;
}

/** Name of the stored query the panel reads membership status from (filtered with its optional PersonID parameter). */
export const MEMBERSHIP_STATUS_QUERY = 'Membership Status';

export interface PersonMembership {
    Profile: MemberProfileRow | null;
    /** From the "Membership Status" stored query; null when the query is missing or failed. */
    MembershipStatus: MembershipStatusInfo | null;
    Prediction: PersonPredictionInfo | null;
    RenewalPrediction?: PersonPredictionInfo | null;
    LtvPrediction?: PersonPredictionInfo | null;
    History: PredictionHistoryItem[];
}

const PROFILE_FIELDS = ['ID', 'MemberNumber', 'Segment', 'Region', 'CountryName', 'City', 'State', 'JoinDate', 'OrganizationID', 'Organization', 'RenewalProbability', 'RenewalStatus', 'RenewalScoredAt'];

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

/** A date-only value (stored as UTC midnight) as "Oct 7, 2027". */
function FormatDateOnly(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Turns a "Membership Status" query row into what the member page shows; null when there is no row. */
export function FormatMembershipStatus(row: MembershipStatusRow | null): MembershipStatusInfo | null {
    if (!row) return null;
    const count = row.MembershipPurchaseCount ?? 0;
    const purchases = `${count} membership purchase${count === 1 ? '' : 's'}`;
    const tier = row.MembershipTier ?? 'Membership';
    switch (row.MembershipStatus) {
        case 'Current':
            return {
                Status: 'Current',
                PillClass: 'active',
                Detail: `${tier} · expires ${FormatDateOnly(row.MembershipExpiresOn)}`,
                Tooltip: `Last membership purchase ${FormatDateOnly(row.LastMembershipPurchaseDate)} · ${purchases}`,
            };
        case 'Lapsed':
            return {
                Status: 'Lapsed',
                PillClass: 'risk-high',
                Detail: `${tier} · lapsed ${FormatDateOnly(row.MembershipExpiresOn)}`,
                Tooltip: `Last membership purchase ${FormatDateOnly(row.LastMembershipPurchaseDate)} · ${purchases}`,
            };
        default:
            return {
                Status: 'Never Purchased',
                PillClass: 'ended',
                Detail: 'No membership purchase on file',
                Tooltip: 'No qualifying annual membership purchase',
            };
    }
}

function IsRunQueryProvider(provider: IMetadataProvider): provider is IMetadataProvider & IRunQueryProvider {
    return typeof (provider as Partial<IRunQueryProvider>).RunQuery === 'function';
}

/**
 * Runs the "Membership Status" stored query for one person. Never throws: a missing query or a failed
 * run returns null so the rest of the panel still renders.
 */
async function LoadMembershipStatus(personID: string, provider?: IMetadataProvider): Promise<MembershipStatusInfo | null> {
    try {
        const rq = provider && IsRunQueryProvider(provider) ? new RunQuery(provider) : new RunQuery();
        const result = await rq.RunQuery({ QueryName: MEMBERSHIP_STATUS_QUERY, Parameters: { PersonID: personID } });
        if (!result.Success) {
            console.warn(`More Cheese: "${MEMBERSHIP_STATUS_QUERY}" query failed for person ${personID}: ${result.ErrorMessage}`);
            return null;
        }
        const rows = (result.Results ?? []) as MembershipStatusRow[];
        return FormatMembershipStatus(rows[0] ?? null);
    } catch (e) {
        console.warn(`More Cheese: could not run "${MEMBERSHIP_STATUS_QUERY}" for person ${personID}`, e);
        return null;
    }
}

/**
 * Format a timestamp into a human-readable date/time string.
 */
export function FormatHistoryDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateStr;
    }
}

/**
 * Formats a continuous numeric prediction value for display.
 * If the label or model suggests a financial or lifetime value metric,
 * formats with a dollar sign and integer commas.
 */
export function FormatRegressionValue(value: number, scoreLabel?: string, modelName?: string): string {
    const combined = `${scoreLabel || ''} ${modelName || ''}`.toLowerCase();
    const isCurrency = combined.includes('ltv') ||
        combined.includes('spend') ||
        combined.includes('revenue') ||
        combined.includes('amount') ||
        combined.includes('cost') ||
        combined.includes('price') ||
        combined.includes('$');
    if (isCurrency) {
        return '$' + Math.round(value).toLocaleString('en-US');
    }
    return Number.isInteger(value)
        ? value.toLocaleString('en-US')
        : value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

/**
 * Format raw prediction values into a decorated {@link PersonPredictionInfo}.
 * Standardized on **Renewal Probability** for classification, or continuous formatted values for regression.
 */
export function FormatPredictionInfo(
    score: number | null,
    predictedClass: string | null,
    drivers: Array<{ name: string; importance: number }> | null,
    modelName?: string,
    scoredAt?: string | null,
    options?: {
        status?: string;
        badgeColor?: string;
        icon?: string;
        scoreLabel?: string;
        statusLabel?: string;
        problemType?: 'classification' | 'regression';
    },
): PersonPredictionInfo {
    const name = modelName || 'Predictive Studio Model';

    let formattedDrivers: PredictionDriver[] = [];
    if (drivers && drivers.length > 0) {
        const maxImp = Math.max(...drivers.map(d => d.importance), 0.0001);
        formattedDrivers = drivers.map(d => ({
            name: d.name,
            importance: d.importance,
            relativePct: Math.max(5, Math.round((d.importance / maxImp) * 100)),
        }));
    }

    if (score == null && !predictedClass) {
        return {
            Score: null,
            Class: null,
            DisplayValue: '—',
            RiskText: 'Not Scored',
            PillClass: 'ended',
            TopDriver: null,
            Drivers: formattedDrivers,
            Tooltip: 'Predictive Studio model scoring has not been executed for this member yet.',
            ScoredAt: null,
            ModelName: name,
        };
    }

    const isRegression = options?.problemType === 'regression';
    const topDriver = formattedDrivers.length > 0 ? formattedDrivers[0].name : null;
    const scoredPhrase = scoredAt ? ` · Scored ${scoredAt}` : '';

    let pillClass: 'risk-low' | 'risk-med' | 'risk-high' | 'ended';
    let riskText: string;
    let displayVal: string;
    let tooltip: string;

    if (isRegression) {
        const formattedVal = FormatRegressionValue(score ?? 0, options?.scoreLabel, name);
        displayVal = formattedVal;
        if (options?.badgeColor) {
            pillClass = options.badgeColor === 'green' ? 'risk-low' : options.badgeColor === 'amber' ? 'risk-med' : options.badgeColor === 'red' ? 'risk-high' : 'ended';
        } else {
            pillClass = 'risk-low';
        }

        if (options?.status) {
            riskText = `${options.status} (${formattedVal})`;
        } else {
            riskText = formattedVal;
        }

        const scoreLabel = options?.scoreLabel || 'Predicted Value';
        tooltip = `Predicted by ${name} · ${scoreLabel}: ${formattedVal}${scoredPhrase}.`;
    } else {
        let norm = score ?? 0;
        if (norm > 1) {
            norm = norm / 100;
        }
        const pct = Math.round(Math.max(0, Math.min(1, norm)) * 100);
        displayVal = predictedClass || `${pct}%`;

        // Renewal probability: higher value is better (≥60% = High / green; 40-59% = Medium / amber; <40% = Low / red)
        if (options?.status) {
            riskText = `${options.status} (${pct}%)`;
            pillClass = options.badgeColor === 'green' ? 'risk-low' : options.badgeColor === 'amber' ? 'risk-med' : 'risk-high';
        } else if (pct >= 60) {
            pillClass = 'risk-low';
            riskText = `High (${pct}%)`;
        } else if (pct >= 40) {
            pillClass = 'risk-med';
            riskText = `Medium (${pct}%)`;
        } else {
            pillClass = 'risk-high';
            riskText = `Low (${pct}%)`;
        }

        const scoreLabel = options?.scoreLabel || 'Renewal Probability';
        tooltip = `Predicted by ${name} · ${pct}% ${scoreLabel}${scoredPhrase}.`;
    }

    return {
        Score: score,
        Class: predictedClass,
        DisplayValue: displayVal,
        RiskText: riskText,
        PillClass: pillClass,
        BadgeColor: options?.badgeColor,
        Icon: options?.icon,
        ScoreLabel: options?.scoreLabel,
        StatusLabel: options?.statusLabel,
        ProblemType: options?.problemType || (isRegression ? 'regression' : 'classification'),
        TopDriver: topDriver,
        Drivers: formattedDrivers,
        Tooltip: tooltip,
        ScoredAt: scoredAt || null,
        ModelName: name,
    };
}

/** One `MJ: Process Run Details` record for reading recent prediction runs. */
interface RunDetailRecord {
    ID: string;
    CompletedAt: string | null;
    ResultPayload: string | null;
}

/**
 * Parses one `RunDetailRecord` into a structured {@link PredictionHistoryItem}.
 * Automatically resolves renewal probability for classification, and preserves continuous values for regression.
 */
export function ParseRunDetailItem(row: RunDetailRecord): PredictionHistoryItem | null {
    if (!row.ResultPayload) return null;
    try {
        const raw = JSON.parse(row.ResultPayload) as Record<string, unknown>;
        const output = (raw['output'] && typeof raw['output'] === 'object' ? raw['output'] : raw) as Record<string, unknown>;
        const scoreVal = typeof output['score'] === 'number' ? output['score'] : (typeof output['value'] === 'number' ? output['value'] : null);
        const classVal = typeof output['class'] === 'string' ? output['class'] : null;
        const targetVal = typeof output['target'] === 'string' ? output['target'] : 'Renewal Risk';
        const scoredAtVal = typeof output['scoredAt'] === 'string' ? output['scoredAt'] : (row.CompletedAt || null);

        const problemTypeRaw = typeof output['problemType'] === 'string' ? output['problemType'].toLowerCase() : '';
        const isRegression = problemTypeRaw === 'regression' ||
            targetVal.toLowerCase().includes('ltv') ||
            (scoreVal != null && scoreVal > 100 && problemTypeRaw !== 'classification');
        const problemType: 'classification' | 'regression' = isRegression ? 'regression' : 'classification';

        let parsedDrivers: Array<{ name: string; importance: number }> | null = null;
        if (Array.isArray(output['drivers'])) {
            parsedDrivers = output['drivers']
                .map((d: unknown) => {
                    if (!d || typeof d !== 'object') return null;
                    const rec = d as Record<string, unknown>;
                    const n = typeof rec['feature'] === 'string' && rec['feature'].length > 0
                        ? rec['feature']
                        : (typeof rec['label'] === 'string' ? rec['label'] : '');
                    const v = typeof rec['value'] === 'number'
                        ? Math.abs(rec['value'])
                        : (typeof rec['importance'] === 'number' ? Math.abs(rec['importance']) : 0);
                    return n ? { name: n, importance: v } : null;
                })
                .filter((d): d is { name: string; importance: number } => d != null && d.importance > 0);
        }

        let effectiveScore = scoreVal;
        if (!isRegression && scoreVal != null) {
            let norm = scoreVal > 1 ? scoreVal / 100 : scoreVal;
            norm = Math.max(0, Math.min(1, norm));

            const cls = (classVal || '').toLowerCase();
            const isLapseTarget = targetVal.toLowerCase().includes('risk') || targetVal.toLowerCase().includes('lapse') || targetVal.toLowerCase().includes('churn');

            let scoreIsLapseRisk = false;
            if (cls === 'renewed' || cls === 'active') {
                scoreIsLapseRisk = norm < 0.5;
            } else if (cls === 'lapsed' || cls === 'cancelled' || cls === 'churn') {
                scoreIsLapseRisk = norm > 0.5;
            } else {
                scoreIsLapseRisk = isLapseTarget;
            }

            effectiveScore = scoreIsLapseRisk ? Math.max(0, Math.min(1, 1 - norm)) : norm;
        }

        const statusVal = typeof output['status'] === 'string' ? output['status'] : undefined;
        const badgeColorVal = typeof output['badgeColor'] === 'string' ? output['badgeColor'] : undefined;
        const iconVal = typeof output['icon'] === 'string' ? output['icon'] : undefined;
        const scoreLabelVal = typeof output['scoreLabel'] === 'string'
            ? output['scoreLabel']
            : (isRegression ? 'Predicted Customer LTV' : 'Renewal Probability');
        const statusLabelVal = typeof output['statusLabel'] === 'string' ? output['statusLabel'] : undefined;
        const modelNameDisplay = typeof output['modelName'] === 'string' && output['modelName'].length > 0
            ? output['modelName']
            : (typeof output['scoreLabel'] === 'string' ? output['scoreLabel'] : (targetVal || scoreLabelVal));

        const info = FormatPredictionInfo(
            effectiveScore,
            classVal,
            parsedDrivers,
            modelNameDisplay,
            scoredAtVal,
            {
                status: statusVal,
                badgeColor: badgeColorVal,
                icon: iconVal,
                scoreLabel: scoreLabelVal,
                statusLabel: statusLabelVal,
                problemType: problemType,
            },
        );
        let prettyPayload: string | null = null;
        try {
            prettyPayload = JSON.stringify(raw, null, 2);
        } catch {
            prettyPayload = row.ResultPayload;
        }

        return {
            id: row.ID,
            completedAt: row.CompletedAt,
            formattedDate: FormatHistoryDate(scoredAtVal || row.CompletedAt),
            score: info.Score,
            predictedClass: info.Class,
            displayValue: info.DisplayValue,
            riskText: info.RiskText,
            pillClass: info.PillClass,
            badgeColor: info.BadgeColor,
            icon: info.Icon,
            modelName: info.ModelName,
            scoreLabel: scoreLabelVal,
            statusLabel: statusLabelVal,
            problemType: problemType,
            target: targetVal,
            topDriver: info.TopDriver,
            drivers: info.Drivers,
            rawPayload: prettyPayload,
        };
    } catch {
        return null;
    }
}

/** `WorkType` of the `MJ: Record Processes` row that Predictive Studio scoring runs under. */
export const PREDICTION_WORK_TYPE = 'ML Model';

/** How many recent prediction rows the member page reads. */
export const PREDICTION_HISTORY_ROWS = 10;

/**
 * `[Schema].[BaseView]` for an entity, read from entity metadata so an ExtraFilter subquery still
 * resolves when the core or an app schema has a non-default name. Throws, naming the entity, when the
 * metadata does not have it.
 */
export function EntityViewRef(entityName: string, provider?: IMetadataProvider): string {
    const entity = (provider ?? new Metadata()).EntityByName(entityName);
    if (!entity?.SchemaName || !entity?.BaseView) {
        throw new Error(`Entity "${entityName}" is not in the metadata, so its view cannot be named.`);
    }
    return `[${entity.SchemaName}].[${entity.BaseView}]`;
}

/**
 * The part of a `MJ: Process Run Details` filter that keeps only Predictive Studio prediction rows
 * (see {@link PredictionDetailFilter}). Shared with the Staff section contributor, which reads the
 * same rows for every staff member at once.
 */
export function PredictionRowsFilter(provider?: IMetadataProvider): string {
    return 'ResultPayload IS NOT NULL'
        + ` AND ProcessRunID IN (SELECT pr.ID FROM ${EntityViewRef('MJ: Process Runs', provider)} pr`
        + ` INNER JOIN ${EntityViewRef('MJ: Record Processes', provider)} rp ON rp.ID = pr.RecordProcessID`
        + ` WHERE rp.WorkType = '${PREDICTION_WORK_TYPE}')`;
}

export function PredictionDetailFilter(recordIDs: string[], provider?: IMetadataProvider): string {
    const ids = recordIDs.map((id) => `'${Quote(id)}'`).join(', ');
    return `RecordID IN (${ids}) AND ${PredictionRowsFilter(provider)}`;
}

/**
 * The renewal card for someone with no membership: there is nothing to renew, so it says
 * "Not a member" rather than "Not Scored" (which would suggest a score is merely missing).
 */
export function NotAMemberRenewalInfo(): PersonPredictionInfo {
    return {
        Score: null,
        Class: null,
        DisplayValue: '—',
        RiskText: 'Not a member',
        PillClass: 'ended',
        TopDriver: null,
        Drivers: [],
        Tooltip: 'No membership purchase on file, so there is no membership to renew.',
        ScoredAt: null,
        ModelName: 'Predictive Studio Model',
    };
}

/**
 * Loads the More Cheese membership picture for one person: the member profile, the membership
 * status, and up to {@link PREDICTION_HISTORY_ROWS} recent Predictive Studio prediction rows.
 */
export async function LoadMembershipForPerson(personID: string, provider?: IMetadataProvider): Promise<PersonMembership> {
    const rv = ViewOf(provider);
    const statusPromise = LoadMembershipStatus(personID, provider);
    const profiles = await rv.RunView<MemberProfileRow>({
        EntityName: 'MoreCheese: Member Profiles',
        ExtraFilter: `PersonID = '${Quote(personID)}'`,
        Fields: PROFILE_FIELDS,
        ResultType: 'simple',
    });
    const profileRows = ResultsOrThrow(profiles, 'the member profile');

    // Predictions are recorded against whichever record the scoring process ran over: the Person
    // (older person-scoped models) or the Member Profile (Member Renewal Risk scores profiles).
    const runDetails = await rv.RunView<RunDetailRecord>({
        EntityName: 'MJ: Process Run Details',
        ExtraFilter: PredictionDetailFilter([personID, ...profileRows.map((p) => p.ID)], provider),
        OrderBy: 'CompletedAt DESC',
        MaxRows: PREDICTION_HISTORY_ROWS,
        Fields: ['ID', 'CompletedAt', 'ResultPayload'],
        ResultType: 'simple',
    });
    const detailRows = runDetails.Results ?? [];

    const history: PredictionHistoryItem[] = [];
    for (const row of detailRows) {
        const item = ParseRunDetailItem(row);
        if (item) {
            history.push(item);
        }
    }

    const toPredictionInfo = (item: PredictionHistoryItem): PersonPredictionInfo => ({
        Score: item.score,
        Class: item.predictedClass,
        DisplayValue: item.displayValue,
        RiskText: item.riskText,
        PillClass: item.pillClass,
        BadgeColor: item.badgeColor,
        Icon: item.icon,
        ScoreLabel: item.scoreLabel,
        StatusLabel: item.statusLabel,
        ProblemType: item.problemType,
        TopDriver: item.topDriver,
        Drivers: item.drivers,
        Tooltip: `Predicted by ${item.modelName}${item.completedAt ? ` · Scored ${FormatHistoryDate(item.completedAt)}` : ''}.`,
        ScoredAt: item.completedAt,
        ModelName: item.modelName,
    });

    const renewalItem = history.find(h =>
        h.problemType === 'classification' ||
        h.target?.toLowerCase().includes('renewal') ||
        h.target?.toLowerCase().includes('risk') ||
        h.modelName.toLowerCase().includes('renewal')
    );

    const ltvItem = history.find(h =>
        h.problemType === 'regression' ||
        h.target?.toLowerCase().includes('ltv') ||
        h.modelName.toLowerCase().includes('ltv') ||
        h.scoreLabel?.toLowerCase().includes('ltv')
    );

    const membershipStatus = await statusPromise;
    // Someone who never bought a membership has nothing to renew. Lapsed members can still renew,
    // and an unknown status (query missing or failed) keeps the prediction as before.
    const isNonMember = membershipStatus?.Status === 'Never Purchased';
    const renewalPrediction = isNonMember
        ? NotAMemberRenewalInfo()
        : (renewalItem ? toPredictionInfo(renewalItem) : FormatPredictionInfo(null, null, null));
    const ltvPrediction = ltvItem ? toPredictionInfo(ltvItem) : null;
    const defaultPrediction = renewalItem || isNonMember
        ? renewalPrediction
        : (history[0] ? toPredictionInfo(history[0]) : FormatPredictionInfo(null, null, null));

    return {
        Profile: profileRows[0] ?? null,
        MembershipStatus: membershipStatus,
        Prediction: defaultPrediction,
        RenewalPrediction: renewalPrediction,
        LtvPrediction: ltvPrediction,
        History: history,
    };
}
