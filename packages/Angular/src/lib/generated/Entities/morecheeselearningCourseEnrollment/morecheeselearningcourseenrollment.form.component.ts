import { Component } from '@angular/core';
import { morecheeselearningCourseEnrollmentEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';

@RegisterClass(BaseFormComponent, 'MoreCheese: Course Enrollments') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeselearningcourseenrollment-form',
    templateUrl: './morecheeselearningcourseenrollment.form.component.html'
})
export class morecheeselearningCourseEnrollmentFormComponent extends BaseFormComponent {
    public record!: morecheeselearningCourseEnrollmentEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'details', sectionName: 'Details', isExpanded: true }
        ]);
    }
}

