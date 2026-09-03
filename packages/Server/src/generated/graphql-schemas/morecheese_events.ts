/********************************************************************************
* ALL ENTITIES - TypeGraphQL Type Class Definition - AUTO GENERATED FILE
* Generated Entities and Resolvers for Server
*
*   >>> DO NOT MODIFY THIS FILE!!!!!!!!!!!!
*   >>> YOUR CHANGES WILL BE OVERWRITTEN
*   >>> THE NEXT TIME THIS FILE IS GENERATED
*
**********************************************************************************/
import { Arg, Ctx, Int, Query, Resolver, Field, Float, ObjectType, InputType, Mutation,
            PubSub, PubSubEngine, ResolverBase, RunViewByIDInput, RunViewByNameInput, RunDynamicViewInput,
            AppContext, KeyValuePairInput, DeleteOptionsInput, GraphQLTimestamp as Timestamp,
            GetReadOnlyProvider, GetReadWriteProvider, RestoreContextInput } from '@memberjunction/server';
import { Metadata, EntityPermissionType, CompositeKey, UserInfo } from '@memberjunction/core'

import { MaxLength } from 'class-validator';
import * as mj_core_schema_server_object_types from '@memberjunction/server'


import { morecheeseeventsCompetitionEntryEntity, morecheeseeventsEventRegistrationEntity, morecheeseeventsEventEntity } from '@mj-more-cheese-demo/entities';
    

//****************************************************************************
// ENTITY CLASS for MoreCheese: Competition Entries
//****************************************************************************
@ObjectType({ description: `Annual competition entries; org membership is the eligibility gate, results are medal or none` })
export class morecheeseeventsCompetitionEntry_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(80)
    EntryKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    OrganizationID?: string;
        
    @Field(() => Int) 
    EntryYear: number;
        
    @Field({description: `Competition category (e.g. Alpine Styles, Soft-Ripened)`}) 
    @MaxLength(100)
    Category: string;
        
    @Field({description: `The entered cheese (invented product names from the cleared bank components)`}) 
    @MaxLength(200)
    ProductName: string;
        
    @Field({description: `Gold, Silver, Bronze, or None`}) 
    @MaxLength(50)
    Result: string;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(201)
    Person: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Organization?: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Competition Entries
//****************************************************************************
@InputType()
export class CreatemorecheeseeventsCompetitionEntryInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    EntryKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    OrganizationID: string | null;

    @Field(() => Int, { nullable: true })
    EntryYear?: number;

    @Field({ nullable: true })
    Category?: string;

    @Field({ nullable: true })
    ProductName?: string;

    @Field({ nullable: true })
    Result?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Competition Entries
//****************************************************************************
@InputType()
export class UpdatemorecheeseeventsCompetitionEntryInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    EntryKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    OrganizationID?: string | null;

    @Field(() => Int, { nullable: true })
    EntryYear?: number;

    @Field({ nullable: true })
    Category?: string;

    @Field({ nullable: true })
    ProductName?: string;

    @Field({ nullable: true })
    Result?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Competition Entries
