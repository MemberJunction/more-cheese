import { Component } from '@angular/core';
import { morecheesemembersMemberProfileEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Member Profiles') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesemembersmemberprofile-form',
    templateUrl: './morecheesemembersmemberprofile.form.component.html'
})
export class morecheesemembersMemberProfileFormComponent extends BaseFormComponent {
    public record!: morecheesemembersMemberProfileEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'relationships', sectionName: 'Relationships', isExpanded: true },
            { sectionKey: 'membershipDetails', sectionName: 'Membership Details', isExpanded: true },
            { sectionKey: 'locationInformation', sectionName: 'Location Information', isExpanded: true },
            { sectionKey: 'demographicInformation', sectionName: 'Demographic Information', isExpanded: true },
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

