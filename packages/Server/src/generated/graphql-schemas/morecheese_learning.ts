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


import { morecheeselearningCertificationEntity, morecheeselearningCourseEnrollmentEntity, morecheeselearningCourseEntity, morecheeselearningMemberCertificationEntity } from '@mj-more-cheese-demo/entities';
    

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