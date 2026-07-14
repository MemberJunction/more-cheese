import { BaseEntity, EntitySaveOptions, EntityDeleteOptions, CompositeKey, ValidationResult, ValidationErrorInfo, ValidationErrorType, Metadata, ProviderType, DatabaseProviderBase } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { z } from "zod";

export const loadModule = () => {
  // no-op, only used to ensure this file is a valid module and to allow easy loading
}

     
 
/**
 * zod schema definition for the entity MoreCheese: Course Enrollments
 */
export const morecheeselearningCourseEnrollmentSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    EnrollKey: z.string().describe(`
        * * Field Name: EnrollKey
        * * Display Name: Enroll Key
        * * SQL Data Type: nvarchar(80)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)`),
    CourseID: z.string().describe(`
        * * Field Name: CourseID
        * * Display Name: Course ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Courses (vwCourses.ID)`),
    EnrolledOn: z.date().describe(`
        * * Field Name: EnrolledOn
        * * Display Name: Enrolled On
        * * SQL Data Type: date`),
    Status: z.string().describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(50)`),
    CompletedOn: z.date().nullable().describe(`
        * * Field Name: CompletedOn
        * * Display Name: Completed On
        * * SQL Data Type: date`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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
        * * SQL Data Type: uniqueidentifier`),
    CourseKey: z.string().describe(`
        * * Field Name: CourseKey
        * * Display Name: Course Key
        * * SQL Data Type: nvarchar(50)`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)`),
    StartDate: z.date().describe(`
        * * Field Name: StartDate
        * * Display Name: Start Date
        * * SQL Data Type: date`),
    DurationWeeks: z.number().describe(`
        * * Field Name: DurationWeeks
        * * Display Name: Duration Weeks
        * * SQL Data Type: int`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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
 * zod schema definition for the entity MoreCheese: Event Registrations
 */
export const morecheeseeventsEventRegistrationSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    RegKey: z.string().describe(`
        * * Field Name: RegKey
        * * Display Name: Reg Key
        * * SQL Data Type: nvarchar(120)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)`),
    EventID: z.string().describe(`
        * * Field Name: EventID
        * * Display Name: Event ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Events (vwEvents.ID)`),
    RegisteredOn: z.date().describe(`
        * * Field Name: RegisteredOn
        * * Display Name: Registered On
        * * SQL Data Type: date`),
    Attended: z.boolean().nullable().describe(`
        * * Field Name: Attended
        * * Display Name: Attended
        * * SQL Data Type: bit`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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
        * * SQL Data Type: uniqueidentifier`),
    EventKey: z.string().describe(`
        * * Field Name: EventKey
        * * Display Name: Event Key
        * * SQL Data Type: nvarchar(50)`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)`),
    EventType: z.string().describe(`
        * * Field Name: EventType
        * * Display Name: Event Type
        * * SQL Data Type: nvarchar(50)`),
    EventDate: z.date().describe(`
        * * Field Name: EventDate
        * * Display Name: Event Date
        * * SQL Data Type: date`),
    IsVirtual: z.boolean().describe(`
        * * Field Name: IsVirtual
        * * Display Name: Is Virtual
        * * SQL Data Type: bit`),
    IsPaid: z.boolean().describe(`
        * * Field Name: IsPaid
        * * Display Name: Is Paid
        * * SQL Data Type: bit`),
    City: z.string().nullable().describe(`
        * * Field Name: City
        * * Display Name: City
        * * SQL Data Type: nvarchar(100)`),
    State: z.string().nullable().describe(`
        * * Field Name: State
        * * Display Name: State
        * * SQL Data Type: nvarchar(50)`),
    Latitude: z.number().nullable().describe(`
        * * Field Name: Latitude
        * * Display Name: Latitude
        * * SQL Data Type: decimal(9, 6)`),
    Longitude: z.number().nullable().describe(`
        * * Field Name: Longitude
        * * Display Name: Longitude
        * * SQL Data Type: decimal(9, 6)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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
 * zod schema definition for the entity MoreCheese: Membership Periods
 */
export const morecheesemembersMembershipPeriodSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    PeriodKey: z.string().describe(`
        * * Field Name: PeriodKey
        * * Display Name: Period Key
        * * SQL Data Type: nvarchar(60)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)`),
    MembershipTier: z.string().describe(`
        * * Field Name: MembershipTier
        * * Display Name: Membership Tier
        * * SQL Data Type: nvarchar(50)`),
    DuesAmount: z.number().describe(`
        * * Field Name: DuesAmount
        * * Display Name: Dues Amount
        * * SQL Data Type: decimal(10, 2)`),
    StartDate: z.date().describe(`
        * * Field Name: StartDate
        * * Display Name: Start Date
        * * SQL Data Type: date`),
    EndDate: z.date().describe(`
        * * Field Name: EndDate
        * * Display Name: End Date
        * * SQL Data Type: date`),
    RenewalDate: z.date().describe(`
        * * Field Name: RenewalDate
        * * Display Name: Renewal Date
        * * SQL Data Type: date`),
    Status: z.string().describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(50)`),
    CancellationDate: z.date().nullable().describe(`
        * * Field Name: CancellationDate
        * * Display Name: Cancellation Date
        * * SQL Data Type: date`),
    CancellationReason: z.string().nullable().describe(`
        * * Field Name: CancellationReason
        * * Display Name: Cancellation Reason
        * * SQL Data Type: nvarchar(200)`),
    AutoRenew: z.boolean().describe(`
        * * Field Name: AutoRenew
        * * Display Name: Auto Renew
        * * SQL Data Type: bit`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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

export type morecheesemembersMembershipPeriodEntityType = z.infer<typeof morecheesemembersMembershipPeriodSchema>;

/**
 * zod schema definition for the entity MoreCheese: Order Lines
 */
export const morecheeseordersOrderLineSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    OrderID: z.string().describe(`
        * * Field Name: OrderID
        * * Display Name: Order ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Orders (vwOrders.ID)`),
    ProductID: z.string().describe(`
        * * Field Name: ProductID
        * * Display Name: Product ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Products (vwProducts.ID)`),
    Quantity: z.number().describe(`
        * * Field Name: Quantity
        * * Display Name: Quantity
        * * SQL Data Type: int`),
    UnitPrice: z.number().describe(`
        * * Field Name: UnitPrice
        * * Display Name: Unit Price
        * * SQL Data Type: decimal(10, 2)`),
    LineTotal: z.number().describe(`
        * * Field Name: LineTotal
        * * Display Name: Line Total
        * * SQL Data Type: decimal(10, 2)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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
    Product: z.string().describe(`
        * * Field Name: Product
        * * Display Name: Product
        * * SQL Data Type: nvarchar(200)`),
});

export type morecheeseordersOrderLineEntityType = z.infer<typeof morecheeseordersOrderLineSchema>;

/**
 * zod schema definition for the entity MoreCheese: Orders
 */
export const morecheeseordersOrderSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    OrderKey: z.string().describe(`
        * * Field Name: OrderKey
        * * Display Name: Order Key
        * * SQL Data Type: nvarchar(50)`),
    PersonID: z.string().describe(`
        * * Field Name: PersonID
        * * Display Name: Person ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)`),
    OrderType: z.string().describe(`
        * * Field Name: OrderType
        * * Display Name: Order Type
        * * SQL Data Type: nvarchar(50)`),
    Status: z.string().describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(50)`),
    OrderDate: z.date().describe(`
        * * Field Name: OrderDate
        * * Display Name: Order Date
        * * SQL Data Type: date`),
    DueDate: z.date().describe(`
        * * Field Name: DueDate
        * * Display Name: Due Date
        * * SQL Data Type: date`),
    TotalGross: z.number().describe(`
        * * Field Name: TotalGross
        * * Display Name: Total Gross
        * * SQL Data Type: decimal(10, 2)`),
    PaymentStatus: z.string().describe(`
        * * Field Name: PaymentStatus
        * * Display Name: Payment Status
        * * SQL Data Type: nvarchar(50)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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

export type morecheeseordersOrderEntityType = z.infer<typeof morecheeseordersOrderSchema>;

/**
 * zod schema definition for the entity MoreCheese: Organizations
 */
export const morecheesecommonOrganizationSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    OrgKey: z.string().describe(`
        * * Field Name: OrgKey
        * * Display Name: Org Key
        * * SQL Data Type: nvarchar(50)`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)`),
    Type: z.string().describe(`
        * * Field Name: Type
        * * Display Name: Type
        * * SQL Data Type: nvarchar(50)`),
    Region: z.string().describe(`
        * * Field Name: Region
        * * Display Name: Region
        * * SQL Data Type: nvarchar(50)`),
    City: z.string().describe(`
        * * Field Name: City
        * * Display Name: City
        * * SQL Data Type: nvarchar(100)`),
    State: z.string().describe(`
        * * Field Name: State
        * * Display Name: State
        * * SQL Data Type: nvarchar(50)`),
    Latitude: z.number().describe(`
        * * Field Name: Latitude
        * * Display Name: Latitude
        * * SQL Data Type: decimal(9, 6)`),
    Longitude: z.number().describe(`
        * * Field Name: Longitude
        * * Display Name: Longitude
        * * SQL Data Type: decimal(9, 6)`),
    LifecycleEventKind: z.string().nullable().describe(`
        * * Field Name: LifecycleEventKind
        * * Display Name: Lifecycle Event Kind
        * * SQL Data Type: nvarchar(50)`),
    LifecycleEventYear: z.number().nullable().describe(`
        * * Field Name: LifecycleEventYear
        * * Display Name: Lifecycle Event Year
        * * SQL Data Type: int`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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

export type morecheesecommonOrganizationEntityType = z.infer<typeof morecheesecommonOrganizationSchema>;

/**
 * zod schema definition for the entity MoreCheese: Payments
 */
export const morecheeseordersPaymentSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    OrderID: z.string().describe(`
        * * Field Name: OrderID
        * * Display Name: Order ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Orders (vwOrders.ID)`),
    Amount: z.number().describe(`
        * * Field Name: Amount
        * * Display Name: Amount
        * * SQL Data Type: decimal(10, 2)`),
    PaymentDate: z.date().describe(`
        * * Field Name: PaymentDate
        * * Display Name: Payment Date
        * * SQL Data Type: date`),
    Method: z.string().describe(`
        * * Field Name: Method
        * * Display Name: Method
        * * SQL Data Type: nvarchar(50)`),
    Status: z.string().describe(`
        * * Field Name: Status
        * * Display Name: Status
        * * SQL Data Type: nvarchar(50)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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

export type morecheeseordersPaymentEntityType = z.infer<typeof morecheeseordersPaymentSchema>;

/**
 * zod schema definition for the entity MoreCheese: People
 */
export const morecheesecommonPersonSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    MemberNumber: z.string().describe(`
        * * Field Name: MemberNumber
        * * Display Name: Member Number
        * * SQL Data Type: nvarchar(50)`),
    FirstName: z.string().describe(`
        * * Field Name: FirstName
        * * Display Name: First Name
        * * SQL Data Type: nvarchar(100)`),
    LastName: z.string().describe(`
        * * Field Name: LastName
        * * Display Name: Last Name
        * * SQL Data Type: nvarchar(100)`),
    Segment: z.string().describe(`
        * * Field Name: Segment
        * * Display Name: Segment
        * * SQL Data Type: nvarchar(50)`),
    Region: z.string().describe(`
        * * Field Name: Region
        * * Display Name: Region
        * * SQL Data Type: nvarchar(50)`),
    City: z.string().describe(`
        * * Field Name: City
        * * Display Name: City
        * * SQL Data Type: nvarchar(100)`),
    State: z.string().describe(`
        * * Field Name: State
        * * Display Name: State
        * * SQL Data Type: nvarchar(50)`),
    Latitude: z.number().describe(`
        * * Field Name: Latitude
        * * Display Name: Latitude
        * * SQL Data Type: decimal(9, 6)`),
    Longitude: z.number().describe(`
        * * Field Name: Longitude
        * * Display Name: Longitude
        * * SQL Data Type: decimal(9, 6)`),
    OrganizationID: z.string().nullable().describe(`
        * * Field Name: OrganizationID
        * * Display Name: Organization ID
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MoreCheese: Organizations (vwOrganizations.ID)`),
    JoinDate: z.date().describe(`
        * * Field Name: JoinDate
        * * Display Name: Join Date
        * * SQL Data Type: date`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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
    Organization: z.string().nullable().describe(`
        * * Field Name: Organization
        * * Display Name: Organization
        * * SQL Data Type: nvarchar(200)`),
});

