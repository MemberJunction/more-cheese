/********************************************************************************
* ALL ENTITIES - TypeGraphQL Type Class Definition - AUTO GENERATED FILE
* Generated Entities and Resolvers for Server
*
*   >>> DO NOT MODIFY THIS FILE!!!!!!!!!!!!
*   >>> YOUR CHANGES WILL BE OVERWRITTEN
*   >>> THE NEXT TIME THIS FILE IS GENERATED
*
**********************************************************************************/
import { Arg, Ctx, Int, Query, Resolver, Field, Float, ObjectType, FieldResolver, Root, InputType, Mutation,
            PubSub, PubSubEngine, ResolverBase, RunViewByIDInput, RunViewByNameInput, RunDynamicViewInput,
            AppContext, KeyValuePairInput, DeleteOptionsInput, GraphQLTimestamp as Timestamp,
            GetReadOnlyProvider, GetReadWriteProvider, RestoreContextInput } from '@memberjunction/server';
import { Metadata, EntityPermissionType, CompositeKey, UserInfo } from '@memberjunction/core'

import { MaxLength } from 'class-validator';
import * as mj_core_schema_server_object_types from '@memberjunction/server'


import { morecheesemembersAdvocacyActionEntity, morecheeselearningCertificationEntity, morecheeseeventsCompetitionEntryEntity, morecheeselearningCourseEnrollmentEntity, morecheeselearningCourseEntity, morecheesemembersDataQualityLabelEntity, morecheeseeventsEventRegistrationEntity, morecheeseeventsEventEntity, morecheeselearningMemberCertificationEntity, morecheesemembersMemberProfileEntity, morecheesemembersMembershipPeriodEntity, morecheeseordersOrderLineEntity, morecheeseordersOrderEntity, morecheesemembersOrganizationProfileEntity, morecheeseordersPaymentEntity, morecheeseordersProductEntity } from '@mj-more-cheese-demo/entities';
    

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
// ENTITY CLASS for MoreCheese: Certifications
//****************************************************************************
@ObjectType({ description: `The credential catalog (CCP, sensory evaluation, food safety)` })
export class morecheeselearningCertification_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key (e.g. CERT-CCP)`}) 
    @MaxLength(50)
    CertKey: string;
        
    @Field() 
    @MaxLength(200)
    Name: string;
        
    @Field({nullable: true}) 
    Description?: string;
        
    @Field(() => Int, {description: `Years the credential stays valid after award`}) 
    ValidYears: number;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [morecheeselearningMemberCertification_])
    morecheeselearningMoreCheese_MemberCertifications_CertificationIDArray: morecheeselearningMemberCertification_[]; // Link to morecheeselearningMoreCheese_MemberCertifications
    
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Certifications
//****************************************************************************
@InputType()
export class CreatemorecheeselearningCertificationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CertKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description: string | null;

    @Field(() => Int, { nullable: true })
    ValidYears?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Certifications
//****************************************************************************
@InputType()
export class UpdatemorecheeselearningCertificationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CertKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    Description?: string | null;

    @Field(() => Int, { nullable: true })
    ValidYears?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Certifications
//****************************************************************************
@ObjectType()
export class RunmorecheeselearningCertificationViewResult {
    @Field(() => [morecheeselearningCertification_])
    Results: morecheeselearningCertification_[];

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

@Resolver(morecheeselearningCertification_)
export class morecheeselearningCertificationResolver extends ResolverBase {
    @Query(() => RunmorecheeselearningCertificationViewResult)
    async RunmorecheeselearningCertificationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningCertificationViewResult)
    async RunmorecheeselearningCertificationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningCertificationViewResult)
    async RunmorecheeselearningCertificationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Certifications';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeselearningCertification_, { nullable: true })
    async morecheeselearningCertification(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeselearningCertification_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Certifications', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_learning', 'vwCertifications')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Certifications', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Certifications', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [morecheeselearningMemberCertification_])
    async morecheeselearningMoreCheese_MemberCertifications_CertificationIDArray(@Root() morecheeselearningcertification_: morecheeselearningCertification_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Member Certifications', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_learning', 'vwMemberCertifications')} WHERE ${provider.QuoteIdentifier('CertificationID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Member Certifications', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheeselearningcertification_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Member Certifications', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => morecheeselearningCertification_)
    async CreatemorecheeselearningCertification(
        @Arg('input', () => CreatemorecheeselearningCertificationInput) input: CreatemorecheeselearningCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Certifications', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeselearningCertification_)
    async UpdatemorecheeselearningCertification(
        @Arg('input', () => UpdatemorecheeselearningCertificationInput) input: UpdatemorecheeselearningCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Certifications', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeselearningCertification_)
    async DeletemorecheeselearningCertification(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Certifications', key, options, provider, userPayload, pubSub);
    }
    
}

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
// ENTITY CLASS for MoreCheese: Course Enrollments
//****************************************************************************
@ObjectType({ description: `Course enrollments with completion outcomes` })
export class morecheeselearningCourseEnrollment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key; UUIDs derive from it`}) 
    @MaxLength(80)
    EnrollKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    @MaxLength(36)
    CourseID: string;
        
    @Field({description: `Enrollment date — always inside a valid membership window`}) 
    EnrolledOn: Date;
        
    @Field({description: `InProgress, Completed, or Dropped (completion is a calibrated outcome)`}) 
    @MaxLength(50)
    Status: string;
        
    @Field({nullable: true, description: `Completion date when Status is Completed`}) 
    CompletedOn?: Date;
        
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
    Course: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Course Enrollments
