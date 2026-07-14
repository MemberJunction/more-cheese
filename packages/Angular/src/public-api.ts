/**
 * @mj-more-cheese-demo/ng — the CLIENT BOOTSTRAP package.
 *
 * MJExplorer bundles this package; evaluating it fires the @RegisterClass
 * decorators for the generated entity forms, and the host's generated
 * class-registration manifest imports the form components by name — so every
 * generated component must be exported here (pattern mirrors bizapps-common).
 */

// Register entity subclasses on the client
import '@mj-more-cheese-demo/entities';

// Evaluate the generated forms module (fires @RegisterClass for every form)
import './lib/generated/generated-forms.module';

// Re-export for consumers + the host class-registration manifest
export { GeneratedFormsModule } from './lib/generated/generated-forms.module';
export { morecheesecommonOrganizationFormComponent } from './lib/generated/Entities/morecheesecommonOrganization/morecheesecommonorganization.form.component';
export { morecheesecommonPersonFormComponent } from './lib/generated/Entities/morecheesecommonPerson/morecheesecommonperson.form.component';
export { morecheeseeventsEventFormComponent } from './lib/generated/Entities/morecheeseeventsEvent/morecheeseeventsevent.form.component';
export { morecheeseeventsEventRegistrationFormComponent } from './lib/generated/Entities/morecheeseeventsEventRegistration/morecheeseeventseventregistration.form.component';
export { morecheeselearningCourseFormComponent } from './lib/generated/Entities/morecheeselearningCourse/morecheeselearningcourse.form.component';
export { morecheeselearningCourseEnrollmentFormComponent } from './lib/generated/Entities/morecheeselearningCourseEnrollment/morecheeselearningcourseenrollment.form.component';
export { morecheesemembersMembershipPeriodFormComponent } from './lib/generated/Entities/morecheesemembersMembershipPeriod/morecheesemembersmembershipperiod.form.component';
export { morecheeseordersOrderFormComponent } from './lib/generated/Entities/morecheeseordersOrder/morecheeseordersorder.form.component';
export { morecheeseordersOrderLineFormComponent } from './lib/generated/Entities/morecheeseordersOrderLine/morecheeseordersorderline.form.component';
export { morecheeseordersPaymentFormComponent } from './lib/generated/Entities/morecheeseordersPayment/morecheeseorderspayment.form.component';
export { morecheeseordersProductFormComponent } from './lib/generated/Entities/morecheeseordersProduct/morecheeseordersproduct.form.component';

/**
 * Bootstrap function named by mj-app.json "startupExport" for the client.
 * The static imports above handle all registration; this function ensures
 * the module is fully evaluated.
 */
export function LoadMoreCheeseDemoClient(): void {
    // Static imports above ensure all classes are registered.
}
