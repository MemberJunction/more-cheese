import { BaseEntity, EntitySaveOptions, EntityDeleteOptions, CompositeKey, ValidationResult, ValidationErrorInfo, ValidationErrorType, Metadata, ProviderType, DatabaseProviderBase, RunView } from "@memberjunction/core";
import { RegisterClass } from "@memberjunction/global";
import { z } from "zod";

     
 
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
        * * Display Name: Registration Key
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
        * * Display Name: Person Name
        * * SQL Data Type: nvarchar(201)`),
    Event: z.string().describe(`
        * * Field Name: Event
        * * Display Name: Event Name
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
    __mj_Latitude: z.number().nullable().describe(`
        * * Field Name: __mj_Latitude
        * * Display Name: Mj Latitude
        * * SQL Data Type: decimal(9, 6)`),
    __mj_Longitude: z.number().nullable().describe(`
        * * Field Name: __mj_Longitude
        * * Display Name: Mj Longitude
        * * SQL Data Type: decimal(9, 6)`),
});

export type morecheeseeventsEventEntityType = z.infer<typeof morecheeseeventsEventSchema>;
 
 

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
    * * Display Name: Registration Key
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
    * * Display Name: Person Name
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: Event
    * * Display Name: Event Name
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

    /**
    * * Field Name: __mj_Latitude
    * * Display Name: Mj Latitude
    * * SQL Data Type: decimal(9, 6)
    */
    get __mj_Latitude(): number | null {
        return this.Get('__mj_Latitude');
    }

    /**
    * * Field Name: __mj_Longitude
    * * Display Name: Mj Longitude
    * * SQL Data Type: decimal(9, 6)
    */
    get __mj_Longitude(): number | null {
        return this.Get('__mj_Longitude');
    }
}
