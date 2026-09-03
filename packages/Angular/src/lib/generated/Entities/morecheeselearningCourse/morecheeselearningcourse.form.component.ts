import { Component } from '@angular/core';
import { morecheeselearningCourseEntity } from '@mj-more-cheese-demo/entities';
import { RegisterClass } from '@memberjunction/global';
import { BaseFormComponent } from '@memberjunction/ng-base-forms';
import {  } from "@memberjunction/ng-entity-viewer"

@RegisterClass(BaseFormComponent, 'MoreCheese: Courses') // Tell MemberJunction about this class
@Component({
    standalone: false,
    selector: 'gen-morecheeselearningcourse-form',
    templateUrl: './morecheeselearningcourse.form.component.html'
})
export class morecheeselearningCourseFormComponent extends BaseFormComponent {
    public record!: morecheeselearningCourseEntity;

    override async ngOnInit() {
        await super.ngOnInit();
        this.initSections([
            { sectionKey: 'courseDetails', sectionName: 'Course Details', isExpanded: true },
            { sectionKey: 'courseSchedule', sectionName: 'Course Schedule', isExpanded: true },
            { sectionKey: 'systemMetadata', sectionName: 'System Metadata', isExpanded: false },
            { sectionKey: 'moreCheeseCourseEnrollments', sectionName: 'Course Enrollments', isExpanded: false }
        ]);
    }
}

