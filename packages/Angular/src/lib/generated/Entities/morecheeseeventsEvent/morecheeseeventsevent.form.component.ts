import { Component } from '@angular/core';
import { morecheeseeventsEventEntity } from '@mj-biz-apps/more-cheese-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MoreCheese: Events') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeseeventsevent-form',
    templateUrl: './morecheeseeventsevent.form.component.html'
})
export class morecheeseeventsEventFormComponent extends BaseFormComponent {
    public record!: morecheeseeventsEventEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'eventDetails', sectionName: 'Event Details', isExpanded: true },
            { sectionKey: 'venueLocation', sectionName: 'Venue Location', isExpanded: true },
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'moreCheeseEventRegistrations', sectionName: 'Event Registrations', isExpanded: false }
        ]);
    }
}