//****************************************************************************
@InputType()
export class CreatemorecheeselearningCourseEnrollmentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    EnrollKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    CourseID?: string;

    @Field({ nullable: true })
    EnrolledOn?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CompletedOn: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Course Enrollments
//****************************************************************************
@InputType()
export class UpdatemorecheeselearningCourseEnrollmentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    EnrollKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    CourseID?: string;

    @Field({ nullable: true })
    EnrolledOn?: Date;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    CompletedOn?: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Course Enrollments
//****************************************************************************
@ObjectType()
export class RunmorecheeselearningCourseEnrollmentViewResult {
    @Field(() => [morecheeselearningCourseEnrollment_])
    Results: morecheeselearningCourseEnrollment_[];

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

@Resolver(morecheeselearningCourseEnrollment_)
export class morecheeselearningCourseEnrollmentResolver extends ResolverBase {
    @Query(() => RunmorecheeselearningCourseEnrollmentViewResult)
    async RunmorecheeselearningCourseEnrollmentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningCourseEnrollmentViewResult)
    async RunmorecheeselearningCourseEnrollmentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningCourseEnrollmentViewResult)
    async RunmorecheeselearningCourseEnrollmentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Course Enrollments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeselearningCourseEnrollment_, { nullable: true })
    async morecheeselearningCourseEnrollment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeselearningCourseEnrollment_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Course Enrollments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_learning', 'vwCourseEnrollments')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Course Enrollments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Course Enrollments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheeselearningCourseEnrollment_)
    async CreatemorecheeselearningCourseEnrollment(
        @Arg('input', () => CreatemorecheeselearningCourseEnrollmentInput) input: CreatemorecheeselearningCourseEnrollmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Course Enrollments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeselearningCourseEnrollment_)
    async UpdatemorecheeselearningCourseEnrollment(
        @Arg('input', () => UpdatemorecheeselearningCourseEnrollmentInput) input: UpdatemorecheeselearningCourseEnrollmentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Course Enrollments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeselearningCourseEnrollment_)
    async DeletemorecheeselearningCourseEnrollment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Course Enrollments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Courses
