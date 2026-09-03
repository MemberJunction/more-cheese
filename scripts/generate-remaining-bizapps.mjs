/**
 * generate-remaining-bizapps.mjs
 *
 * Deterministically generates seed metadata for all remaining BizApps tables:
 * - __mj_BizAppsAccounting: GLAccount, GLAccountLink
 * - __mj_BizAppsCommon: Activity, ActivityLink
 * - __mj_BizAppsCommittees: Minute, Comment, Artifact
 * - __mj_BizAppsTasks: TaskTag, TaskTagLink, TaskComment, TaskActivity
 * - __mj_BizAppsSecureMessaging: MessageFile
 *
 * Uses existing metadata (People, Meetings, Committees, Tasks, SecureMessages)
 * to maintain 100% referential integrity with zero orphans.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const metadataDir = path.join(rootDir, 'metadata');

const ICF_NAMESPACE = '8d3e9117-2b36-4078-a6fe-4c60144f8101';
const ICF_COMPANY_ID = 'E8A1D92C-38A2-51E7-8FB2-12C9B7A65D30';

function uuidv5(name, namespace = ICF_NAMESPACE) {
  const nsBuffer = Buffer.from(namespace.replace(/-/g, ''), 'hex');
  const nameBuffer = Buffer.from(name, 'utf8');
  const hash = crypto.createHash('sha1').update(Buffer.concat([nsBuffer, nameBuffer])).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50; // version 5
  hash[8] = (hash[8] & 0x3f) | 0x80; // variant 1
  const hex = hash.toString('hex', 0, 16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`.toUpperCase();
}

function loadJsonDir(dirName) {
  const targetDir = path.join(metadataDir, dirName);
  if (!fs.existsSync(targetDir)) return [];
  const records = [];
  for (const file of fs.readdirSync(targetDir)) {
    if (file.endsWith('.json') && !file.startsWith('.mj-sync')) {
      const data = JSON.parse(fs.readFileSync(path.join(targetDir, file), 'utf8'));
      if (Array.isArray(data)) {
        records.push(...data);
      } else if (data.records) {
        records.push(...data.records);
      }
    }
  }
  return records;
}

function writeMetadataDir(dirName, entityName, records) {
  const targetDir = path.join(metadataDir, dirName);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Write .mj-sync.json
  const syncConfig = {
    entity: entityName,
    filePattern: '**/.*.json'
  };
  fs.writeFileSync(path.join(targetDir, '.mj-sync.json'), JSON.stringify(syncConfig, null, 2) + '\n');

  // 2. Write data file
  const fileName = `.${dirName}.json`;
  const formatted = records.map(r => ({
    primaryKey: { ID: r.ID },
    fields: r.fields
  }));
  fs.writeFileSync(path.join(targetDir, fileName), JSON.stringify(formatted, null, 2) + '\n');
  console.log(`✓ Wrote ${records.length} records to metadata/${dirName}/${fileName} [${entityName}]`);
}

// -----------------------------------------------------------------------------
// 1. Accounting: GLAccount and GLAccountLink
// -----------------------------------------------------------------------------
console.log('\n--- Generating GL Accounts & Links ---');
const accounts = [
  { code: '1010', name: 'Operating Cash', type: 'Asset', desc: 'Main operating checking account for ICF' },
  { code: '1100', name: 'Accounts Receivable Control', type: 'Asset', desc: 'Trade accounts receivable from members and sponsors' },
  { code: '1200', name: 'Inventory Asset', type: 'Asset', desc: 'Publications and physical merchandise inventory' },
  { code: '2100', name: 'Deferred Revenue', type: 'Liability', desc: 'Unearned membership dues and prepaid event registrations' },
  { code: '4010', name: 'Membership Dues Revenue', type: 'Revenue', desc: 'Annual dues recognized from member tiers' },
  { code: '4020', name: 'Event & Conference Revenue', type: 'Revenue', desc: 'Registrations and symposium ticketing' },
  { code: '4030', name: 'Education & Certification Revenue', type: 'Revenue', desc: 'Course enrollments and credential exam fees' },
  { code: '4040', name: 'Publications & Goods Revenue', type: 'Revenue', desc: 'Standards guides, journals, and merchandise sales' },
  { code: '4050', name: 'Contributions & Sponsorship Revenue', type: 'Revenue', desc: 'Corporate donations and annual conference sponsorships' },
  { code: '4900', name: 'Sales Discounts', type: 'Revenue', desc: 'Early bird and volume promotional discounts' },
  { code: '4910', name: 'Sales Returns and Allowances', type: 'Revenue', desc: 'Order cancellations and refund allowances' },
  { code: '5010', name: 'Payment Processing Fees', type: 'Expense', desc: 'Credit card and gateway transaction merchant fees' },
  { code: '5020', name: 'Cost of Goods Sold', type: 'Expense', desc: 'Direct printing and materials costs for publications' }
];

