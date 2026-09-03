import { Component } from '@angular/core';
import { morecheeselearningCertificationEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MoreCheese: Certifications') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeselearningcertification-form',
    templateUrl: './morecheeselearningcertification.form.component.html'
})
export class morecheeselearningCertificationFormComponent extends BaseFormComponent {
    public record!: morecheeselearningCertificationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'certificationDetails', sectionName: 'Certification Details', isExpanded: true },
            { sectionKey: 'configuration', sectionName: 'Configuration', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'moreCheeseMemberCertifications', sectionName: 'Member Certifications', isExpanded: false }
        ]);
    }
}

