import { Component } from '@angular/core';
import { morecheesemembersvwMemberRenewalSignalsEntity } from '@mj-biz-apps/more-cheese-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Member Renewal Signals') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesemembersvwmemberrenewalsignals-form',
    templateUrl: './morecheesemembersvwmemberrenewalsignals.form.component.html'
})
export class morecheesemembersvwMemberRenewalSignalsFormComponent extends BaseFormComponent {
    public record!: morecheesemembersvwMemberRenewalSignalsEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

