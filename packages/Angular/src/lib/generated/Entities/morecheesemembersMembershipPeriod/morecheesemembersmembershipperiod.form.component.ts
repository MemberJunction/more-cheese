import { Component } from '@angular/core';
import { morecheesemembersMembershipPeriodEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Membership Periods') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesemembersmembershipperiod-form',
    templateUrl: './morecheesemembersmembershipperiod.form.component.html'
})
export class morecheesemembersMembershipPeriodFormComponent extends BaseFormComponent {
    public record!: morecheesemembersMembershipPeriodEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

