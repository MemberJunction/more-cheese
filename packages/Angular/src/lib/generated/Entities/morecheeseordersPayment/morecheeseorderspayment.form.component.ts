import { Component } from '@angular/core';
import { morecheeseordersPaymentEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Payments') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeseorderspayment-form',
    templateUrl: './morecheeseorderspayment.form.component.html'
})
export class morecheeseordersPaymentFormComponent extends BaseFormComponent {
    public record!: morecheeseordersPaymentEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

