import { Component } from '@angular/core';
import { morecheesemembersOrganizationProfileEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Organization Profiles') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesemembersorganizationprofile-form',
    templateUrl: './morecheesemembersorganizationprofile.form.component.html'
})
export class morecheesemembersOrganizationProfileFormComponent extends BaseFormComponent {
    public record!: morecheesemembersOrganizationProfileEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'organizationIdentity', sectionName: 'Organization Identity', isExpanded: true },
            { sectionKey: 'geographicLocation', sectionName: 'Geographic Location', isExpanded: true },
            { sectionKey: 'lifecycleEvents', sectionName: 'Lifecycle Events', isExpanded: true },
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

