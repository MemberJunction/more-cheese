import { Component } from '@angular/core';
import { morecheeseordersProductEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MoreCheese: Products') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeseordersproduct-form',
    templateUrl: './morecheeseordersproduct.form.component.html'
})
export class morecheeseordersProductFormComponent extends BaseFormComponent {
    public record!: morecheeseordersProductEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true },
            { sectionKey: 'moreCheeseOrderLines', sectionName: 'Order Lines', isExpanded: false }
        ]);
    }
}

