import { Component } from '@angular/core';
import { morecheeseordersOrderEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MoreCheese: Orders') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeseordersorder-form',
    templateUrl: './morecheeseordersorder.form.component.html'
})
export class morecheeseordersOrderFormComponent extends BaseFormComponent {
    public record!: morecheeseordersOrderEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'moreCheeseOrderLines', sectionName: 'Order Lines', isExpanded: false },
            { sectionKey: 'moreCheesePayments', sectionName: 'Payments', isExpanded: false }
        ]);
    }
}