//****************************************************************************
@ObjectType()
export class RunmorecheeseeventsCompetitionEntryViewResult {
    @Field(() => [morecheeseeventsCompetitionEntry_])
    Results: morecheeseeventsCompetitionEntry_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(morecheeseeventsCompetitionEntry_)
export class morecheeseeventsCompetitionEntryResolver extends ResolverBase {
    @Query(() => RunmorecheeseeventsCompetitionEntryViewResult)
    async RunmorecheeseeventsCompetitionEntryViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseeventsCompetitionEntryViewResult)
    async RunmorecheeseeventsCompetitionEntryViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseeventsCompetitionEntryViewResult)
    async RunmorecheeseeventsCompetitionEntryDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Competition Entries';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeseeventsCompetitionEntry_, { nullable: true })
    async morecheeseeventsCompetitionEntry(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeseeventsCompetitionEntry_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Competition Entries', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_events', 'vwCompetitionEntries')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Competition Entries', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Competition Entries', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheeseeventsCompetitionEntry_)
    async CreatemorecheeseeventsCompetitionEntry(
        @Arg('input', () => CreatemorecheeseeventsCompetitionEntryInput) input: CreatemorecheeseeventsCompetitionEntryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Competition Entries', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeseeventsCompetitionEntry_)
    async UpdatemorecheeseeventsCompetitionEntry(
        @Arg('input', () => UpdatemorecheeseeventsCompetitionEntryInput) input: UpdatemorecheeseeventsCompetitionEntryInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Competition Entries', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeseeventsCompetitionEntry_)
    async DeletemorecheeseeventsCompetitionEntry(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Competition Entries', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Event Registrations
//****************************************************************************
@ObjectType({ description: `Event registrations; Attended NULL means the event has not occurred yet` })
export class morecheeseeventsEventRegistration_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key: REG-<member>-<event>[-n]; UUIDs derive from it`}) 
    @MaxLength(120)
    RegKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    @MaxLength(36)
    EventID: string;
        
    @Field({description: `Registration date — always inside a valid membership window by construction`}) 
    RegisteredOn: Date;
        
    @Field(() => Boolean, {nullable: true, description: `Whether the member showed up; NULL means the event has not happened yet`}) 
    Attended?: boolean;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(201)
    Person: string;
        
    @Field() 
    @MaxLength(200)
    Event: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Event Registrations
//****************************************************************************
@InputType()
export class CreatemorecheeseeventsEventRegistrationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    RegKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    EventID?: string;

    @Field({ nullable: true })
    RegisteredOn?: Date;

    @Field(() => Boolean, { nullable: true })
    Attended: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Event Registrations
//****************************************************************************
@InputType()
export class UpdatemorecheeseeventsEventRegistrationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    RegKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    EventID?: string;

    @Field({ nullable: true })
    RegisteredOn?: Date;

    @Field(() => Boolean, { nullable: true })
    Attended?: boolean | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Event Registrations
//****************************************************************************
@ObjectType()
export class RunmorecheeseeventsEventRegistrationViewResult {
    @Field(() => [morecheeseeventsEventRegistration_])
    Results: morecheeseeventsEventRegistration_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(morecheeseeventsEventRegistration_)
export class morecheeseeventsEventRegistrationResolver extends ResolverBase {
    @Query(() => RunmorecheeseeventsEventRegistrationViewResult)
    async RunmorecheeseeventsEventRegistrationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseeventsEventRegistrationViewResult)
    async RunmorecheeseeventsEventRegistrationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseeventsEventRegistrationViewResult)
    async RunmorecheeseeventsEventRegistrationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Event Registrations';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeseeventsEventRegistration_, { nullable: true })
    async morecheeseeventsEventRegistration(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeseeventsEventRegistration_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Event Registrations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_events', 'vwEventRegistrations')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Event Registrations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Event Registrations', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheeseeventsEventRegistration_)
    async CreatemorecheeseeventsEventRegistration(
        @Arg('input', () => CreatemorecheeseeventsEventRegistrationInput) input: CreatemorecheeseeventsEventRegistrationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Event Registrations', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeseeventsEventRegistration_)
    async UpdatemorecheeseeventsEventRegistration(
        @Arg('input', () => UpdatemorecheeseeventsEventRegistrationInput) input: UpdatemorecheeseeventsEventRegistrationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Event Registrations', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeseeventsEventRegistration_)
    async DeletemorecheeseeventsEventRegistration(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Event Registrations', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Events
//****************************************************************************
@ObjectType({ description: `Conferences, workshops, and webinars with venue coordinates for the member map` })
export class morecheeseeventsEvent_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key (e.g. EVT-2025-CONF); UUIDs derive from it`}) 
    @MaxLength(50)
    EventKey: string;
        
    @Field({description: `Event display name`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({description: `Conference, Workshop, or Webinar`}) 
    @MaxLength(50)
    EventType: string;
        
    @Field({description: `Date the event takes place`}) 
    EventDate: Date;
        
    @Field(() => Boolean, {description: `Virtual events have no venue coordinates (COVID-era conferences were virtual)`}) 
    IsVirtual: boolean;
        
    @Field(() => Boolean, {description: `Whether registration is billable (webinars are free)`}) 
    IsPaid: boolean;
        
    @Field({nullable: true, description: `Venue city; NULL for virtual events`}) 
    @MaxLength(100)
    City?: string;
        
    @Field({nullable: true, description: `Venue state; NULL for virtual events`}) 
    @MaxLength(50)
    State?: string;
        
    @Field(() => Float, {nullable: true, description: `Venue latitude for the events map; NULL for virtual`}) 
    Latitude?: number;
        
    @Field(() => Float, {nullable: true, description: `Venue longitude for the events map; NULL for virtual`}) 
    Longitude?: number;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => Float, {nullable: true}) 
    _mj__Latitude?: number;
        
    @Field(() => Float, {nullable: true}) 
    _mj__Longitude?: number;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Events
//****************************************************************************
@InputType()
export class CreatemorecheeseeventsEventInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    EventKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    EventType?: string;

    @Field({ nullable: true })
    EventDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsVirtual?: boolean;

    @Field(() => Boolean, { nullable: true })
    IsPaid?: boolean;

    @Field({ nullable: true })
    City: string | null;

    @Field({ nullable: true })
    State: string | null;

    @Field(() => Float, { nullable: true })
    Latitude: number | null;

    @Field(() => Float, { nullable: true })
    Longitude: number | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Events
//****************************************************************************
@InputType()
export class UpdatemorecheeseeventsEventInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    EventKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    EventType?: string;

    @Field({ nullable: true })
    EventDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsVirtual?: boolean;

    @Field(() => Boolean, { nullable: true })
    IsPaid?: boolean;

    @Field({ nullable: true })
    City?: string | null;

    @Field({ nullable: true })
    State?: string | null;

    @Field(() => Float, { nullable: true })
    Latitude?: number | null;

    @Field(() => Float, { nullable: true })
    Longitude?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Events
//****************************************************************************
@ObjectType()
export class RunmorecheeseeventsEventViewResult {
    @Field(() => [morecheeseeventsEvent_])
    Results: morecheeseeventsEvent_[];

    @Field(() => String, {nullable: true})
    UserViewRunID?: string;

    @Field(() => Int, {nullable: true})
    RowCount: number;

    @Field(() => Int, {nullable: true})
    TotalRowCount: number;

    @Field(() => Int, {nullable: true})
    ExecutionTime: number;

    @Field({nullable: true})
    ErrorMessage?: string;

    @Field(() => Boolean, {nullable: false})
    Success: boolean;
}

@Resolver(morecheeseeventsEvent_)
export class morecheeseeventsEventResolver extends ResolverBase {
    @Query(() => RunmorecheeseeventsEventViewResult)
    async RunmorecheeseeventsEventViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseeventsEventViewResult)
    async RunmorecheeseeventsEventViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseeventsEventViewResult)
    async RunmorecheeseeventsEventDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Events';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeseeventsEvent_, { nullable: true })
    async morecheeseeventsEvent(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeseeventsEvent_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Events', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_events', 'vwEvents')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Events', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Events', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheeseeventsEvent_)
    async CreatemorecheeseeventsEvent(
        @Arg('input', () => CreatemorecheeseeventsEventInput) input: CreatemorecheeseeventsEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Events', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeseeventsEvent_)
    async UpdatemorecheeseeventsEvent(
        @Arg('input', () => UpdatemorecheeseeventsEventInput) input: UpdatemorecheeseeventsEventInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Events', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeseeventsEvent_)
    async DeletemorecheeseeventsEvent(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Events', key, options, provider, userPayload, pubSub);
    }
    
}