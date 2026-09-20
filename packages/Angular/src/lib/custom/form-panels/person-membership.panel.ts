import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RegisterClassEx } from '@memberjunction/global';
import type { BaseEntity } from '@memberjunction/core';
import { BaseFormPanel, BaseFormsModule } from '@memberjunction/ng-base-forms';
import { PersonMembershipComponent } from './person-membership.component';

/**
 * More Cheese's one contribution to the Common People form: the member's
 * profile and every membership period, as a first-class rail section.
 *
 * It CLAIMS the `MoreCheese: Membership Periods` relationship, so the stock
 * related-entity grid the form composer would otherwise mount is replaced by
 * this panel (forms architecture guide §7c, scenario D). Nothing in Common or
 * in core metadata is touched; the People form learns about More Cheese only
 * because this package is installed. contributionKey must equal SectionKey.
 */
@RegisterClassEx(BaseFormPanel, {
    key: 'form-panel:People:morecheese-membership',
    metadata: {
        entity: 'MJ_BizApps_Common: People',
        slot: 'after-fields',
        sortKey: 90,
        contributionKey: 'moreCheeseMembership',
        relatedEntity: 'MoreCheese: Member Profiles',
        relatedJoinField: 'PersonID',
        inclusion: 'Primary',
    },
})
@Component({
    selector: 'mc-person-membership-panel',
    standalone: true,
    imports: [CommonModule, BaseFormsModule, PersonMembershipComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <mj-collapsible-panel
            SectionKey="moreCheeseMembership"
            SectionName="Membership"
            Icon="fa-solid fa-cheese"
            Variant="related-entity"
            [Form]="FormComponent"
            [FormContext]="FormContext"
            [DefaultExpanded]="true">
            @if (Record.IsSaved) {
                <mc-person-membership
                    [PersonID]="PersonID"
                    [Provider]="FormComponent.ProviderToUse"
                    (Navigate)="FormComponent.OnFormNavigate($event)">
                </mc-person-membership>
            }
        </mj-collapsible-panel>
    `,
})
export class PersonMembershipPanel extends BaseFormPanel<BaseEntity> {
    /** The People record's primary key; typed loosely so this package does not depend on Common's entity package. */
    public get PersonID(): string | null {
        const id: unknown = this.Record.Get('ID');
        return typeof id === 'string' && id.length > 0 ? id : null;
    }
}
