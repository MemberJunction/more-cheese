import { Component } from '@angular/core';
import { morecheeselearningMemberCertificationEntity } from '@mj-biz-apps/more-cheese-entities';
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
            { sectionKey: 'timeline', sectionName: 'Timeline', isExpanded: true },
            { sectionKey: 'configuration', sectionName: 'Configuration', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

