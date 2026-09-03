import { BaseEntity, EntitySaveOptions, EntityDeleteOptions, CompositeKey, ValidationResult, ValidationErrorInfo, ValidationErrorType, Metadata, ProviderType, DatabaseProviderBase, RunView } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { z } from "zod";

export const loadModule = () => {
  // no-op, only used to ensure this file is a valid module and to allow easy loading
}

     
 
/**
 * zod schema definition for the entity MoreCheese: Advocacy Actions
 */
export const morecheesemembersAdvocacyActionSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    ActionKey: z.string().describe(`
        * * Field Name: ActionKey
        * * Display Name: Action Key
        * * SQL Data Type: nvarchar(80)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    ActionDate: z.date().describe(`
        * * Field Name: ActionDate
        * * Display Name: Action Date
        * * SQL Data Type: date`),
    Kind: z.union([z.literal('CoalitionMeeting'), z.literal('LetterCampaign'), z.literal('PetitionSignature'), z.literal('Testimony')]).describe(`
        * * Field Name: Kind
        * * Display Name: Kind
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * CoalitionMeeting
    *   * LetterCampaign
    *   * PetitionSignature
    *   * Testimony
        * * Description: LetterCampaign, PetitionSignature, Testimony, or CoalitionMeeting`),
    Topic: z.string().describe(`
        * * Field Name: Topic
        * * Display Name: Topic
        * * SQL Data Type: nvarchar(200)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
});

export type morecheesemembersAdvocacyActionEntityType = z.infer<typeof morecheesemembersAdvocacyActionSchema>;

/**
 * zod schema definition for the entity MoreCheese: Certifications
 */
export const morecheeselearningCertificationSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    CertKey: z.string().describe(`
        * * Field Name: CertKey
        * * Display Name: Cert Key
        * * SQL Data Type: nvarchar(50)
        * * Description: Business key (e.g. CERT-CCP)`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)`),
    Description: z.string().nullable().describe(`
        * * Field Name: Description
        * * Display Name: Description
        * * SQL Data Type: nvarchar(MAX)`),
    ValidYears: z.number().describe(`
        * * Field Name: ValidYears
        * * Display Name: Valid Years
        * * SQL Data Type: int
        * * Default Value: 3
        * * Description: Years the credential stays valid after award`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
});

export type morecheeselearningCertificationEntityType = z.infer<typeof morecheeselearningCertificationSchema>;

/**
 * zod schema definition for the entity MoreCheese: Competition Entries
 */
export const morecheeseeventsCompetitionEntrySchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    EntryKey: z.string().describe(`
        * * Field Name: EntryKey
        * * Display Name: Entry Key
        * * SQL Data Type: nvarchar(80)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    OrganizationID: z.string().nullable().describe(`
        * * Field Name: OrganizationID
        * * Display Name: Organization ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)`),
    EntryYear: z.number().describe(`
        * * Field Name: EntryYear
        * * Display Name: Entry Year
        * * SQL Data Type: int`),
    Category: z.string().describe(`
        * * Field Name: Category
        * * Display Name: Category
        * * SQL Data Type: nvarchar(100)
        * * Description: Competition category (e.g. Alpine Styles, Soft-Ripened)`),
    ProductName: z.string().describe(`
        * * Field Name: ProductName
        * * Display Name: Product Name
        * * SQL Data Type: nvarchar(200)
        * * Description: The entered cheese (invented product names from the cleared bank components)`),
    Result: z.union([z.literal('Bronze'), z.literal('Gold'), z.literal('None'), z.literal('Silver')]).describe(`
        * * Field Name: Result
        * * Display Name: Result
        * * SQL Data Type: nvarchar(50)
        * * Default Value: None
    * * Value List Type: List
    * * Possible Values 
    *   * Bronze
    *   * Gold
    *   * None
    *   * Silver
        * * Description: Gold, Silver, Bronze, or None`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
    Organization: z.string().nullable().describe(`
        * * Field Name: Organization
        * * Display Name: Organization
        * * SQL Data Type: nvarchar(255)`),
});

export type morecheeseeventsCompetitionEntryEntityType = z.infer<typeof morecheeseeventsCompetitionEntrySchema>;

/**
 * zod schema definition for the entity MoreCheese: Course Enrollments
 */
export const morecheeselearningCourseEnrollmentSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    EnrollKey: z.string().describe(`
        * * Field Name: EnrollKey
        * * Display Name: Enroll Key
        * * SQL Data Type: nvarchar(80)
        * * Description: Business key; UUIDs derive from it`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    CourseID: z.string().describe(`
        * * Field Name: CourseID
        * * Display Name: Course ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Courses (vwCourses.ID)`),
    EnrolledOn: z.date().describe(`
        * * Field Name: EnrolledOn
        * * Display Name: Enrolled On
        * * SQL Data Type: date
        * * Description: Enrollment date — always inside a valid membership window`),
    Status: z.union([z.literal('Completed'), z.literal('Dropped'), z.literal('InProgress')]).describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Completed
    *   * Dropped
    *   * InProgress
        * * Description: InProgress, Completed, or Dropped (completion is a calibrated outcome)`),
    CompletedOn: z.date().nullable().describe(`
        * * Field Name: CompletedOn
        * * Display Name: Completed On
        * * SQL Data Type: date
        * * Description: Completion date when Status is Completed`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
    Course: z.string().describe(`
        * * Field Name: Course
        * * Display Name: Course
        * * SQL Data Type: nvarchar(200)`),
});

export type morecheeselearningCourseEnrollmentEntityType = z.infer<typeof morecheeselearningCourseEnrollmentSchema>;

/**
 * zod schema definition for the entity MoreCheese: Courses
 */
export const morecheeselearningCourseSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    CourseKey: z.string().describe(`
        * * Field Name: CourseKey
        * * Display Name: Course Key
        * * SQL Data Type: nvarchar(50)
        * * Description: Business key; UUIDs derive from it`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Course title`),
    StartDate: z.date().describe(`
        * * Field Name: StartDate
        * * Display Name: Start Date
        * * SQL Data Type: date
        * * Description: Cohort start date`),
    DurationWeeks: z.number().describe(`
        * * Field Name: DurationWeeks
        * * Display Name: Duration Weeks
        * * SQL Data Type: int
        * * Description: Course length in weeks`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
});

export type morecheeselearningCourseEntityType = z.infer<typeof morecheeselearningCourseSchema>;

/**
 * zod schema definition for the entity MoreCheese: Data Quality Labels
 */
export const morecheesemembersDataQualityLabelSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    LabelKey: z.string().describe(`
        * * Field Name: LabelKey
        * * Display Name: Label Key
        * * SQL Data Type: nvarchar(80)`),
    DefectKind: z.union([z.literal('DuplicatePerson'), z.literal('StaleEmployer'), z.literal('TypoEmail')]).describe(`
        * * Field Name: DefectKind
        * * Display Name: Defect Kind
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * DuplicatePerson
    *   * StaleEmployer
    *   * TypoEmail
        * * Description: DuplicatePerson (RelatedPersonID = the canonical record), StaleEmployer (RelatedOrganizationID = the TRUE employer), or TypoEmail (TruthValue = the correct email)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    RelatedPersonID: z.string().nullable().describe(`
        * * Field Name: RelatedPersonID
        * * Display Name: Related Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    RelatedOrganizationID: z.string().nullable().describe(`
        * * Field Name: RelatedOrganizationID
        * * Display Name: Related Organization ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)`),
    DefectValue: z.string().nullable().describe(`
        * * Field Name: DefectValue
        * * Display Name: Defect Value
        * * SQL Data Type: nvarchar(400)
        * * Description: The defective value as it appears in the data (e.g. the typo'd email, the stale org name)`),
    TruthValue: z.string().nullable().describe(`
        * * Field Name: TruthValue
        * * Display Name: Truth Value
        * * SQL Data Type: nvarchar(400)
        * * Description: The correct value (the verifiable right answer)`),
    Notes: z.string().nullable().describe(`
        * * Field Name: Notes
        * * Display Name: Notes
        * * SQL Data Type: nvarchar(500)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
    RelatedPerson: z.string().nullable().describe(`
        * * Field Name: RelatedPerson
        * * Display Name: Related Person
        * * SQL Data Type: nvarchar(201)`),
    RelatedOrganization: z.string().nullable().describe(`
        * * Field Name: RelatedOrganization
        * * Display Name: Related Organization
        * * SQL Data Type: nvarchar(255)`),
});

export type morecheesemembersDataQualityLabelEntityType = z.infer<typeof morecheesemembersDataQualityLabelSchema>;

/**
 * zod schema definition for the entity MoreCheese: Event Registrations
 */
export const morecheeseeventsEventRegistrationSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    RegKey: z.string().describe(`
        * * Field Name: RegKey
        * * Display Name: Reg Key
        * * SQL Data Type: nvarchar(120)
        * * Description: Business key: REG-<member>-<event>[-n]; UUIDs derive from it`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    EventID: z.string().describe(`
        * * Field Name: EventID
        * * Display Name: Event ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Events (vwEvents.ID)`),
    RegisteredOn: z.date().describe(`
        * * Field Name: RegisteredOn
        * * Display Name: Registered On
        * * SQL Data Type: date
        * * Description: Registration date — always inside a valid membership window by construction`),
    Attended: z.boolean().nullable().describe(`
        * * Field Name: Attended
        * * Display Name: Attended
        * * SQL Data Type: bit
        * * Description: Whether the member showed up; NULL means the event has not happened yet`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
    Event: z.string().describe(`
        * * Field Name: Event
        * * Display Name: Event
        * * SQL Data Type: nvarchar(200)`),
});

export type morecheeseeventsEventRegistrationEntityType = z.infer<typeof morecheeseeventsEventRegistrationSchema>;

/**
 * zod schema definition for the entity MoreCheese: Events
 */
export const morecheeseeventsEventSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    EventKey: z.string().describe(`
        * * Field Name: EventKey
        * * Display Name: Event Key
        * * SQL Data Type: nvarchar(50)
        * * Description: Business key (e.g. EVT-2025-CONF); UUIDs derive from it`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Event display name`),
    EventType: z.union([z.literal('Conference'), z.literal('Webinar'), z.literal('Workshop')]).describe(`
        * * Field Name: EventType
        * * Display Name: Event Type
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Conference
    *   * Webinar
    *   * Workshop
        * * Description: Conference, Workshop, or Webinar`),
    EventDate: z.date().describe(`
        * * Field Name: EventDate
        * * Display Name: Event Date
        * * SQL Data Type: date
        * * Description: Date the event takes place`),
    IsVirtual: z.boolean().describe(`
        * * Field Name: IsVirtual
        * * Display Name: Is Virtual
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Virtual events have no venue coordinates (COVID-era conferences were virtual)`),
    IsPaid: z.boolean().describe(`
        * * Field Name: IsPaid
        * * Display Name: Is Paid
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Whether registration is billable (webinars are free)`),
    City: z.string().nullable().describe(`
        * * Field Name: City
        * * Display Name: City
        * * SQL Data Type: nvarchar(100)
        * * Description: Venue city; NULL for virtual events`),
    State: z.string().nullable().describe(`
        * * Field Name: State
        * * Display Name: State
        * * SQL Data Type: nvarchar(50)
        * * Description: Venue state; NULL for virtual events`),
    Latitude: z.number().nullable().describe(`
        * * Field Name: Latitude
        * * Display Name: Latitude
        * * SQL Data Type: decimal(9, 6)
        * * Description: Venue latitude for the events map; NULL for virtual`),
    Longitude: z.number().nullable().describe(`
        * * Field Name: Longitude
        * * Display Name: Longitude
        * * SQL Data Type: decimal(9, 6)
        * * Description: Venue longitude for the events map; NULL for virtual`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
});

export type morecheeseeventsEventEntityType = z.infer<typeof morecheeseeventsEventSchema>;

/**
 * zod schema definition for the entity MoreCheese: Member Certifications
 */
export const morecheeselearningMemberCertificationSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    MemberCertKey: z.string().describe(`
        * * Field Name: MemberCertKey
        * * Display Name: Member Cert Key
        * * SQL Data Type: nvarchar(80)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    CertificationID: z.string().describe(`
        * * Field Name: CertificationID
        * * Display Name: Certification ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Certifications (vwCertifications.ID)`),
    Status: z.union([z.literal('Awarded'), z.literal('Expired'), z.literal('InProgress'), z.literal('Withdrawn')]).describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Awarded
    *   * Expired
    *   * InProgress
    *   * Withdrawn
        * * Description: InProgress, Awarded, Expired, or Withdrawn`),
    EnrolledOn: z.date().describe(`
        * * Field Name: EnrolledOn
        * * Display Name: Enrolled On
        * * SQL Data Type: date`),
    AwardedOn: z.date().nullable().describe(`
        * * Field Name: AwardedOn
        * * Display Name: Awarded On
        * * SQL Data Type: date`),
    ExpiresOn: z.date().nullable().describe(`
        * * Field Name: ExpiresOn
        * * Display Name: Expires On
        * * SQL Data Type: date`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
    Certification: z.string().describe(`
        * * Field Name: Certification
        * * Display Name: Certification
        * * SQL Data Type: nvarchar(200)`),
});

export type morecheeselearningMemberCertificationEntityType = z.infer<typeof morecheeselearningMemberCertificationSchema>;

/**
 * zod schema definition for the entity MoreCheese: Member Profiles
 */
export const morecheesemembersMemberProfileSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    OrganizationID: z.string().nullable().describe(`
        * * Field Name: OrganizationID
        * * Display Name: Organization
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)`),
    MemberNumber: z.string().describe(`
        * * Field Name: MemberNumber
        * * Display Name: Member Number
        * * SQL Data Type: nvarchar(50)
        * * Description: Business key for the member (e.g. ICF-100217); UUIDs derive from it`),
    Segment: z.union([z.literal('Educator'), z.literal('Enthusiast'), z.literal('Producer'), z.literal('Retailer'), z.literal('Supplier')]).describe(`
        * * Field Name: Segment
        * * Display Name: Segment
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Educator
    *   * Enthusiast
    *   * Producer
    *   * Retailer
    *   * Supplier
        * * Description: Professional segment: Producer, Retailer, Supplier, Educator, or Enthusiast`),
    Region: z.union([z.literal('EU'), z.literal('NA'), z.literal('RoW')]).describe(`
        * * Field Name: Region
        * * Display Name: Region
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * EU
    *   * NA
    *   * RoW
        * * Description: Coarse geography bucket: NA, EU, or RoW`),
    Country: z.string().nullable().describe(`
        * * Field Name: Country
        * * Display Name: Country
        * * SQL Data Type: nvarchar(2)`),
    CountryName: z.string().nullable().describe(`
        * * Field Name: CountryName
        * * Display Name: Country Name
        * * SQL Data Type: nvarchar(100)`),
    City: z.string().describe(`
        * * Field Name: City
        * * Display Name: City
        * * SQL Data Type: nvarchar(100)
        * * Description: Member city (real city; drives the member map)`),
    State: z.string().describe(`
        * * Field Name: State
        * * Display Name: State
        * * SQL Data Type: nvarchar(50)
        * * Description: Member state/country code`),
    AddressLine1: z.string().nullable().describe(`
        * * Field Name: AddressLine1
        * * Display Name: Address Line 1
        * * SQL Data Type: nvarchar(200)`),
    AddressLine2: z.string().nullable().describe(`
        * * Field Name: AddressLine2
        * * Display Name: Address Line 2
        * * SQL Data Type: nvarchar(200)`),
    PostalCode: z.string().nullable().describe(`
        * * Field Name: PostalCode
        * * Display Name: Postal Code
        * * SQL Data Type: nvarchar(20)`),
    Latitude: z.number().describe(`
        * * Field Name: Latitude
        * * Display Name: Latitude
        * * SQL Data Type: decimal(9, 6)
        * * Description: Member latitude, pre-baked for the map`),
    Longitude: z.number().describe(`
        * * Field Name: Longitude
        * * Display Name: Longitude
        * * SQL Data Type: decimal(9, 6)
        * * Description: Member longitude, pre-baked for the map`),
    JoinDate: z.date().describe(`
        * * Field Name: JoinDate
        * * Display Name: Join Date
        * * SQL Data Type: date
        * * Description: Date the member first joined the federation`),
    RaceEthnicity: z.string().nullable().describe(`
        * * Field Name: RaceEthnicity
        * * Display Name: Race Ethnicity
        * * SQL Data Type: nvarchar(200)`),
    EthnicityHispanic: z.string().nullable().describe(`
        * * Field Name: EthnicityHispanic
        * * Display Name: Hispanic Ethnicity
        * * SQL Data Type: nvarchar(30)`),
    PronounSet: z.string().nullable().describe(`
        * * Field Name: PronounSet
        * * Display Name: Pronouns
        * * SQL Data Type: nvarchar(50)`),
    PrimaryLanguage: z.string().nullable().describe(`
        * * Field Name: PrimaryLanguage
        * * Display Name: Primary Language
        * * SQL Data Type: nvarchar(50)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
    Organization: z.string().nullable().describe(`
        * * Field Name: Organization
        * * Display Name: Organization
        * * SQL Data Type: nvarchar(255)`),
    __mj_Latitude: z.number().describe(`
        * * Field Name: __mj_Latitude
        * * Display Name: Mj Latitude
        * * SQL Data Type: decimal(9, 6)`),
    __mj_Longitude: z.number().describe(`
        * * Field Name: __mj_Longitude
        * * Display Name: Mj Longitude
        * * SQL Data Type: decimal(9, 6)`),
});

export type morecheesemembersMemberProfileEntityType = z.infer<typeof morecheesemembersMemberProfileSchema>;

/**
 * zod schema definition for the entity MoreCheese: Membership Periods
 */
export const morecheesemembersMembershipPeriodSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    PeriodKey: z.string().describe(`
        * * Field Name: PeriodKey
        * * Display Name: Period Key
        * * SQL Data Type: nvarchar(60)
        * * Description: Business key: <MemberNumber>-P<n>, the n-th period of that member`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    MembershipTier: z.union([z.literal('Corporate'), z.literal('Enthusiast'), z.literal('Individual'), z.literal('SmallBusiness')]).describe(`
        * * Field Name: MembershipTier
        * * Display Name: Membership Tier
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Corporate
    *   * Enthusiast
    *   * Individual
    *   * SmallBusiness
        * * Description: Tier for this period: Enthusiast, Individual, SmallBusiness, or Corporate`),
    DuesAmount: z.number().describe(`
        * * Field Name: DuesAmount
        * * Display Name: Dues Amount
        * * SQL Data Type: decimal(10, 2)
        * * Description: Dues billed for this period, in USD, per the tier lattice`),
    StartDate: z.date().describe(`
        * * Field Name: StartDate
        * * Display Name: Start Date
        * * SQL Data Type: date
        * * Description: Period start; renewals back-date so consecutive periods never gap`),
    EndDate: z.date().describe(`
        * * Field Name: EndDate
        * * Display Name: End Date
        * * SQL Data Type: date
        * * Description: Period end; member status is derived from the latest period, never stored`),
    RenewalDate: z.date().describe(`
        * * Field Name: RenewalDate
        * * Display Name: Renewal Date
        * * SQL Data Type: date
        * * Description: Date the renewal decision falls due (equals EndDate)`),
    Status: z.union([z.literal('Active'), z.literal('Cancelled'), z.literal('Lapsed'), z.literal('PendingRenewal'), z.literal('Renewed')]).describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Active
    *   * Cancelled
    *   * Lapsed
    *   * PendingRenewal
    *   * Renewed
        * * Description: Period state: Active, Renewed, Lapsed, PendingRenewal, or Cancelled — member-lifecycle state lives HERE, never on Person`),
    CancellationDate: z.date().nullable().describe(`
        * * Field Name: CancellationDate
        * * Display Name: Cancellation Date
        * * SQL Data Type: date
        * * Description: Set when a lapse passes the 2-month grace window (team rule: every lapse past grace gets a termination date)`),
    CancellationReason: z.string().nullable().describe(`
        * * Field Name: CancellationReason
        * * Display Name: Cancellation Reason
        * * SQL Data Type: nvarchar(200)
        * * Description: Why the membership ended (e.g. non-payment — employer event); carries the diagnosis for win-back stories`),
    AutoRenew: z.boolean().describe(`
        * * Field Name: AutoRenew
        * * Display Name: Auto Renew
        * * SQL Data Type: bit
        * * Default Value: 0
        * * Description: Whether this period renews automatically (card on file)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Person: z.string().describe(`
        * * Field Name: Person
        * * Display Name: Person
        * * SQL Data Type: nvarchar(201)`),
});

export type morecheesemembersMembershipPeriodEntityType = z.infer<typeof morecheesemembersMembershipPeriodSchema>;

/**
 * zod schema definition for the entity MoreCheese: Organization Profiles
 */
export const morecheesemembersOrganizationProfileSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier
        * * Default Value: newsequentialid()`),
    OrganizationID: z.string().describe(`
        * * Field Name: OrganizationID
        * * Display Name: Organization ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)`),
    OrgKey: z.string().describe(`
        * * Field Name: OrgKey
        * * Display Name: Organization Key
        * * SQL Data Type: nvarchar(50)
        * * Description: Business key for the organization (e.g. ORG-0042); UUIDs derive from it`),
    Type: z.union([z.literal('Educator'), z.literal('Producer'), z.literal('Retailer'), z.literal('Supplier')]).describe(`
        * * Field Name: Type
        * * Display Name: Type
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Educator
    *   * Producer
    *   * Retailer
    *   * Supplier
        * * Description: What the organization does in the cheese world: Producer, Retailer, Supplier, or Educator`),
    Region: z.union([z.literal('EU'), z.literal('NA'), z.literal('RoW')]).describe(`
        * * Field Name: Region
        * * Display Name: Region
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * EU
    *   * NA
    *   * RoW
        * * Description: Coarse geography bucket: NA, EU, or RoW`),
    Country: z.string().nullable().describe(`
        * * Field Name: Country
        * * Display Name: Country Code
        * * SQL Data Type: nvarchar(2)`),
    CountryName: z.string().nullable().describe(`
        * * Field Name: CountryName
        * * Display Name: Country Name
        * * SQL Data Type: nvarchar(100)`),
    City: z.string().describe(`
        * * Field Name: City
        * * Display Name: City
        * * SQL Data Type: nvarchar(100)
        * * Description: Headquarters city (real city, invented business name)`),
    State: z.string().describe(`
        * * Field Name: State
        * * Display Name: State
        * * SQL Data Type: nvarchar(50)
        * * Description: Headquarters state/country code`),
    AddressLine1: z.string().nullable().describe(`
        * * Field Name: AddressLine1
        * * Display Name: Address Line 1
        * * SQL Data Type: nvarchar(200)`),
    PostalCode: z.string().nullable().describe(`
        * * Field Name: PostalCode
        * * Display Name: Postal Code
        * * SQL Data Type: nvarchar(20)`),
    Latitude: z.number().describe(`
        * * Field Name: Latitude
        * * Display Name: Latitude
        * * SQL Data Type: decimal(9, 6)
        * * Description: Headquarters latitude, pre-baked for the map (no live geocoding)`),
    Longitude: z.number().describe(`
        * * Field Name: Longitude
        * * Display Name: Longitude
        * * SQL Data Type: decimal(9, 6)
        * * Description: Headquarters longitude, pre-baked for the map (no live geocoding)`),
    LifecycleEventKind: z.union([z.literal('Acquired'), z.literal('Dissolved'), z.literal('ProgramCut')]).nullable().describe(`
        * * Field Name: LifecycleEventKind
        * * Display Name: Lifecycle Event
        * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Acquired
    *   * Dissolved
    *   * ProgramCut
        * * Description: The org-level shock, if any: Dissolved, Acquired, or ProgramCut — the driver behind employer-related churn`),
    LifecycleEventYear: z.number().nullable().describe(`
        * * Field Name: LifecycleEventYear
        * * Display Name: Event Year
        * * SQL Data Type: int
        * * Description: Year the lifecycle event happened`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit
        * * Default Value: 1
        * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary`),
    __mj_CreatedAt: z.date().describe(`
        * * Field Name: __mj_CreatedAt
        * * Display Name: Created At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    __mj_UpdatedAt: z.date().describe(`
        * * Field Name: __mj_UpdatedAt
        * * Display Name: Updated At
        * * SQL Data Type: datetimeoffset
        * * Default Value: getutcdate()`),
    Organization: z.string().describe(`
        * * Field Name: Organization
        * * Display Name: Organization Name
        * * SQL Data Type: nvarchar(255)`),
    __mj_Latitude: z.number().describe(`
        * * Field Name: __mj_Latitude
        * * Display Name: Mj Latitude
        * * SQL Data Type: decimal(9, 6)`),
    __mj_Longitude: z.number().describe(`
        * * Field Name: __mj_Longitude
        * * Display Name: Mj Longitude
        * * SQL Data Type: decimal(9, 6)`),
});

