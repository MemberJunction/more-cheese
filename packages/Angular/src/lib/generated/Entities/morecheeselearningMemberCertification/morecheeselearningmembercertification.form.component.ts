import { Component } from '@angular/core';
import { morecheeselearningMemberCertificationEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Member Certifications') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeselearningmembercertification-form',
    templateUrl: './morecheeselearningmembercertification.form.component.html'
})
export class morecheeselearningMemberCertificationFormComponent extends BaseFormComponent {
    public record!: morecheeselearningMemberCertificationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'certificationDetails', sectionName: 'Certification Details', isExpanded: true },
            { sectionKey: 'memberInformation', sectionName: 'Member Information', isExpanded: true },
            { sectionKey: 'certificationStatus', sectionName: 'Certification Status', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