const glAccountRecords = accounts.map(a => {
  const id = uuidv5(`GLAccount:${a.code}`);
  return {
    ID: id,
    fields: {
      CompanyID: ICF_COMPANY_ID,
      Code: a.code,
      Name: a.name,
      AccountType: a.type,
      ParentGLAccountID: null,
      CurrencyCode: 'USD',
      ExternalSystem: null,
      ExternalAccountID: null,
      IsActive: true,
      IsSystemSeeded: false,
      Description: a.desc
    }
  };
});
writeMetadataDir('gl-accounts', 'MJ_BizApps_Accounting: GL Accounts', glAccountRecords);

const categories = loadJsonDir('product-categories');
const categoryMap = new Map();
for (const cat of categories) {
  categoryMap.set(cat.fields.Name, cat.primaryKey.ID);
}

const glAccountLinks = [
  // Company Defaults
  {
    role: 'Accounts Receivable',
    accCode: '1100',
    entity: 'MJ: Companies',
    recordId: ICF_COMPANY_ID,
    comment: 'ICF default AR control account'
  },
  {
    role: 'Cash',
    accCode: '1010',
    entity: 'MJ: Companies',
    recordId: ICF_COMPANY_ID,
    comment: 'ICF default operating cash account'
  },
  {
    role: 'Deferred Revenue',
    accCode: '2100',
    entity: 'MJ: Companies',
    recordId: ICF_COMPANY_ID,
    comment: 'ICF default unearned dues liability'
  },
  {
    role: 'Sales Discounts',
    accCode: '4900',
    entity: 'MJ: Companies',
    recordId: ICF_COMPANY_ID,
    comment: 'ICF default sales discount contra account'
  },
  {
    role: 'Sales Returns and Allowances',
    accCode: '4910',
    entity: 'MJ: Companies',
    recordId: ICF_COMPANY_ID,
    comment: 'ICF default returns & allowances contra account'
  },
  {
    role: 'Processing Fee',
    accCode: '5010',
    entity: 'MJ: Companies',
    recordId: ICF_COMPANY_ID,
    comment: 'ICF default gateway processing fee expense'
  },
  // Category-specific Sales Revenue links
  {
    role: 'Sales',
    accCode: '4010',
    entity: 'MJ_BizApps_Orders: Product Categories',
    recordId: categoryMap.get('Memberships'),
    comment: 'Membership dues revenue recognized'
  },
  {
    role: 'Sales',
    accCode: '4020',
    entity: 'MJ_BizApps_Orders: Product Categories',
    recordId: categoryMap.get('Events'),
    comment: 'Event and conference ticketing revenue'
  },
  {
    role: 'Sales',
    accCode: '4030',
    entity: 'MJ_BizApps_Orders: Product Categories',
    recordId: categoryMap.get('Certifications & Training'),
    comment: 'LMS course and exam revenue'
  },
  {
    role: 'Sales',
    accCode: '4040',
    entity: 'MJ_BizApps_Orders: Product Categories',
    recordId: categoryMap.get('Publications & Goods'),
    comment: 'Standards guides and merchandise sales'
  },
  {
    role: 'Sales',
    accCode: '4050',
    entity: 'MJ_BizApps_Orders: Product Categories',
    recordId: categoryMap.get('General'),
    comment: 'General and sponsorship revenue'
  }
];

