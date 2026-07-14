import { Component } from '@angular/core';
import { morecheeseeventsEventRegistrationEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Event Registrations') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeseeventseventregistration-form',
    templateUrl: './morecheeseeventseventregistration.form.component.html'
})
export class morecheeseeventsEventRegistrationFormComponent extends BaseFormComponent {
    public record!: morecheeseeventsEventRegistrationEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

