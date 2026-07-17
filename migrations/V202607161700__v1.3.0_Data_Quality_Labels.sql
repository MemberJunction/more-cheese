-- ============================================================
-- MoreCheese: data-quality defect labels (v1.3.0)
-- The defects module (feedback 2026-07-16): the generator deliberately injects
-- realistic record defects (duplicate people, stale employers, typo'd emails) and
-- records EVERY injection here as labeled ground truth — so data-quality demos
-- (dedup, enrichment, cleansing) have a verifiable right answer.
-- Hand-authored per the ownership rule. No __mj_* columns, no FK indexes (CodeGen).
-- ============================================================

CREATE TABLE morecheese_members.DataQualityLabel (
    ID UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
    LabelKey NVARCHAR(80) NOT NULL,
    DefectKind NVARCHAR(50) NOT NULL,
    PersonID UNIQUEIDENTIFIER NOT NULL,
    RelatedPersonID UNIQUEIDENTIFIER NULL,
    RelatedOrganizationID UNIQUEIDENTIFIER NULL,
    DefectValue NVARCHAR(400) NULL,
    TruthValue NVARCHAR(400) NULL,
    Notes NVARCHAR(500) NULL,
    IsSharedDemo BIT NOT NULL DEFAULT 1,
    CONSTRAINT PK_DataQualityLabel PRIMARY KEY (ID),
    CONSTRAINT UQ_DataQualityLabel_Key UNIQUE (LabelKey),
    CONSTRAINT FK_DataQualityLabel_Person FOREIGN KEY (PersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_DataQualityLabel_RelatedPerson FOREIGN KEY (RelatedPersonID) REFERENCES __mj_BizAppsCommon.Person(ID),
    CONSTRAINT FK_DataQualityLabel_RelatedOrganization FOREIGN KEY (RelatedOrganizationID) REFERENCES __mj_BizAppsCommon.Organization(ID),
    CONSTRAINT CK_DataQualityLabel_Kind CHECK (DefectKind IN ('DuplicatePerson', 'StaleEmployer', 'TypoEmail'))
);
GO

EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'Labeled ground truth for deliberately injected data defects — every duplicate, stale record, and typo the generator planted, with the correct answer. Data-quality demos verify against this table.', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'DuplicatePerson (RelatedPersonID = the canonical record), StaleEmployer (RelatedOrganizationID = the TRUE employer), or TypoEmail (TruthValue = the correct email)', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel', @level2type = N'COLUMN', @level2name = N'DefectKind';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The defective value as it appears in the data (e.g. the typo''d email, the stale org name)', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel', @level2type = N'COLUMN', @level2name = N'DefectValue';
GO
EXEC sp_addextendedproperty @name = N'MS_Description', @value = N'The correct value (the verifiable right answer)', @level0type = N'SCHEMA', @level0name = N'morecheese_members', @level1type = N'TABLE', @level1name = N'DataQualityLabel', @level2type = N'COLUMN', @level2name = N'TruthValue';
GO