//****************************************************************************
@ObjectType({ description: `The learning catalog` })
export class morecheeselearningCourse_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key; UUIDs derive from it`}) 
    @MaxLength(50)
    CourseKey: string;
        
    @Field({description: `Course title`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({description: `Cohort start date`}) 
    StartDate: Date;
        
    @Field(() => Int, {description: `Course length in weeks`}) 
    DurationWeeks: number;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [morecheeselearningCourseEnrollment_])
    morecheeselearningMoreCheese_CourseEnrollments_CourseIDArray: morecheeselearningCourseEnrollment_[]; // Link to morecheeselearningMoreCheese_CourseEnrollments
    
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Courses
//****************************************************************************
@InputType()
export class CreatemorecheeselearningCourseInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    CourseKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field(() => Int, { nullable: true })
    DurationWeeks?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Courses
//****************************************************************************
@InputType()
export class UpdatemorecheeselearningCourseInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    CourseKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    StartDate?: Date;

    @Field(() => Int, { nullable: true })
    DurationWeeks?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Courses
//****************************************************************************
@ObjectType()
export class RunmorecheeselearningCourseViewResult {
    @Field(() => [morecheeselearningCourse_])
    Results: morecheeselearningCourse_[];

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

@Resolver(morecheeselearningCourse_)
export class morecheeselearningCourseResolver extends ResolverBase {
    @Query(() => RunmorecheeselearningCourseViewResult)
    async RunmorecheeselearningCourseViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningCourseViewResult)
    async RunmorecheeselearningCourseViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningCourseViewResult)
    async RunmorecheeselearningCourseDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Courses';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeselearningCourse_, { nullable: true })
    async morecheeselearningCourse(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeselearningCourse_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Courses', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_learning', 'vwCourses')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Courses', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Courses', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [morecheeselearningCourseEnrollment_])
    async morecheeselearningMoreCheese_CourseEnrollments_CourseIDArray(@Root() morecheeselearningcourse_: morecheeselearningCourse_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Course Enrollments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_learning', 'vwCourseEnrollments')} WHERE ${provider.QuoteIdentifier('CourseID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Course Enrollments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheeselearningcourse_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Course Enrollments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => morecheeselearningCourse_)
    async CreatemorecheeselearningCourse(
        @Arg('input', () => CreatemorecheeselearningCourseInput) input: CreatemorecheeselearningCourseInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Courses', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeselearningCourse_)
    async UpdatemorecheeselearningCourse(
        @Arg('input', () => UpdatemorecheeselearningCourseInput) input: UpdatemorecheeselearningCourseInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Courses', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeselearningCourse_)
    async DeletemorecheeselearningCourse(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Courses', key, options, provider, userPayload, pubSub);
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
        
    @Field(() => [morecheeseeventsEventRegistration_])
    morecheeseeventsMoreCheese_EventRegistrations_EventIDArray: morecheeseeventsEventRegistration_[]; // Link to morecheeseeventsMoreCheese_EventRegistrations
    
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
    
    @FieldResolver(() => [morecheeseeventsEventRegistration_])
    async morecheeseeventsMoreCheese_EventRegistrations_EventIDArray(@Root() morecheeseeventsevent_: morecheeseeventsEvent_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Event Registrations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_events', 'vwEventRegistrations')} WHERE ${provider.QuoteIdentifier('EventID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Event Registrations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheeseeventsevent_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Event Registrations', rows, this.GetUserFromPayload(userPayload));
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

//****************************************************************************
// ENTITY CLASS for MoreCheese: Member Certifications
//****************************************************************************
@ObjectType({ description: `A member\'s certification journey: enrolled, awarded (with expiry), expired, or withdrawn` })
export class morecheeselearningMemberCertification_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(80)
    MemberCertKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    @MaxLength(36)
    CertificationID: string;
        
    @Field({description: `InProgress, Awarded, Expired, or Withdrawn`}) 
    @MaxLength(50)
    Status: string;
        
    @Field() 
    EnrolledOn: Date;
        
    @Field({nullable: true}) 
    AwardedOn?: Date;
        
    @Field({nullable: true}) 
    ExpiresOn?: Date;
        
    @Field(() => Boolean) 
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
    Certification: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Member Certifications
//****************************************************************************
@InputType()
export class CreatemorecheeselearningMemberCertificationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberCertKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    CertificationID?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    EnrolledOn?: Date;

    @Field({ nullable: true })
    AwardedOn: Date | null;

    @Field({ nullable: true })
    ExpiresOn: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Member Certifications
//****************************************************************************
@InputType()
export class UpdatemorecheeselearningMemberCertificationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberCertKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    CertificationID?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    EnrolledOn?: Date;

    @Field({ nullable: true })
    AwardedOn?: Date | null;

    @Field({ nullable: true })
    ExpiresOn?: Date | null;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Member Certifications
