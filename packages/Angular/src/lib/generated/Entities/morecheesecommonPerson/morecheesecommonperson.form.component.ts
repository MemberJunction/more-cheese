import { Component } from '@angular/core';
import { morecheesecommonPersonEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MoreCheese: People') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesecommonperson-form',
    templateUrl: './morecheesecommonperson.form.component.html'
})
export class morecheesecommonPersonFormComponent extends BaseFormComponent {
    public record!: morecheesecommonPersonEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'moreCheeseEventRegistrations', sectionName: 'Event Registrations', isExpanded: false },
            { sectionKey: 'moreCheeseMembershipPeriods', sectionName: 'Membership Periods', isExpanded: false },
            { sectionKey: 'moreCheeseOrders', sectionName: 'Orders', isExpanded: false },
            { sectionKey: 'moreCheeseCourseEnrollments', sectionName: 'Course Enrollments', isExpanded: false }
        ]);
    }
}

