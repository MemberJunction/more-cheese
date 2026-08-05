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
import { buildContacts } from './contacts.mjs';
import { buildProspects } from './prospects.mjs';
import { buildFunnel } from './funnel.mjs';
import { buildTasks } from './tasks.mjs';
import { buildIssues } from './issues.mjs';
import { buildPrograms } from './programs.mjs';
import { buildDefects } from './defects.mjs';
import { buildMessaging } from './messaging.mjs';
import { buildPlatform } from './platform.mjs';
import { buildSonar } from './sonar.mjs';
import { identityFor, orgIdentityFor } from './identity.mjs';
import { applyMotifs } from './motifs.mjs';

export { morecheeseHooks as hooks } from './hooks.mjs';

const R_APP_REFERRERS = (cfg) => cfg.R.forms.application.referrers;

export function buildWorld(cfg) {
  // §5.1–2: the world and its drivers
  const orgs = buildOrgs(cfg);
  let people = buildPeople(cfg, { orgs }); // note: appends hero employers to orgs

  // motifs BEFORE the unroll: stamped archetypes pin renewal outcomes (_lapseYear) and
  // author engagement arcs (_thetaPath) that every downstream domain reads
  const motifs = applyMotifs(cfg, { people, orgs });

  // §5.3: membership — the renewal unroll, then archive old lapsed records
  const { periods: allPeriods, renewalEvents } = runRenewalUnroll(cfg, { people, orgs });
  const archived = applyArchiveRule(cfg, { people, periods: allPeriods });
  people = archived.people;
  const periods = archived.periods;

  // §5.4: events + registrations (only ever inside valid membership windows)
  const events = buildEvents(cfg);
  const registrations = buildRegistrations(cfg, { people, periods, events });

  // §5.4b: learning — same pattern, third domain
  const learning = buildLearning(cfg, { people, periods });

  // programs (certifications, competition entries, advocacy) BEFORE money: credentials
  // and competition entries are billable facts, so the money chain has to see them
  const programs = buildPrograms(cfg, { people, periods, learning });

  // §5.5: the money chain — one order per billable fact, timing per declared paymentProfiles
  const money = buildMoney(cfg, { people, periods, events, registrations, programs });

  // composed bizapps slices: committees (governance), forms (D10 survey), relationships
  // (identity graph), tasks (action items + outreach), issues (support tickets)
  const committees = buildCommittees(cfg, { people, periods });
  const forms = buildForms(cfg, { people, events, registrations });
  const relationships = buildRelationships(cfg, { people, orgs });
  const tasks = buildTasks(cfg, { people, periods, committees });
  const issues = buildIssues(cfg, { people, orgs, events, registrations, money, committees });
  // secure messaging: support threads derive from issues (hero issues always get one)
  const messaging = buildMessaging(cfg, { people, issues });

  // defects LAST: labeled record corruption over the finished world (mutates emails,
  // appends duplicate contact records and true-employer relationship edges)
  const defects = buildDefects(cfg, { people, orgs, relationships });

  // platform residue AFTER defects: its RecordChange rows mirror timelines everywhere
  // above, including the employment edges the defects module just rewrote.
  // It must see the SAME roster the common pack ships (people + the duplicate-record
  // shells defects injected) — the seeded Skip transcripts quote counts computed from
  // this list, and quoting a pre-defects count made the transcript false against the
  // very query it points the user at.
  // non-members: Person rows with no MemberProfile (see prospects.mjs). They join the
  // shipped roster so identity, contact methods and addresses treat them like anyone else.
  const prospects = buildProspects(cfg, { orgs, events, memberCount: people.length + defects.extraPeople.length });
  // the funnel: recent joiners get the pre-membership history they would have had, and the
  // non-members get an employer edge. Adds no members — only the prologue to existing ones.
  const funnel = buildFunnel(cfg, {
    people, prospects: prospects.prospects, orgs, events, periods,
    application: { formKey: 'membership-application', distributionKey: 'membership-application:public', referrers: R_APP_REFERRERS(cfg) },
  });
  relationships.relationships.push(...funnel.employmentEdges);
  forms.formResponses.push(...funnel.responses);
  forms.formAnswers.push(...funnel.answers);
  // the named applications land on the SAME public distribution, so its counter has to move
  // with them — a distribution whose ResponseCount disagrees with its rows is a live bug in
  // any UI that renders the number instead of counting
  const appDist = forms.formDistributions.find((d) => d.DistributionKey === 'membership-application:public');
  if (appDist) appDist.ResponseCount += funnel.responses.length;

  const shippedPeople = [...people, ...defects.extraPeople, ...prospects.prospects];

  // contact details + voluntary self-ID demographics, applied as ONE post-pass over the
  // finished roster. Person/organization rows are hand-constructed in five places (crowd,
  // hero, duplicate shell, crowd org, hero org, defect true-employer) and a field added to
  // only some of them ships `undefined`; doing it here makes that impossible. Every value
  // rides its own stream key, so nothing above this line moves.
  const orgNameByKey = new Map(orgs.map((o) => [o.OrgKey, o.Name]));
  for (const p of shippedPeople) {
    p._orgName = p.OrgKey ? (orgNameByKey.get(p.OrgKey) ?? null) : null; // generator-internal, stripped before emit
    Object.assign(p, identityFor(cfg.seed, p, cfg.release));
  }
  for (const o of orgs) Object.assign(o, orgIdentityFor(cfg.seed, o, cfg.releaseYear, cfg.R));
  // …and then the same facts as FIRST-CLASS bizapps-common rows (that app owns the domain
  // and its UI reads these tables, not our MemberProfile columns). Must run after the
  // identity pass — it projects the addresses that pass just wrote.
  const contacts = buildContacts(cfg, { people: shippedPeople, orgs });
  // platform residue is MEMBER-facing: its lists, favourites and the seeded Skip transcript
  // all quote membership counts, so prospects must not be in the roster it sees
  const platform = buildPlatform(cfg, { people: shippedPeople.filter((p) => !p.IsProspect), periods, events, registrations, tasks, issues, relationships, competitionEntries: programs.competitionEntries });

  // sonar = engagement model DEFINITION only; Sonar's engine computes the scores live
  const sonar = buildSonar(cfg);

  return { people, orgs, periods, events, registrations, renewalEvents, money, learning, committees, forms, relationships, contacts, prospects, funnel, tasks, issues, programs, messaging, defects, motifs, platform, sonar };
}

