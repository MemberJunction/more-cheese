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


import { morecheeseeventsCompetitionEntryEntity } from '@mj-biz-apps/more-cheese-entities';
    

//****************************************************************************
// ENTITY CLASS for MoreCheese: Competition Entries
//****************************************************************************
@ObjectType({ description: `Annual competition entries; org membership is the eligibility gate, results are medal or none` })
export class morecheeseeventsCompetitionEntry_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({nullable: true}) 
    @MaxLength(80)
    EntryKey?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    PersonID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    OrganizationID?: string;
        
    @Field(() => Int, {nullable: true}) 
    EntryYear?: number;
        
    @Field({nullable: true, description: `Competition category (e.g. Alpine Styles, Soft-Ripened)`}) 
    @MaxLength(100)
    Category?: string;
        
    @Field({nullable: true, description: `The entered cheese (invented product names from the cleared bank components)`}) 
    @MaxLength(200)
    ProductName?: string;
        
    @Field({nullable: true, description: `Gold, Silver, Bronze, or None`}) 
    @MaxLength(50)
    Result?: string;
        
    @Field(() => Boolean, {nullable: true}) 
    IsSharedDemo?: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(201)
    Person?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Organization?: string;
        
    @Field(() => [String], { nullable: true, description: `Field-level security: when non-null, the fields on this entity the calling user may read. Any other field arriving as null was withheld by the server rather than genuinely empty. Null for callers with no field restrictions.` })
    ReadableFields___?: string[];
        
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