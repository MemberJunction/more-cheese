import { Component } from '@angular/core';
import { morecheeseordersOrderLineEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Order Lines') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeseordersorderline-form',
    templateUrl: './morecheeseordersorderline.form.component.html'
})
export class morecheeseordersOrderLineFormComponent extends BaseFormComponent {
    public record!: morecheeseordersOrderLineEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

