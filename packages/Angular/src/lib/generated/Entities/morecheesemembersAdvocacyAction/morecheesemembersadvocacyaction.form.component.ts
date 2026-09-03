import { Component } from '@angular/core';
import { morecheesemembersAdvocacyActionEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Advocacy Actions') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesemembersadvocacyaction-form',
    templateUrl: './morecheesemembersadvocacyaction.form.component.html'
})
export class morecheesemembersAdvocacyActionFormComponent extends BaseFormComponent {
    public record!: morecheesemembersAdvocacyActionEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'actionDetails', sectionName: 'Action Details', isExpanded: true },
            { sectionKey: 'actionContext', sectionName: 'Action Context', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

