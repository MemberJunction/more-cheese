import { Component } from '@angular/core';
import { morecheesecommonOrganizationEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MoreCheese: Organizations') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesecommonorganization-form',
    templateUrl: './morecheesecommonorganization.form.component.html'
})
export class morecheesecommonOrganizationFormComponent extends BaseFormComponent {
    public record!: morecheesecommonOrganizationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'moreCheesePeople', sectionName: 'People', isExpanded: false }
        ]);
    }
}

