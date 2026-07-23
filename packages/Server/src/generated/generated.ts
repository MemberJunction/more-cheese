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


import { morecheeselearningCourseEnrollmentEntity, morecheeselearningCourseEntity, morecheeseeventsEventRegistrationEntity, morecheeseeventsEventEntity, morecheesemembersMembershipPeriodEntity, morecheeseordersOrderLineEntity, morecheeseordersOrderEntity, morecheesecommonOrganizationEntity, morecheeseordersPaymentEntity, morecheesecommonPersonEntity, morecheeseordersProductEntity } from '@mj-more-cheese-demo/entities';
    

//****************************************************************************
// ENTITY CLASS for MoreCheese: Course Enrollments
//****************************************************************************
@ObjectType()
export class morecheeselearningCourseEnrollment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(80)
    EnrollKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    @MaxLength(36)
    CourseID: string;
        
    @Field() 
    EnrolledOn: Date;
        
    @Field() 
    @MaxLength(50)
    Status: string;
        
    @Field({nullable: true}) 
    CompletedOn?: Date;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
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
@ObjectType()
export class morecheeselearningCourse_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    CourseKey: string;
        
    @Field() 
    @MaxLength(200)
    Name: string;
        
    @Field() 
    StartDate: Date;
        
    @Field(() => Int) 
    DurationWeeks: number;
        
    @Field(() => Boolean) 
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
// ENTITY CLASS for MoreCheese: Event Registrations
//****************************************************************************
@ObjectType()
export class morecheeseeventsEventRegistration_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(120)
    RegKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    @MaxLength(36)
    EventID: string;
        
    @Field() 
    RegisteredOn: Date;
        
    @Field(() => Boolean, {nullable: true}) 
    Attended?: boolean;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
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
@ObjectType()
export class morecheeseeventsEvent_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    EventKey: string;
        
    @Field() 
    @MaxLength(200)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    EventType: string;
        
    @Field() 
    EventDate: Date;
        
    @Field(() => Boolean) 
    IsVirtual: boolean;
        
    @Field(() => Boolean) 
    IsPaid: boolean;
        
    @Field({nullable: true}) 
    @MaxLength(100)
    City?: string;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    State?: string;
        
    @Field(() => Float, {nullable: true}) 
    Latitude?: number;
        
    @Field(() => Float, {nullable: true}) 
    Longitude?: number;
        
    @Field(() => Boolean) 
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
// ENTITY CLASS for MoreCheese: Membership Periods
//****************************************************************************
@ObjectType()
export class morecheesemembersMembershipPeriod_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(60)
    PeriodKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    @MaxLength(50)
    MembershipTier: string;
        
    @Field(() => Float) 
    DuesAmount: number;
        
    @Field() 
    StartDate: Date;
        
    @Field() 
    EndDate: Date;
        
    @Field() 
    RenewalDate: Date;
        
    @Field() 
    @MaxLength(50)
    Status: string;
        
    @Field({nullable: true}) 
    CancellationDate?: Date;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    CancellationReason?: string;
        
    @Field(() => Boolean) 
    AutoRenew: boolean;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
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
@ObjectType()
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
        
    @Field(() => Int) 
    Quantity: number;
        
    @Field(() => Float) 
    UnitPrice: number;
        
    @Field(() => Float) 
    LineTotal: number;
        
    @Field(() => Boolean) 
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
@ObjectType()
export class morecheeseordersOrder_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    OrderKey: string;
        
    @Field() 
    @MaxLength(36)
    PersonID: string;
        
    @Field() 
    @MaxLength(50)
    OrderType: string;
        
    @Field() 
    @MaxLength(50)
    Status: string;
        
    @Field() 
    OrderDate: Date;
        
    @Field() 
    DueDate: Date;
        
    @Field(() => Float) 
    TotalGross: number;
        
    @Field() 
    @MaxLength(50)
    PaymentStatus: string;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [morecheeseordersOrderLine_])
    morecheeseordersMoreCheese_OrderLines_OrderIDArray: morecheeseordersOrderLine_[]; // Link to morecheeseordersMoreCheese_OrderLines
    
    @Field(() => [morecheeseordersPayment_])
    morecheeseordersMoreCheese_Payments_OrderIDArray: morecheeseordersPayment_[]; // Link to morecheeseordersMoreCheese_Payments
    
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
    
    @FieldResolver(() => [morecheeseordersOrderLine_])
    async morecheeseordersMoreCheese_OrderLines_OrderIDArray(@Root() morecheeseordersorder_: morecheeseordersOrder_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Order Lines', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwOrderLines')} WHERE ${provider.QuoteIdentifier('OrderID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Order Lines', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheeseordersorder_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Order Lines', rows, this.GetUserFromPayload(userPayload));
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
// ENTITY CLASS for MoreCheese: Organizations
//****************************************************************************
@ObjectType()
export class morecheesecommonOrganization_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    OrgKey: string;
        
    @Field() 
    @MaxLength(200)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    Type: string;
        
    @Field() 
    @MaxLength(50)
    Region: string;
        
    @Field() 
    @MaxLength(100)
    City: string;
        
    @Field() 
    @MaxLength(50)
    State: string;
        
    @Field(() => Float) 
    Latitude: number;
        
    @Field(() => Float) 
    Longitude: number;
        
    @Field({nullable: true}) 
    @MaxLength(50)
    LifecycleEventKind?: string;
        
    @Field(() => Int, {nullable: true}) 
    LifecycleEventYear?: number;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field(() => [morecheesecommonPerson_])
    morecheesecommonMoreCheese_People_OrganizationIDArray: morecheesecommonPerson_[]; // Link to morecheesecommonMoreCheese_People
    
}

//****************************************************************************
// INPUT TYPE for MoreCheese: Organizations
//****************************************************************************
@InputType()
export class CreatemorecheesecommonOrganizationInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    OrgKey?: string;

    @Field({ nullable: true })
    Name?: string;

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

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: Organizations
//****************************************************************************
@InputType()
export class UpdatemorecheesecommonOrganizationInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    OrgKey?: string;

    @Field({ nullable: true })
    Name?: string;

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

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: Organizations
//****************************************************************************
@ObjectType()
export class RunmorecheesecommonOrganizationViewResult {
    @Field(() => [morecheesecommonOrganization_])
    Results: morecheesecommonOrganization_[];

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

@Resolver(morecheesecommonOrganization_)
export class morecheesecommonOrganizationResolver extends ResolverBase {
    @Query(() => RunmorecheesecommonOrganizationViewResult)
    async RunmorecheesecommonOrganizationViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesecommonOrganizationViewResult)
    async RunmorecheesecommonOrganizationViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesecommonOrganizationViewResult)
    async RunmorecheesecommonOrganizationDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: Organizations';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheesecommonOrganization_, { nullable: true })
    async morecheesecommonOrganization(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheesecommonOrganization_ | null> {
        this.CheckUserReadPermissions('MoreCheese: Organizations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_common', 'vwOrganizations')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Organizations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: Organizations', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [morecheesecommonPerson_])
    async morecheesecommonMoreCheese_People_OrganizationIDArray(@Root() morecheesecommonorganization_: morecheesecommonOrganization_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: People', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_common', 'vwPeople')} WHERE ${provider.QuoteIdentifier('OrganizationID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: People', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheesecommonorganization_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: People', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => morecheesecommonOrganization_)
    async CreatemorecheesecommonOrganization(
        @Arg('input', () => CreatemorecheesecommonOrganizationInput) input: CreatemorecheesecommonOrganizationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: Organizations', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheesecommonOrganization_)
    async UpdatemorecheesecommonOrganization(
        @Arg('input', () => UpdatemorecheesecommonOrganizationInput) input: UpdatemorecheesecommonOrganizationInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: Organizations', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheesecommonOrganization_)
    async DeletemorecheesecommonOrganization(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: Organizations', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Payments
//****************************************************************************
@ObjectType()
export class morecheeseordersPayment_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(36)
    OrderID: string;
        
    @Field(() => Float) 
    Amount: number;
        
    @Field() 
    PaymentDate: Date;
        
    @Field() 
    @MaxLength(50)
    Method: string;
        
    @Field() 
    @MaxLength(50)
    Status: string;
        
    @Field(() => Boolean) 
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
// ENTITY CLASS for MoreCheese: People
//****************************************************************************
@ObjectType()
export class morecheesecommonPerson_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    MemberNumber: string;
        
    @Field() 
    @MaxLength(100)
    FirstName: string;
        
    @Field() 
    @MaxLength(100)
    LastName: string;
        
    @Field() 
    @MaxLength(50)
    Segment: string;
        
    @Field() 
    @MaxLength(50)
    Region: string;
        
    @Field() 
    @MaxLength(100)
    City: string;
        
    @Field() 
    @MaxLength(50)
    State: string;
        
    @Field(() => Float) 
    Latitude: number;
        
    @Field(() => Float) 
    Longitude: number;
        
    @Field({nullable: true}) 
    @MaxLength(36)
    OrganizationID?: string;
        
    @Field() 
    JoinDate: Date;
        
    @Field(() => Boolean) 
    IsSharedDemo: boolean;
        
    @Field() 
    _mj__CreatedAt: Date;
        
    @Field() 
    _mj__UpdatedAt: Date;
        
    @Field({nullable: true}) 
    @MaxLength(200)
    Organization?: string;
        
    @Field(() => [morecheeseeventsEventRegistration_])
    morecheeseeventsMoreCheese_EventRegistrations_PersonIDArray: morecheeseeventsEventRegistration_[]; // Link to morecheeseeventsMoreCheese_EventRegistrations
    
    @Field(() => [morecheesemembersMembershipPeriod_])
    morecheesemembersMoreCheese_MembershipPeriods_PersonIDArray: morecheesemembersMembershipPeriod_[]; // Link to morecheesemembersMoreCheese_MembershipPeriods
    
    @Field(() => [morecheeseordersOrder_])
    morecheeseordersMoreCheese_Orders_PersonIDArray: morecheeseordersOrder_[]; // Link to morecheeseordersMoreCheese_Orders
    
    @Field(() => [morecheeselearningCourseEnrollment_])
    morecheeselearningMoreCheese_CourseEnrollments_PersonIDArray: morecheeselearningCourseEnrollment_[]; // Link to morecheeselearningMoreCheese_CourseEnrollments
    
}

//****************************************************************************
// INPUT TYPE for MoreCheese: People
//****************************************************************************
@InputType()
export class CreatemorecheesecommonPersonInput {
    @Field({ nullable: true })
    ID?: string;

    @Field({ nullable: true })
    MemberNumber?: string;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

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
    OrganizationID: string | null;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    

//****************************************************************************
// INPUT TYPE for MoreCheese: People
//****************************************************************************
@InputType()
export class UpdatemorecheesecommonPersonInput {
    @Field()
    ID: string;

    @Field({ nullable: true })
    MemberNumber?: string;

    @Field({ nullable: true })
    FirstName?: string;

    @Field({ nullable: true })
    LastName?: string;

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
    OrganizationID?: string | null;

    @Field({ nullable: true })
    JoinDate?: Date;

    @Field(() => Boolean, { nullable: true })
    IsSharedDemo?: boolean;

    @Field(() => [KeyValuePairInput], { nullable: true })
    OldValues___?: KeyValuePairInput[];

    @Field(() => RestoreContextInput, { nullable: true })
    RestoreContext___?: RestoreContextInput;
}
    
//****************************************************************************
// RESOLVER for MoreCheese: People
//****************************************************************************
@ObjectType()
export class RunmorecheesecommonPersonViewResult {
    @Field(() => [morecheesecommonPerson_])
    Results: morecheesecommonPerson_[];

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

@Resolver(morecheesecommonPerson_)
export class morecheesecommonPersonResolver extends ResolverBase {
    @Query(() => RunmorecheesecommonPersonViewResult)
    async RunmorecheesecommonPersonViewByID(@Arg('input', () => RunViewByIDInput) input: RunViewByIDInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByIDGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesecommonPersonViewResult)
    async RunmorecheesecommonPersonViewByName(@Arg('input', () => RunViewByNameInput) input: RunViewByNameInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        return super.RunViewByNameGeneric(input, provider, userPayload, pubSub);
    }

    @Query(() => RunmorecheesecommonPersonViewResult)
    async RunmorecheesecommonPersonDynamicView(@Arg('input', () => RunDynamicViewInput) input: RunDynamicViewInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        input.EntityName = 'MoreCheese: People';
        return super.RunDynamicViewGeneric(input, provider, userPayload, pubSub);
    }
    @Query(() => morecheesecommonPerson_, { nullable: true })
    async morecheesecommonPerson(@Arg('ID', () => String) ID: string, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine): Promise<morecheesecommonPerson_ | null> {
        this.CheckUserReadPermissions('MoreCheese: People', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_common', 'vwPeople')} WHERE ${provider.QuoteIdentifier('ID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: People', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.MapFieldNamesToCodeNames('MoreCheese: People', rows && rows.length > 0 ? rows[0] : null, this.GetUserFromPayload(userPayload));
        return result;
    }
    
    @FieldResolver(() => [morecheeseeventsEventRegistration_])
    async morecheeseeventsMoreCheese_EventRegistrations_PersonIDArray(@Root() morecheesecommonperson_: morecheesecommonPerson_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Event Registrations', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_events', 'vwEventRegistrations')} WHERE ${provider.QuoteIdentifier('PersonID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Event Registrations', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheesecommonperson_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Event Registrations', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [morecheesemembersMembershipPeriod_])
    async morecheesemembersMoreCheese_MembershipPeriods_PersonIDArray(@Root() morecheesecommonperson_: morecheesecommonPerson_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Membership Periods', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_members', 'vwMembershipPeriods')} WHERE ${provider.QuoteIdentifier('PersonID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Membership Periods', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheesecommonperson_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Membership Periods', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [morecheeseordersOrder_])
    async morecheeseordersMoreCheese_Orders_PersonIDArray(@Root() morecheesecommonperson_: morecheesecommonPerson_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Orders', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_orders', 'vwOrders')} WHERE ${provider.QuoteIdentifier('PersonID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Orders', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheesecommonperson_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Orders', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @FieldResolver(() => [morecheeselearningCourseEnrollment_])
    async morecheeselearningMoreCheese_CourseEnrollments_PersonIDArray(@Root() morecheesecommonperson_: morecheesecommonPerson_, @Ctx() { userPayload, providers }: AppContext, @PubSub() pubSub: PubSubEngine) {
        this.CheckUserReadPermissions('MoreCheese: Course Enrollments', userPayload);
        const provider = GetReadOnlyProvider(providers, { allowFallbackToReadWrite: true });
        const sSQL = `SELECT * FROM ${provider.QuoteSchemaAndView('morecheese_learning', 'vwCourseEnrollments')} WHERE ${provider.QuoteIdentifier('PersonID')}=${provider.BuildParameterPlaceholder(0)} ` + this.getRowLevelSecurityWhereClause(provider, 'MoreCheese: Course Enrollments', userPayload, EntityPermissionType.Read, 'AND');
        const rows = await provider.ExecuteSQL(sSQL, [morecheesecommonperson_.ID], undefined, this.GetUserFromPayload(userPayload));
        const result = await this.ArrayMapFieldNamesToCodeNames('MoreCheese: Course Enrollments', rows, this.GetUserFromPayload(userPayload));
        return result;
    }
        
    @Mutation(() => morecheesecommonPerson_)
    async CreatemorecheesecommonPerson(
        @Arg('input', () => CreatemorecheesecommonPersonInput) input: CreatemorecheesecommonPersonInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.CreateRecord('MoreCheese: People', input, provider, userPayload, pubSub)
    }
        
    @Mutation(() => morecheesecommonPerson_)
    async UpdatemorecheesecommonPerson(
        @Arg('input', () => UpdatemorecheesecommonPersonInput) input: UpdatemorecheesecommonPersonInput,
        @Ctx() { providers, userPayload }: AppContext,
        @PubSub() pubSub: PubSubEngine
    ) {
        const provider = GetReadWriteProvider(providers);
        return this.UpdateRecord('MoreCheese: People', input, provider, userPayload, pubSub);
    }
    
    @Mutation(() => morecheesecommonPerson_)
    async DeletemorecheesecommonPerson(@Arg('ID', () => String) ID: string, @Arg('options___', () => DeleteOptionsInput) options: DeleteOptionsInput, @Ctx() { providers, userPayload }: AppContext, @PubSub() pubSub: PubSubEngine) {
        const provider = GetReadWriteProvider(providers);
        const key = new CompositeKey([{FieldName: 'ID', Value: ID}]);
        return this.DeleteRecord('MoreCheese: People', key, options, provider, userPayload, pubSub);
    }
    
}

//****************************************************************************
// ENTITY CLASS for MoreCheese: Products
//****************************************************************************
@ObjectType()
export class morecheeseordersProduct_ {
    @Field() 
    @MaxLength(36)
    ID: string;
        
    @Field() 
    @MaxLength(50)
    ProductKey: string;
        
    @Field() 
    @MaxLength(200)
    Name: string;
        
    @Field() 
    @MaxLength(50)
    ProductType: string;
        
    @Field(() => Float) 
    UnitPrice: number;
        
    @Field(() => Boolean) 
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