export type morecheesecommonPersonEntityType = z.infer<typeof morecheesecommonPersonSchema>;

/**
 * zod schema definition for the entity MoreCheese: Products
 */
export const morecheeseordersProductSchema = z.object({
    ID: z.string().describe(`
        * * Field Name: ID
        * * Display Name: ID
        * * SQL Data Type: uniqueidentifier`),
    ProductKey: z.string().describe(`
        * * Field Name: ProductKey
        * * Display Name: Product Key
        * * SQL Data Type: nvarchar(50)`),
    Name: z.string().describe(`
        * * Field Name: Name
        * * Display Name: Name
        * * SQL Data Type: nvarchar(200)`),
    ProductType: z.string().describe(`
        * * Field Name: ProductType
        * * Display Name: Product Type
        * * SQL Data Type: nvarchar(50)`),
    UnitPrice: z.number().describe(`
        * * Field Name: UnitPrice
        * * Display Name: Unit Price
        * * SQL Data Type: decimal(10, 2)`),
    IsSharedDemo: z.boolean().describe(`
        * * Field Name: IsSharedDemo
        * * Display Name: Is Shared Demo
        * * SQL Data Type: bit`),
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

export type morecheeseordersProductEntityType = z.infer<typeof morecheeseordersProductSchema>;
 
 

/**
 * MoreCheese: Course Enrollments - strongly typed entity sub-class
 * * Schema: morecheese_learning
 * * Base Table: CourseEnrollment
 * * Base View: vwCourseEnrollments
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
    * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)
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
    */
    get Status(): string {
        return this.Get('Status');
    }
    set Status(value: string) {
        this.Set('Status', value);
    }

    /**
    * * Field Name: CompletedOn
    * * Display Name: Completed On
    * * SQL Data Type: date
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
 * MoreCheese: Event Registrations - strongly typed entity sub-class
 * * Schema: morecheese_events
 * * Base Table: EventRegistration
 * * Base View: vwEventRegistrations
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
    * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)
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
    */
    get EventType(): string {
        return this.Get('EventType');
    }
    set EventType(value: string) {
        this.Set('EventType', value);
    }

    /**
    * * Field Name: EventDate
    * * Display Name: Event Date
    * * SQL Data Type: date
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
 * MoreCheese: Membership Periods - strongly typed entity sub-class
 * * Schema: morecheese_members
 * * Base Table: MembershipPeriod
 * * Base View: vwMembershipPeriods
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
    * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)
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
    */
    get MembershipTier(): string {
        return this.Get('MembershipTier');
    }
    set MembershipTier(value: string) {
        this.Set('MembershipTier', value);
    }

    /**
    * * Field Name: DuesAmount
    * * Display Name: Dues Amount
    * * SQL Data Type: decimal(10, 2)
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
    */
    get Status(): string {
        return this.Get('Status');
    }
    set Status(value: string) {
        this.Set('Status', value);
    }

    /**
    * * Field Name: CancellationDate
    * * Display Name: Cancellation Date
    * * SQL Data Type: date
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
 * MoreCheese: Order Lines - strongly typed entity sub-class
 * * Schema: morecheese_orders
 * * Base Table: OrderLine
 * * Base View: vwOrderLines
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Order Lines')
export class morecheeseordersOrderLineEntity extends BaseEntity<morecheeseordersOrderLineEntityType> {
    /**
    * Loads the MoreCheese: Order Lines record from the database
    * @param ID: string - primary key value to load the MoreCheese: Order Lines record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeseordersOrderLineEntity
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
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: OrderID
    * * Display Name: Order ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: Orders (vwOrders.ID)
    */
    get OrderID(): string {
        return this.Get('OrderID');
    }
    set OrderID(value: string) {
        this.Set('OrderID', value);
    }

    /**
    * * Field Name: ProductID
    * * Display Name: Product ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: Products (vwProducts.ID)
    */
    get ProductID(): string {
        return this.Get('ProductID');
    }
    set ProductID(value: string) {
        this.Set('ProductID', value);
    }

    /**
    * * Field Name: Quantity
    * * Display Name: Quantity
    * * SQL Data Type: int
    */
    get Quantity(): number {
        return this.Get('Quantity');
    }
    set Quantity(value: number) {
        this.Set('Quantity', value);
    }

    /**
    * * Field Name: UnitPrice
    * * Display Name: Unit Price
    * * SQL Data Type: decimal(10, 2)
    */
    get UnitPrice(): number {
        return this.Get('UnitPrice');
    }
    set UnitPrice(value: number) {
        this.Set('UnitPrice', value);
    }

    /**
    * * Field Name: LineTotal
    * * Display Name: Line Total
    * * SQL Data Type: decimal(10, 2)
    */
    get LineTotal(): number {
        return this.Get('LineTotal');
    }
    set LineTotal(value: number) {
        this.Set('LineTotal', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
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
    * * Field Name: Product
    * * Display Name: Product
    * * SQL Data Type: nvarchar(200)
    */
    get Product(): string {
        return this.Get('Product');
    }
}


/**
 * MoreCheese: Orders - strongly typed entity sub-class
 * * Schema: morecheese_orders
 * * Base Table: Order
 * * Base View: vwOrders
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Orders')
export class morecheeseordersOrderEntity extends BaseEntity<morecheeseordersOrderEntityType> {
    /**
    * Loads the MoreCheese: Orders record from the database
    * @param ID: string - primary key value to load the MoreCheese: Orders record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeseordersOrderEntity
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
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: OrderKey
    * * Display Name: Order Key
    * * SQL Data Type: nvarchar(50)
    */
    get OrderKey(): string {
        return this.Get('OrderKey');
    }
    set OrderKey(value: string) {
        this.Set('OrderKey', value);
    }

    /**
    * * Field Name: PersonID
    * * Display Name: Person ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: People (vwPeople.ID)
    */
    get PersonID(): string {
        return this.Get('PersonID');
    }
    set PersonID(value: string) {
        this.Set('PersonID', value);
    }

    /**
    * * Field Name: OrderType
    * * Display Name: Order Type
    * * SQL Data Type: nvarchar(50)
    */
    get OrderType(): string {
        return this.Get('OrderType');
    }
    set OrderType(value: string) {
        this.Set('OrderType', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(50)
    */
    get Status(): string {
        return this.Get('Status');
    }
    set Status(value: string) {
        this.Set('Status', value);
    }

    /**
    * * Field Name: OrderDate
    * * Display Name: Order Date
    * * SQL Data Type: date
    */
    get OrderDate(): Date {
        return this.Get('OrderDate');
    }
    set OrderDate(value: Date) {
        this.Set('OrderDate', value);
    }

    /**
    * * Field Name: DueDate
    * * Display Name: Due Date
    * * SQL Data Type: date
    */
    get DueDate(): Date {
        return this.Get('DueDate');
    }
    set DueDate(value: Date) {
        this.Set('DueDate', value);
    }

    /**
    * * Field Name: TotalGross
    * * Display Name: Total Gross
    * * SQL Data Type: decimal(10, 2)
    */
    get TotalGross(): number {
        return this.Get('TotalGross');
    }
    set TotalGross(value: number) {
        this.Set('TotalGross', value);
    }

    /**
    * * Field Name: PaymentStatus
    * * Display Name: Payment Status
    * * SQL Data Type: nvarchar(50)
    */
    get PaymentStatus(): string {
        return this.Get('PaymentStatus');
    }
    set PaymentStatus(value: string) {
        this.Set('PaymentStatus', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
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
 * MoreCheese: Organizations - strongly typed entity sub-class
 * * Schema: morecheese_common
 * * Base Table: Organization
 * * Base View: vwOrganizations
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Organizations')
export class morecheesecommonOrganizationEntity extends BaseEntity<morecheesecommonOrganizationEntityType> {
    /**
    * Loads the MoreCheese: Organizations record from the database
    * @param ID: string - primary key value to load the MoreCheese: Organizations record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheesecommonOrganizationEntity
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
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: OrgKey
    * * Display Name: Org Key
    * * SQL Data Type: nvarchar(50)
    */
    get OrgKey(): string {
        return this.Get('OrgKey');
    }
    set OrgKey(value: string) {
        this.Set('OrgKey', value);
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
    * * Field Name: Type
    * * Display Name: Type
    * * SQL Data Type: nvarchar(50)
    */
    get Type(): string {
        return this.Get('Type');
    }
    set Type(value: string) {
        this.Set('Type', value);
    }

    /**
    * * Field Name: Region
    * * Display Name: Region
    * * SQL Data Type: nvarchar(50)
    */
    get Region(): string {
        return this.Get('Region');
    }
    set Region(value: string) {
        this.Set('Region', value);
    }

    /**
    * * Field Name: City
    * * Display Name: City
    * * SQL Data Type: nvarchar(100)
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
    */
    get State(): string {
        return this.Get('State');
    }
    set State(value: string) {
        this.Set('State', value);
    }

    /**
    * * Field Name: Latitude
    * * Display Name: Latitude
    * * SQL Data Type: decimal(9, 6)
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
    */
    get Longitude(): number {
        return this.Get('Longitude');
    }
    set Longitude(value: number) {
        this.Set('Longitude', value);
    }

    /**
    * * Field Name: LifecycleEventKind
    * * Display Name: Lifecycle Event Kind
    * * SQL Data Type: nvarchar(50)
    */
    get LifecycleEventKind(): string | null {
        return this.Get('LifecycleEventKind');
    }
    set LifecycleEventKind(value: string | null) {
        this.Set('LifecycleEventKind', value);
    }

    /**
    * * Field Name: LifecycleEventYear
    * * Display Name: Lifecycle Event Year
    * * SQL Data Type: int
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
 * MoreCheese: Payments - strongly typed entity sub-class
 * * Schema: morecheese_orders
 * * Base Table: Payment
 * * Base View: vwPayments
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Payments')
export class morecheeseordersPaymentEntity extends BaseEntity<morecheeseordersPaymentEntityType> {
    /**
    * Loads the MoreCheese: Payments record from the database
    * @param ID: string - primary key value to load the MoreCheese: Payments record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeseordersPaymentEntity
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
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: OrderID
    * * Display Name: Order ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: Orders (vwOrders.ID)
    */
    get OrderID(): string {
        return this.Get('OrderID');
    }
    set OrderID(value: string) {
        this.Set('OrderID', value);
    }

    /**
    * * Field Name: Amount
    * * Display Name: Amount
    * * SQL Data Type: decimal(10, 2)
    */
    get Amount(): number {
        return this.Get('Amount');
    }
    set Amount(value: number) {
        this.Set('Amount', value);
    }

    /**
    * * Field Name: PaymentDate
    * * Display Name: Payment Date
    * * SQL Data Type: date
    */
    get PaymentDate(): Date {
        return this.Get('PaymentDate');
    }
    set PaymentDate(value: Date) {
        this.Set('PaymentDate', value);
    }

    /**
    * * Field Name: Method
    * * Display Name: Method
    * * SQL Data Type: nvarchar(50)
    */
    get Method(): string {
        return this.Get('Method');
    }
    set Method(value: string) {
        this.Set('Method', value);
    }

    /**
    * * Field Name: Status
    * * Display Name: Status
    * * SQL Data Type: nvarchar(50)
    */
    get Status(): string {
        return this.Get('Status');
    }
    set Status(value: string) {
        this.Set('Status', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
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
 * MoreCheese: People - strongly typed entity sub-class
 * * Schema: morecheese_common
 * * Base Table: Person
 * * Base View: vwPeople
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: People')
export class morecheesecommonPersonEntity extends BaseEntity<morecheesecommonPersonEntityType> {
    /**
    * Loads the MoreCheese: People record from the database
    * @param ID: string - primary key value to load the MoreCheese: People record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheesecommonPersonEntity
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
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: MemberNumber
    * * Display Name: Member Number
    * * SQL Data Type: nvarchar(50)
    */
    get MemberNumber(): string {
        return this.Get('MemberNumber');
    }
    set MemberNumber(value: string) {
        this.Set('MemberNumber', value);
    }

    /**
    * * Field Name: FirstName
    * * Display Name: First Name
    * * SQL Data Type: nvarchar(100)
    */
    get FirstName(): string {
        return this.Get('FirstName');
    }
    set FirstName(value: string) {
        this.Set('FirstName', value);
    }

    /**
    * * Field Name: LastName
    * * Display Name: Last Name
    * * SQL Data Type: nvarchar(100)
    */
    get LastName(): string {
        return this.Get('LastName');
    }
    set LastName(value: string) {
        this.Set('LastName', value);
    }

    /**
    * * Field Name: Segment
    * * Display Name: Segment
    * * SQL Data Type: nvarchar(50)
    */
    get Segment(): string {
        return this.Get('Segment');
    }
    set Segment(value: string) {
        this.Set('Segment', value);
    }

    /**
    * * Field Name: Region
    * * Display Name: Region
    * * SQL Data Type: nvarchar(50)
    */
    get Region(): string {
        return this.Get('Region');
    }
    set Region(value: string) {
        this.Set('Region', value);
    }

    /**
    * * Field Name: City
    * * Display Name: City
    * * SQL Data Type: nvarchar(100)
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
    */
    get State(): string {
        return this.Get('State');
    }
    set State(value: string) {
        this.Set('State', value);
    }

    /**
    * * Field Name: Latitude
    * * Display Name: Latitude
    * * SQL Data Type: decimal(9, 6)
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
    */
    get Longitude(): number {
        return this.Get('Longitude');
    }
    set Longitude(value: number) {
        this.Set('Longitude', value);
    }

    /**
    * * Field Name: OrganizationID
    * * Display Name: Organization ID
    * * SQL Data Type: uniqueidentifier
    * * Related Entity/Foreign Key: MoreCheese: Organizations (vwOrganizations.ID)
    */
    get OrganizationID(): string | null {
        return this.Get('OrganizationID');
    }
    set OrganizationID(value: string | null) {
        this.Set('OrganizationID', value);
    }

    /**
    * * Field Name: JoinDate
    * * Display Name: Join Date
    * * SQL Data Type: date
    */
    get JoinDate(): Date {
        return this.Get('JoinDate');
    }
    set JoinDate(value: Date) {
        this.Set('JoinDate', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
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
    * * Display Name: Organization
    * * SQL Data Type: nvarchar(200)
    */
    get Organization(): string | null {
        return this.Get('Organization');
    }
}


/**
 * MoreCheese: Products - strongly typed entity sub-class
 * * Schema: morecheese_orders
 * * Base Table: Product
 * * Base View: vwProducts
 * * Primary Key: ID
 * @extends {BaseEntity}
 * @class
 * @public
 */
@RegisterClass(BaseEntity, 'MoreCheese: Products')
export class morecheeseordersProductEntity extends BaseEntity<morecheeseordersProductEntityType> {
    /**
    * Loads the MoreCheese: Products record from the database
    * @param ID: string - primary key value to load the MoreCheese: Products record.
    * @param EntityRelationshipsToLoad - (optional) the relationships to load
    * @returns {Promise<boolean>} - true if successful, false otherwise
    * @public
    * @async
    * @memberof morecheeseordersProductEntity
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
    */
    get ID(): string {
        return this.Get('ID');
    }
    set ID(value: string) {
        this.Set('ID', value);
    }

    /**
    * * Field Name: ProductKey
    * * Display Name: Product Key
    * * SQL Data Type: nvarchar(50)
    */
    get ProductKey(): string {
        return this.Get('ProductKey');
    }
    set ProductKey(value: string) {
        this.Set('ProductKey', value);
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
    * * Field Name: ProductType
    * * Display Name: Product Type
    * * SQL Data Type: nvarchar(50)
    */
    get ProductType(): string {
        return this.Get('ProductType');
    }
    set ProductType(value: string) {
        this.Set('ProductType', value);
    }

    /**
    * * Field Name: UnitPrice
    * * Display Name: Unit Price
    * * SQL Data Type: decimal(10, 2)
    */
    get UnitPrice(): number {
        return this.Get('UnitPrice');
    }
    set UnitPrice(value: number) {
        this.Set('UnitPrice', value);
    }

    /**
    * * Field Name: IsSharedDemo
    * * Display Name: Is Shared Demo
    * * SQL Data Type: bit
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
