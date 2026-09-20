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
 */
export function FormatPredictionInfo(
    score: number | null,
    predictedClass: string | null,
    drivers: Array<{ name: string; importance: number }> | null,
    modelName?: string,
    scoredAt?: string | null,
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

    let pillClass: 'risk-low' | 'risk-med' | 'risk-high';
    let riskText: string;
    if (pct <= 25) {
        pillClass = 'risk-low';
        riskText = `Low (${pct}%)`;
    } else if (pct <= 60) {
        pillClass = 'risk-med';
        riskText = `Medium (${pct}%)`;
    } else {
        pillClass = 'risk-high';
        riskText = `High (${pct}%)`;
    }

    const topDriver = formattedDrivers.length > 0 ? formattedDrivers[0].name : null;
    const scoredPhrase = scoredAt ? ` · Scored ${scoredAt}` : '';
    const tooltip = `Predicted by ${name}${scoredPhrase}.`;

    return {
        Score: score,
        Class: predictedClass,
        DisplayValue: predictedClass || `${pct}%`,
        RiskText: riskText,
        PillClass: pillClass,
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

        const info = FormatPredictionInfo(scoreVal, classVal, parsedDrivers, targetVal, scoredAtVal);
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
