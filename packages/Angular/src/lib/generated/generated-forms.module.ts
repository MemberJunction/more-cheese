import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseFormsModule } from '@memberjunction/ng-base-forms';
import { EntityViewerModule } from '@memberjunction/ng-entity-viewer';
import { LinkDirectivesModule } from '@memberjunction/ng-link-directives';

// Import Generated Components
import { morecheesemembersAdvocacyActionFormComponent } from "./Entities/morecheesemembersAdvocacyAction/morecheesemembersadvocacyaction.form.component";
import { morecheeselearningCertificationFormComponent } from "./Entities/morecheeselearningCertification/morecheeselearningcertification.form.component";
import { morecheeseeventsCompetitionEntryFormComponent } from "./Entities/morecheeseeventsCompetitionEntry/morecheeseeventscompetitionentry.form.component";
import { morecheeselearningCourseEnrollmentFormComponent } from "./Entities/morecheeselearningCourseEnrollment/morecheeselearningcourseenrollment.form.component";
import { morecheeselearningCourseFormComponent } from "./Entities/morecheeselearningCourse/morecheeselearningcourse.form.component";
import { morecheesemembersDataQualityLabelFormComponent } from "./Entities/morecheesemembersDataQualityLabel/morecheesemembersdataqualitylabel.form.component";
import { morecheeseeventsEventRegistrationFormComponent } from "./Entities/morecheeseeventsEventRegistration/morecheeseeventseventregistration.form.component";
import { morecheeseeventsEventFormComponent } from "./Entities/morecheeseeventsEvent/morecheeseeventsevent.form.component";
import { morecheeselearningMemberCertificationFormComponent } from "./Entities/morecheeselearningMemberCertification/morecheeselearningmembercertification.form.component";
import { morecheesemembersMemberProfileFormComponent } from "./Entities/morecheesemembersMemberProfile/morecheesemembersmemberprofile.form.component";
import { morecheesemembersMembershipPeriodFormComponent } from "./Entities/morecheesemembersMembershipPeriod/morecheesemembersmembershipperiod.form.component";
import { morecheesemembersOrganizationProfileFormComponent } from "./Entities/morecheesemembersOrganizationProfile/morecheesemembersorganizationprofile.form.component";

@NgModule({
    declarations: [
        morecheesemembersAdvocacyActionFormComponent,
        morecheeselearningCertificationFormComponent,
        morecheeseeventsCompetitionEntryFormComponent,
        morecheeselearningCourseEnrollmentFormComponent,
        morecheeselearningCourseFormComponent,
        morecheesemembersDataQualityLabelFormComponent,
        morecheeseeventsEventRegistrationFormComponent,
        morecheeseeventsEventFormComponent,
        morecheeselearningMemberCertificationFormComponent,
        morecheesemembersMemberProfileFormComponent,
        morecheesemembersMembershipPeriodFormComponent,
        morecheesemembersOrganizationProfileFormComponent
    ],
    imports: [
        CommonModule,
        FormsModule,
        BaseFormsModule,
        EntityViewerModule,
        LinkDirectivesModule
    ],
    exports: [
        morecheesemembersAdvocacyActionFormComponent,
        morecheeselearningCertificationFormComponent,
        morecheeseeventsCompetitionEntryFormComponent,
        morecheeselearningCourseEnrollmentFormComponent,
        morecheeselearningCourseFormComponent,
        morecheesemembersDataQualityLabelFormComponent,
        morecheeseeventsEventRegistrationFormComponent,
        morecheeseeventsEventFormComponent,
        morecheeselearningMemberCertificationFormComponent,
        morecheesemembersMemberProfileFormComponent,
        morecheesemembersMembershipPeriodFormComponent,
        morecheesemembersOrganizationProfileFormComponent
    ]
})
export class GeneratedFormsModule { }
export function LoadGeneratedFormsModule() {
    return GeneratedFormsModule;
}