/**
 * THIS PROJECT'S UUID NAMESPACE — generated once with `uuidgen`, frozen forever.
 *
 * Deterministic IDs mean the same business key always mints the same UUID, which is what lets
 * parent and child rows derive foreign keys independently with no lookups. The flip side is that
 * two projects sharing a namespace would mint IDENTICAL UUIDs for overlapping keys, so each owns
 * its own and never changes it: changing it changes every ID this project has ever shipped.
 *
 * It lives HERE, not in the engine. It used to be an entry in a NAMESPACES table inside
 * engine/ids.mjs, which meant adding a project required editing the engine — and the engine's own
 * error message said exactly that. A framework whose engine carries a list of its consumers is
 * not a framework.
 */
export const UUID_NAMESPACE = '9b1dcbf2c05341e8a2f4d40e11ce66a1';

// ─── THE PACK MAP (D9: cook once, portion last) ───────────────────────────────────────────────
//
// The world is cooked as one batch; this deals the finished rows into one folder per installable
// app. Per the pack contract in engine/packs.mjs, each entry declares `dependsOn` (install order,
// checked against refs.mjs) and `tables` (what ships). One table per line — these were single
// lines of up to 494 characters, which is not a map anybody can read.

/** Generator-internal fields, and the three membership columns the bizapps-common People table
 * does not own (they live on membership_periods). Present on rows, must not ship. */