const glAccountLinkRecords = glAccountLinks.map((l, idx) => {
  const id = uuidv5(`GLAccountLink:${idx}:${l.role}:${l.recordId}`);
  const glAccountId = uuidv5(`GLAccount:${l.accCode}`);
  return {
    ID: id,
    fields: {
      GLAccountID: glAccountId,
      GLAccountRoleID: `@lookup:MJ_BizApps_Accounting: GL Account Roles.Name=${l.role}`,
      EntityID: `@lookup:MJ: Entities.Name=${l.entity}`,
      RecordID: l.recordId,
      Status: 'Active',
      StartedAt: '2019-01-01T00:00:00.000Z',
      EndedAt: null,
      Comments: l.comment
    }
  };
});
writeMetadataDir('gl-account-links', 'MJ_BizApps_Accounting: GL Account Links', glAccountLinkRecords);

// -----------------------------------------------------------------------------
// 2. Common Activities & Activity Links
// -----------------------------------------------------------------------------
console.log('\n--- Generating Activities & Links ---');
const people = loadJsonDir('people');
const samplePeople = people.slice(0, 500); // Generate 500 rich member interaction logs

const activityTemplates = [
  { type: 'Call', dir: 'Outbound', title: 'Membership renewal follow-up call', outcome: 'Connected', desc: 'Discussed upcoming anniversary renewal, confirmed monger roster.' },
  { type: 'Call', dir: 'Outbound', title: 'Grace period check-in call', outcome: 'LeftVoicemail', desc: 'Left voicemail regarding unrenewed membership and benefits grace window.' },
  { type: 'Email', dir: 'Outbound', title: 'Annual symposium speaker invitation', outcome: 'Interested', desc: 'Sent speaker invitation for the artisan curd management workshop.' },
  { type: 'Email', dir: 'Inbound', title: 'Raw milk compliance inquiry', outcome: 'Connected', desc: 'Member inquiry on state transport regulations for unpasteurized cheese.' },
  { type: 'Meeting', dir: 'Internal', title: 'Executive member onboarding session', outcome: 'Connected', desc: 'Virtual welcome meeting to review committee appointment and portal access.' },
  { type: 'Note', dir: 'Internal', title: 'Producer creamery site visit notes', outcome: null, desc: 'Met with head affineur during regional tour. Aging caves operating at optimal humidity.' }
];

const activityRecords = [];
const activityLinkRecords = [];

samplePeople.forEach((p, idx) => {
  const personId = p.primaryKey.ID;
  const personName = `${p.fields.FirstName} ${p.fields.LastName}`;
  const tmpl = activityTemplates[idx % activityTemplates.length];
  
  const year = 2020 + (idx % 6);
  const month = String(1 + (idx % 12)).padStart(2, '0');
  const day = String(1 + (idx % 28)).padStart(2, '0');
  const startedAt = `${year}-${month}-${day}T14:30:00.000Z`;
  const endedAt = tmpl.type === 'Meeting' || tmpl.type === 'Call' ? `${year}-${month}-${day}T15:00:00.000Z` : null;
  
  const actId = uuidv5(`Activity:${personId}:${idx}`);
  activityRecords.push({
    ID: actId,
    fields: {
      ActivityTypeID: `@lookup:MJ_BizApps_Common: Activity Types.Name=${tmpl.type}`,
      StartedAt: startedAt,
      EndedAt: endedAt,
      Title: `${tmpl.title} — ${personName}`,
      Description: tmpl.desc,
      Direction: tmpl.dir,
      Status: 'Completed',
      Outcome: tmpl.outcome,
      Visibility: 'Internal',
      Source: 'Manual',
      SourceSystem: null,
      ExternalID: null,
      ExternalThreadID: null,
      ParentActivityID: null,
      LoggedByUserID: '@lookup:MJ: Users.Email=marcus.oduya@morecheesefederation.example',
      Location: tmpl.type === 'Meeting' ? 'Virtual (Teams)' : null,
      AddressID: null,
      ActivitySyncConnectionID: null,
      Details: null
    }
  });

  const linkId = uuidv5(`ActivityLink:${actId}:${personId}`);
  activityLinkRecords.push({
    ID: linkId,
    fields: {
      ActivityID: actId,
      Role: tmpl.dir === 'Inbound' ? 'From' : 'To',
      EntityID: '@lookup:MJ: Entities.Name=MJ_BizApps_Common: People',
      RecordID: personId,
      IdentityKind: null,
      IdentityValue: null,
      Sequence: 1
    }
  });
});

