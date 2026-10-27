---
title: "Certification administration and exam audit"
date: 2024-07-24
doc_type: memo
visibility: internal
org: "International Cheese Federation"
era: era-artisan-boom-2022-2024
fiscal_year: 2024
fictional: true
from_role: "Education & Credentialing"
to_roles:
  - "Membership Operations"
  - "Office of the Chief Executive"
subject: "Certification administration and exam audit"
week_of: 2024-07-22
tags:
  - certification
  - exam-sitting
  - credential-records
  - audit
data_sources:
  - generated/certifications
  - generated/member-certifications
---

> **FICTIONAL DEMONSTRATION DOCUMENT** — International Cheese Federation (ICF), a fictitious trade association created for the MemberJunction More Cheese demonstration environment. All names, figures, events, and decisions are invented.

**To:** Membership Operations; Office of the Chief Executive
**From:** Education & Credentialing
**Date:** 24 July 2024
**Subject:** Certification administration and exam audit

This memo outlines administrative findings following the recent Des Moines conference and reviews current credential records. While public attention focuses on seasonal blog themes like margin reports and cave humidity during peak July heat, our internal credential ledger requires immediate reconciliation. Specifically, we have identified discrepancies in recent exam sittings, prerequisite validations, and credential recertification tracking that must be resolved before the fall cohort cycle begins.

## Exam Sittings and Prerequisite Verification

Following the annual conference, our credential review queue shows zero new certification enrollments taken this week, which is consistent with the post-conference drop in administrative processing. However, we did complete one significant credential award: the Sensory Evaluation Certificate was officially awarded to Pascal Napolitano. This brings our year-to-date credential output into alignment with annual targets, but it also exposed a lag in our prerequisite verification workflow.

During the audit of recent candidate files, we discovered that two applicants registered for upcoming advanced examinations without fully clearing their foundational prerequisites in the database. While neither candidate has sat for an exam yet, the automated enrollment script permitted registration because the prerequisite flags were manually bypassed during the spring rush. This is an administrative risk. We cannot have candidates sitting for specialized exams—such as advanced sensory or affinage modules—without verifiable foundational certificates on record.

## Credential Record Corrections

We also reviewed historical credential records and found three instances where member name changes or organizational transfers resulted in duplicated profile entries. These duplicate profiles risk splitting a single member's continuing education credits across two separate records. While this does not rise to the level of systemic data corruption, it creates friction during annual renewals and makes it difficult for members to verify their active credentials on the portal.

Membership Operations and Education must establish a shared protocol for handling credential updates when a member changes their creamery affiliation. At present, when an individual moves from one small business member organization to another, their active certification status occasionally unlinks from their primary profile. This requires manual SQL intervention rather than a standard administrative toggle.

## Capacity and Timing Constraints

Our team is currently managing 31 active course enrollments for the upcoming autumn cohort cycle, alongside preparations for the upcoming Washed-Curd & Dutch Styles and Affinage Fundamentals cohorts. Conducting a full credential audit simultaneously stretches our administrative capacity thin. However, delaying the audit until autumn will only compound the record discrepancies.

We recommend tackling the duplicate profile clean-up in stages, starting with corporate and small business tiers where credential tracking is tied directly to organizational membership benefits.

## What we need

- Membership Operations: cross-reference our list of duplicated credential profiles against active membership rosters by 31 July 2024.
- Office of the Chief Executive: approve a temporary administrative hold on automated exam registration overrides until prerequisite validation rules are updated in the portal.
- Education & Credentialing: draft a revised checklist for exam sitters and distribute it to regional proctors before the next exam window opens.

*Education & Credentialing*
