import { RunView, type IMetadataProvider, type RunViewResult } from '@memberjunction/core';

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
    topDriver: string | null;
    drivers: PredictionDriver[];
    rawPayload: string | null;
}

export interface PersonMembership {
    Profile: MemberProfileRow | null;
    Prediction: PersonPredictionInfo | null;
    History: PredictionHistoryItem[];
}

const PROFILE_FIELDS = ['ID', 'MemberNumber', 'Segment', 'Region', 'CountryName', 'City', 'State', 'JoinDate', 'OrganizationID', 'Organization'];

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
 * Format raw prediction values into a decorated {@link PersonPredictionInfo}.
 * Standardized on **Renewal Probability** (higher value = better / more likely to renew).
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

    let norm = score ?? 0;
    if (norm > 1) {
        norm = norm / 100;
    }
    const pct = Math.round(Math.max(0, Math.min(1, norm)) * 100);

    // Renewal probability: higher value is better (≥60% = High / green; 40-59% = Medium / amber; <40% = Low / red)
    let pillClass: 'risk-low' | 'risk-med' | 'risk-high';
    let riskText: string;

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

    const topDriver = formattedDrivers.length > 0 ? formattedDrivers[0].name : null;
    const scoredPhrase = scoredAt ? ` · Scored ${scoredAt}` : '';
    const scoreLabel = options?.scoreLabel || 'Renewal Probability';
    const tooltip = `Predicted by ${name} · ${pct}% ${scoreLabel}${scoredPhrase}.`;

    return {
        Score: score,
        Class: predictedClass,
        DisplayValue: predictedClass || `${pct}%`,
        RiskText: riskText,
        PillClass: pillClass,
        BadgeColor: options?.badgeColor,
        Icon: options?.icon,
        ScoreLabel: options?.scoreLabel,
        StatusLabel: options?.statusLabel,
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
 * Automatically resolves renewal probability whether the raw score represents P(Lapse) or P(Renewed).
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

        let parsedDrivers: Array<{ name: string; importance: number }> | null = null;
        if (Array.isArray(output['drivers'])) {
            parsedDrivers = output['drivers']
                .map((d: unknown) => {
                    if (!d || typeof d !== 'object') return null;
                    const rec = d as Record<string, unknown>;
                    const n = typeof rec['feature'] === 'string' ? rec['feature'] : '';
                    const v = typeof rec['value'] === 'number' ? Math.abs(rec['value']) : 0;
                    return n ? { name: n, importance: v } : null;
                })
                .filter((d): d is { name: string; importance: number } => d != null && d.importance > 0);
        }

        // Determine effective renewal probability (0–1)
        let renewalProb = scoreVal;
        if (scoreVal != null) {
            let norm = scoreVal > 1 ? scoreVal / 100 : scoreVal;
            norm = Math.max(0, Math.min(1, norm));

            const cls = (classVal || '').toLowerCase();
            const isLapseTarget = targetVal.toLowerCase().includes('risk') || targetVal.toLowerCase().includes('lapse') || targetVal.toLowerCase().includes('churn');

            let scoreIsLapseRisk = false;
            if (cls === 'renewed' || cls === 'active') {
                // A renewed member with small score (< 0.5) means score represents P(Lapse)
                scoreIsLapseRisk = norm < 0.5;
            } else if (cls === 'lapsed' || cls === 'cancelled' || cls === 'churn') {
                // A lapsed member with large score (> 0.5) means score represents P(Lapse)
                scoreIsLapseRisk = norm > 0.5;
            } else {
                scoreIsLapseRisk = isLapseTarget;
            }

            renewalProb = scoreIsLapseRisk ? Math.max(0, Math.min(1, 1 - norm)) : norm;
        }

        const statusVal = typeof output['status'] === 'string' ? output['status'] : undefined;
        const badgeColorVal = typeof output['badgeColor'] === 'string' ? output['badgeColor'] : undefined;
        const iconVal = typeof output['icon'] === 'string' ? output['icon'] : undefined;
        const scoreLabelVal = typeof output['scoreLabel'] === 'string' ? output['scoreLabel'] : undefined;
        const statusLabelVal = typeof output['statusLabel'] === 'string' ? output['statusLabel'] : undefined;

        const info = FormatPredictionInfo(
            renewalProb,
            classVal,
            parsedDrivers,
            targetVal,
            scoredAtVal,
            statusVal ? {
                status: statusVal,
                badgeColor: badgeColorVal,
                icon: iconVal,
                scoreLabel: scoreLabelVal,
                statusLabel: statusLabelVal,
            } : undefined,
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
            topDriver: info.TopDriver,
            drivers: info.Drivers,
            rawPayload: prettyPayload,
        };
    } catch {
        return null;
    }
}

/**
 * Loads the More Cheese membership picture for one person:
 * the member profile and up to 10 recent Predictive Studio model prediction runs.
 */
export async function LoadMembershipForPerson(personID: string, provider?: IMetadataProvider): Promise<PersonMembership> {
    const profileFilter = `PersonID = '${Quote(personID)}'`;
    const detailFilter = `RecordID = '${Quote(personID)}'`;

    const rv = ViewOf(provider);
    const [profiles, runDetails] = await rv.RunViews([
        {
            EntityName: 'MoreCheese: Member Profiles',
            ExtraFilter: profileFilter,
            Fields: PROFILE_FIELDS,
            ResultType: 'simple',
        },
        {
            EntityName: 'MJ: Process Run Details',
            ExtraFilter: detailFilter,
            OrderBy: 'CompletedAt DESC',
            MaxRows: 10,
            Fields: ['ID', 'CompletedAt', 'ResultPayload'],
            ResultType: 'simple',
        },
    ]);

    const profileRows = ResultsOrThrow(profiles as RunViewResult<MemberProfileRow>, 'the member profile');
    const detailRows = (runDetails as RunViewResult<RunDetailRecord>).Results ?? [];

    const history: PredictionHistoryItem[] = [];
    for (const row of detailRows) {
        const item = ParseRunDetailItem(row);
        if (item) {
            history.push(item);
        }
    }

    let prediction: PersonPredictionInfo | null = null;
    if (history.length > 0) {
        const latest = history[0];
        prediction = {
            Score: latest.score,
            Class: latest.predictedClass,
            DisplayValue: latest.displayValue,
            RiskText: latest.riskText,
            PillClass: latest.pillClass,
            TopDriver: latest.topDriver,
            Drivers: latest.drivers,
            Tooltip: `Predicted by ${latest.modelName}${latest.completedAt ? ` · Scored ${latest.completedAt}` : ''}.`,
            ScoredAt: latest.completedAt,
            ModelName: latest.modelName,
        };
    } else {
        prediction = FormatPredictionInfo(null, null, null);
    }

    return {
        Profile: profileRows[0] ?? null,
        Prediction: prediction,
        History: history,
    };
}