//****************************************************************************
@ObjectType()
export class RunmorecheeselearningMemberCertificationViewResult {
    @Field(() => [morecheeselearningMemberCertification_])
    Results: morecheeselearningMemberCertification_[];

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

@Resolver(morecheeselearningMemberCertification_)
export class morecheeselearningMemberCertificationResolver extends ResolverBase {
    @Query(() => RunmorecheeselearningMemberCertificationViewResult)
    async RunmorecheeselearningMemberCertificationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningMemberCertificationViewResult)
    async RunmorecheeselearningMemberCertificationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeselearningMemberCertificationViewResult)
    async RunmorecheeselearningMemberCertificationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Member Certifications';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeselearningMemberCertification_, { nullable: true })
    async morecheeselearningMemberCertification(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeselearningMemberCertification_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Member Certifications', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_learning', 'vwMemberCertifications')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Member Certifications', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Member Certifications', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheeselearningMemberCertification_)
    async CreatemorecheeselearningMemberCertification(
        @Arg('input', () => CreatemorecheeselearningMemberCertificationInput) input: CreatemorecheeselearningMemberCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Member Certifications', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeselearningMemberCertification_)
    async UpdatemorecheeselearningMemberCertification(
        @Arg('input', () => UpdatemorecheeselearningMemberCertificationInput) input: UpdatemorecheeselearningMemberCertificationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Member Certifications', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeselearningMemberCertification_)
    async DeletemorecheeselearningMemberCertification(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Member Certifications', key, options, provider, userPayload, pubSub);
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
        
    @Field({description: `Member city (real city; drives the member map)`}) 
    @MaxLength(100)
    City: string;
        
    @Field({description: `Member state/country code`}) 
    @MaxLength(50)
    State: string;
        
    @Field(() => Float, {description: `Member latitude, pre-baked for the map`}) 
    Latitude: number;
        
    @Field(() => Float, {description: `Member longitude, pre-baked for the map`}) 
    Longitude: number;
        
    @Field({description: `Date the member first joined the federation`}) 
    JoinDate: Date;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(2)
    Country?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    CountryName?: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    AddressLine1?: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    AddressLine2?: string;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    PostalCode?: string;
        
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
        
    @Field() 
    @MaxLength(201)
    Person: string;
        
    @Field({nullable: true}) 
    @MaxLength(255)
    Organization?: string;
        
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
    City?: string;

    @Field({ nullable: true })
    State?: string;

    @Field(() => Float, { nullable: true })
    Latitude?: number;

    @Field(() => Float, { nullable: true })
    Longitude?: number;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field({ nullable: true })
    Country: string | null;

    @Field({ nullable: true })
    CountryName: string | null;

    @Field({ nullable: true })
    AddressLine1: string | null;

    @Field({ nullable: true })
    AddressLine2: string | null;

    @Field({ nullable: true })
    PostalCode: string | null;

    @Field({ nullable: true })
    RaceEthnicity: string | null;

    @Field({ nullable: true })
    EthnicityHispanic: string | null;

    @Field({ nullable: true })
    PronounSet: string | null;

    @Field({ nullable: true })
    PrimaryLanguage: string | null;

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
    City?: string;

    @Field({ nullable: true })
    State?: string;

    @Field(() => Float, { nullable: true })
    Latitude?: number;

    @Field(() => Float, { nullable: true })
    Longitude?: number;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    CountryName?: string | null;

    @Field({ nullable: true })
    AddressLine1?: string | null;

    @Field({ nullable: true })
    AddressLine2?: string | null;

    @Field({ nullable: true })
    PostalCode?: string | null;

    @Field({ nullable: true })
    RaceEthnicity?: string | null;

    @Field({ nullable: true })
    EthnicityHispanic?: string | null;

    @Field({ nullable: true })
    PronounSet?: string | null;

    @Field({ nullable: true })
    PrimaryLanguage?: string | null;

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
// ENTITY CLASS for MoreCheese: Order Lines
//****************************************************************************
@ObjectType({ description: `Product-typed order lines` })
export class morecheeseordersOrderLine_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    OrderID: string;
        
    @Field() 
    @MaxLength(36)
    ProductID: string;
        
    @Field(() => Int, {description: `Line quantity (1 in the demo slice)`}) 
    Quantity: number;
        
    @Field(() => Float, {description: `Line unit price in USD`}) 
    UnitPrice: number;
        
    @Field(() => Float, {description: `Quantity × UnitPrice, in USD`}) 
    LineTotal: number;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(200)
    Product: string;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Order Lines
//****************************************************************************
@InputType()
export class CreatemorecheeseordersOrderLineInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    OrderID?: string;

    @Field({ nullable: true })
    ProductID?: string;

    @Field(() => Int, { nullable: true })
    Quantity?: number;

    @Field(() => Float, { nullable: true })
    UnitPrice?: number;

    @Field(() => Float, { nullable: true })
    LineTotal?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Order Lines
//****************************************************************************
@InputType()
export class UpdatemorecheeseordersOrderLineInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    OrderID?: string;

    @Field({ nullable: true })
    ProductID?: string;

    @Field(() => Int, { nullable: true })
    Quantity?: number;

    @Field(() => Float, { nullable: true })
    UnitPrice?: number;

    @Field(() => Float, { nullable: true })
    LineTotal?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Order Lines
//****************************************************************************
@ObjectType()
export class RunmorecheeseordersOrderLineViewResult {
    @Field(() => [morecheeseordersOrderLine_])
    Results: morecheeseordersOrderLine_[];

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

@Resolver(morecheeseordersOrderLine_)
export class morecheeseordersOrderLineResolver extends ResolverBase {
    @Query(() => RunmorecheeseordersOrderLineViewResult)
    async RunmorecheeseordersOrderLineViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersOrderLineViewResult)
    async RunmorecheeseordersOrderLineViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersOrderLineViewResult)
    async RunmorecheeseordersOrderLineDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Order Lines';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeseordersOrderLine_, { nullable: true })
    async morecheeseordersOrderLine(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeseordersOrderLine_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Order Lines', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwOrderLines')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Order Lines', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Order Lines', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheeseordersOrderLine_)
    async CreatemorecheeseordersOrderLine(
        @Arg('input', () => CreatemorecheeseordersOrderLineInput) input: CreatemorecheeseordersOrderLineInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Order Lines', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeseordersOrderLine_)
    async UpdatemorecheeseordersOrderLine(
        @Arg('input', () => UpdatemorecheeseordersOrderLineInput) input: UpdatemorecheeseordersOrderLineInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Order Lines', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeseordersOrderLine_)
    async DeletemorecheeseordersOrderLine(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Order Lines', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Orders
//****************************************************************************
@ObjectType({ description: `One order per billable fact (order-per-cycle; the posted order IS the bill). Stand-in for bizapps-orders` })
export class morecheeseordersOrder_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key (ORD-D-* dues, ORD-R-* open renewal, ORD-E-* event); UUIDs derive from it`}) 
    @MaxLength(50)
    OrderKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field({description: `Always Sale in the demo slice`}) 
    @MaxLength(50)
    OrderType: string;
        
    @Field({description: `Always Posted — the posted order IS the bill (no invoices, per bizapps-orders design)`}) 
    @MaxLength(50)
    Status: string;
        
    @Field({description: `Date the order posted (dues post at period start; event orders at registration)`}) 
    OrderDate: Date;
        
    @Field({description: `Payment due date (period start, or +30 days on business-tier net terms)`}) 
    DueDate: Date;
        
    @Field(() => Float, {description: `Order total in USD`}) 
    TotalGross: number;
        
    @Field({description: `Paid, Unpaid, or Overdue — a payment dated after release has not happened yet, so orders age (real A/R)`}) 
    @MaxLength(50)
    PaymentStatus: string;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field() 
    @MaxLength(201)
    Person: string;
        
    @Field(() => [morecheeseordersPayment_])
    morecheeseordersMoreCheese_Payments_OrderIDArray: morecheeseordersPayment_[]; // Link to morecheeseordersMoreCheese_Payments
    
    @Field(() => [morecheeseordersOrderLine_])
    morecheeseordersMoreCheese_OrderLines_OrderIDArray: morecheeseordersOrderLine_[]; // Link to morecheeseordersMoreCheese_OrderLines
    
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Orders
//****************************************************************************
@InputType()
export class CreatemorecheeseordersOrderInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    OrderKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    OrderType?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    OrderDate?: Date;

    @Field({ nullable: true })
    DueDate?: Date;

    @Field(() => Float, { nullable: true })
    TotalGross?: number;

    @Field({ nullable: true })
    PaymentStatus?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Orders
//****************************************************************************
@InputType()
export class UpdatemorecheeseordersOrderInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    OrderKey?: string;

    @Field({ nullable: true })
    PersonID?: string;

    @Field({ nullable: true })
    OrderType?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field({ nullable: true })
    OrderDate?: Date;

    @Field({ nullable: true })
    DueDate?: Date;

    @Field(() => Float, { nullable: true })
    TotalGross?: number;

    @Field({ nullable: true })
    PaymentStatus?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Orders
//****************************************************************************
@ObjectType()
export class RunmorecheeseordersOrderViewResult {
    @Field(() => [morecheeseordersOrder_])
    Results: morecheeseordersOrder_[];

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

@Resolver(morecheeseordersOrder_)
export class morecheeseordersOrderResolver extends ResolverBase {
    @Query(() => RunmorecheeseordersOrderViewResult)
    async RunmorecheeseordersOrderViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersOrderViewResult)
    async RunmorecheeseordersOrderViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersOrderViewResult)
    async RunmorecheeseordersOrderDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Orders';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeseordersOrder_, { nullable: true })
    async morecheeseordersOrder(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeseordersOrder_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Orders', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwOrders')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Orders', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Orders', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [morecheeseordersPayment_])
    async morecheeseordersMoreCheese_Payments_OrderIDArray(@Root() morecheeseordersorder_: morecheeseordersOrder_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Payments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwPayments')} WHERE ${provider.QuoteIdentifier('OrderID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Payments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheeseordersorder_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Payments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [morecheeseordersOrderLine_])
    async morecheeseordersMoreCheese_OrderLines_OrderIDArray(@Root() morecheeseordersorder_: morecheeseordersOrder_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Order Lines', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwOrderLines')} WHERE ${provider.QuoteIdentifier('OrderID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Order Lines', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheeseordersorder_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Order Lines', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => morecheeseordersOrder_)
    async CreatemorecheeseordersOrder(
        @Arg('input', () => CreatemorecheeseordersOrderInput) input: CreatemorecheeseordersOrderInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Orders', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeseordersOrder_)
    async UpdatemorecheeseordersOrder(
        @Arg('input', () => UpdatemorecheeseordersOrderInput) input: UpdatemorecheeseordersOrderInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Orders', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeseordersOrder_)
    async DeletemorecheeseordersOrder(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Orders', key, options, provider, userPayload, pubSub);
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
        
    @Field({description: `Headquarters city (real city, invented business name)`}) 
    @MaxLength(100)
    City: string;
        
    @Field({description: `Headquarters state/country code`}) 
    @MaxLength(50)
    State: string;
        
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
        
    @Field({nullable: true}) 
    @MaxLength(2)
    Country?: string;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    CountryName?: string;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    AddressLine1?: string;
        
    @Field({nullable: true}) 
    @MaxLength(20)
    PostalCode?: string;
        
    @Field() 
    @MaxLength(255)
    Organization: string;
        
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
    City?: string;

    @Field({ nullable: true })
    State?: string;

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

    @Field({ nullable: true })
    Country: string | null;

    @Field({ nullable: true })
    CountryName: string | null;

    @Field({ nullable: true })
    AddressLine1: string | null;

    @Field({ nullable: true })
    PostalCode: string | null;

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
    City?: string;

    @Field({ nullable: true })
    State?: string;

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

    @Field({ nullable: true })
    Country?: string | null;

    @Field({ nullable: true })
    CountryName?: string | null;

    @Field({ nullable: true })
    AddressLine1?: string | null;

    @Field({ nullable: true })
    PostalCode?: string | null;

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

//****************************************************************************
// ENTITY CLASS for MoreCheese: Payments
//****************************************************************************
@ObjectType({ description: `Payments against orders, timed by the declared payment profiles (a payment dated after release has not happened yet — orders age instead)` })
export class morecheeseordersPayment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    OrderID: string;
        
    @Field(() => Float, {description: `Payment amount in USD (full payment; no partials in the demo slice)`}) 
    Amount: number;
        
    @Field({description: `Date the payment landed, per the declared payment-timing profiles`}) 
    PaymentDate: Date;
        
    @Field({description: `CreditCard, ACH, Check, or Wire (business tiers pay on net terms)`}) 
    @MaxLength(50)
    Method: string;
        
    @Field({description: `Captured (Failed/Refunded reserved for future stories)`}) 
    @MaxLength(50)
    Status: string;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Payments
//****************************************************************************
@InputType()
export class CreatemorecheeseordersPaymentInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    OrderID?: string;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field({ nullable: true })
    PaymentDate?: Date;

    @Field({ nullable: true })
    Method?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Payments
//****************************************************************************
@InputType()
export class UpdatemorecheeseordersPaymentInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    OrderID?: string;

    @Field(() => Float, { nullable: true })
    Amount?: number;

    @Field({ nullable: true })
    PaymentDate?: Date;

    @Field({ nullable: true })
    Method?: string;

    @Field({ nullable: true })
    Status?: string;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Payments
//****************************************************************************
@ObjectType()
export class RunmorecheeseordersPaymentViewResult {
    @Field(() => [morecheeseordersPayment_])
    Results: morecheeseordersPayment_[];

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

@Resolver(morecheeseordersPayment_)
export class morecheeseordersPaymentResolver extends ResolverBase {
    @Query(() => RunmorecheeseordersPaymentViewResult)
    async RunmorecheeseordersPaymentViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersPaymentViewResult)
    async RunmorecheeseordersPaymentViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersPaymentViewResult)
    async RunmorecheeseordersPaymentDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Payments';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeseordersPayment_, { nullable: true })
    async morecheeseordersPayment(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeseordersPayment_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Payments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwPayments')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Payments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Payments', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @Mutation(() => morecheeseordersPayment_)
    async CreatemorecheeseordersPayment(
        @Arg('input', () => CreatemorecheeseordersPaymentInput) input: CreatemorecheeseordersPaymentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Payments', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeseordersPayment_)
    async UpdatemorecheeseordersPayment(
        @Arg('input', () => UpdatemorecheeseordersPaymentInput) input: UpdatemorecheeseordersPaymentInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Payments', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeseordersPayment_)
    async DeletemorecheeseordersPayment(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Payments', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Products
//****************************************************************************
@ObjectType({ description: `Sellable products: membership tiers and event registrations` })
export class morecheeseordersProduct_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field({description: `Business key (e.g. PROD-MEM-INDIVIDUAL); UUIDs derive from it`}) 
    @MaxLength(50)
    ProductKey: string;
        
    @Field({description: `Product display name`}) 
    @MaxLength(200)
    Name: string;
        
    @Field({description: `Membership (annual dues per tier) or Event (registration)`}) 
    @MaxLength(50)
    ProductType: string;
        
    @Field(() => Float, {description: `List price in USD`}) 
    UnitPrice: number;
        
    @Field(() => Boolean, {description: `Marks generated shared-demo rows; the wipe-and-recreate boundary`}) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [morecheeseordersOrderLine_])
    morecheeseordersMoreCheese_OrderLines_ProductIDArray: morecheeseordersOrderLine_[]; // Link to morecheeseordersMoreCheese_OrderLines
    
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Products
//****************************************************************************
@InputType()
export class CreatemorecheeseordersProductInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    ProductKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    ProductType?: string;

    @Field(() => Float, { nullable: true })
    UnitPrice?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Products
//****************************************************************************
@InputType()
export class UpdatemorecheeseordersProductInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    ProductKey?: string;

    @Field({ nullable: true })
    Name?: string;

    @Field({ nullable: true })
    ProductType?: string;

    @Field(() => Float, { nullable: true })
    UnitPrice?: number;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Products
//****************************************************************************
@ObjectType()
export class RunmorecheeseordersProductViewResult {
    @Field(() => [morecheeseordersProduct_])
    Results: morecheeseordersProduct_[];

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

@Resolver(morecheeseordersProduct_)
export class morecheeseordersProductResolver extends ResolverBase {
    @Query(() => RunmorecheeseordersProductViewResult)
    async RunmorecheeseordersProductViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersProductViewResult)
    async RunmorecheeseordersProductViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheeseordersProductViewResult)
    async RunmorecheeseordersProductDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Products';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheeseordersProduct_, { nullable: true })
    async morecheeseordersProduct(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheeseordersProduct_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Products', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwProducts')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Products', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Products', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [morecheeseordersOrderLine_])
    async morecheeseordersMoreCheese_OrderLines_ProductIDArray(@Root() morecheeseordersproduct_: morecheeseordersProduct_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Order Lines', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwOrderLines')} WHERE ${provider.QuoteIdentifier('ProductID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Order Lines', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheeseordersproduct_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Order Lines', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => morecheeseordersProduct_)
    async CreatemorecheeseordersProduct(
        @Arg('input', () => CreatemorecheeseordersProductInput) input: CreatemorecheeseordersProductInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Products', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheeseordersProduct_)
    async UpdatemorecheeseordersProduct(
        @Arg('input', () => UpdatemorecheeseordersProductInput) input: UpdatemorecheeseordersProductInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Products', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheeseordersProduct_)
    async DeletemorecheeseordersProduct(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Products', key, options, provider, userPayload, pubSub);
    }
    
}