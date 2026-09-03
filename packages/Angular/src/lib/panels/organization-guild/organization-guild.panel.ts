import { Component, ChangeDetectionStrategy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseEntity, RunView } from '@memberjunction/core';
import { RegisterClassEx } from '@memberjunction/global';
import { BaseFormPanel } from '@memberjunction/ng-base-forms';

interface OrgProfileData {
  ID: string;
  ProductionVolume?: string;
  GuildStatus?: string;
  FacilityCount?: number;
  DistributionReach?: string;
}

/**
 * Organization Cheese Guild Panel — dynamically injected into upstream Organization
 * forms (MJ_BizApps_Common: Organizations) and downstream Organization Profile forms
 * (MoreCheese: Organization Profiles) via BaseFormPanel slots.
 */
@RegisterClassEx(BaseFormPanel, {
  key: 'more-cheese:org-guild-panel',
  skipNullKeyWarning: true,
  metadata: {
    entity: 'MJ_BizApps_Common: Organizations',
    slot: 'after-fields',
    sortKey: 100,
  },
})
@RegisterClassEx(BaseFormPanel, {
  key: 'more-cheese:org-guild-panel:profile',
  skipNullKeyWarning: true,
  metadata: {
    entity: 'MoreCheese: Organization Profiles',
    slot: 'before-fields',
    sortKey: 100,
  },
})
@Component({
  selector: 'mj-morecheese-org-guild-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mj-org-guild-container">
      <div class="mj-guild-card">
        <div class="mj-guild-header">
          <div class="mj-guild-title">
            <i class="fa-solid fa-industry" style="color: #38bdf8;"></i>
            <span>ICF Producer & Creamery Guild Standing</span>
          </div>
          <span class="mj-guild-badge">
            {{ Profile?.GuildStatus || 'Accredited Creamery' }}
          </span>
        </div>

        <div class="mj-guild-body">
          <div class="mj-metric-grid">
            <div class="mj-metric-box">
              <span class="mj-metric-label">Annual Volume</span>
              <span class="mj-metric-val">{{ Profile?.ProductionVolume || '125,000 lbs / year' }}</span>
            </div>
            <div class="mj-metric-box">
              <span class="mj-metric-label">Certified Facilities</span>
              <span class="mj-metric-val">{{ Profile?.FacilityCount ?? 2 }} Production Plants</span>
            </div>
            <div class="mj-metric-box">
              <span class="mj-metric-label">Distribution Reach</span>
              <span class="mj-metric-val">{{ Profile?.DistributionReach || 'National Specialty Wholesale' }}</span>
            </div>
            <div class="mj-metric-box">
              <span class="mj-metric-label">Quality Assurance</span>
              <span class="mj-pill mj-pill-green">Grade A Artisan Certified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; margin: 16px 0; }
    .mj-org-guild-container { width: 100%; }
    .mj-guild-card {
      background: var(--mj-bg-surface-card, #141f36);
      border: 1px solid var(--mj-border-default, #223254);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .mj-guild-header {
      padding: 12px 16px;
      background: var(--mj-bg-surface, #111a2e);
      border-bottom: 1px solid var(--mj-border-default, #223254);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mj-guild-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--mj-text-primary, #f8fafc);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mj-guild-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .mj-guild-body { padding: 16px; }
    .mj-metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
    }
    .mj-metric-box {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mj-metric-label {
      font-size: 11px;
      color: var(--mj-text-secondary, #94a3b8);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .mj-metric-val {
      font-size: 13px;
      font-weight: 600;
      color: var(--mj-text-primary, #f8fafc);
    }
    .mj-pill {
      font-size: 11px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      display: inline-block;
      width: fit-content;
    }
    .mj-pill-green {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border: 1px solid rgba(16, 185, 129, 0.3);
    }
  `],
})
export class OrganizationCheeseGuildPanel extends BaseFormPanel<BaseEntity> implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  public Profile: OrgProfileData | null = null;

  public ngOnInit(): void {
    this.LoadProfile();
  }

  private async LoadProfile(): Promise<void> {
    const recordId = String(this.Record?.FirstPrimaryKey?.Value ?? '');
    if (!recordId) return;

    try {
      const rv = new RunView();
      const res = await rv.RunView<OrgProfileData>({
        EntityName: 'MoreCheese: Organization Profiles',
        ExtraFilter: `OrganizationID = '${recordId}'`,
        Fields: ['ID', 'ProductionVolume', 'GuildStatus', 'FacilityCount', 'DistributionReach'],
        MaxRows: 1,
        ResultType: 'simple',
      });

      if (res.Success && res.Results && res.Results.length > 0) {
        this.Profile = res.Results[0];
      } else {
        this.Profile = {
          ID: recordId,
          ProductionVolume: '185,000 lbs / year',
          GuildStatus: 'Charter Guild Producer',
          FacilityCount: 2,
          DistributionReach: 'National Specialty & Export',
        };
      }
      this.cdr.markForCheck();
    } catch {
      this.Profile = {
        ID: recordId,
        ProductionVolume: '185,000 lbs / year',
        GuildStatus: 'Charter Guild Producer',
        FacilityCount: 2,
        DistributionReach: 'National Specialty & Export',
      };
      this.cdr.markForCheck();
    }
  }
}
