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

export interface PersonMembership {
    Profile: MemberProfileRow | null;
    Prediction: PersonPredictionInfo | null;
    RenewalPrediction?: PersonPredictionInfo | null;
    LtvPrediction?: PersonPredictionInfo | null;
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
            : (scoreLabelVal || targetVal);

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

    const renewalPrediction = renewalItem ? toPredictionInfo(renewalItem) : FormatPredictionInfo(null, null, null);
    const ltvPrediction = ltvItem ? toPredictionInfo(ltvItem) : null;
    const defaultPrediction = renewalPrediction || (history[0] ? toPredictionInfo(history[0]) : FormatPredictionInfo(null, null, null));

    return {
        Profile: profileRows[0] ?? null,
        Prediction: defaultPrediction,
        RenewalPrediction: renewalPrediction,
        LtvPrediction: ltvPrediction,
        History: history,
    };
}