export type morecheesemembersOrganizationProfileEntityType = z.infer<typeof morecheesemembersOrganizationProfileSchema>;
 
 

/**
 * MoreCheese: Advocacy Actions - strongly typed entity sub-class
 * * Schema: morecheese_members
 * * Base Table: AdvocacyAction
 * * Base View: vwAdvocacyActions
 * * @description Legislative engagement actions — the advocacy-shaped component of member engagement
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Advocacy Actions')
export class morecheesemembersAdvocacyActionEntity extends BaseEntity<morecheesemembersAdvocacyActionEntityType> {
    /**
    * Loads the MoreCheese: Advocacy Actions record from the database
    * @param ID: string - primary key value to load the MoreCheese: Advocacy Actions record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheesemembersAdvocacyActionEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ActionKey
    * * Display Name: Action Key
    * * SQL Data Type: nvarchar(80)
    */
    get ActionKey(): string {
        return this.Get('ActionKey');
    }
    set ActionKey(value: string) {
        this.Set('ActionKey', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: ActionDate
    * * Display Name: Action Date
    * * SQL Data Type: date
    */
    get ActionDate(): Date {
        return this.Get('ActionDate');
    }
    set ActionDate(value: Date) {
        this.Set('ActionDate', value);
    }

    /**
    * * Field Name: Kind
    * * Display Name: Kind
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * CoalitionMeeting
    *   * LetterCampaign
    *   * PetitionSignature
    *   * Testimony
    * * Description: LetterCampaign, PetitionSignature, Testimony, or CoalitionMeeting
    */
    get Kind(): 'CoalitionMeeting' | 'LetterCampaign' | 'PetitionSignature' | 'Testimony' {
        return this.Get('Kind');
    }
    set Kind(value: 'CoalitionMeeting' | 'LetterCampaign' | 'PetitionSignature' | 'Testimony') {
        this.Set('Kind', value);
    }

    /**
    * * Field Name: Topic
    * * Display Name: Topic
    * * SQL Data Type: nvarchar(200)
    */
    get Topic(): string {
        return this.Get('Topic');
    }
    set Topic(value: string) {
        this.Set('Topic', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }
}


/**
 * MoreCheese: Certifications - strongly typed entity sub-class
 * * Schema: morecheese_learning
 * * Base Table: Certification
 * * Base View: vwCertifications
 * * @description The credential catalog (CCP, sensory evaluation, food safety)
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Certifications')
export class morecheeselearningCertificationEntity extends BaseEntity<morecheeselearningCertificationEntityType> {
    /**
    * Loads the MoreCheese: Certifications record from the database
    * @param ID: string - primary key value to load the MoreCheese: Certifications record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeselearningCertificationEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: CertKey
    * * Display Name: Cert Key
    * * SQL Data Type: nvarchar(50)
    * * Description: Business key (e.g. CERT-CCP)
    */
    get CertKey(): string {
        return this.Get('CertKey');
    }
    set CertKey(value: string) {
        this.Set('CertKey', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: Description
    * * Display Name: Description
    * * SQL Data Type: nvarchar(MAX)
    */
    get Description(): string | null {
        return this.Get('Description');
    }
    set Description(value: string | null) {
        this.Set('Description', value);
    }

    /**
    * * Field Name: ValidYears
    * * Display Name: Valid Years
    * * SQL Data Type: int
    * * Default Value: 3
    * * Description: Years the credential stays valid after award
    */
    get ValidYears(): number {
        return this.Get('ValidYears');
    }
    set ValidYears(value: number) {
        this.Set('ValidYears', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }
}


/**
 * MoreCheese: Competition Entries - strongly typed entity sub-class
 * * Schema: morecheese_events
 * * Base Table: CompetitionEntry
 * * Base View: vwCompetitionEntries
 * * @description Annual competition entries; org membership is the eligibility gate, results are medal or none
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Competition Entries')
export class morecheeseeventsCompetitionEntryEntity extends BaseEntity<morecheeseeventsCompetitionEntryEntityType> {
    /**
    * Loads the MoreCheese: Competition Entries record from the database
    * @param ID: string - primary key value to load the MoreCheese: Competition Entries record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeseeventsCompetitionEntryEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: EntryKey
    * * Display Name: Entry Key
    * * SQL Data Type: nvarchar(80)
    */
    get EntryKey(): string {
        return this.Get('EntryKey');
    }
    set EntryKey(value: string) {
        this.Set('EntryKey', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: OrganizationID
    * * Display Name: Organization ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)
    */
    get OrganizationID(): string | null {
        return this.Get('OrganizationID');
    }
    set OrganizationID(value: string | null) {
        this.Set('OrganizationID', value);
    }

    /**
    * * Field Name: EntryYear
    * * Display Name: Entry Year
    * * SQL Data Type: int
    */
    get EntryYear(): number {
        return this.Get('EntryYear');
    }
    set EntryYear(value: number) {
        this.Set('EntryYear', value);
    }

    /**
    * * Field Name: Category
    * * Display Name: Category
    * * SQL Data Type: nvarchar(100)
    * * Description: Competition category (e.g. Alpine Styles, Soft-Ripened)
    */
    get Category(): string {
        return this.Get('Category');
    }
    set Category(value: string) {
        this.Set('Category', value);
    }

    /**
    * * Field Name: ProductName
    * * Display Name: Product Name
    * * SQL Data Type: nvarchar(200)
    * * Description: The entered cheese (invented product names from the cleared bank components)
    */
    get ProductName(): string {
        return this.Get('ProductName');
    }
    set ProductName(value: string) {
        this.Set('ProductName', value);
    }

    /**
    * * Field Name: Result
    * * Display Name: Result
    * * SQL Data Type: nvarchar(50)
    * * Default Value: None
    * * Value List Type: List
    * * Possible Values 
    *   * Bronze
    *   * Gold
    *   * None
    *   * Silver
    * * Description: Gold, Silver, Bronze, or None
    */
    get Result(): 'Bronze' | 'Gold' | 'None' | 'Silver' {
        return this.Get('Result');
    }
    set Result(value: 'Bronze' | 'Gold' | 'None' | 'Silver') {
        this.Set('Result', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: Organization
    * * Display Name: Organization
    * * SQL Data Type: nvarchar(255)
    */
    get Organization(): string | null {
        return this.Get('Organization');
    }
}


/**
 * MoreCheese: Course Enrollments - strongly typed entity sub-class
 * * Schema: morecheese_learning
 * * Base Table: CourseEnrollment
 * * Base View: vwCourseEnrollments
 * * @description Course enrollments with completion outcomes
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Course Enrollments')
export class morecheeselearningCourseEnrollmentEntity extends BaseEntity<morecheeselearningCourseEnrollmentEntityType> {
    /**
    * Loads the MoreCheese: Course Enrollments record from the database
    * @param ID: string - primary key value to load the MoreCheese: Course Enrollments record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeselearningCourseEnrollmentEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: EnrollKey
    * * Display Name: Enroll Key
    * * SQL Data Type: nvarchar(80)
    * * Description: Business key; UUIDs derive from it
    */
    get EnrollKey(): string {
        return this.Get('EnrollKey');
    }
    set EnrollKey(value: string) {
        this.Set('EnrollKey', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: CourseID
    * * Display Name: Course ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: Courses (vwCourses.ID)
    */
    get CourseID(): string {
        return this.Get('CourseID');
    }
    set CourseID(value: string) {
        this.Set('CourseID', value);
    }

    /**
    * * Field Name: EnrolledOn
    * * Display Name: Enrolled On
    * * SQL Data Type: date
    * * Description: Enrollment date — always inside a valid membership window
    */
    get EnrolledOn(): Date {
        return this.Get('EnrolledOn');
    }
    set EnrolledOn(value: Date) {
        this.Set('EnrolledOn', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Completed
    *   * Dropped
    *   * InProgress
    * * Description: InProgress, Completed, or Dropped (completion is a calibrated outcome)
    */
    get Status(): 'Completed' | 'Dropped' | 'InProgress' {
        return this.Get('Status');
    }
    set Status(value: 'Completed' | 'Dropped' | 'InProgress') {
        this.Set('Status', value);
    }

    /**
    * * Field Name: CompletedOn
    * * Display Name: Completed On
    * * SQL Data Type: date
    * * Description: Completion date when Status is Completed
    */
    get CompletedOn(): Date | null {
        return this.Get('CompletedOn');
    }
    set CompletedOn(value: Date | null) {
        this.Set('CompletedOn', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: Course
    * * Display Name: Course
    * * SQL Data Type: nvarchar(200)
    */
    get Course(): string {
        return this.Get('Course');
    }
}


/**
 * MoreCheese: Courses - strongly typed entity sub-class
 * * Schema: morecheese_learning
 * * Base Table: Course
 * * Base View: vwCourses
 * * @description The learning catalog
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Courses')
export class morecheeselearningCourseEntity extends BaseEntity<morecheeselearningCourseEntityType> {
    /**
    * Loads the MoreCheese: Courses record from the database
    * @param ID: string - primary key value to load the MoreCheese: Courses record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeselearningCourseEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: CourseKey
    * * Display Name: Course Key
    * * SQL Data Type: nvarchar(50)
    * * Description: Business key; UUIDs derive from it
    */
    get CourseKey(): string {
        return this.Get('CourseKey');
    }
    set CourseKey(value: string) {
        this.Set('CourseKey', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Course title
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: StartDate
    * * Display Name: Start Date
    * * SQL Data Type: date
    * * Description: Cohort start date
    */
    get StartDate(): Date {
        return this.Get('StartDate');
    }
    set StartDate(value: Date) {
        this.Set('StartDate', value);
    }

    /**
    * * Field Name: DurationWeeks
    * * Display Name: Duration Weeks
    * * SQL Data Type: int
    * * Description: Course length in weeks
    */
    get DurationWeeks(): number {
        return this.Get('DurationWeeks');
    }
    set DurationWeeks(value: number) {
        this.Set('DurationWeeks', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }
}


/**
 * MoreCheese: Data Quality Labels - strongly typed entity sub-class
 * * Schema: morecheese_members
 * * Base Table: DataQualityLabel
 * * Base View: vwDataQualityLabels
 * * @description Labeled ground truth for deliberately injected data defects — every duplicate, stale record, and typo the generator planted, with the correct answer. Data-quality demos verify against this table.
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Data Quality Labels')
export class morecheesemembersDataQualityLabelEntity extends BaseEntity<morecheesemembersDataQualityLabelEntityType> {
    /**
    * Loads the MoreCheese: Data Quality Labels record from the database
    * @param ID: string - primary key value to load the MoreCheese: Data Quality Labels record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheesemembersDataQualityLabelEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: LabelKey
    * * Display Name: Label Key
    * * SQL Data Type: nvarchar(80)
    */
    get LabelKey(): string {
        return this.Get('LabelKey');
    }
    set LabelKey(value: string) {
        this.Set('LabelKey', value);
    }

    /**
    * * Field Name: DefectKind
    * * Display Name: Defect Kind
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * DuplicatePerson
    *   * StaleEmployer
    *   * TypoEmail
    * * Description: DuplicatePerson (RelatedPersonID = the canonical record), StaleEmployer (RelatedOrganizationID = the TRUE employer), or TypoEmail (TruthValue = the correct email)
    */
    get DefectKind(): 'DuplicatePerson' | 'StaleEmployer' | 'TypoEmail' {
        return this.Get('DefectKind');
    }
    set DefectKind(value: 'DuplicatePerson' | 'StaleEmployer' | 'TypoEmail') {
        this.Set('DefectKind', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: RelatedPersonID
    * * Display Name: Related Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get RelatedPersonID(): string | null {
        return this.Get('RelatedPersonID');
    }
    set RelatedPersonID(value: string | null) {
        this.Set('RelatedPersonID', value);
    }

    /**
    * * Field Name: RelatedOrganizationID
    * * Display Name: Related Organization ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)
    */
    get RelatedOrganizationID(): string | null {
        return this.Get('RelatedOrganizationID');
    }
    set RelatedOrganizationID(value: string | null) {
        this.Set('RelatedOrganizationID', value);
    }

    /**
    * * Field Name: DefectValue
    * * Display Name: Defect Value
    * * SQL Data Type: nvarchar(400)
    * * Description: The defective value as it appears in the data (e.g. the typo'd email, the stale org name)
    */
    get DefectValue(): string | null {
        return this.Get('DefectValue');
    }
    set DefectValue(value: string | null) {
        this.Set('DefectValue', value);
    }

    /**
    * * Field Name: TruthValue
    * * Display Name: Truth Value
    * * SQL Data Type: nvarchar(400)
    * * Description: The correct value (the verifiable right answer)
    */
    get TruthValue(): string | null {
        return this.Get('TruthValue');
    }
    set TruthValue(value: string | null) {
        this.Set('TruthValue', value);
    }

    /**
    * * Field Name: Notes
    * * Display Name: Notes
    * * SQL Data Type: nvarchar(500)
    */
    get Notes(): string | null {
        return this.Get('Notes');
    }
    set Notes(value: string | null) {
        this.Set('Notes', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: RelatedPerson
    * * Display Name: Related Person
    * * SQL Data Type: nvarchar(201)
    */
    get RelatedPerson(): string | null {
        return this.Get('RelatedPerson');
    }

    /**
    * * Field Name: RelatedOrganization
    * * Display Name: Related Organization
    * * SQL Data Type: nvarchar(255)
    */
    get RelatedOrganization(): string | null {
        return this.Get('RelatedOrganization');
    }
}


/**
 * MoreCheese: Event Registrations - strongly typed entity sub-class
 * * Schema: morecheese_events
 * * Base Table: EventRegistration
 * * Base View: vwEventRegistrations
 * * @description Event registrations; Attended NULL means the event has not occurred yet
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Event Registrations')
export class morecheeseeventsEventRegistrationEntity extends BaseEntity<morecheeseeventsEventRegistrationEntityType> {
    /**
    * Loads the MoreCheese: Event Registrations record from the database
    * @param ID: string - primary key value to load the MoreCheese: Event Registrations record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeseeventsEventRegistrationEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: RegKey
    * * Display Name: Reg Key
    * * SQL Data Type: nvarchar(120)
    * * Description: Business key: REG-<member>-<event>[-n]; UUIDs derive from it
    */
    get RegKey(): string {
        return this.Get('RegKey');
    }
    set RegKey(value: string) {
        this.Set('RegKey', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: EventID
    * * Display Name: Event ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: Events (vwEvents.ID)
    */
    get EventID(): string {
        return this.Get('EventID');
    }
    set EventID(value: string) {
        this.Set('EventID', value);
    }

    /**
    * * Field Name: RegisteredOn
    * * Display Name: Registered On
    * * SQL Data Type: date
    * * Description: Registration date — always inside a valid membership window by construction
    */
    get RegisteredOn(): Date {
        return this.Get('RegisteredOn');
    }
    set RegisteredOn(value: Date) {
        this.Set('RegisteredOn', value);
    }

    /**
    * * Field Name: Attended
    * * Display Name: Attended
    * * SQL Data Type: bit
    * * Description: Whether the member showed up; NULL means the event has not happened yet
    */
    get Attended(): boolean | null {
        return this.Get('Attended');
    }
    set Attended(value: boolean | null) {
        this.Set('Attended', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: Event
    * * Display Name: Event
    * * SQL Data Type: nvarchar(200)
    */
    get Event(): string {
        return this.Get('Event');
    }
}


/**
 * MoreCheese: Events - strongly typed entity sub-class
 * * Schema: morecheese_events
 * * Base Table: Event
 * * Base View: vwEvents
 * * @description Conferences, workshops, and webinars with venue coordinates for the member map
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Events')
export class morecheeseeventsEventEntity extends BaseEntity<morecheeseeventsEventEntityType> {
    /**
    * Loads the MoreCheese: Events record from the database
    * @param ID: string - primary key value to load the MoreCheese: Events record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeseeventsEventEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: EventKey
    * * Display Name: Event Key
    * * SQL Data Type: nvarchar(50)
    * * Description: Business key (e.g. EVT-2025-CONF); UUIDs derive from it
    */
    get EventKey(): string {
        return this.Get('EventKey');
    }
    set EventKey(value: string) {
        this.Set('EventKey', value);
    }

    /**
    * * Field Name: Name
    * * Display Name: Name
    * * SQL Data Type: nvarchar(200)
    * * Description: Event display name
    */
    get Name(): string {
        return this.Get('Name');
    }
    set Name(value: string) {
        this.Set('Name', value);
    }

    /**
    * * Field Name: EventType
    * * Display Name: Event Type
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Conference
    *   * Webinar
    *   * Workshop
    * * Description: Conference, Workshop, or Webinar
    */
    get EventType(): 'Conference' | 'Webinar' | 'Workshop' {
        return this.Get('EventType');
    }
    set EventType(value: 'Conference' | 'Webinar' | 'Workshop') {
        this.Set('EventType', value);
    }

    /**
    * * Field Name: EventDate
    * * Display Name: Event Date
    * * SQL Data Type: date
    * * Description: Date the event takes place
    */
    get EventDate(): Date {
        return this.Get('EventDate');
    }
    set EventDate(value: Date) {
        this.Set('EventDate', value);
    }

    /**
    * * Field Name: IsVirtual
    * * Display Name: Is Virtual
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Virtual events have no venue coordinates (COVID-era conferences were virtual)
    */
    get IsVirtual(): boolean {
        return this.Get('IsVirtual');
    }
    set IsVirtual(value: boolean) {
        this.Set('IsVirtual', value);
    }

    /**
    * * Field Name: IsPaid
    * * Display Name: Is Paid
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Whether registration is billable (webinars are free)
    */
    get IsPaid(): boolean {
        return this.Get('IsPaid');
    }
    set IsPaid(value: boolean) {
        this.Set('IsPaid', value);
    }

    /**
    * * Field Name: City
    * * Display Name: City
    * * SQL Data Type: nvarchar(100)
    * * Description: Venue city; NULL for virtual events
    */
    get City(): string | null {
        return this.Get('City');
    }
    set City(value: string | null) {
        this.Set('City', value);
    }

    /**
    * * Field Name: State
    * * Display Name: State
    * * SQL Data Type: nvarchar(50)
    * * Description: Venue state; NULL for virtual events
    */
    get State(): string | null {
        return this.Get('State');
    }
    set State(value: string | null) {
        this.Set('State', value);
    }

    /**
    * * Field Name: Latitude
    * * Display Name: Latitude
    * * SQL Data Type: decimal(9, 6)
    * * Description: Venue latitude for the events map; NULL for virtual
    */
    get Latitude(): number | null {
        return this.Get('Latitude');
    }
    set Latitude(value: number | null) {
        this.Set('Latitude', value);
    }

    /**
    * * Field Name: Longitude
    * * Display Name: Longitude
    * * SQL Data Type: decimal(9, 6)
    * * Description: Venue longitude for the events map; NULL for virtual
    */
    get Longitude(): number | null {
        return this.Get('Longitude');
    }
    set Longitude(value: number | null) {
        this.Set('Longitude', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }
}


/**
 * MoreCheese: Member Certifications - strongly typed entity sub-class
 * * Schema: morecheese_learning
 * * Base Table: MemberCertification
 * * Base View: vwMemberCertifications
 * * @description A member's certification journey: enrolled, awarded (with expiry), expired, or withdrawn
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Member Certifications')
export class morecheeselearningMemberCertificationEntity extends BaseEntity<morecheeselearningMemberCertificationEntityType> {
    /**
    * Loads the MoreCheese: Member Certifications record from the database
    * @param ID: string - primary key value to load the MoreCheese: Member Certifications record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeselearningMemberCertificationEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: MemberCertKey
    * * Display Name: Member Cert Key
    * * SQL Data Type: nvarchar(80)
    */
    get MemberCertKey(): string {
        return this.Get('MemberCertKey');
    }
    set MemberCertKey(value: string) {
        this.Set('MemberCertKey', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: CertificationID
    * * Display Name: Certification ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: Certifications (vwCertifications.ID)
    */
    get CertificationID(): string {
        return this.Get('CertificationID');
    }
    set CertificationID(value: string) {
        this.Set('CertificationID', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Awarded
    *   * Expired
    *   * InProgress
    *   * Withdrawn
    * * Description: InProgress, Awarded, Expired, or Withdrawn
    */
    get Status(): 'Awarded' | 'Expired' | 'InProgress' | 'Withdrawn' {
        return this.Get('Status');
    }
    set Status(value: 'Awarded' | 'Expired' | 'InProgress' | 'Withdrawn') {
        this.Set('Status', value);
    }

    /**
    * * Field Name: EnrolledOn
    * * Display Name: Enrolled On
    * * SQL Data Type: date
    */
    get EnrolledOn(): Date {
        return this.Get('EnrolledOn');
    }
    set EnrolledOn(value: Date) {
        this.Set('EnrolledOn', value);
    }

    /**
    * * Field Name: AwardedOn
    * * Display Name: Awarded On
    * * SQL Data Type: date
    */
    get AwardedOn(): Date | null {
        return this.Get('AwardedOn');
    }
    set AwardedOn(value: Date | null) {
        this.Set('AwardedOn', value);
    }

    /**
    * * Field Name: ExpiresOn
    * * Display Name: Expires On
    * * SQL Data Type: date
    */
    get ExpiresOn(): Date | null {
        return this.Get('ExpiresOn');
    }
    set ExpiresOn(value: Date | null) {
        this.Set('ExpiresOn', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: Certification
    * * Display Name: Certification
    * * SQL Data Type: nvarchar(200)
    */
    get Certification(): string {
        return this.Get('Certification');
    }
}


/**
 * MoreCheese: Member Profiles - strongly typed entity sub-class
 * * Schema: morecheese_members
 * * Base Table: MemberProfile
 * * Base View: vwMemberProfiles
 * * @description Member-specific extension of bizapps-common Person: member number, segment, geography, join date (v2-plan §4.2)
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Member Profiles')
export class morecheesemembersMemberProfileEntity extends BaseEntity<morecheesemembersMemberProfileEntityType> {
    /**
    * Loads the MoreCheese: Member Profiles record from the database
    * @param ID: string - primary key value to load the MoreCheese: Member Profiles record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheesemembersMemberProfileEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: OrganizationID
    * * Display Name: Organization
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)
    */
    get OrganizationID(): string | null {
        return this.Get('OrganizationID');
    }
    set OrganizationID(value: string | null) {
        this.Set('OrganizationID', value);
    }

    /**
    * * Field Name: MemberNumber
    * * Display Name: Member Number
    * * SQL Data Type: nvarchar(50)
    * * Description: Business key for the member (e.g. ICF-100217); UUIDs derive from it
    */
    get MemberNumber(): string {
        return this.Get('MemberNumber');
    }
    set MemberNumber(value: string) {
        this.Set('MemberNumber', value);
    }

    /**
    * * Field Name: Segment
    * * Display Name: Segment
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Educator
    *   * Enthusiast
    *   * Producer
    *   * Retailer
    *   * Supplier
    * * Description: Professional segment: Producer, Retailer, Supplier, Educator, or Enthusiast
    */
    get Segment(): 'Educator' | 'Enthusiast' | 'Producer' | 'Retailer' | 'Supplier' {
        return this.Get('Segment');
    }
    set Segment(value: 'Educator' | 'Enthusiast' | 'Producer' | 'Retailer' | 'Supplier') {
        this.Set('Segment', value);
    }

    /**
    * * Field Name: Region
    * * Display Name: Region
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * EU
    *   * NA
    *   * RoW
    * * Description: Coarse geography bucket: NA, EU, or RoW
    */
    get Region(): 'EU' | 'NA' | 'RoW' {
        return this.Get('Region');
    }
    set Region(value: 'EU' | 'NA' | 'RoW') {
        this.Set('Region', value);
    }

    /**
    * * Field Name: Country
    * * Display Name: Country
    * * SQL Data Type: nvarchar(2)
    */
    get Country(): string | null {
        return this.Get('Country');
    }
    set Country(value: string | null) {
        this.Set('Country', value);
    }

    /**
    * * Field Name: CountryName
    * * Display Name: Country Name
    * * SQL Data Type: nvarchar(100)
    */
    get CountryName(): string | null {
        return this.Get('CountryName');
    }
    set CountryName(value: string | null) {
        this.Set('CountryName', value);
    }

    /**
    * * Field Name: City
    * * Display Name: City
    * * SQL Data Type: nvarchar(100)
    * * Description: Member city (real city; drives the member map)
    */
    get City(): string {
        return this.Get('City');
    }
    set City(value: string) {
        this.Set('City', value);
    }

    /**
    * * Field Name: State
    * * Display Name: State
    * * SQL Data Type: nvarchar(50)
    * * Description: Member state/country code
    */
    get State(): string {
        return this.Get('State');
    }
    set State(value: string) {
        this.Set('State', value);
    }

    /**
    * * Field Name: AddressLine1
    * * Display Name: Address Line 1
    * * SQL Data Type: nvarchar(200)
    */
    get AddressLine1(): string | null {
        return this.Get('AddressLine1');
    }
    set AddressLine1(value: string | null) {
        this.Set('AddressLine1', value);
    }

    /**
    * * Field Name: AddressLine2
    * * Display Name: Address Line 2
    * * SQL Data Type: nvarchar(200)
    */
    get AddressLine2(): string | null {
        return this.Get('AddressLine2');
    }
    set AddressLine2(value: string | null) {
        this.Set('AddressLine2', value);
    }

    /**
    * * Field Name: PostalCode
    * * Display Name: Postal Code
    * * SQL Data Type: nvarchar(20)
    */
    get PostalCode(): string | null {
        return this.Get('PostalCode');
    }
    set PostalCode(value: string | null) {
        this.Set('PostalCode', value);
    }

    /**
    * * Field Name: Latitude
    * * Display Name: Latitude
    * * SQL Data Type: decimal(9, 6)
    * * Description: Member latitude, pre-baked for the map
    */
    get Latitude(): number {
        return this.Get('Latitude');
    }
    set Latitude(value: number) {
        this.Set('Latitude', value);
    }

    /**
    * * Field Name: Longitude
    * * Display Name: Longitude
    * * SQL Data Type: decimal(9, 6)
    * * Description: Member longitude, pre-baked for the map
    */
    get Longitude(): number {
        return this.Get('Longitude');
    }
    set Longitude(value: number) {
        this.Set('Longitude', value);
    }

    /**
    * * Field Name: JoinDate
    * * Display Name: Join Date
    * * SQL Data Type: date
    * * Description: Date the member first joined the federation
    */
    get JoinDate(): Date {
        return this.Get('JoinDate');
    }
    set JoinDate(value: Date) {
        this.Set('JoinDate', value);
    }

    /**
    * * Field Name: RaceEthnicity
    * * Display Name: Race Ethnicity
    * * SQL Data Type: nvarchar(200)
    */
    get RaceEthnicity(): string | null {
        return this.Get('RaceEthnicity');
    }
    set RaceEthnicity(value: string | null) {
        this.Set('RaceEthnicity', value);
    }

    /**
    * * Field Name: EthnicityHispanic
    * * Display Name: Hispanic Ethnicity
    * * SQL Data Type: nvarchar(30)
    */
    get EthnicityHispanic(): string | null {
        return this.Get('EthnicityHispanic');
    }
    set EthnicityHispanic(value: string | null) {
        this.Set('EthnicityHispanic', value);
    }

    /**
    * * Field Name: PronounSet
    * * Display Name: Pronouns
    * * SQL Data Type: nvarchar(50)
    */
    get PronounSet(): string | null {
        return this.Get('PronounSet');
    }
    set PronounSet(value: string | null) {
        this.Set('PronounSet', value);
    }

    /**
    * * Field Name: PrimaryLanguage
    * * Display Name: Primary Language
    * * SQL Data Type: nvarchar(50)
    */
    get PrimaryLanguage(): string | null {
        return this.Get('PrimaryLanguage');
    }
    set PrimaryLanguage(value: string | null) {
        this.Set('PrimaryLanguage', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: Organization
    * * Display Name: Organization
    * * SQL Data Type: nvarchar(255)
    */
    get Organization(): string | null {
        return this.Get('Organization');
    }

    /**
    * * Field Name: __mj_Latitude
    * * Display Name: Mj Latitude
    * * SQL Data Type: decimal(9, 6)
    */
    get __mj_Latitude(): number {
        return this.Get('__mj_Latitude');
    }

    /**
    * * Field Name: __mj_Longitude
    * * Display Name: Mj Longitude
    * * SQL Data Type: decimal(9, 6)
    */
    get __mj_Longitude(): number {
        return this.Get('__mj_Longitude');
    }
}


/**
 * MoreCheese: Membership Periods - strongly typed entity sub-class
 * * Schema: morecheese_members
 * * Base Table: MembershipPeriod
 * * Base View: vwMembershipPeriods
 * * @description One row per membership cycle; member status is derived from the latest period. Decomposes into bizapps-orders Subscription + renewal Orders when that app ships
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Membership Periods')
export class morecheesemembersMembershipPeriodEntity extends BaseEntity<morecheesemembersMembershipPeriodEntityType> {
    /**
    * Loads the MoreCheese: Membership Periods record from the database
    * @param ID: string - primary key value to load the MoreCheese: Membership Periods record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheesemembersMembershipPeriodEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: PeriodKey
    * * Display Name: Period Key
    * * SQL Data Type: nvarchar(60)
    * * Description: Business key: <MemberNumber>-P<n>, the n-th period of that member
    */
    get PeriodKey(): string {
        return this.Get('PeriodKey');
    }
    set PeriodKey(value: string) {
        this.Set('PeriodKey', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: MembershipTier
    * * Display Name: Membership Tier
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Corporate
    *   * Enthusiast
    *   * Individual
    *   * SmallBusiness
    * * Description: Tier for this period: Enthusiast, Individual, SmallBusiness, or Corporate
    */
    get MembershipTier(): 'Corporate' | 'Enthusiast' | 'Individual' | 'SmallBusiness' {
        return this.Get('MembershipTier');
    }
    set MembershipTier(value: 'Corporate' | 'Enthusiast' | 'Individual' | 'SmallBusiness') {
        this.Set('MembershipTier', value);
    }

    /**
    * * Field Name: DuesAmount
    * * Display Name: Dues Amount
    * * SQL Data Type: decimal(10, 2)
    * * Description: Dues billed for this period, in USD, per the tier lattice
    */
    get DuesAmount(): number {
        return this.Get('DuesAmount');
    }
    set DuesAmount(value: number) {
        this.Set('DuesAmount', value);
    }

    /**
    * * Field Name: StartDate
    * * Display Name: Start Date
    * * SQL Data Type: date
    * * Description: Period start; renewals back-date so consecutive periods never gap
    */
    get StartDate(): Date {
        return this.Get('StartDate');
    }
    set StartDate(value: Date) {
        this.Set('StartDate', value);
    }

    /**
    * * Field Name: EndDate
    * * Display Name: End Date
    * * SQL Data Type: date
    * * Description: Period end; member status is derived from the latest period, never stored
    */
    get EndDate(): Date {
        return this.Get('EndDate');
    }
    set EndDate(value: Date) {
        this.Set('EndDate', value);
    }

    /**
    * * Field Name: RenewalDate
    * * Display Name: Renewal Date
    * * SQL Data Type: date
    * * Description: Date the renewal decision falls due (equals EndDate)
    */
    get RenewalDate(): Date {
        return this.Get('RenewalDate');
    }
    set RenewalDate(value: Date) {
        this.Set('RenewalDate', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Active
    *   * Cancelled
    *   * Lapsed
    *   * PendingRenewal
    *   * Renewed
    * * Description: Period state: Active, Renewed, Lapsed, PendingRenewal, or Cancelled — member-lifecycle state lives HERE, never on Person
    */
    get Status(): 'Active' | 'Cancelled' | 'Lapsed' | 'PendingRenewal' | 'Renewed' {
        return this.Get('Status');
    }
    set Status(value: 'Active' | 'Cancelled' | 'Lapsed' | 'PendingRenewal' | 'Renewed') {
        this.Set('Status', value);
    }

    /**
    * * Field Name: CancellationDate
    * * Display Name: Cancellation Date
    * * SQL Data Type: date
    * * Description: Set when a lapse passes the 2-month grace window (team rule: every lapse past grace gets a termination date)
    */
    get CancellationDate(): Date | null {
        return this.Get('CancellationDate');
    }
    set CancellationDate(value: Date | null) {
        this.Set('CancellationDate', value);
    }

    /**
    * * Field Name: CancellationReason
    * * Display Name: Cancellation Reason
    * * SQL Data Type: nvarchar(200)
    * * Description: Why the membership ended (e.g. non-payment — employer event); carries the diagnosis for win-back stories
    */
    get CancellationReason(): string | null {
        return this.Get('CancellationReason');
    }
    set CancellationReason(value: string | null) {
        this.Set('CancellationReason', value);
    }

    /**
    * * Field Name: AutoRenew
    * * Display Name: Auto Renew
    * * SQL Data Type: bit
    * * Default Value: 0
    * * Description: Whether this period renews automatically (card on file)
    */
    get AutoRenew(): boolean {
        return this.Get('AutoRenew');
    }
    set AutoRenew(value: boolean) {
        this.Set('AutoRenew', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Person
    * * Display Name: Person
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }
}


/**
 * MoreCheese: Organization Profiles - strongly typed entity sub-class
 * * Schema: morecheese_members
 * * Base Table: OrganizationProfile
 * * Base View: vwOrganizationProfiles
 * * @description Org-specific extension of bizapps-common Organization: demo geography and the lifecycle events (dissolution/acquisition/program cut) that drive employer-related churn
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Organization Profiles')
export class morecheesemembersOrganizationProfileEntity extends BaseEntity<morecheesemembersOrganizationProfileEntityType> {
    /**
    * Loads the MoreCheese: Organization Profiles record from the database
    * @param ID: string - primary key value to load the MoreCheese: Organization Profiles record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheesemembersOrganizationProfileEntity
    * @method
    * @override
    */
    public async Load(ID: string, EntityRelationshipsToLoad?: string[]) : Promise<boolean> {
        const compositeKey: CompositeKey = new CompositeKey();
        compositeKey.KeyValuePairs.push({ FieldName: 'ID', Value: ID });
        return await super.InnerLoad(compositeKey, EntityRelationshipsToLoad);
    }

    /**
    * * Field Name: ID
    * * Display Name: ID
    * * SQL Data Type: uniqueidentifier
    * * Default Value: newsequentialid()
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: OrganizationID
    * * Display Name: Organization ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MJ_BizApps_Common: Organizations (vwOrganizations.ID)
    */
    get OrganizationID(): string {
        return this.Get('OrganizationID');
    }
    set OrganizationID(value: string) {
        this.Set('OrganizationID', value);
    }

    /**
    * * Field Name: OrgKey
    * * Display Name: Organization Key
    * * SQL Data Type: nvarchar(50)
    * * Description: Business key for the organization (e.g. ORG-0042); UUIDs derive from it
    */
    get OrgKey(): string {
        return this.Get('OrgKey');
    }
    set OrgKey(value: string) {
        this.Set('OrgKey', value);
    }

    /**
    * * Field Name: Type
    * * Display Name: Type
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Educator
    *   * Producer
    *   * Retailer
    *   * Supplier
    * * Description: What the organization does in the cheese world: Producer, Retailer, Supplier, or Educator
    */
    get Type(): 'Educator' | 'Producer' | 'Retailer' | 'Supplier' {
        return this.Get('Type');
    }
    set Type(value: 'Educator' | 'Producer' | 'Retailer' | 'Supplier') {
        this.Set('Type', value);
    }

    /**
    * * Field Name: Region
    * * Display Name: Region
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * EU
    *   * NA
    *   * RoW
    * * Description: Coarse geography bucket: NA, EU, or RoW
    */
    get Region(): 'EU' | 'NA' | 'RoW' {
        return this.Get('Region');
    }
    set Region(value: 'EU' | 'NA' | 'RoW') {
        this.Set('Region', value);
    }

    /**
    * * Field Name: Country
    * * Display Name: Country Code
    * * SQL Data Type: nvarchar(2)
    */
    get Country(): string | null {
        return this.Get('Country');
    }
    set Country(value: string | null) {
        this.Set('Country', value);
    }

    /**
    * * Field Name: CountryName
    * * Display Name: Country Name
    * * SQL Data Type: nvarchar(100)
    */
    get CountryName(): string | null {
        return this.Get('CountryName');
    }
    set CountryName(value: string | null) {
        this.Set('CountryName', value);
    }

    /**
    * * Field Name: City
    * * Display Name: City
    * * SQL Data Type: nvarchar(100)
    * * Description: Headquarters city (real city, invented business name)
    */
    get City(): string {
        return this.Get('City');
    }
    set City(value: string) {
        this.Set('City', value);
    }

    /**
    * * Field Name: State
    * * Display Name: State
    * * SQL Data Type: nvarchar(50)
    * * Description: Headquarters state/country code
    */
    get State(): string {
        return this.Get('State');
    }
    set State(value: string) {
        this.Set('State', value);
    }

    /**
    * * Field Name: AddressLine1
    * * Display Name: Address Line 1
    * * SQL Data Type: nvarchar(200)
    */
    get AddressLine1(): string | null {
        return this.Get('AddressLine1');
    }
    set AddressLine1(value: string | null) {
        this.Set('AddressLine1', value);
    }

    /**
    * * Field Name: PostalCode
    * * Display Name: Postal Code
    * * SQL Data Type: nvarchar(20)
    */
    get PostalCode(): string | null {
        return this.Get('PostalCode');
    }
    set PostalCode(value: string | null) {
        this.Set('PostalCode', value);
    }

    /**
    * * Field Name: Latitude
    * * Display Name: Latitude
    * * SQL Data Type: decimal(9, 6)
    * * Description: Headquarters latitude, pre-baked for the map (no live geocoding)
    */
    get Latitude(): number {
        return this.Get('Latitude');
    }
    set Latitude(value: number) {
        this.Set('Latitude', value);
    }

    /**
    * * Field Name: Longitude
    * * Display Name: Longitude
    * * SQL Data Type: decimal(9, 6)
    * * Description: Headquarters longitude, pre-baked for the map (no live geocoding)
    */
    get Longitude(): number {
        return this.Get('Longitude');
    }
    set Longitude(value: number) {
        this.Set('Longitude', value);
    }

    /**
    * * Field Name: LifecycleEventKind
    * * Display Name: Lifecycle Event
    * * SQL Data Type: nvarchar(50)
    * * Value List Type: List
    * * Possible Values 
    *   * Acquired
    *   * Dissolved
    *   * ProgramCut
    * * Description: The org-level shock, if any: Dissolved, Acquired, or ProgramCut — the driver behind employer-related churn
    */
    get LifecycleEventKind(): 'Acquired' | 'Dissolved' | 'ProgramCut' | null {
        return this.Get('LifecycleEventKind');
    }
    set LifecycleEventKind(value: 'Acquired' | 'Dissolved' | 'ProgramCut' | null) {
        this.Set('LifecycleEventKind', value);
    }

    /**
    * * Field Name: LifecycleEventYear
    * * Display Name: Event Year
    * * SQL Data Type: int
    * * Description: Year the lifecycle event happened
    */
    get LifecycleEventYear(): number | null {
        return this.Get('LifecycleEventYear');
    }
    set LifecycleEventYear(value: number | null) {
        this.Set('LifecycleEventYear', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
    * * Default Value: 1
    * * Description: Marks generated shared-demo rows; the wipe-and-recreate boundary
    */
    get IsSharedDemo(): boolean {
        return this.Get('IsSharedDemo');
    }
    set IsSharedDemo(value: boolean) {
        this.Set('IsSharedDemo', value);
    }

    /**
    * * Field Name: __mj_CreatedAt
    * * Display Name: Created At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_CreatedAt(): Date {
        return this.Get('__mj_CreatedAt');
    }

    /**
    * * Field Name: __mj_UpdatedAt
    * * Display Name: Updated At
    * * SQL Data Type: datetimeoffset
    * * Default Value: getutcdate()
    */
    get __mj_UpdatedAt(): Date {
        return this.Get('__mj_UpdatedAt');
    }

    /**
    * * Field Name: Organization
    * * Display Name: Organization Name
    * * SQL Data Type: nvarchar(255)
    */
    get Organization(): string {
        return this.Get('Organization');
    }

    /**
    * * Field Name: __mj_Latitude
    * * Display Name: Mj Latitude
    * * SQL Data Type: decimal(9, 6)
    */
    get __mj_Latitude(): number {
        return this.Get('__mj_Latitude');
    }

    /**
    * * Field Name: __mj_Longitude
    * * Display Name: Mj Longitude
    * * SQL Data Type: decimal(9, 6)
    */
    get __mj_Longitude(): number {
        return this.Get('__mj_Longitude');
    }
}
