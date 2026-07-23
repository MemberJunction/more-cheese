-- ============================================================
-- MoreCheese: certifications, competition entries, advocacy actions (v1.2.0)
-- The "more tables" enrichment (2026-07-16): three new demo domains that unlock the
-- remaining expressible personas — Sofia Marchetti (the certification journey), Henri
-- Dubois's Gold medal (the competition eligibility story), Tom Reyes (the advocacy
-- champion / Sonar component-breakdown demo).
-- Hand-authored per the ownership rule (the baseline is immutable; the generator never
-- writes migrations). No __mj_* columns, no FK indexes — CodeGen owns those.
-- ============================================================

---------------------------------------------------------------------------
-- Certification: the credential catalog (learning domain)
---------------------------------------------------------------------------
CREATE TABLE morecheese_learning.Certification (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    CertKey NVARCHAR(50) NOT NULL,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NULL,
    ValidYears INT NOT NULL DEFAULT 3,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_Certification PRIMARY KEY (ID),
    CONSTRAINT UQ_Certification_CertKey UNIQUE (CertKey)
);
GO

CREATE TABLE morecheese_learning.MemberCertification (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    MemberCertKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    CertificationID UNIQUEIDENTIFIER NOT NULL,
    Status NVARCHAR(50) NOT NULL,
    EnrolledOn DATE NOT NULL,
    AwardedOn DATE NULL,
    ExpiresOn DATE NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_MemberCertification PRIMARY KEY (ID),
    CONSTRAINT UQ_MemberCertification_Key UNIQUE (MemberCertKey),
    CONSTRAINT FK_MemberCertification_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_MemberCertification_Certification FOREIGN KEY (CertificationID) REFERENCES morecheese_learning.Certification(ID),
    CONSTRAINT CK_MemberCertification_Status CHECK (Status IN ('InProgress', 'Awarded', 'Expired', 'Withdrawn'))
);
GO

---------------------------------------------------------------------------
-- CompetitionEntry: the annual judging (events domain) — org membership is
-- the eligibility gate (Henri's join trigger)
---------------------------------------------------------------------------
CREATE TABLE morecheese_events.CompetitionEntry (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    EntryKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    OrganizationID UNIQUEIDENTIFIER NULL,
    EntryYear INT NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    Result NVARCHAR(50) NOT NULL DEFAULT 'None',
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_CompetitionEntry PRIMARY KEY (ID),
    CONSTRAINT UQ_CompetitionEntry_Key UNIQUE (EntryKey),
    CONSTRAINT FK_CompetitionEntry_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_CompetitionEntry_Organization FOREIGN KEY (OrganizationID) REFERENCES __mj_BizAppsCommon.Organization(ID),
    CONSTRAINT CK_CompetitionEntry_Result CHECK (Result IN ('Gold', 'Silver', 'Bronze', 'None'))
);
GO

---------------------------------------------------------------------------
-- AdvocacyAction: legislative engagement (membership domain) — the
-- "engaged, but differently shaped" signal for Sonar's component breakdown
---------------------------------------------------------------------------
CREATE TABLE morecheese_members.AdvocacyAction (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    ActionKey NVARCHAR(80) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    ActionDate DATE NOT NULL,
    Kind NVARCHAR(50) NOT NULL,
    Topic NVARCHAR(200) NOT NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_AdvocacyAction PRIMARY KEY (ID),
    CONSTRAINT UQ_AdvocacyAction_Key UNIQUE (ActionKey),
    CONSTRAINT FK_AdvocacyAction_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT CK_AdvocacyAction_Kind CHECK (Kind IN ('LetterCampaign', 'PetitionSignature', 'Testimony', 'CoalitionMeeting'))
);
GO

---------------------------------------------------------------------------
-- Extended properties (MS_Description) — tables + non-PK/FK columns
---------------------------------------------------------------------------
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The credential catalog (CCP, sensory evaluation, food safety)', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Certification';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'A member''s certification journey: enrolled, awarded (with expiry), expired, or withdrawn', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'MemberCertification';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Annual competition entries; org membership is the eligibility gate, results are medal or none', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Legislative engagement actions — the advocacy-shaped component of member engagement', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'AdvocacyAction';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Business key (e.g. CERT-CCP)', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Certification', @level2type = N'COLUMN', @level2name = N'CertKey';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Years the credential stays valid after award', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'Certification', @level2type = N'COLUMN', @level2name = N'ValidYears';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'InProgress, Awarded, Expired, or Withdrawn', @level0type = N'SCHEMA', @level0name = N'morecheese_learning', @level1type = N'TABLE', @level1name = N'MemberCertification', @level2type = N'COLUMN', @level2name = N'Status';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Competition category (e.g. Alpine Styles, Soft-Ripened)', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry', @level2type = N'COLUMN', @level2name = N'Category';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The entered cheese (invented product names from the cleared bank components)', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry', @level2type = N'COLUMN', @level2name = N'ProductName';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Gold, Silver, Bronze, or None', @level0type = N'SCHEMA', @level0name = N'morecheese_events', @level1type = N'TABLE', @level1name = N'CompetitionEntry', @level2type = N'COLUMN', @level2name = N'Result';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'LetterCampaign, PetitionSignature, Testimony, or CoalitionMeeting', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'AdvocacyAction', @level2type = N'COLUMN', @level2name = N'Kind';
GO
