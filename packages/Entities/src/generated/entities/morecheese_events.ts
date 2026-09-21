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
        * * Display Name: Person
        * * SQL Data Type: uniqueidentifier
        * * Related Entity/Foreign Key: MJ_BizApps_Common: People (vwPeople.ID)`),
    OrganizationID: z.string().nullable().describe(`
        * * Field Name: OrganizationID
        * * Display Name: Organization
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
        * * Display Name: Person Name
        * * SQL Data Type: nvarchar(201)`),
    Organization: z.string().nullable().describe(`
        * * Field Name: Organization
        * * Display Name: Organization Name
        * * SQL Data Type: nvarchar(255)`),
});

export type morecheeseeventsCompetitionEntryEntityType = z.infer<typeof morecheeseeventsCompetitionEntrySchema>;
 
 

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
    * * Display Name: Person Name
    * * SQL Data Type: nvarchar(201)
    */
    get Person(): string {
        return this.Get('Person');
    }

    /**
    * * Field Name: Organization
    * * Display Name: Organization Name
    * * SQL Data Type: nvarchar(255)
    */
    get Organization(): string | null {
        return this.Get('Organization');
    }
}