const PEOPLE_NOT_SHIPPED = ['_theta', '_thetaPath', '_phi', '_hero', '_lapseYear', '_dup', '_motif',
  '_renewAlways', '_orgName', 'CycleType', 'AutoRenew', 'MembershipTier'];
const REGISTRATION_INTERNALS = ['_class', '_theta', '_future'];
const ENROLLMENT_INTERNALS = ['_theta', '_endBase', '_weeks'];

/** Arrays that are generated and deliberately ship in no pack. Each needs a reason: without this
 * list, "decided not to ship it" and "forgot the pack entry" look identical, and forgetting is
 * silent — it costs zero rows and a green build. engine/packs.mjs enforces the difference. */
export const NOT_SHIPPED = {
  renewalEvents: 'validator-private ground truth — written as validation-events.json, never installed',
  'motifs.registry': 'harness-private registry: what was planted, for the checks to find. Not data.',
  'funnel.responses': 'merged into forms.formResponses in buildWorld — ships inside the forms pack',
  'funnel.answers': 'merged into forms.formAnswers in buildWorld — ships inside the forms pack',
  'funnel.employmentEdges': 'merged into relationships.relationships — ships inside the common pack',
};

/** This project's validator. cli/validate.mjs holds ~175 bespoke MoreCheese gates and imports this
 *  project's seed-mapping — it is OURS, not the engine's, and declaring it here is what lets
 *  cli/build.mjs stay project-blind. A project that declares nothing gets check-declared.mjs, which
 *  runs every gate derived from declarations and knows no domain. */
export const VALIDATOR = 'validate.mjs';

/** The per-member latents the validator and inspector read (never installed). WHICH dials exist
 *  is this project's model, so the projection lives here — the engine used to hardcode it. */
export const LATENTS_OF = (world) => world.people.map((p) => ({
  m: p.MemberNumber, theta: +p._theta.toFixed(4), phi: +p._phi.toFixed(4),
  tier: p.MembershipTier, hero: !!p._hero,
}));

/** Extra facts this project wants recorded in run.json. The covid years are a MoreCheese regime;
 *  the engine has no business knowing they exist. */
export const RUN_EXTRAS = (cfg) => ({ covidYears: cfg.R.regimes.covid.years });

/** The run summary this project wants printed. Domain reporting: a status mix and a renewal curve
 *  mean nothing to the engine, which can only count rows. Returns lines, printed in order. */
export const SUMMARY_OF = (world) => {
  const { people, orgs, periods, events, registrations, renewalEvents } = world;
  const lastStatus = new Map();
  for (const per of periods) lastStatus.set(per.MemberNumber, per.Status);
  const mix = { Active: 0, Lapsed: 0, Cancelled: 0, PendingRenewal: 0, Renewed: 0 };
  for (const s of lastStatus.values()) mix[s] = (mix[s] ?? 0) + 1;
  const byYear = {};
  for (const e of renewalEvents) { (byYear[e.year] ??= { n: 0, r: 0 }); byYear[e.year].n++; byYear[e.year].r += e.renewed; }
  return [
    `generated: ${people.length} people, ${orgs.length} orgs, ${periods.length} periods, ${events.length} events, ${registrations.length} registrations`,
    `status mix @release: ${JSON.stringify(mix)}`,
    `renewal by year: ${JSON.stringify(Object.fromEntries(Object.entries(byYear).map(([y, v]) => [y, (v.r / v.n).toFixed(3)])))}`,
  ];
};

