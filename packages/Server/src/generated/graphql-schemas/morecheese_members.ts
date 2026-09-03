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


import { morecheesemembersAdvocacyActionEntity, morecheesemembersDataQualityLabelEntity, morecheesemembersMemberProfileEntity, morecheesemembersMembershipPeriodEntity, morecheesemembersOrganizationProfileEntity } from '@mj-more-cheese-demo/entities';
    

//****************************************************************************
// ENTITY CLASS for MoreCheese: Advocacy Actions
//****************************************************************************
@ObjectType({ description: `Legislative engagement actions — the advocacy-shaped component of member engagement` })
export class morecheesemembersAdvocacyAction_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(80)
    ActionKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    ActionDate: Date;
        
    @Field({description: `LetterCampaign, PetitionSignature, Testimony, or CoalitionMeeting`}) 
    @MaxLength(50)
    Kind: string;
        
    @Field() 
    @MaxLength(200)
    Topic: string;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(201)
    Person: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Advocacy Actions
//****************************************************************************
@InputType()
export class CreatemorecheesemembersAdvocacyActionInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ActionKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    ActionDate?: Date;

    @Field({ nullable: true })
    Kind?: string;

    @Field({ nullable: true })
    Topic?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Advocacy Actions
//****************************************************************************
@InputType()
export class UpdatemorecheesemembersAdvocacyActionInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ActionKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    ActionDate?: Date;

    @Field({ nullable: true })
    Kind?: string;

    @Field({ nullable: true })
    Topic?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Advocacy Actions
