import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { IMetadataProvider } from '@memberjunction/core';
import type { FormNavigationEvent } from '@memberjunction/ng-base-forms';
import { LoadMembershipForPerson, type PersonMembership, type PersonPredictionInfo } from './membership-data';

/**
 * The More Cheese membership picture for one person: member profile KPIs and
 * real-time Predictive Studio AI Renewal Risk.
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
                    <div class="mc-kpi mc-kpi-ai" [title]="Prediction?.Tooltip || 'No prediction on file'">
                        <div class="mc-kpi-val">
                            <span [class]="'mc-pill ' + (Prediction?.PillClass || 'ended')">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> {{ Prediction?.RiskText || 'Not Scored' }}
                            </span>
                        </div>
                        <div class="mc-kpi-label">AI Renewal Risk</div>
                        @if (Prediction?.TopDriver) {
                            <div class="mc-kpi-sub" [title]="Prediction?.TopDriver">{{ Prediction?.TopDriver }}</div>
                        }
                    </div>
                </div>

                <div class="mc-profile-summary">
                    <div class="mc-summary-header">
                        <i class="fa-solid fa-circle-info"></i>
                        <span>Member Intelligence & Predictive Scoring</span>
                    </div>
                    <div class="mc-summary-body">
                        Scored across upstream activity, order frequency, course completion, and engagement data via
                        <strong>Predictive Studio</strong>. Detailed model attribution and historical prediction runs are available in the
                        <strong>Model Predictions</strong> panel below.
                    </div>
                </div>
            }
        </div>
    `,
    styles: [`
        .mc-mem { display: flex; flex-direction: column; gap: 14px; padding: 4px 0 8px; }
        .mc-muted { color: var(--mj-text-muted, #6b7280); font-size: 13px; padding: 8px 2px; }
        .mc-error { color: #b42318; font-size: 13px; padding: 8px 2px; }
        .mc-kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .mc-kpi { border: 1px solid var(--mj-border, #e5e7eb); border-radius: 10px; padding: 10px 12px; background: var(--mj-surface, #fff); }
        .mc-kpi-val { font-size: 16px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mc-kpi-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mj-text-muted, #6b7280); margin-top: 2px; }
        .mc-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 18px; }
        .mc-pill.active { background: #e7f6ec; color: #1e7f43; }
        .mc-pill.ended { background: #f1f3f5; color: #5f6b7a; }
        .mc-kpi-ai { border-color: #c7d2fe; background: linear-gradient(135deg, #fbfcfe 0%, #f0f3ff 100%); }
        .mc-kpi-ai .mc-kpi-label { color: #4f46e5; font-weight: 600; }
        .mc-kpi-sub { font-size: 10.5px; color: var(--mj-text-muted, #6b7280); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mc-pill.risk-low { background: #e7f6ec; color: #1e7f43; }
        .mc-pill.risk-med { background: #fff4e5; color: #b25e09; }
        .mc-pill.risk-high { background: #fdecec; color: #b42318; }
        .mc-profile-summary {
            background: var(--mj-surface, #fff);
            border: 1px solid var(--mj-border, #e5e7eb);
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
            color: var(--mj-text-muted, #6b7280);
            text-transform: uppercase;
            letter-spacing: 0.03em;
            margin-bottom: 4px;
        }
        .mc-summary-header i {
            color: #4f46e5;
        }
        .mc-summary-body {
            color: var(--mj-text, #374151);
            line-height: 1.5;
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