export function buildPacks(world) {
  const { people, orgs, periods, events, registrations, money, learning, committees, forms, relationships, contacts, prospects, funnel, tasks, issues, programs, messaging, defects, platform, sonar } = world;
  const strip = (rows, keys) => rows.map((r) => { const c = { ...r }; for (const k of keys) delete c[k]; return c; });
  return {
    common: {
      dependsOn: [],
      tables: {
        people: strip([...people, ...defects.extraPeople, ...prospects.prospects], PEOPLE_NOT_SHIPPED),
        organizations: orgs,
        relationship_types: relationships.relationshipTypes,
        relationships: relationships.relationships,
        addresses: contacts.addresses,
        address_links: contacts.addressLinks,
        contact_methods: contacts.contactMethods,
      },
    },
    membership: {
      dependsOn: ['common'],
      tables: {
        membership_periods: periods,
        advocacy_actions: programs.advocacyActions,
        data_quality_labels: defects.labels,
      },
    },
    events: {
      dependsOn: ['common', 'membership'],
      tables: {
        events,
        // three sources, one table: members, prospects, and the pre-join application funnel
        event_registrations: [...strip(registrations, REGISTRATION_INTERNALS), ...prospects.registrations, ...funnel.preRegistrations],
        competition_entries: programs.competitionEntries,
      },
    },
    learning: {
      dependsOn: ['common', 'membership'],
      tables: {
        courses: learning.courses,
        enrollments: strip(learning.enrollments, ENROLLMENT_INTERNALS),
        certifications: programs.certifications,
        member_certifications: programs.memberCertifications,
      },
    },
    orders: {
      dependsOn: ['common', 'membership', 'events'],
      tables: {
        products: money.products,
        orders: money.orders,
        order_lines: money.orderLines,
        payments: money.payments,
      },
    },
    committees: {
      dependsOn: ['common', 'membership'],
      tables: {
        committee_types: committees.types,
        committee_roles: committees.roles,
        committees: committees.committees,
        committee_terms: committees.terms,
        committee_memberships: committees.memberships,
        committee_meetings: committees.meetings,
        committee_attendance: committees.attendance,
        committee_agenda_items: committees.agendaItems,
        committee_motions: committees.motions,
        committee_votes: committees.votes,
      },
    },
    forms: {
      dependsOn: ['common', 'events'],
      tables: {
        forms: forms.forms,
        form_versions: forms.formVersions,
        form_pages: forms.formPages,
        form_questions: forms.formQuestions,
        form_question_options: forms.formQuestionOptions,
        form_distributions: forms.formDistributions,
        form_responses: forms.formResponses,
        form_answers: forms.formAnswers,
      },
    },
    tasks: {
      dependsOn: ['common', 'membership', 'committees'],
      tables: {
        task_types: tasks.taskTypes,
        tasks: tasks.tasks,
        task_assignments: tasks.taskAssignments,
        task_links: tasks.taskLinks,
      },
    },
    issues: {
      dependsOn: ['common', 'events', 'orders'],
      tables: {
        issue_types: issues.issueTypes,
        issue_statuses: issues.issueStatuses,
        issues: issues.issues,
        issue_comments: issues.issueComments,
        issue_sequences: issues.issueSequences,
      },
    },
    messaging: {
      dependsOn: ['common', 'issues'],
      tables: {
        portal_sessions: messaging.sessions,
        secure_threads: messaging.threads,
        secure_messages: messaging.messages,
      },
    },
    platform: {
      dependsOn: ['common', 'membership', 'events', 'tasks', 'issues'],
      tables: {
        mj_users: platform.users,
        mj_user_roles: platform.userRoles,
        user_views: platform.views,
        queries: platform.queries,
        conversations: platform.conversations,
        conversation_details: platform.conversationDetails,
        user_favorites: platform.favorites,
        lists: platform.lists,
        list_details: platform.listDetails,
        user_notifications: platform.notifications,
        record_changes: platform.recordChanges,
      },
    },
    // DEFINITIONS ONLY — Sonar's engine computes scores/contributions/history/transitions live
    sonar: {
      dependsOn: ['common', 'events', 'learning', 'committees', 'forms', 'platform'],
      tables: {
        score_band_sets: [sonar.bandSet],
        score_bands: sonar.bands,
        time_windows: sonar.timeWindows,
        score_models: [sonar.model],
        score_model_versions: [sonar.version],
        model_related_entities: sonar.relatedEntities,
        factors: sonar.factors,
        model_factors: sonar.modelFactors,
      },
    },
  };
}
