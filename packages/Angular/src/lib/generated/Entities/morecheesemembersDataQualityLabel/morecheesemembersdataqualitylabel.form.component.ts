import { Component } from '@angular/core';
import { morecheesemembersDataQualityLabelEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Data Quality Labels') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheesemembersdataqualitylabel-form',
    templateUrl: './morecheesemembersdataqualitylabel.form.component.html'
})
export class morecheesemembersDataQualityLabelFormComponent extends BaseFormComponent {
    public record!: morecheesemembersDataQualityLabelEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

