// The MoreCheese PROJECT — one generated universe (fake International Cheese Federation).
//
// A project is everything the engine must NOT know: the domain modules, the compile/lint
// hooks, the name banks, and the ruleset (projects/morecheese/ruleset/). The engine calls
// exactly two exports: `hooks` (compile feature map, refinement measure, lint, pack map)
// and `buildWorld(cfg)` (the pipeline, in ruleset-spec §5 order). A second project = a
// second directory shaped like this one — zero engine changes (FRAMEWORK.md's test).

import { buildOrgs, buildPeople } from './world.mjs';
import { runRenewalUnroll, applyArchiveRule } from './membership.mjs';
import { buildEvents, buildRegistrations } from './events.mjs';
import { buildMoney } from './money.mjs';
import { buildLearning } from './learning.mjs';
import { buildCommittees } from './committees.mjs';
import { buildForms } from './forms.mjs';
import { buildRelationships } from './relationships.mjs';
import { buildTasks } from './tasks.mjs';
import { buildIssues } from './issues.mjs';
import { buildPrograms } from './programs.mjs';
import { buildDefects } from './defects.mjs';
import { buildMessaging } from './messaging.mjs';
import { buildPlatform } from './platform.mjs';
import { buildSonar } from './sonar.mjs';
import { applyMotifs } from './motifs.mjs';

export { morecheeseHooks as hooks } from './hooks.mjs';

export function buildWorld(cfg) {
  // §5.1–2: the world and its drivers
  const orgs = buildOrgs(cfg);
  let people = buildPeople(cfg, orgs); // note: appends hero employers to orgs

  // motifs BEFORE the unroll: stamped archetypes pin renewal outcomes (_lapseYear) and
  // author engagement arcs (_thetaPath) that every downstream domain reads
  const motifs = applyMotifs(cfg, people, orgs);

  // §5.3: membership — the renewal unroll, then archive old lapsed records
  const { periods: allPeriods, renewalEvents } = runRenewalUnroll(cfg, people, orgs);
  const archived = applyArchiveRule(cfg, people, allPeriods);
  people = archived.people;
  const periods = archived.periods;

  // §5.4: events + registrations (only ever inside valid membership windows)
  const events = buildEvents(cfg);
  const registrations = buildRegistrations(cfg, people, periods, events);

  // §5.4b: learning — same pattern, third domain
  const learning = buildLearning(cfg, people, periods);

  // §5.5: the money chain — one order per billable fact, timing per declared paymentProfiles
  const money = buildMoney(cfg, people, periods, events, registrations);

  // composed bizapps slices: committees (governance), forms (D10 survey), relationships
  // (identity graph), tasks (action items + outreach), issues (support tickets)
  const committees = buildCommittees(cfg, people, periods);
  const forms = buildForms(cfg, people, events, registrations);
  const relationships = buildRelationships(cfg, people, orgs);
  const tasks = buildTasks(cfg, people, periods, committees);
  const issues = buildIssues(cfg, people, orgs, events, registrations, money, committees);
  const programs = buildPrograms(cfg, people, periods, learning);
  // secure messaging: support threads derive from issues (hero issues always get one)
  const messaging = buildMessaging(cfg, people, issues);

  // defects LAST: labeled record corruption over the finished world (mutates emails,
  // appends duplicate contact records and true-employer relationship edges)
  const defects = buildDefects(cfg, people, orgs, relationships);

  // platform residue AFTER defects: its RecordChange rows mirror timelines everywhere
  // above, including the employment edges the defects module just rewrote
  const platform = buildPlatform(cfg, { people, periods, events, registrations, tasks, issues, relationships });

  // sonar rides the same facts: engagement scores recomputed from the packs above at
  // quarterly snapshots — the scoring product's residue, honest by construction
  const sonar = buildSonar(cfg, { people, events, registrations, learning, programs, money, committees, forms });

  return { people, orgs, periods, events, registrations, renewalEvents, money, learning, committees, forms, relationships, tasks, issues, programs, messaging, defects, motifs, platform, sonar };
}

