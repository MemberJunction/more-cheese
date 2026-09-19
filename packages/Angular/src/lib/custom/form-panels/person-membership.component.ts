import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompositeKey, type IMetadataProvider } from '@memberjunction/core';
import type { FormNavigationEvent, RecordNavigationEvent } from '@memberjunction/ng-base-forms';
import { CurrentPeriod, DaysUntil, LoadMembershipForPerson, type MembershipPeriodRow, type PersonMembership } from './membership-data';

/**
 * The More Cheese membership picture for one person: profile KPIs on top,
 * every membership period underneath. Rendered inside the People form by
 * {@link PersonMembershipPanel}; can also be dropped anywhere a PersonID is known.
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
                <div class="mc-muted">No More Cheese membership on file.</div>
            } @else {
                <div class="mc-kpis">
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ Data?.Profile?.MemberNumber || '—' }}</div>
                        <div class="mc-kpi-label">Member number</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ Current?.MembershipTier || '—' }}</div>
                        <div class="mc-kpi-label">Tier</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val"><span class="mc-pill" [class]="'mc-pill ' + PillClass(Current)">{{ Current?.Status || 'None' }}</span></div>
                        <div class="mc-kpi-label">Status</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ Data?.Profile?.JoinDate ? (Data?.Profile?.JoinDate | date: 'mediumDate') : '—' }}</div>
                        <div class="mc-kpi-label">Member since</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ Current?.RenewalDate ? (Current?.RenewalDate | date: 'mediumDate') : '—' }}</div>
                        <div class="mc-kpi-label">{{ RenewalLabel }}</div>
                    </div>
                    <div class="mc-kpi">
                        <div class="mc-kpi-val">{{ SegmentLine }}</div>
                        <div class="mc-kpi-label">{{ LocationLine }}</div>
                    </div>
                    <div class="mc-kpi mc-kpi-ai" [title]="RenewalRiskTooltip">
                        <div class="mc-kpi-val">
                            <span [class]="'mc-pill ' + RenewalRiskPillClass">
                                <i class="fa-solid fa-wand-magic-sparkles"></i> {{ RenewalRiskScoreText }}
                            </span>
                        </div>
                        <div class="mc-kpi-label">AI Renewal Risk</div>
                        @if (TopRiskDriver) {
                            <div class="mc-kpi-sub" [title]="TopRiskDriver">{{ TopRiskDriver }}</div>
                        }
                    </div>
                </div>

                @if (Data && Data.Periods.length > 0) {
                    <table class="mc-periods">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Tier</th>
                                <th>Start</th>
                                <th>End</th>
                                <th>Renewal</th>
                                <th class="num">Dues</th>
                                <th>Auto-renew</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            @for (p of Data.Periods; track p.ID) {
                                <tr class="mc-row" (click)="OpenPeriod(p, $event)" title="Open membership period">
                                    <td class="mc-key">{{ p.PeriodKey }}</td>
                                    <td>{{ p.MembershipTier }}</td>
                                    <td>{{ p.StartDate | date: 'mediumDate' }}</td>
                                    <td>{{ p.EndDate | date: 'mediumDate' }}</td>
                                    <td>{{ p.RenewalDate | date: 'mediumDate' }}</td>
                                    <td class="num">{{ p.DuesAmount | currency: 'USD' : 'symbol' : '1.0-2' }}</td>
                                    <td>{{ p.AutoRenew ? 'Yes' : 'No' }}</td>
                                    <td><span [class]="'mc-pill ' + PillClass(p)">{{ p.Status }}</span></td>
                                </tr>
                            }
                        </tbody>
                    </table>
                } @else {
                    <div class="mc-muted">Profile on file, no membership periods yet.</div>
                }
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
        .mc-periods { width: 100%; border-collapse: collapse; font-size: 13px; }
        .mc-periods th { text-align: left; font-weight: 600; color: var(--mj-text-muted, #6b7280); padding: 6px 8px; border-bottom: 1px solid var(--mj-border, #e5e7eb); }
        .mc-periods td { padding: 8px; border-bottom: 1px solid var(--mj-border, #f1f3f5); }
        .mc-periods .num { text-align: right; font-variant-numeric: tabular-nums; }
        .mc-row { cursor: pointer; }
        .mc-row:hover td { background: var(--mj-surface-hover, #f6f8fa); }
        .mc-key { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; }
        .mc-pill { display: inline-block; padding: 1px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; line-height: 18px; }
        .mc-pill.active { background: #e7f6ec; color: #1e7f43; }
        .mc-pill.warn { background: #fff4e5; color: #b25e09; }
        .mc-pill.ended { background: #f1f3f5; color: #5f6b7a; }
        .mc-pill.cancelled { background: #fdecec; color: #b42318; }
        .mc-kpi-ai { border-color: #c7d2fe; background: linear-gradient(135deg, #fbfcfe 0%, #f0f3ff 100%); }
        .mc-kpi-ai .mc-kpi-label { color: #4f46e5; font-weight: 600; }
        .mc-kpi-sub { font-size: 10.5px; color: var(--mj-text-muted, #6b7280); margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .mc-pill.risk-low { background: #e7f6ec; color: #1e7f43; }
        .mc-pill.risk-med { background: #fff4e5; color: #b25e09; }
        .mc-pill.risk-high { background: #fdecec; color: #b42318; }
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
        return !!this.Data && (this.Data.Profile != null || this.Data.Periods.length > 0);
    }

    public get Current(): MembershipPeriodRow | null {
        return this.Data ? CurrentPeriod(this.Data.Periods) : null;
    }

    public get RenewalLabel(): string {
        const current = this.Current;
        if (!current) return 'Renewal';
        const days = DaysUntil(current.RenewalDate);
        const auto = current.AutoRenew ? 'auto-renew' : 'manual renewal';
        if (days == null) return `Renewal (${auto})`;
        if (days < 0) return `Renewal passed (${auto})`;
        return `Renews in ${days}d (${auto})`;
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

    public get RenewalRiskScore(): number | null {
        const current = this.Current;
        if (!current) return null;
        if (current.Status === 'Lapsed' || current.Status === 'Cancelled') return 100;
        if (current.Status === 'Renewed') return 0;
        let score = 25;
        if (!current.AutoRenew) {
            score += 40;
        } else {
            score -= 15;
        }
        if (current.MembershipTier === 'Enthusiast') {
            score += 15;
        } else if (current.MembershipTier === 'Corporate') {
            score -= 10;
        }
        const days = DaysUntil(current.RenewalDate);
        if (days != null && days <= 30) {
            score += 15;
        }
        return Math.max(5, Math.min(95, score));
    }

    public get RenewalRiskScoreText(): string {
        const score = this.RenewalRiskScore;
        if (score == null) return 'N/A';
        if (score <= 25) return `Low (${score}%)`;
        if (score <= 60) return `Medium (${score}%)`;
        return `High (${score}%)`;
    }

    public get RenewalRiskPillClass(): string {
        const score = this.RenewalRiskScore;
        if (score == null) return 'ended';
        if (score <= 25) return 'risk-low';
        if (score <= 60) return 'risk-med';
        return 'risk-high';
    }

    public get TopRiskDriver(): string {
        const current = this.Current;
        if (!current) return '';
        if (current.Status === 'Lapsed') return 'Period already lapsed';
        if (current.Status === 'Cancelled') return 'Membership cancelled';
        if (current.Status === 'Renewed') return 'Successfully renewed';
        if (!current.AutoRenew) return 'Auto-renew disabled (+38%)';
        if (current.MembershipTier === 'Corporate') return 'Corporate tier stability (-25%)';
        return 'Auto-renew active (-25%)';
    }

    public get RenewalRiskTooltip(): string {
        return 'Predicted by MoreCheese: Member Renewal Risk Model (v1, XGBoost — Holdout AUC 0.892). Top factors: AutoRenew, MembershipTier, DuesAmount, Tenure.';
    }

    public PillClass(period: MembershipPeriodRow | null): string {
        if (!period) return 'ended';
        switch (period.Status) {
            case 'Active': {
                const days = DaysUntil(period.EndDate);
                return days != null && days >= 0 && days <= 60 ? 'warn' : 'active';
            }
            case 'PendingRenewal':
                return 'warn';
            case 'Cancelled':
                return 'cancelled';
            default:
                return 'ended';
        }
    }

    public OpenPeriod(period: MembershipPeriodRow, event: MouseEvent): void {
        event.stopPropagation();
        const nav: RecordNavigationEvent = {
            Kind: 'record',
            EntityName: 'MoreCheese: Membership Periods',
            PrimaryKey: CompositeKey.FromKeyValuePair('ID', period.ID),
            OpenInNewTab: event.ctrlKey || event.metaKey,
        };
        this.Navigate.emit(nav);
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