writeMetadataDir('activities', 'MJ_BizApps_Common: Activities', activityRecords);
writeMetadataDir('activity-links', 'MJ_BizApps_Common: Activity Links', activityLinkRecords);

// -----------------------------------------------------------------------------
// 3. Committees: Minutes, Comments, Artifacts
// -----------------------------------------------------------------------------
console.log('\n--- Generating Committee Minutes, Comments & Artifacts ---');
const meetings = loadJsonDir('committee-meetings');
const committees = loadJsonDir('committees');
const agendaItems = loadJsonDir('committee-agenda-items');

// Minutes (1 per meeting)
const minuteRecords = meetings.map((m, idx) => {
  const meetingId = m.primaryKey.ID;
  const meetingName = m.fields.MeetingName || `Committee Meeting #${idx + 1}`;
  const meetingDate = m.fields.MeetingDate ? m.fields.MeetingDate.split('T')[0] : '2023-01-15';
  const id = uuidv5(`CommitteeMinute:${meetingId}`);
  
  return {
    ID: id,
    fields: {
      ArtifactID: null,
      MeetingID: meetingId,
      Content: `## Official Minutes: ${meetingName}\n\n**Date**: ${meetingDate}\n**Call to Order**: The Chair called the meeting to order at 10:00 AM UTC. Quorum was confirmed.\n\n### Business Transacted\n1. Review and approval of previous session minutes.\n2. Discussion of standing agenda items and open motions.\n3. Member open floor and public policy updates.\n\n**Adjournment**: The meeting was adjourned at 11:30 AM UTC.`,
      ApprovalStatus: 'Approved',
      ApprovedAt: `${meetingDate}T12:00:00.000Z`,
      ApprovedByMeetingID: null,
      Notes: 'Signed off by Committee Secretary.'
    }
  };
});
writeMetadataDir('committee-minutes', 'Committees: Minutes', minuteRecords);

// Comments (Discussion comments on agenda items & meetings)
const committeeComments = [
  'Seconding the recommendation to update the microbial criteria in section 4.',
  'The draft standard has been reviewed by our regional creameries and looks solid.',
  'Suggesting we table this motion until the quarterly testing lab report is released.',
  'Agree with the proposed changes. Let us move to a roll-call vote at the next session.',
  'Will circulate the revised guidance notes ahead of the general member symposium.'
];

const committeeCommentRecords = [];
const samplePeoplePool = people.slice(0, 50); // Use 50 committee member persons

agendaItems.forEach((ai, idx) => {
  if (idx % 2 === 0) { // Add comments to every other agenda item
    const id = uuidv5(`CommitteeComment:${ai.primaryKey.ID}:${idx}`);
    const person = samplePeoplePool[idx % samplePeoplePool.length];
    const commentText = committeeComments[idx % committeeComments.length];
    
    committeeCommentRecords.push({
      ID: id,
      fields: {
        CommitteeID: ai.fields.CommitteeID || committees[0].primaryKey.ID,
        MeetingID: ai.fields.MeetingID,
        AgendaItemID: ai.primaryKey.ID,
        TaskID: null,
        ArtifactID: null,
        ParentCommentID: null,
        PersonID: person.primaryKey.ID,
        CommentText: commentText,
        MentionedPersonIDs: null,
        IsResolved: true
      }
    });
  }
});
writeMetadataDir('committee-comments', 'Committees: Comments', committeeCommentRecords);

// Artifacts (Documents & Charters attached to committees and meetings)
const artifactTemplates = [
  { name: 'Committee Charter & Bylaws', type: 'Document', mime: 'application/pdf', desc: 'Governing charter and voting procedure bylaws.' },
  { name: 'Annual Strategy Presentation', type: 'Presentation', mime: 'application/vnd.ms-powerpoint', desc: 'Strategic priorities, budget allocation, and goals deck.' },
  { name: 'Standards Audit Summary Report', type: 'Spreadsheet', mime: 'application/vnd.ms-excel', desc: 'Quantitative audit findings from regional creamery visits.' },
  { name: 'Meeting Agenda Packet', type: 'Agenda', mime: 'application/pdf', desc: 'Compiled agenda items, officer reports, and background memorandums.' }
];

