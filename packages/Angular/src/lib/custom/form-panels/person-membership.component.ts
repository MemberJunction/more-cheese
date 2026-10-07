import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { IMetadataProvider } from '@memberjunction/core';
import type { FormNavigationEvent } from '@memberjunction/ng-base-forms';
import {
    LoadMembershipForPerson,
    type PersonMembership,
    type PersonPredictionInfo,
    type PredictionDriver,
    type PredictionHistoryItem,
} from './membership-data';

/**
 * The More Cheese membership picture for one person: member profile KPIs,
 * real-time Predictive Studio AI Renewal Probability, top attribution drivers, and run history.
 * Rendered inside the People form by {@link PersonMembershipPanel}.
 */
@Component({
    selector: 'mc-person-membership',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="mc-mem">
            @if (Loading) {
                <div class="mc-muted">Loading membership…</div>
            } @else if (ErrorMessage) {
                <div class="mc-error">{{ ErrorMessage }}</div>
            } @else if (!HasMembership) {
                <div class="mc-muted">No More Cheese member profile on file.</div>
            } @else {
                <div class="mc-kpis">
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ Data?.Profile?.MemberNumber || '—' }}</div>
                        <div class="mc-kpi-label">Member number</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ Data?.Profile?.JoinDate ? (Data?.Profile?.JoinDate | date: 'mediumDate') : '—' }}</div>
                        <div class="mc-kpi-label">Member since</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ Data?.Profile?.Organization || 'Individual' }}</div>
                        <div class="mc-kpi-label">Organization</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ SegmentLine }}</div>
                        <div class="mc-kpi-label">{{ LocationLine }}</div>
                    </div>
                    <div class="mc-kpi mc-kpi-ai" [title]="RenewalPrediction?.Tooltip || 'No prediction on file'">
                        <div class="mc-kpi-val">
                            <span [class]="'mc-pill ' + (RenewalPrediction?.PillClass || 'ended')">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> {{ RenewalPrediction?.RiskText || 'Not Scored' }}
                            </span>
                        </div>
                        <div class="mc-kpi-label">AI Renewal Probability</div>
                        @if (RenewalPrediction?.TopDriver) {
                            <div class="mc-kpi-sub" [title]="RenewalPrediction?.TopDriver">{{ RenewalPrediction?.TopDriver }}</div>
                        }
                    </div>
                    @if (LtvPrediction) {
                        <div class="mc-kpi mc-kpi-ai mc-kpi-ltv" [title]="LtvPrediction.Tooltip || 'Predicted Customer Lifetime Value'">
                            <div class="mc-kpi-val">
                                <span [class]="'mc-pill ' + (LtvPrediction.PillClass || 'ended')">
                                    <i [class]="'fa-solid ' + (LtvPrediction.Icon || 'fa-arrow-trend-up')"></i> {{ LtvPrediction.RiskText || 'Not Scored' }}
                                </span>
                            </div>
                            <div class="mc-kpi-label">Predicted Customer LTV</div>
                            @if (LtvPrediction.TopDriver) {
                                <div class="mc-kpi-sub" [title]="LtvPrediction.TopDriver">{{ LtvPrediction.TopDriver }}</div>
                            }
                        </div>
                    }
                </div>

                <div class="mc-profile-summary">
                    <div class="mc-summary-header">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>Member Intelligence & Predictive Scoring</span>
                    </div>
                    <div class="mc-summary-body">
                        Scored across upstream activity, order frequency, course completion, and engagement data via
                        <strong>Predictive Studio</strong>. Detailed model attribution and historical prediction runs are available below.
                    </div>
                </div>

                @if (Drivers.length > 0 || History.length > 0) {
                    <div class="mc-insights-panel">
                        <button type="button" class="mc-insights-toggle" (click)="ToggleExpanded()">
                            <div class="mc-insights-title">
                                <i class="fa-solid fa-brain"></i>
                                <span>Attribution Drivers & Prediction History</span>
                                @if (Drivers.length > 0) {
                                    <span class="mc-badge">{{ Drivers.length }} Drivers</span>
                                }
                                @if (History.length > 0) {
                                    <span class="mc-badge mc-badge-muted">{{ History.length }} {{ History.length === 1 ? 'Run' : 'Runs' }}</span>
                                }
                            </div>
                            <i class="fa-solid" [class.fa-chevron-up]="Expanded" [class.fa-chevron-down]="!Expanded"></i>
                        </button>

                        @if (Expanded) {
                            <div class="mc-insights-content">
                                @if (Drivers.length > 0) {
                                    <div class="mc-drivers-section">
                                        <div class="mc-section-heading">Top Model Feature Attribution</div>
                                        <div class="mc-driver-list">
                                            @for (driver of Drivers; track driver.name) {
                                                <div class="mc-driver-row">
                                                    <div class="mc-driver-info">
                                                        <span class="mc-driver-name">{{ driver.name }}</span>
                                                        <span class="mc-driver-pct">{{ (driver.importance * 100).toFixed(1) }}%</span>
                                                    </div>
                                                    <div class="mc-driver-bar-track">
                                                        <div class="mc-driver-bar-fill" [style.width.%]="driver.relativePct"></div>
                                                    </div>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }

                                @if (History.length > 0) {
                                    <div class="mc-history-section">
                                        <div class="mc-section-heading">Prediction Run History</div>
                                        <div class="mc-history-list">
                                            @for (item of History; track item.id) {
                                                <div class="mc-history-item">
                                                    <div class="mc-history-header">
                                                        <div class="mc-history-meta">
                                                            <span [class]="'mc-pill ' + item.pillClass">
                                                                <i [class]="'fa-solid ' + (item.icon || (item.problemType === 'regression' ? 'fa-arrow-trend-up' : 'fa-wand-magic-sparkles'))"></i> {{ item.riskText }}
                                                            </span>
                                                            <span class="mc-history-model">{{ item.scoreLabel || item.modelName }}</span>
                                                        </div>
                                                        <span class="mc-history-date">{{ item.formattedDate }}</span>
                                                    </div>
                                                    @if (item.topDriver) {
                                                        <div class="mc-history-driver">
                                                            Primary factor: <strong>{{ item.topDriver }}</strong>
                                                        </div>
                                                    }
                                                    @if (item.rawPayload) {
                                                        <div class="mc-history-raw-toggle">
                                                            <button type="button" class="mc-raw-btn" (click)="TogglePayload(item.id)">
                                                                <i class="fa-solid fa-code"></i> {{ IsPayloadOpen(item.id) ? 'Hide Raw Payload' : 'View Raw Payload' }}
                                                            </button>
                                                        </div>
                                                        @if (IsPayloadOpen(item.id)) {
                                                            <pre class="mc-raw-json">{{ item.rawPayload }}</pre>
                                                        }
                                                    }
                                                </div>
                                            }
                                        </div>
                                    </div>
                                }
                            </div>
                        }
                    </div>
                }
            }
        </div>
    `,
    styles: [`
        .mc-mem { display: flex; flex-direction: column; gap: 14px; padding: 4px 0 8px; }
        .mc-muted { color: var(--mj-text-muted); font-size: 13px; padding: 8px 2px; }
        .mc-error { color: var(--mj-status-error); font-size: 13px; padding: 8px 2px; }
        .mc-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .mc-kpi { border: 1px solid var(--mj-border-default); border-radius: 10px; padding: 10px 12px; background: var(--mj-bg-surface-card); }
        .mc-kpi-val { font-size: 16px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mc-kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mj-text-muted); margin-top: 2px; }
        .mc-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 18px; }
        .mc-pill.active { background: var(--mj-status-success-bg); color: var(--mj-status-success-text); }
        .mc-pill.ended { background: var(--mj-bg-surface-hover); color: var(--mj-text-secondary); }
        .mc-kpi-ai { border-color: color-mix(in srgb, var(--mj-brand-primary) 30%, var(--mj-border-default)); background: linear-gradient(135deg, var(--mj-bg-surface-card) 0%, color-mix(in srgb, var(--mj-brand-primary) 8%, var(--mj-bg-surface-card)) 100%); }
        .mc-kpi-ai .mc-kpi-label { color: var(--mj-brand-primary); font-weight: 600; }
        .mc-kpi-ltv { border-color: color-mix(in srgb, var(--mj-status-success-border) 40%, var(--mj-border-default)); background: linear-gradient(135deg, var(--mj-bg-surface-card) 0%, color-mix(in srgb, var(--mj-status-success-border) 8%, var(--mj-bg-surface-card)) 100%); }
        .mc-kpi-ltv .mc-kpi-label { color: var(--mj-status-success); font-weight: 600; }
        .mc-kpi-sub { font-size: 10.5px; color: var(--mj-text-muted); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mc-pill.risk-low { background: var(--mj-status-success-bg); color: var(--mj-status-success-text); }
        .mc-pill.risk-med { background: var(--mj-status-warning-bg); color: var(--mj-status-warning-text); }
        .mc-pill.risk-high { background: var(--mj-status-error-bg); color: var(--mj-status-error-text); }
        .mc-profile-summary {
            background: var(--mj-bg-surface-card);
            border: 1px solid var(--mj-border-default);
            border-radius: 8px;
            padding: 12px 14px;
            font-size: 13px;
        }
        .mc-summary-header {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 12px;
            font-weight: 600;
            color: var(--mj-text-muted);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-bottom: 4px;
        }
        .mc-summary-header i {
            color: var(--mj-brand-primary);
        }
        .mc-summary-body {
            color: var(--mj-text-primary);
            line-height: 1.5;
        }

        /* Expandable Insights Panel */
        .mc-insights-panel {
            border: 1px solid color-mix(in srgb, var(--mj-brand-primary) 30%, var(--mj-border-default));
            border-radius: 8px;
            background: var(--mj-bg-surface-card);
            overflow: hidden;
        }
        .mc-insights-toggle {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: transparent;
            border: none;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            color: var(--mj-text-primary);
            text-align: left;
            transition: background 0.15s ease;
        }
        .mc-insights-toggle:hover {
            background: var(--mj-bg-surface-hover);
        }
        .mc-insights-title {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .mc-insights-title i {
            color: var(--mj-brand-primary);
        }
        .mc-badge {
            display: inline-block;
            font-size: 11px;
            font-weight: 600;
            padding: 1px 7px;
            border-radius: 10px;
            background: color-mix(in srgb, var(--mj-brand-primary) 15%, transparent);
            color: var(--mj-brand-primary);
        }
        .mc-badge-muted {
            background: var(--mj-bg-surface-hover);
            color: var(--mj-text-secondary);
        }
        .mc-insights-content {
            padding: 14px;
            border-top: 1px solid color-mix(in srgb, var(--mj-brand-primary) 30%, var(--mj-border-default));
            display: flex;
            flex-direction: column;
            gap: 16px;
            background: var(--mj-bg-surface);
        }
        .mc-section-heading {
            font-size: 12px;
            font-weight: 600;
            color: var(--mj-text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.04em;
            margin-bottom: 8px;
        }

        /* Attribution Drivers */
        .mc-drivers-section {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .mc-driver-list {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .mc-driver-row {
            display: flex;
            flex-direction: column;
            gap: 3px;
        }
        .mc-driver-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: var(--mj-text-primary);
        }
        .mc-driver-name {
            font-weight: 500;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11.5px;
        }
        .mc-driver-pct {
            font-weight: 600;
            color: var(--mj-brand-primary);
        }
        .mc-driver-bar-track {
            height: 6px;
            background: var(--mj-bg-surface-hover);
            border-radius: 3px;
            overflow: hidden;
        }
        .mc-driver-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--mj-brand-primary-hover), var(--mj-brand-primary));
            border-radius: 3px;
            transition: width 0.3s ease;
        }

        /* Prediction History */
        .mc-history-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .mc-history-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        .mc-history-item {
            border: 1px solid var(--mj-border-default);
            border-radius: 6px;
            padding: 10px 12px;
            background: var(--mj-bg-surface-card);
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .mc-history-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .mc-history-meta {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .mc-history-model {
            font-size: 12px;
            font-weight: 500;
            color: var(--mj-text-secondary);
        }
        .mc-history-date {
            font-size: 11.5px;
            color: var(--mj-text-muted);
        }
        .mc-history-driver {
            font-size: 12px;
            color: var(--mj-text-secondary);
        }
        .mc-history-driver strong {
            color: var(--mj-text-primary);
        }
        .mc-history-raw-toggle {
            margin-top: 2px;
        }
        .mc-raw-btn {
            background: none;
            border: none;
            padding: 0;
            font-size: 11px;
            color: var(--mj-text-link);
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .mc-raw-btn:hover {
            color: var(--mj-text-link-hover);
            text-decoration: underline;
        }
        .mc-raw-json {
            margin: 6px 0 0;
            padding: 8px 10px;
            background: var(--mj-bg-surface-sunken);
            color: var(--mj-text-primary);
            border: 1px solid var(--mj-border-subtle);
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-size: 11px;
            line-height: 1.4;
            border-radius: 4px;
            overflow-x: auto;
            max-height: 200px;
            white-space: pre-wrap;
            word-break: break-all;
        }
    `],
})
export class PersonMembershipComponent implements OnChanges {
    private readonly cdr = inject(ChangeDetectorRef);

    @Input() public PersonID: string | null = null;
    @Input() public Provider: IMetadataProvider | null = null;
    @Output() public Navigate = new EventEmitter<FormNavigationEvent>();

    public Loading = false;
    public ErrorMessage: string | null = null;
    public Data: PersonMembership | null = null;
    public Expanded = true;
    public ExpandedPayloads = new Set<string>();

    public ngOnChanges(changes: SimpleChanges): void {
        if (changes['PersonID'] || changes['Provider']) {
            void this.Load();
        }
    }

    public get HasMembership(): boolean {
        return !!this.Data && this.Data.Profile != null;
    }

    public get Prediction(): PersonPredictionInfo | null {
        return this.Data?.Prediction ?? null;
    }

    public get RenewalPrediction(): PersonPredictionInfo | null {
        return this.Data?.RenewalPrediction ?? this.Data?.Prediction ?? null;
    }

    public get LtvPrediction(): PersonPredictionInfo | null {
        return this.Data?.LtvPrediction ?? null;
    }

    public get Drivers(): PredictionDriver[] {
        return this.Prediction?.Drivers ?? [];
    }

    public get History(): PredictionHistoryItem[] {
        return this.Data?.History ?? [];
    }

    public get SegmentLine(): string {
        const profile = this.Data?.Profile;
        if (!profile) return '—';
        return [profile.Segment, profile.Region].filter(Boolean).join(' · ');
    }

    public get LocationLine(): string {
        const profile = this.Data?.Profile;
        if (!profile) return 'Segment';
        return [profile.City, profile.State, profile.CountryName].filter(Boolean).join(', ') || 'Segment';
    }

    public ToggleExpanded(): void {
        this.Expanded = !this.Expanded;
        this.cdr.markForCheck();
    }

    public TogglePayload(id: string): void {
        if (this.ExpandedPayloads.has(id)) {
            this.ExpandedPayloads.delete(id);
        } else {
            this.ExpandedPayloads.add(id);
        }
        this.cdr.markForCheck();
    }

    public IsPayloadOpen(id: string): boolean {
        return this.ExpandedPayloads.has(id);
    }

    private async Load(): Promise<void> {
        if (!this.PersonID) {
            this.Data = null;
            return;
        }
        this.Loading = true;
        this.ErrorMessage = null;
        this.cdr.markForCheck();
        try {
            this.Data = await LoadMembershipForPerson(this.PersonID, this.Provider ?? undefined);
        } catch (e) {
            this.ErrorMessage = e instanceof Error ? e.message : 'Could not load membership.';
            this.Data = null;
        } finally {
            this.Loading = false;
            this.cdr.markForCheck();
        }
    }
}
