import { BaseEntity, EntitySaveOptions, EntityDeleteOptions, CompositeKey, ValidationResult, ValidationErrorInfo, ValidationErrorType, Metadata, ProviderType, DatabaseProviderBase, RunView } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { z } from "zod";

     
 
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
        * * Display Name: Certification Key
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
        * * Display Name: Validity (Years)
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
        * * Display Name: Enrollment Key
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
        * * Display Name: Course Name
        * * SQL Data Type: nvarchar(200)
        * * Description: Course title`),
    StartDate: z.date().describe(`
        * * Field Name: StartDate
        * * Display Name: Start Date
        * * SQL Data Type: date
        * * Description: Cohort start date`),
    DurationWeeks: z.number().describe(`
        * * Field Name: DurationWeeks
        * * Display Name: Duration (Weeks)
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
        * * Display Name: Member Certification Key
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
    * * Display Name: Certification Key
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
    * * Display Name: Validity (Years)
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
    * * Display Name: Enrollment Key
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
    * * Display Name: Course Name
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
    * * Display Name: Duration (Weeks)
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
    * * Display Name: Member Certification Key
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
