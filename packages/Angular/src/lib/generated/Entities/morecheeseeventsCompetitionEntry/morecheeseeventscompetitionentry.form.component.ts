import { Component } from '@angular/core';
import { morecheeseeventsCompetitionEntryEntity } from '@mj-more-cheese-demo/entities';
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
            { sectionKey: 'competitionDetails', sectionName: 'Competition Details', isExpanded: true },
            { sectionKey: 'entrantInformation', sectionName: 'Entrant Information', isExpanded: true },
            { sectionKey: 'entryConfiguration', sectionName: 'Entry Configuration', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false }
        ]);
    }
}

