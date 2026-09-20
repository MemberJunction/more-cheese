import { Component } from '@angular/core';
import { morecheeseeventsCompetitionEntryEntity } from '@mj-biz-apps/more-cheese-entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Competition Entries') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeseeventscompetitionentry-form',
    templateUrl: './morecheeseeventscompetitionentry.form.component.html'
})
export class morecheeseeventsCompetitionEntryFormComponent extends BaseFormComponent {
    public record!: morecheeseeventsCompetitionEntryEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'entryDetails', sectionName: 'Entry Details', isExpanded: true },
            { sectionKey: 'participantInformation', sectionName: 'Participant Information', isExpanded: true },
            { sectionKey: 'competitionResults', sectionName: 'Competition Results', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