const committeeArtifactRecords = [];
meetings.slice(0, 60).forEach((m, idx) => {
  const id = uuidv5(`CommitteeArtifact:${m.primaryKey.ID}:${idx}`);
  const tmpl = artifactTemplates[idx % artifactTemplates.length];
  const uploader = samplePeoplePool[idx % samplePeoplePool.length];
  
  committeeArtifactRecords.push({
    ID: id,
    fields: {
      CommitteeID: m.fields.CommitteeID || committees[0].primaryKey.ID,
      MeetingID: m.primaryKey.ID,
      AgendaItemID: null,
      TaskID: null,
      ArtifactTypeID: `@lookup:Committees: Artifact Types.Name=${tmpl.type}`,
      Name: `${tmpl.name} — ${m.fields.MeetingName || `Session ${idx + 1}`}`,
      Description: tmpl.desc,
      URL: `https://archive.internationalcheese.org/artifacts/${id.toLowerCase()}.pdf`,
      Provider: 'URL',
      MimeType: tmpl.mime,
      FileSize: 1048576 + (idx * 65536),
      UploadedByPersonID: uploader.primaryKey.ID
    }
  });
});
writeMetadataDir('committee-artifacts', 'Committees: Artifacts', committeeArtifactRecords);

// -----------------------------------------------------------------------------
// 4. Tasks: Tags, TagLinks, Comments, Activities
// -----------------------------------------------------------------------------
console.log('\n--- Generating Tasks Extensions (Tags, Comments, Activities) ---');
const tasks = loadJsonDir('tasks');

const taskTags = [
  { name: 'Governance', color: '#1E3A8A', desc: 'Board and standing committee governance matters' },
  { name: 'Standards Review', color: '#059669', desc: 'Sanitation, sensory, and technical product standards' },
  { name: 'Conference 2024', color: '#D97706', desc: 'Planning and execution for the ICF Annual Conference' },
  { name: 'Finance & Audit', color: '#4F46E5', desc: 'Budgeting, tax filing, and audit controls' },
  { name: 'Curriculum & LMS', color: '#0284C7', desc: 'Certified Cheese Professional course development' },
  { name: 'Member Services', color: '#9333EA', desc: 'Membership renewals and roster maintenance' },
  { name: 'Advocacy', color: '#DC2626', desc: 'Legislative hearings and regulatory comments' },
  { name: 'Urgent', color: '#B91C1C', desc: 'Time-sensitive executive actions' }
];

const taskTagRecords = taskTags.map(t => {
  const id = uuidv5(`TaskTag:${t.name}`);
  return {
    ID: id,
    fields: {
      Name: t.name,
      ColorCode: t.color,
      Description: t.desc
    }
  };
});
writeMetadataDir('task-tags', 'MJ_BizApps_Tasks: Task Tags', taskTagRecords);

// Task Tag Links (1-2 tags per task)
const taskTagLinkRecords = [];
tasks.forEach((t, idx) => {
  const taskId = t.primaryKey.ID;
  const tag1 = taskTagRecords[idx % taskTagRecords.length];
  const linkId1 = uuidv5(`TaskTagLink:${taskId}:${tag1.ID}`);
  taskTagLinkRecords.push({
    ID: linkId1,
    fields: {
      TaskID: taskId,
      TagID: tag1.ID
    }
  });

  if (idx % 3 === 0) {
    const tag2 = taskTagRecords[(idx + 2) % taskTagRecords.length];
    const linkId2 = uuidv5(`TaskTagLink:${taskId}:${tag2.ID}`);
    taskTagLinkRecords.push({
      ID: linkId2,
      fields: {
        TaskID: taskId,
        TagID: tag2.ID
      }
    });
  }
});
writeMetadataDir('task-tag-links', 'MJ_BizApps_Tasks: Task Tag Links', taskTagLinkRecords);

