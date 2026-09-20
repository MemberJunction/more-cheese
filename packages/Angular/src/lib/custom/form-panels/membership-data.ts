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

/** Predictive Studio prediction details resolved for a person. */
export interface PersonPredictionInfo {
    Score: number | null;
    Class: string | null;
    DisplayValue: string;
    RiskText: string;
    PillClass: 'risk-low' | 'risk-med' | 'risk-high' | 'ended';
    TopDriver: string | null;
    Tooltip: string;
    ScoredAt: string | null;
    ModelName: string;
}

export interface PersonMembership {
    Profile: MemberProfileRow | null;
    Prediction: PersonPredictionInfo | null;
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
    if (score == null && !predictedClass) {
        return {
            Score: null,
            Class: null,
            DisplayValue: '—',
            RiskText: 'Not Scored',
            PillClass: 'ended',
            TopDriver: null,
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

    const topDriver = drivers && drivers.length > 0 ? drivers[0].name : null;
    const scoredPhrase = scoredAt ? ` · Scored ${scoredAt}` : '';
    const tooltip = `Predicted by ${name}${scoredPhrase}.`;

    return {
        Score: score,
        Class: predictedClass,
        DisplayValue: predictedClass || `${pct}%`,
        RiskText: riskText,
        PillClass: pillClass,
        TopDriver: topDriver,
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
 * Loads the More Cheese membership picture for one person:
 * the member profile and the latest Predictive Studio model prediction.
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
            MaxRows: 1,
            Fields: ['ID', 'CompletedAt', 'ResultPayload'],
            ResultType: 'simple',
        },
    ]);

    const profileRows = ResultsOrThrow(profiles as RunViewResult<MemberProfileRow>, 'the member profile');
    const detailRows = (runDetails as RunViewResult<RunDetailRecord>).Results ?? [];

    let prediction: PersonPredictionInfo | null = null;
    if (detailRows.length > 0 && detailRows[0].ResultPayload) {
        try {
            const raw = JSON.parse(detailRows[0].ResultPayload) as Record<string, unknown>;
            const output = (raw['output'] && typeof raw['output'] === 'object' ? raw['output'] : raw) as Record<string, unknown>;
            const scoreVal = typeof output['score'] === 'number' ? output['score'] : (typeof output['value'] === 'number' ? output['value'] : null);
            const classVal = typeof output['class'] === 'string' ? output['class'] : null;
            const targetVal = typeof output['target'] === 'string' ? output['target'] : 'Renewal Risk';
            const scoredAtVal = typeof output['scoredAt'] === 'string' ? output['scoredAt'] : (detailRows[0].CompletedAt || null);

            let drivers: Array<{ name: string; importance: number }> | null = null;
            if (Array.isArray(output['drivers'])) {
                drivers = output['drivers']
                    .map((d: unknown) => {
                        if (!d || typeof d !== 'object') return null;
                        const rec = d as Record<string, unknown>;
                        const n = typeof rec['feature'] === 'string' ? rec['feature'] : '';
                        const v = typeof rec['value'] === 'number' ? Math.abs(rec['value']) : 0;
                        return n ? { name: n, importance: v } : null;
                    })
                    .filter((d): d is { name: string; importance: number } => d != null && d.importance > 0);
            }

            prediction = FormatPredictionInfo(scoreVal, classVal, drivers, targetVal, scoredAtVal);
        } catch {
            prediction = FormatPredictionInfo(null, null, null);
        }
    } else {
        prediction = FormatPredictionInfo(null, null, null);
    }

    return {
        Profile: profileRows[0] ?? null,
        Prediction: prediction,
    };
}