//****************************************************************************
@ObjectType()
export class RunmorecheesemembersAdvocacyActionViewResult {
    @Field(() => [morecheesemembersAdvocacyAction_])
    Results: morecheesemembersAdvocacyAction_[];

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

@Resolver(morecheesemembersAdvocacyAction_)
export class morecheesemembersAdvocacyActionResolver extends ResolverBase {
    @Query(() => RunmorecheesemembersAdvocacyActionViewResult)
    async RunmorecheesemembersAdvocacyActionViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersAdvocacyActionViewResult)
    async RunmorecheesemembersAdvocacyActionViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersAdvocacyActionViewResult)
    async RunmorecheesemembersAdvocacyActionDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Advocacy Actions';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheesemembersAdvocacyAction_, { nullable: true })
    async morecheesemembersAdvocacyAction(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheesemembersAdvocacyAction_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Advocacy Actions', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_members', 'vwAdvocacyActions')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Advocacy Actions', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Advocacy Actions', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheesemembersAdvocacyAction_)
    async CreatemorecheesemembersAdvocacyAction(
        @Arg('input', () => CreatemorecheesemembersAdvocacyActionInput) input: CreatemorecheesemembersAdvocacyActionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Advocacy Actions', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheesemembersAdvocacyAction_)
    async UpdatemorecheesemembersAdvocacyAction(
        @Arg('input', () => UpdatemorecheesemembersAdvocacyActionInput) input: UpdatemorecheesemembersAdvocacyActionInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Advocacy Actions', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheesemembersAdvocacyAction_)
    async DeletemorecheesemembersAdvocacyAction(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Advocacy Actions', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Data Quality Labels
//****************************************************************************
@ObjectType({ description: `Labeled ground truth for deliberately injected data defects — every duplicate, stale record, and typo the generator planted, with the correct answer. Data-quality demos verify against this table.` })
export class morecheesemembersDataQualityLabel_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(80)
    LabelKey: string;
        
    @Field({description: `DuplicatePerson (RelatedPersonID = the canonical record), StaleEmployer (RelatedOrganizationID = the TRUE employer), or TypoEmail (TruthValue = the correct email)`}) 
    @MaxLength(50)
    DefectKind: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RelatedPersonID?: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    RelatedOrganizationID?: string;
        
    @Field({nullable: true, description: `The defective value as it appears in the data (e.g. the typo'd email, the stale org name)`}) 
    @MaxLength(400)
    DefectValue?: string;
        
    @Field({nullable: true, description: `The correct value (the verifiable right answer)`}) 
    @MaxLength(400)
    TruthValue?: string;
        
    @Field({nullable: true}) 
    @MaxLength(500)
    Notes?: string;
        
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
    @MaxLength(201)
    RelatedPerson?: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    RelatedOrganization?: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Data Quality Labels
//****************************************************************************
@InputType()
export class CreatemorecheesemembersDataQualityLabelInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    LabelKey?: string;

    @Field({ nullable: true })
    DefectKind?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    RelatedPersonID: string | null;

    @Field({ nullable: true })
    RelatedOrganizationID: string | null;

    @Field({ nullable: true })
    DefectValue: string | null;

    @Field({ nullable: true })
    TruthValue: string | null;

    @Field({ nullable: true })
    Notes: string | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Data Quality Labels
//****************************************************************************
@InputType()
export class UpdatemorecheesemembersDataQualityLabelInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    LabelKey?: string;

    @Field({ nullable: true })
    DefectKind?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    RelatedPersonID?: string | null;

    @Field({ nullable: true })
    RelatedOrganizationID?: string | null;

    @Field({ nullable: true })
    DefectValue?: string | null;

    @Field({ nullable: true })
    TruthValue?: string | null;

    @Field({ nullable: true })
    Notes?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Data Quality Labels
//****************************************************************************
@ObjectType()
export class RunmorecheesemembersDataQualityLabelViewResult {
    @Field(() => [morecheesemembersDataQualityLabel_])
    Results: morecheesemembersDataQualityLabel_[];

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

@Resolver(morecheesemembersDataQualityLabel_)
export class morecheesemembersDataQualityLabelResolver extends ResolverBase {
    @Query(() => RunmorecheesemembersDataQualityLabelViewResult)
    async RunmorecheesemembersDataQualityLabelViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersDataQualityLabelViewResult)
    async RunmorecheesemembersDataQualityLabelViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersDataQualityLabelViewResult)
    async RunmorecheesemembersDataQualityLabelDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Data Quality Labels';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheesemembersDataQualityLabel_, { nullable: true })
    async morecheesemembersDataQualityLabel(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheesemembersDataQualityLabel_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Data Quality Labels', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_members', 'vwDataQualityLabels')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Data Quality Labels', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Data Quality Labels', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheesemembersDataQualityLabel_)
    async CreatemorecheesemembersDataQualityLabel(
        @Arg('input', () => CreatemorecheesemembersDataQualityLabelInput) input: CreatemorecheesemembersDataQualityLabelInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Data Quality Labels', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheesemembersDataQualityLabel_)
    async UpdatemorecheesemembersDataQualityLabel(
        @Arg('input', () => UpdatemorecheesemembersDataQualityLabelInput) input: UpdatemorecheesemembersDataQualityLabelInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Data Quality Labels', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheesemembersDataQualityLabel_)
    async DeletemorecheesemembersDataQualityLabel(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Data Quality Labels', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Member Profiles
//****************************************************************************
@ObjectType({ description: `Member-specific extension of bizapps-common Person: member number, segment, geography, join date (v2-plan §4.2)` })
export class morecheesemembersMemberProfile_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    OrganizationID?: string;
        
    @Field({description: `Business key for the member (e.g. ICF-100217); UUIDs derive from it`}) 
    @MaxLength(50)
    MemberNumber: string;
        
    @Field({description: `Professional segment: Producer, Retailer, Supplier, Educator, or Enthusiast`}) 
    @MaxLength(50)
    Segment: string;
        
    @Field({description: `Coarse geography bucket: NA, EU, or RoW`}) 
    @MaxLength(50)
    Region: string;
        
    @Field({nullable: true}) 
    @MaxLength(2)
    Country?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    CountryName?: string;
        
    @Field({description: `Member city (real city; drives the member map)`}) 
    @MaxLength(100)
    City: string;
        
    @Field({description: `Member state/country code`}) 
    @MaxLength(50)
    State: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    AddressLine1?: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    AddressLine2?: string;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    PostalCode?: string;
        
    @Field(() => Float, {description: `Member latitude, pre-baked for the map`}) 
    Latitude: number;
        
    @Field(() => Float, {description: `Member longitude, pre-baked for the map`}) 
    Longitude: number;
        
    @Field({description: `Date the member first joined the federation`}) 
    JoinDate: Date;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    RaceEthnicity?: string;
        
    @Field({nullable: true}) 
    @MaxLength(30)
    EthnicityHispanic?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    PronounSet?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    PrimaryLanguage?: string;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
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
        
    @Field(() => Float) 
    _mj__Latitude: number;
        
    @Field(() => Float) 
    _mj__Longitude: number;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Member Profiles
//****************************************************************************
@InputType()
export class CreatemorecheesemembersMemberProfileInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    OrganizationID: string | null;

    @Field({ nullable: true })
    MemberNumber?: string;

    @Field({ nullable: true })
    Segment?: string;

    @Field({ nullable: true })
    Region?: string;

    @Field({ nullable: true })
    Country: string | null;

    @Field({ nullable: true })
    CountryName: string | null;

    @Field({ nullable: true })
    City?: string;

    @Field({ nullable: true })
    State?: string;

    @Field({ nullable: true })
    AddressLine1: string | null;

    @Field({ nullable: true })
    AddressLine2: string | null;

    @Field({ nullable: true })
    PostalCode: string | null;

    @Field(() => Float, { nullable: true })
    Latitude?: number;

    @Field(() => Float, { nullable: true })
    Longitude?: number;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    RaceEthnicity: string | null;

    @Field({ nullable: true })
    EthnicityHispanic: string | null;

    @Field({ nullable: true })
    PronounSet: string | null;

    @Field({ nullable: true })
    PrimaryLanguage: string | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Member Profiles
//****************************************************************************
@InputType()
export class UpdatemorecheesemembersMemberProfileInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    OrganizationID?: string | null;

    @Field({ nullable: true })
    MemberNumber?: string;

    @Field({ nullable: true })
    Segment?: string;

    @Field({ nullable: true })
    Region?: string;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    CountryName?: string | null;

    @Field({ nullable: true })
    City?: string;

    @Field({ nullable: true })
    State?: string;

    @Field({ nullable: true })
    AddressLine1?: string | null;

    @Field({ nullable: true })
    AddressLine2?: string | null;

    @Field({ nullable: true })
    PostalCode?: string | null;

    @Field(() => Float, { nullable: true })
    Latitude?: number;

    @Field(() => Float, { nullable: true })
    Longitude?: number;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field({ nullable: true })
    RaceEthnicity?: string | null;

    @Field({ nullable: true })
    EthnicityHispanic?: string | null;

    @Field({ nullable: true })
    PronounSet?: string | null;

    @Field({ nullable: true })
    PrimaryLanguage?: string | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Member Profiles
//****************************************************************************
@ObjectType()
export class RunmorecheesemembersMemberProfileViewResult {
    @Field(() => [morecheesemembersMemberProfile_])
    Results: morecheesemembersMemberProfile_[];

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

@Resolver(morecheesemembersMemberProfile_)
export class morecheesemembersMemberProfileResolver extends ResolverBase {
    @Query(() => RunmorecheesemembersMemberProfileViewResult)
    async RunmorecheesemembersMemberProfileViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersMemberProfileViewResult)
    async RunmorecheesemembersMemberProfileViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersMemberProfileViewResult)
    async RunmorecheesemembersMemberProfileDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Member Profiles';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheesemembersMemberProfile_, { nullable: true })
    async morecheesemembersMemberProfile(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheesemembersMemberProfile_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Member Profiles', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_members', 'vwMemberProfiles')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Member Profiles', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Member Profiles', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheesemembersMemberProfile_)
    async CreatemorecheesemembersMemberProfile(
        @Arg('input', () => CreatemorecheesemembersMemberProfileInput) input: CreatemorecheesemembersMemberProfileInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Member Profiles', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheesemembersMemberProfile_)
    async UpdatemorecheesemembersMemberProfile(
        @Arg('input', () => UpdatemorecheesemembersMemberProfileInput) input: UpdatemorecheesemembersMemberProfileInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Member Profiles', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheesemembersMemberProfile_)
    async DeletemorecheesemembersMemberProfile(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Member Profiles', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Membership Periods
//****************************************************************************
@ObjectType({ description: `One row per membership cycle; member status is derived from the latest period. Decomposes into bizapps-orders Subscription + renewal Orders when that app ships` })
export class morecheesemembersMembershipPeriod_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key: <MemberNumber>-P<n>, the n-th period of that member`}) 
    @MaxLength(60)
    PeriodKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field({description: `Tier for this period: Enthusiast, Individual, SmallBusiness, or Corporate`}) 
    @MaxLength(50)
    MembershipTier: string;
        
    @Field(() => Float, {description: `Dues billed for this period, in USD, per the tier lattice`}) 
    DuesAmount: number;
        
    @Field({description: `Period start; renewals back-date so consecutive periods never gap`}) 
    StartDate: Date;
        
    @Field({description: `Period end; member status is derived from the latest period, never stored`}) 
    EndDate: Date;
        
    @Field({description: `Date the renewal decision falls due (equals EndDate)`}) 
    RenewalDate: Date;
        
    @Field({description: `Period state: Active, Renewed, Lapsed, PendingRenewal, or Cancelled — member-lifecycle state lives HERE, never on Person`}) 
    @MaxLength(50)
    Status: string;
        
    @Field({nullable: true, description: `Set when a lapse passes the 2-month grace window (team rule: every lapse past grace gets a termination date)`}) 
    CancellationDate?: Date;
        
    @Field({nullable: true, description: `Why the membership ended (e.g. non-payment — employer event); carries the diagnosis for win-back stories`}) 
    @MaxLength(200)
    CancellationReason?: string;
        
    @Field(() => Boolean, {description: `Whether this period renews automatically (card on file)`}) 
    AutoRenew: boolean;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(201)
    Person: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Membership Periods
//****************************************************************************
@InputType()
export class CreatemorecheesemembersMembershipPeriodInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    PeriodKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    MembershipTier?: string;

    @Field(() => Float, { nullable: true })
    DuesAmount?: number;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    RenewalDate?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CancellationDate: Date | null;

    @Field({ nullable: true })
    CancellationReason: string | null;

    @Field(() => Boolean, { nullable: true })
    AutoRenew?: boolean;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Membership Periods
//****************************************************************************
@InputType()
export class UpdatemorecheesemembersMembershipPeriodInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    PeriodKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    MembershipTier?: string;

    @Field(() => Float, { nullable: true })
    DuesAmount?: number;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field({ nullable: true })
    EndDate?: Date;

    @Field({ nullable: true })
    RenewalDate?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CancellationDate?: Date | null;

    @Field({ nullable: true })
    CancellationReason?: string | null;

    @Field(() => Boolean, { nullable: true })
    AutoRenew?: boolean;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Membership Periods
//****************************************************************************
@ObjectType()
export class RunmorecheesemembersMembershipPeriodViewResult {
    @Field(() => [morecheesemembersMembershipPeriod_])
    Results: morecheesemembersMembershipPeriod_[];

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

@Resolver(morecheesemembersMembershipPeriod_)
export class morecheesemembersMembershipPeriodResolver extends ResolverBase {
    @Query(() => RunmorecheesemembersMembershipPeriodViewResult)
    async RunmorecheesemembersMembershipPeriodViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersMembershipPeriodViewResult)
    async RunmorecheesemembersMembershipPeriodViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersMembershipPeriodViewResult)
    async RunmorecheesemembersMembershipPeriodDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Membership Periods';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheesemembersMembershipPeriod_, { nullable: true })
    async morecheesemembersMembershipPeriod(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheesemembersMembershipPeriod_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Membership Periods', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_members', 'vwMembershipPeriods')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Membership Periods', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Membership Periods', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheesemembersMembershipPeriod_)
    async CreatemorecheesemembersMembershipPeriod(
        @Arg('input', () => CreatemorecheesemembersMembershipPeriodInput) input: CreatemorecheesemembersMembershipPeriodInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Membership Periods', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheesemembersMembershipPeriod_)
    async UpdatemorecheesemembersMembershipPeriod(
        @Arg('input', () => UpdatemorecheesemembersMembershipPeriodInput) input: UpdatemorecheesemembersMembershipPeriodInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Membership Periods', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheesemembersMembershipPeriod_)
    async DeletemorecheesemembersMembershipPeriod(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Membership Periods', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Organization Profiles
//****************************************************************************
@ObjectType({ description: `Org-specific extension of bizapps-common Organization: demo geography and the lifecycle events (dissolution/acquisition/program cut) that drive employer-related churn` })
export class morecheesemembersOrganizationProfile_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    OrganizationID: string;
        
    @Field({description: `Business key for the organization (e.g. ORG-0042); UUIDs derive from it`}) 
    @MaxLength(50)
    OrgKey: string;
        
    @Field({description: `What the organization does in the cheese world: Producer, Retailer, Supplier, or Educator`}) 
    @MaxLength(50)
    Type: string;
        
    @Field({description: `Coarse geography bucket: NA, EU, or RoW`}) 
    @MaxLength(50)
    Region: string;
        
    @Field({nullable: true}) 
    @MaxLength(2)
    Country?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    CountryName?: string;
        
    @Field({description: `Headquarters city (real city, invented business name)`}) 
    @MaxLength(100)
    City: string;
        
    @Field({description: `Headquarters state/country code`}) 
    @MaxLength(50)
    State: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    AddressLine1?: string;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    PostalCode?: string;
        
    @Field(() => Float, {description: `Headquarters latitude, pre-baked for the map (no live geocoding)`}) 
    Latitude: number;
        
    @Field(() => Float, {description: `Headquarters longitude, pre-baked for the map (no live geocoding)`}) 
    Longitude: number;
        
    @Field({nullable: true, description: `The org-level shock, if any: Dissolved, Acquired, or ProgramCut — the driver behind employer-related churn`}) 
    @MaxLength(50)
    LifecycleEventKind?: string;
        
    @Field(() => Int, {nullable: true, description: `Year the lifecycle event happened`}) 
    LifecycleEventYear?: number;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(255)
    Organization: string;
        
    @Field(() => Float) 
    _mj__Latitude: number;
        
    @Field(() => Float) 
    _mj__Longitude: number;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Organization Profiles
//****************************************************************************
@InputType()
export class CreatemorecheesemembersOrganizationProfileInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    OrganizationID?: string;

    @Field({ nullable: true })
    OrgKey?: string;

    @Field({ nullable: true })
    Type?: string;

    @Field({ nullable: true })
    Region?: string;

    @Field({ nullable: true })
    Country: string | null;

    @Field({ nullable: true })
    CountryName: string | null;

    @Field({ nullable: true })
    City?: string;

    @Field({ nullable: true })
    State?: string;

    @Field({ nullable: true })
    AddressLine1: string | null;

    @Field({ nullable: true })
    PostalCode: string | null;

    @Field(() => Float, { nullable: true })
    Latitude?: number;

    @Field(() => Float, { nullable: true })
    Longitude?: number;

    @Field({ nullable: true })
    LifecycleEventKind: string | null;

    @Field(() => Int, { nullable: true })
    LifecycleEventYear: number | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Organization Profiles
//****************************************************************************
@InputType()
export class UpdatemorecheesemembersOrganizationProfileInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    OrganizationID?: string;

    @Field({ nullable: true })
    OrgKey?: string;

    @Field({ nullable: true })
    Type?: string;

    @Field({ nullable: true })
    Region?: string;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    CountryName?: string | null;

    @Field({ nullable: true })
    City?: string;

    @Field({ nullable: true })
    State?: string;

    @Field({ nullable: true })
    AddressLine1?: string | null;

    @Field({ nullable: true })
    PostalCode?: string | null;

    @Field(() => Float, { nullable: true })
    Latitude?: number;

    @Field(() => Float, { nullable: true })
    Longitude?: number;

    @Field({ nullable: true })
    LifecycleEventKind?: string | null;

    @Field(() => Int, { nullable: true })
    LifecycleEventYear?: number | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Organization Profiles
//****************************************************************************
@ObjectType()
export class RunmorecheesemembersOrganizationProfileViewResult {
    @Field(() => [morecheesemembersOrganizationProfile_])
    Results: morecheesemembersOrganizationProfile_[];

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

@Resolver(morecheesemembersOrganizationProfile_)
export class morecheesemembersOrganizationProfileResolver extends ResolverBase {
    @Query(() => RunmorecheesemembersOrganizationProfileViewResult)
    async RunmorecheesemembersOrganizationProfileViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersOrganizationProfileViewResult)
    async RunmorecheesemembersOrganizationProfileViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesemembersOrganizationProfileViewResult)
    async RunmorecheesemembersOrganizationProfileDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Organization Profiles';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheesemembersOrganizationProfile_, { nullable: true })
    async morecheesemembersOrganizationProfile(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheesemembersOrganizationProfile_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Organization Profiles', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_members', 'vwOrganizationProfiles')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Organization Profiles', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Organization Profiles', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheesemembersOrganizationProfile_)
    async CreatemorecheesemembersOrganizationProfile(
        @Arg('input', () => CreatemorecheesemembersOrganizationProfileInput) input: CreatemorecheesemembersOrganizationProfileInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Organization Profiles', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheesemembersOrganizationProfile_)
    async UpdatemorecheesemembersOrganizationProfile(
        @Arg('input', () => UpdatemorecheesemembersOrganizationProfileInput) input: UpdatemorecheesemembersOrganizationProfileInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Organization Profiles', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheesemembersOrganizationProfile_)
    async DeletemorecheesemembersOrganizationProfile(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Organization Profiles', key, options, provider, userPayload, pubSub);
    }
    
}