// Task Comments
const taskCommentTemplates = [
  'First draft completed. Attached the working document for committee feedback.',
  'Reviewed with the Standards Committee chair; feedback incorporated.',
  'Awaiting final sign-off before publishing to member portal.',
  'Action item completed ahead of schedule.'
];

const taskCommentRecords = [];
tasks.slice(0, 150).forEach((t, idx) => {
  const taskId = t.primaryKey.ID;
  const person = samplePeoplePool[idx % samplePeoplePool.length];
  const commentText = taskCommentTemplates[idx % taskCommentTemplates.length];
  const id = uuidv5(`TaskComment:${taskId}:${idx}`);
  
  taskCommentRecords.push({
    ID: id,
    fields: {
      TaskID: taskId,
      ParentID: null,
      PersonID: person.primaryKey.ID,
      Content: commentText,
      IsEdited: false
    }
  });
});
writeMetadataDir('task-comments', 'MJ_BizApps_Tasks: Task Comments', taskCommentRecords);

// Task Activities (Audit logs of task transitions)
const taskActivityRecords = [];
tasks.forEach((t, idx) => {
  const taskId = t.primaryKey.ID;
  const person = samplePeoplePool[idx % samplePeoplePool.length];
  
  // Created activity
  const createId = uuidv5(`TaskActivity:Created:${taskId}`);
  taskActivityRecords.push({
    ID: createId,
    fields: {
      TaskID: taskId,
      PersonID: person.primaryKey.ID,
      ActivityType: 'Created',
      PreviousValue: null,
      NewValue: 'Open',
      Description: 'Task was created and placed into the backlog'
    }
  });

  // Assigned / InProgress activity
  if (t.fields.Status === 'InProgress' || t.fields.Status === 'Completed') {
    const progId = uuidv5(`TaskActivity:InProgress:${taskId}`);
    taskActivityRecords.push({
      ID: progId,
      fields: {
        TaskID: taskId,
        PersonID: person.primaryKey.ID,
        ActivityType: 'StatusChange',
        PreviousValue: 'Open',
        NewValue: 'InProgress',
        Description: 'Task status updated to InProgress'
      }
    });
  }

  // Completed activity
  if (t.fields.Status === 'Completed') {
    const compId = uuidv5(`TaskActivity:Completed:${taskId}`);
    taskActivityRecords.push({
      ID: compId,
      fields: {
        TaskID: taskId,
        PersonID: person.primaryKey.ID,
        ActivityType: 'Completed',
        PreviousValue: 'InProgress',
        NewValue: 'Completed',
        Description: 'Task work completed and verified'
      }
    });
  }
});
writeMetadataDir('task-activities', 'MJ_BizApps_Tasks: Task Activities', taskActivityRecords);

// -----------------------------------------------------------------------------
// 5. Secure Messaging: Message Files
// -----------------------------------------------------------------------------
console.log('\n--- Generating Secure Messaging Attachments ---');
const secureMessages = loadJsonDir('secure-messages');

const messageFileTemplates = [
  { name: 'creamery_annual_audit_2024.pdf', type: 'application/pdf', size: 1048576 },
  { name: 'cheesemaker_registration_proof.pdf', type: 'application/pdf', size: 524288 },
  { name: 'payment_receipt_copy.pdf', type: 'application/pdf', size: 262144 },
  { name: 'roster_update_form_signed.pdf', type: 'application/pdf', size: 786432 }
];

const messageFileRecords = [];
secureMessages.slice(0, 100).forEach((m, idx) => {
  const msgId = m.primaryKey.ID;
  const threadId = m.fields.ThreadID;
  const tmpl = messageFileTemplates[idx % messageFileTemplates.length];
  const id = uuidv5(`MessageFile:${msgId}:${idx}`);

  messageFileRecords.push({
    ID: id,
    fields: {
      SecureMessageID: msgId,
      ExternalMessageID: null,
      ThreadID: threadId,
      ArtifactID: null,
      FileID: null,
      Filename: tmpl.name,
      ContentType: tmpl.type,
      Size: tmpl.size
    }
  });
});
writeMetadataDir('message-files', 'MJ_BizApps_SecureMessaging: Message Files', messageFileRecords);

console.log('\n✅ All remaining BizApps metadata generated successfully.');