/** The pack map (D9: cook once, portion last) — the project owns what ships where. */
export function buildPacks(world) {
  const { people, orgs, periods, events, registrations, money, learning, committees, forms, relationships, tasks, issues, programs, messaging, defects, platform, sonar } = world;
  const strip = (rows, keys) => rows.map((r) => { const c = { ...r }; for (const k of keys) delete c[k]; return c; });
  return {
    common: { dependsOn: [], tables: { people: strip([...people, ...defects.extraPeople], ['_theta', '_thetaPath', '_phi', '_hero', '_lapseYear', '_dup', '_motif', '_renewAlways', 'CycleType', 'AutoRenew', 'MembershipTier']), organizations: orgs, relationship_types: relationships.relationshipTypes, relationships: relationships.relationships } },
    membership: { dependsOn: ['common'], tables: { membership_periods: periods, advocacy_actions: programs.advocacyActions, data_quality_labels: defects.labels } },
    events: { dependsOn: ['common', 'membership'], tables: { events, event_registrations: strip(registrations, ['_class', '_theta']), competition_entries: programs.competitionEntries } },
    learning: { dependsOn: ['common', 'membership'], tables: { courses: learning.courses, enrollments: strip(learning.enrollments, ['_theta', '_endBase', '_weeks']), certifications: programs.certifications, member_certifications: programs.memberCertifications } },
    orders: { dependsOn: ['common', 'membership', 'events'], tables: { products: money.products, orders: money.orders, order_lines: money.orderLines, payments: money.payments } },
    committees: { dependsOn: ['common', 'membership'], tables: { committee_types: committees.types, committee_roles: committees.roles, committees: committees.committees, committee_terms: committees.terms, committee_memberships: committees.memberships, committee_meetings: committees.meetings, committee_attendance: committees.attendance, committee_agenda_items: committees.agendaItems, committee_motions: committees.motions, committee_votes: committees.votes } },
    forms: { dependsOn: ['common', 'events'], tables: { forms: forms.forms, form_versions: forms.formVersions, form_pages: forms.formPages, form_questions: forms.formQuestions, form_question_options: forms.formQuestionOptions, form_distributions: forms.formDistributions, form_responses: forms.formResponses, form_answers: forms.formAnswers } },
    tasks: { dependsOn: ['common', 'membership', 'committees'], tables: { task_types: tasks.taskTypes, tasks: tasks.tasks, task_assignments: tasks.taskAssignments, task_links: tasks.taskLinks } },
    issues: { dependsOn: ['common', 'events', 'orders'], tables: { issue_types: issues.issueTypes, issue_statuses: issues.issueStatuses, issues: issues.issues, issue_sequences: issues.issueSequences } },
    messaging: { dependsOn: ['common', 'issues'], tables: { portal_sessions: messaging.sessions, secure_threads: messaging.threads, secure_messages: messaging.messages } },
    platform: { dependsOn: ['common', 'membership', 'events', 'tasks', 'issues'], tables: { mj_users: platform.users, mj_user_roles: platform.userRoles, user_views: platform.views, queries: platform.queries, conversations: platform.conversations, conversation_details: platform.conversationDetails, user_favorites: platform.favorites, lists: platform.lists, list_details: platform.listDetails, user_notifications: platform.notifications, record_changes: platform.recordChanges } },
    sonar: { dependsOn: ['common', 'events', 'learning', 'orders', 'committees', 'forms', 'platform'], tables: { score_band_sets: [sonar.bandSet], score_bands: sonar.bands, time_windows: sonar.timeWindows, score_models: [sonar.model], score_model_versions: [sonar.version], model_related_entities: sonar.relatedEntities, factors: sonar.factors, model_factors: sonar.modelFactors, recompute_runs: sonar.runs, scores: sonar.scores, score_contributions: sonar.contributions, score_history: sonar.history, band_transitions: sonar.transitions, audit_events: sonar.auditEvents } },
  };
}
