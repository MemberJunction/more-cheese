import { Component, ChangeDetectionStrategy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseEntity, RunView } from '@memberjunction/core';
import { RegisterClassEx } from '@memberjunction/global';
import { BaseFormPanel } from '@memberjunction/ng-base-forms';

interface MemberProfileData {
  ID: string;
  PrimaryCheeseFocus?: string;
  PreferredMilkType?: string;
  GuildStanding?: string;
  EngagementScore?: number;
  AdvocacyCount?: number;
}

/**
 * Member Community Panel — dynamically injected into upstream Person forms
 * (MJ_BizApps_Common: People) and downstream Member Profile forms
 * (MoreCheese: Member Profiles) via MemberJunction's BaseFormPanel slot architecture.
 *
 * Demonstrates downstream OpenApp domain extension into upstream core forms
 * without modifying upstream templates or breaking CodeGen regeneration.
 */
@RegisterClassEx(BaseFormPanel, {
  key: 'more-cheese:member-community-panel',
  skipNullKeyWarning: true,
  metadata: {
    entity: 'MJ_BizApps_Common: People',
    slot: 'after-fields',
    sortKey: 100,
  },
})
@RegisterClassEx(BaseFormPanel, {
  key: 'more-cheese:member-community-panel:profile',
  skipNullKeyWarning: true,
  metadata: {
    entity: 'MoreCheese: Member Profiles',
    slot: 'before-fields',
    sortKey: 100,
  },
})
@Component({
  selector: 'mj-morecheese-member-community-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mj-cheese-community-container">
      <div class="mj-cheese-card">
        <div class="mj-cheese-card-header">
          <div class="mj-cheese-header-title">
            <i class="fa-solid fa-cheese" style="color: #f59e0b;"></i>
            <span>ICF Cheesemaker Community Profile</span>
          </div>
          <span class="mj-cheese-badge" [class.mj-badge-active]="Profile?.GuildStanding !== 'Lapsed'">
            {{ Profile?.GuildStanding || 'Artisan Member' }}
          </span>
        </div>

        <div class="mj-cheese-card-body">
          <div class="mj-metric-grid">
            <div class="mj-metric-box">
              <span class="mj-metric-label">Primary Cheese Focus</span>
              <span class="mj-metric-val">{{ Profile?.PrimaryCheeseFocus || 'Aged Alpine & Cheddar' }}</span>
            </div>
            <div class="mj-metric-box">
              <span class="mj-metric-label">Preferred Milk Type</span>
              <span class="mj-metric-val">{{ Profile?.PreferredMilkType || 'Raw Cow & Sheep' }}</span>
            </div>
            <div class="mj-metric-box">
              <span class="mj-metric-label">Advocacy Actions</span>
              <span class="mj-metric-val">{{ Profile?.AdvocacyCount ?? 3 }} Campaigns</span>
            </div>
            <div class="mj-metric-box">
              <span class="mj-metric-label">Engagement Index</span>
              <div class="mj-meter-wrap">
                <span class="mj-metric-val">{{ Profile?.EngagementScore ?? 85 }}/100</span>
                <div class="mj-progress-bar">
                  <div class="mj-progress-fill" [style.width.%]="Profile?.EngagementScore ?? 85"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; margin: 16px 0; }
    .mj-cheese-community-container { width: 100%; }
    .mj-cheese-card {
      background: var(--mj-bg-surface-card, #141f36);
      border: 1px solid var(--mj-border-default, #223254);
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .mj-cheese-card-header {
      padding: 12px 16px;
      background: var(--mj-bg-surface, #111a2e);
      border-bottom: 1px solid var(--mj-border-default, #223254);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .mj-cheese-header-title {
      font-size: 13px;
      font-weight: 700;
      color: var(--mj-text-primary, #f8fafc);
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mj-cheese-badge {
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 9999px;
      background: rgba(245, 158, 11, 0.15);
      color: #f59e0b;
      border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .mj-badge-active {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.3);
    }
    .mj-cheese-card-body { padding: 16px; }
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
    .mj-meter-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .mj-progress-bar {
      flex: 1;
      height: 6px;
      background: var(--mj-bg-surface-elevated, #1a2744);
      border-radius: 9999px;
      overflow: hidden;
    }
    .mj-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #10b981);
      border-radius: 9999px;
    }
  `],
})
export class MemberCommunityPanel extends BaseFormPanel<BaseEntity> implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  public Profile: MemberProfileData | null = null;

  public ngOnInit(): void {
    this.LoadProfile();
  }

  private async LoadProfile(): Promise<void> {
    const recordId = String(this.Record?.FirstPrimaryKey?.Value ?? '');
    if (!recordId) return;

    try {
      // Query associated MoreCheese Member Profile for this Person
      const rv = new RunView();
      const res = await rv.RunView<MemberProfileData>({
        EntityName: 'MoreCheese: Member Profiles',
        ExtraFilter: `PersonID = '${recordId}'`,
        Fields: ['ID', 'PrimaryCheeseFocus', 'PreferredMilkType', 'GuildStanding', 'EngagementScore'],
        MaxRows: 1,
        ResultType: 'simple',
      });

      if (res.Success && res.Results && res.Results.length > 0) {
        this.Profile = res.Results[0];
      } else {
        // Mock default state for persons without separate profile rows
        this.Profile = {
          ID: recordId,
          PrimaryCheeseFocus: 'Artisanal Cheddar & Gouda',
          PreferredMilkType: 'Raw Cow & Goat',
          GuildStanding: 'Certified Artisan',
          EngagementScore: 82,
          AdvocacyCount: 2,
        };
      }
      this.cdr.markForCheck();
    } catch {
      // Fallback display gracefully in standalone mode
      this.Profile = {
        ID: recordId,
        PrimaryCheeseFocus: 'Artisanal Cheddar & Gouda',
        PreferredMilkType: 'Raw Cow & Goat',
        GuildStanding: 'Certified Artisan',
        EngagementScore: 82,
        AdvocacyCount: 2,
      };
      this.cdr.markForCheck();
    }
  }
}
