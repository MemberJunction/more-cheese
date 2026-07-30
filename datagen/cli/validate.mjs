// MoreCheese datagen — validation harness (ruleset-spec §7).
//
// Usage: node validate.mjs [--out out]   (run generate.mjs first)
// Exit code 0 = all gates pass; 1 = any failure (build-breaking by design).
//
// The gates, in plain words (one function per group below):
//   packs        — every reference resolves against the pack's declared dependencies
//   temporal     — dates obey the team's rules (grace, back-dating, windows)
//   benchmarks   — the headline numbers land in tolerance AND are rough enough (variance floors)
//   arrows       — every causal rule is re-detectable in the output, right sign and size
//   trainability — a churn model trained on observables actually rank-orders risk
//   heroes       — the pinned people load with their stories intact
//   statusMix    — the member-status split looks like the documented world

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { logisticFit } from '../engine/stats.mjs';
import { iso as iso2, addDays as addDays2, parseDate as parseDate2 } from '../engine/dates.mjs';
import { loadRuleset } from '../engine/config.mjs';
import { MJ_ENTITY_VAR, RECORD_PREFIX } from '../engine/seed-mapping.mjs';
import { CITIES } from '../projects/morecheese/banks.mjs';
import { CONTACT_TYPES, ADDRESS_TYPES } from '../projects/morecheese/contacts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));
const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
const R = await loadRuleset(run.scenario, run.project); // the validator judges against the SAME world (project + scenario) the run was built for

// NON-MEMBERS: the common pack's people table carries both members and prospects (a prospect
// is a Person with no MemberProfile). Every gate below was written about MEMBERS, so `people`
// and `regs` keep meaning exactly that and the non-member rows get their own names — adding
// contacts to the roster must not silently move a single membership benchmark.
const allPeople = load('common', 'people');
const people = allPeople.filter((p) => !p.IsProspect);
const prospects = allPeople.filter((p) => p.IsProspect);
const prospectKeys = new Set(prospects.map((p) => p.MemberNumber));
// A membership can end two ways: LAPSED (silence — the renewal never arrived) or CANCELLED (the
// member told us mid-term). Both are terminal, so every gate that means "left" must count both;
// gates that specifically mean "lapsed" still say Lapsed.
const ENDED = new Set(['Lapsed', 'Cancelled']);
const hasEnded = (status) => ENDED.has(status);
const orgs = load('common', 'organizations');
const periods = load('membership', 'membership_periods');
const events = load('events', 'events');
const allRegs = load('events', 'event_registrations');
const regs = allRegs.filter((r) => !prospectKeys.has(r.MemberNumber));
const prospectRegs = allRegs.filter((r) => prospectKeys.has(r.MemberNumber));
const addresses = load('common', 'addresses');
const addressLinks = load('common', 'address_links');
const contactMethods = load('common', 'contact_methods');
const cMemberships = load('committees', 'committee_memberships');
const cTerms = load('committees', 'committee_terms');
const cCommittees = load('committees', 'committees');
const cMeetings = load('committees', 'committee_meetings');
const cAttendance = load('committees', 'committee_attendance');
const fResponses = load('forms', 'form_responses');
const fAnswers = load('forms', 'form_answers');
const relationships = load('common', 'relationships');
const cMotions = load('committees', 'committee_motions');
const cVotes = load('committees', 'committee_votes');
const tTasks = load('tasks', 'tasks');
const tAssignments = load('tasks', 'task_assignments');
const issues = load('issues', 'issues');
const memberCerts = load('learning', 'member_certifications');
const compEntries = load('events', 'competition_entries');
const advocacy = load('membership', 'advocacy_actions');
const dqLabels = load('membership', 'data_quality_labels');
const smThreads = load('messaging', 'secure_threads');
const smMessages = load('messaging', 'secure_messages');
const smSessions = load('messaging', 'portal_sessions');
const pUsers = load('platform', 'mj_users');
const pViews = load('platform', 'user_views');
const pQueries = load('platform', 'queries');
const pConvs = load('platform', 'conversations');
const pConvDetails = load('platform', 'conversation_details');
const pFavs = load('platform', 'user_favorites');
const pListDetails = load('platform', 'list_details');
const pListsP = load('platform', 'lists');
const pNotifs = load('platform', 'user_notifications');
const pRecordChanges = load('platform', 'record_changes');
const snModelFactors = load('sonar', 'model_factors');
const snBands = load('sonar', 'score_bands');
const snFactors = load('sonar', 'factors');
const snModels = load('sonar', 'score_models');
const snVersions = load('sonar', 'score_model_versions');
const snRelated = load('sonar', 'model_related_entities');
const products = load('orders', 'products');
const orders = load('orders', 'orders');
const orderLines = load('orders', 'order_lines');
const payments = load('orders', 'payments');
const courses = load('learning', 'courses');
const enrollments = load('learning', 'enrollments');
// validator-private: renewal decisions WITH the latents (never installed) — needed so arrow
// recovery isn't attenuated by omitting a strong hidden driver (spec §7 lesson #2)
const renewalEvents = JSON.parse(readFileSync(join(OUT, 'validation-events.json'), 'utf8'));

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });

// shared lookups
const joinOf = new Map(people.map((p) => [p.MemberNumber, p.JoinDate]));
const periodsByMember = new Map();
for (const x of periods) { (periodsByMember.get(x.MemberNumber) ?? periodsByMember.set(x.MemberNumber, []).get(x.MemberNumber)).push(x); }
const lastStatus = new Map();
const lastPeriod = new Map();
for (const per of periods) { lastStatus.set(per.MemberNumber, per.Status); lastPeriod.set(per.MemberNumber, per); }

// ---------- packs (§7.8) ----------
function checkPacks() {
  const peopleKeys = new Set(people.map((p) => p.MemberNumber));
  const orgKeys = new Set(orgs.map((o) => o.OrgKey));
  const eventKeys = new Set(events.map((e) => e.EventKey));
  const badEmployer = people.filter((p) => p.OrgKey && !orgKeys.has(p.OrgKey)).length;
  const badPeriod = periods.filter((x) => !peopleKeys.has(x.MemberNumber)).length;
  const badRegP = regs.filter((x) => !peopleKeys.has(x.MemberNumber)).length;
  const badRegE = regs.filter((x) => !eventKeys.has(x.EventKey)).length;
  check('pack refs: people→orgs (within common)', badEmployer === 0, `${badEmployer} dangling`);
  check('pack refs: membership→common', badPeriod === 0, `${badPeriod} dangling`);
  check('pack refs: events→common+events', badRegP + badRegE === 0, `${badRegP}+${badRegE} dangling`);
  const productKeys = new Set(products.map((x) => x.ProductKey));
  const orderKeys = new Set(orders.map((x) => x.OrderKey));
  const badOrderM = orders.filter((x) => !peopleKeys.has(x.MemberNumber)).length;
  const badLine = orderLines.filter((x) => !orderKeys.has(x.OrderKey) || !productKeys.has(x.ProductKey)).length;
  const badPay = payments.filter((x) => !orderKeys.has(x.OrderKey)).length;
  check('pack refs: orders→common + lines→products + payments→orders', badOrderM + badLine + badPay === 0, `${badOrderM}+${badLine}+${badPay} dangling`);
  const meetingKeys = new Set(cMeetings.map((x) => x.MeetingKey));
  const badCm = cMemberships.filter((x) => !peopleKeys.has(x.MemberNumber)).length;
  const badAtt = cAttendance.filter((x) => !peopleKeys.has(x.MemberNumber) || !meetingKeys.has(x.MeetingKey)).length;
  check('pack refs: committees→common + attendance→meetings', badCm + badAtt === 0, `${badCm}+${badAtt} dangling`);
  // memberships → the term and committee they claim. A membership on a term that was never
  // emitted is invisible in the packs (the seat still looks fine) and only fails at install,
  // where the real FK rejects it — exactly how the 2015 Membership & Outreach seat surfaced.
  const termKeys = new Set(cTerms.map((x) => x.TermKey));
  const committeeKeys = new Set(cCommittees.map((x) => x.CommitteeKey));
  const badMemTerm = cMemberships.filter((x) => !termKeys.has(x.TermKey) || !committeeKeys.has(x.CommitteeKey)).length;
  const badTermC = cTerms.filter((x) => !committeeKeys.has(x.CommitteeKey)).length;
  const badMeetC = cMeetings.filter((x) => !committeeKeys.has(x.CommitteeKey)).length;
  check('pack refs: memberships→terms + terms/meetings→committees', badMemTerm + badTermC + badMeetC === 0, `${badMemTerm}+${badTermC}+${badMeetC} dangling`);
  // blank columns are how generated data gives itself away: the legal-structure FK sat NULL on
  // every organization, and Person.Bio on every person. Both are app-owned fields their UIs show.
  {
    const structures = new Set(Object.values(R.orgs.legalStructure.byType).flat().map(([n]) => n));
    const withType = orgs.filter((o) => o.OrganizationTypeName);
    const badName = withType.filter((o) => !structures.has(o.OrganizationTypeName)).length;
    check(`orgs: all ${orgs.length} carry a legal structure from the app's seeded list`,
      withType.length === orgs.length && badName === 0, `${withType.length}/${orgs.length} set, ${badName} off-list`);
    // and it must not simply mirror our business Type — they are orthogonal dimensions
    const perType = new Map();
    for (const o of withType) {
      if (!perType.has(o.Type)) perType.set(o.Type, new Set());
      perType.get(o.Type).add(o.OrganizationTypeName);
    }
    const collapsed = [...perType].filter(([, set]) => set.size < 2).map(([t]) => t);
    check('orgs: legal structure varies within each business type (not a relabelled Type)',
      collapsed.length === 0, collapsed.length ? `single structure for: ${collapsed.join(', ')}` : `${perType.size} business types`);
    const bios = allPeople.filter((x) => x.Bio);
    const share = bios.length / Math.max(1, allPeople.length);
    check(`people: ${bios.length} bios written (${(share * 100).toFixed(0)}% of profiles)`,
      bios.length > 0 && share < 0.75, 'a minority write one; nobody having one is the tell');
    check('people: bios are distinct prose, not one template', new Set(bios.map((x) => x.Bio)).size > Math.min(20, bios.length * 0.5),
      `${new Set(bios.map((x) => x.Bio)).size} distinct of ${bios.length}`);
  }
  // contact/address rows are bizapps-common's OWN tables — every owner must resolve, and the
  // TYPE names must be ones that app seeds (we reference them by name and never emit them: F6)
  {
    const orgKeys = new Set(orgs.map((o) => o.OrgKey));
    const addrKeys = new Set(addresses.map((a) => a.AddressKey));
    // contact details belong to every PERSON we know, member or not
    const anyPersonKeys = new Set(allPeople.map((p) => p.MemberNumber));
    const badCm = contactMethods.filter((c) => c.OwnerKind === 'person' ? !anyPersonKeys.has(c.OwnerKey) : !orgKeys.has(c.OwnerKey)).length;
    const badLink = addressLinks.filter((l) => !addrKeys.has(l.AddressKey)
      || (l.RecordKind === 'person' ? !anyPersonKeys.has(l.RecordKey) : !orgKeys.has(l.RecordKey))).length;
    check('pack refs: contact methods + address links → people/orgs/addresses', badCm + badLink === 0, `${badCm}+${badLink} dangling`);
    const badType = contactMethods.filter((c) => !CONTACT_TYPES.includes(c.ContactTypeName)).length;
    const badAType = addressLinks.filter((l) => !ADDRESS_TYPES.includes(l.AddressTypeName)).length;
    check('contacts: every type name is one the app seeds (F6)', badType + badAType === 0, `${badType}+${badAType} unseeded`);
  }
  // the whole point of the module: the app's tables carry what MemberProfile carries. A member
  // with a street address on their profile and no Address row is the empty-UI bug returning.
  {
    const linkedPeople = new Set(addressLinks.filter((l) => l.RecordKind === 'person').map((l) => l.RecordKey));
    const missing = allPeople.filter((p) => p.AddressLine1 && !linkedPeople.has(p.MemberNumber)).length;
    check('contacts: every profile address is also a bizapps-common Address', missing === 0, `${addresses.length} addresses, ${missing} missing`);
    const emailed = new Set(contactMethods.filter((c) => c.ContactTypeName === 'Email' && c.OwnerKind === 'person').map((c) => c.OwnerKey));
    const noEmail = allPeople.filter((p) => p.Email && !emailed.has(p.MemberNumber)).length;
    check('contacts: every member email is a ContactMethod row', noEmail === 0, `${emailed.size} people with an email method`);
    // one primary per channel — a UI that renders "the" phone picks the primary and must find one
    const dupPrimary = [...contactMethods.filter((c) => c.IsPrimary).reduce((m, c) => {
      const k = `${c.OwnerKind}:${c.OwnerKey}:${c.ContactTypeName === 'Email' ? 'email' : c.ContactTypeName === 'Website' ? 'web' : 'phone'}`;
      return m.set(k, (m.get(k) ?? 0) + 1);
    }, new Map()).values()].filter((n) => n > 1).length;
    check('contacts: at most one primary per owner and channel', dupPrimary === 0, `${dupPrimary} owners with two primaries`);
  }
  // NON-MEMBERS: a prospect is a Person with NO MemberProfile. The whole design rests on
  // that, so assert it from both directions — no membership artefact may reference one, and
  // they must still be real contacts (identity, email, a place in the world).
  {
    const periodKeys = new Set(periods.map((x) => x.MemberNumber));
    const leaked = prospects.filter((p) => periodKeys.has(p.MemberNumber)).length;
    check('prospects: no non-member has a membership period', leaked === 0, `${prospects.length} prospects, ${leaked} with membership`);
    const share = allPeople.length ? prospects.length / allPeople.length : 0;
    const want = R.prospects.ratioToMembers / (1 + R.prospects.ratioToMembers);
    check(`prospects: ${(share * 100).toFixed(1)}% of known people are non-members vs ${(want * 100).toFixed(1)}% ±4`,
      Math.abs(share - want) <= 0.04, 'an association knows more people than it has members');
    const nameless = prospects.filter((p) => !p.FirstName || !p.LastName || !p.Email).length;
    check('prospects: every non-member is a real contact (name + email)', nameless === 0, `${nameless} incomplete`);
    // free webinars only — a paid seat needs an order, and non-member pricing is not modelled yet
    const paidKeys = new Set(events.filter((e) => e.IsPaid).map((e) => e.EventKey));
    const paidReg = prospectRegs.filter((r) => paidKeys.has(r.EventKey)).length;
    check('prospects: non-member registrations are free events only', paidReg === 0, `${prospectRegs.length} registrations, ${paidReg} paid`);
    const withReg = new Set(prospectRegs.map((r) => r.MemberNumber)).size;
    check(`prospects: ${withReg} of ${prospects.length} came to a webinar`, prospectRegs.length > 0 && withReg > 0, `${prospectRegs.length} registrations`);
    // and no order may ever reference one (the money chain is membership-only today)
    const badOrder = orders.filter((o) => prospectKeys.has(o.MemberNumber)).length;
    check('prospects: the money chain never bills a non-member', badOrder === 0, `${badOrder} orders`);
  }
  // THE FUNNEL: the point of holding non-members at all. These gates assert the conversion
  // question is answerable — attended a free webinar, then joined — and that the prologue is
  // genuinely a prologue (every pre-membership fact strictly precedes the join date).
  {
    const freeSet = new Set(events.filter((e) => !e.IsPaid).map((e) => e.EventKey));
    const evDate = new Map(events.map((e) => [e.EventKey, e.Date]));
    const priorRegs = regs.filter((x) => freeSet.has(x.EventKey) && evDate.get(x.EventKey) < joinOf.get(x.MemberNumber));
    const converted = new Set(priorRegs.map((x) => x.MemberNumber));
    check(`funnel: ${converted.size} members attended a free webinar before joining (${priorRegs.length} registrations)`,
      converted.size > 0, 'without a prologue there is no conversion rate');
    const late = priorRegs.filter((x) => x.RegisteredOn >= joinOf.get(x.MemberNumber)).length;
    check('funnel: every pre-membership registration precedes the join date', late === 0, `${late} booked after joining`);
    // the named application is the other half of the prologue
    const namedApp = fResponses.filter((x) => x.FormKey === 'membership-application' && x.MemberNumber != null);
    const badWhen = namedApp.filter((x) => x.SubmittedAt && x.SubmittedAt.slice(0, 10) >= joinOf.get(x.MemberNumber)).length;
    check(`funnel: ${namedApp.length} members applied before their start date`, namedApp.length > 0 && badWhen === 0, `${badWhen} applied after joining`);
    // and the denominator: non-members who came to a webinar and did NOT join
    const nonConverting = new Set(prospectRegs.map((x) => x.MemberNumber));
    const rate = nonConverting.size + converted.size ? converted.size / (nonConverting.size + converted.size) : 0;
    check(`funnel: webinar-to-member conversion is ${(rate * 100).toFixed(0)}% (${converted.size} joined, ${nonConverting.size} did not)`,
      rate > 0.03 && rate < 0.35, 'association benchmarks put webinar-to-member in the teens; a majority would mean the webinar list IS the member list');
  }
  const respKeys = new Set(fResponses.map((x) => x.ResponseKey));
  // member responses must resolve to people; anonymous ones must carry a session id instead
  const badResp = fResponses.filter((x) => x.MemberNumber != null ? !peopleKeys.has(x.MemberNumber) : !x.AnonymousSessionID).length;
  const badAns = fAnswers.filter((x) => !respKeys.has(x.ResponseKey)).length;
  check('pack refs: forms→common (anon: session id) + answers→responses', badResp + badAns === 0, `${badResp}+${badAns} dangling`);
  // an employment edge belongs to any PERSON we know — members and non-members alike
  const anyPersonKeys = new Set(allPeople.map((x) => x.MemberNumber));
  const badRel = relationships.filter((x) => (x.FromMemberNumber && !anyPersonKeys.has(x.FromMemberNumber)) || (x.ToMemberNumber && !anyPersonKeys.has(x.ToMemberNumber)) || (x.FromOrgKey && !orgKeys.has(x.FromOrgKey)) || (x.ToOrgKey && !orgKeys.has(x.ToOrgKey))).length;
  const badTask = tAssignments.filter((x) => !peopleKeys.has(x.AssigneeMemberNumber)).length + issues.filter((x) => !peopleKeys.has(x.ReporterMemberNumber)).length
    + issues.filter((x) => x.AssigneeMemberNumber && !peopleKeys.has(x.AssigneeMemberNumber)).length;
  check('pack refs: relationships/tasks/issues→common', badRel + badTask === 0, `${badRel}+${badTask} dangling`);
  const threadKeys = new Set(smThreads.map((x) => x.ThreadKey));
  const sessionKeys = new Set(smSessions.map((x) => x.SessionKey));
  const badMsg = smThreads.filter((x) => !peopleKeys.has(x.MemberNumber)).length
    + smSessions.filter((x) => !peopleKeys.has(x.MemberNumber)).length
    + smMessages.filter((x) => !threadKeys.has(x.ThreadKey) || !sessionKeys.has(x.SessionKey)).length;
  check('pack refs: messaging→common + messages→threads/sessions', badMsg === 0, `${badMsg} dangling`);
  // platform: staff-owned artifacts resolve to staff users; audit/favorite/list refs resolve to real records
  const staffKeys = new Set(pUsers.map((u) => u.UserKey));
  const issueKeySet = new Set(issues.map((x) => x.IssueKey));
  const taskKeySet = new Set(tTasks.map((x) => x.TaskKey));
  const periodKeySet = new Set(periods.map((x) => x.PeriodKey));
  const relKeySet = new Set(relationships.map((x) => x.RelKey));
  const refOk = (x) => x.RefKind === 'issue' ? issueKeySet.has(x.RefKey)
    : x.RefKind === 'task' ? taskKeySet.has(x.RefKey)
    : x.RefKind === 'period' ? periodKeySet.has(x.RefKey)
    : x.RefKind === 'memberprofile' || x.RefKind === 'person' ? peopleKeys.has(x.RefKey)
    : x.RefKind === 'rel' ? relKeySet.has(x.RefKey) : false;
  const badPlat = [...pViews, ...pConvs, ...pListsP, ...pNotifs].filter((x) => !staffKeys.has(x.UserKey)).length
    + pConvDetails.filter((x) => x.UserKey && !staffKeys.has(x.UserKey)).length
    + [...pFavs, ...pRecordChanges].filter((x) => !staffKeys.has(x.UserKey) || !RECORD_PREFIX[x.RefKind] || !refOk(x)).length
    + pListDetails.filter((x) => !RECORD_PREFIX[x.RefKind] || !refOk(x)).length;
  check('pack refs: platform→staff users + audit/favorites/lists→real records', badPlat === 0, `${badPlat} dangling`);
  // sonar: scores/history/transitions anchor real people; contributions resolve to scores+factors
  // sonar is DEFINITIONS ONLY (Sonar computes scores live): factors link to a model + a
  // related entity; model-factors link factor↔model; bands belong to the band set.
  const modelKeys = new Set(snModels.map((x) => x.ModelKey));
  const factorKeys = new Set(snFactors.map((x) => x.FactorKey));
  const relatedKeys = new Set(snRelated.map((x) => x.RelatedKey));
  const badSonar = snFactors.filter((x) => !modelKeys.has(x.ModelKey) || !relatedKeys.has(x.SourceRelatedKey)).length
    + snModelFactors.filter((x) => !modelKeys.has(x.ModelKey) || !factorKeys.has(x.FactorKey)).length
    + snRelated.filter((x) => !modelKeys.has(x.ModelKey)).length;
  check('pack refs: sonar factors→model+relatedEntity, model-factors→factor', badSonar === 0, `${badSonar} dangling`);
  for (const pack of ['common', 'membership', 'events', 'orders']) {
    const m = JSON.parse(readFileSync(join(OUT, 'packs', pack, 'manifest.json'), 'utf8'));
    check(`manifest: ${pack}`, m.name === pack && Array.isArray(m.dependsOn), `dependsOn=[${m.dependsOn}]`);
  }
}

// ---------- temporal integrity (§7.6): the team's date rules, re-verified ----------
function checkTemporal() {
  const badStart = periods.filter((x) => x.StartDate < joinOf.get(x.MemberNumber)).length;
  const badOrder = periods.filter((x) => x.EndDate <= x.StartDate).length;
  const lapsedNoCancel = periods.filter((x) => hasEnded(x.Status) && x.CancellationDate === null && x.EndDate < run.releaseDate).length;
  // grace runs AFTER the term for a lapse; notice is given BEFORE the term ends for a cancellation,
  // and cannot predate the term it cancels
  const cancelBeforeEnd = periods.filter((x) => x.CancellationDate
    && (x.Status === 'Cancelled'
      ? (x.CancellationDate > x.EndDate || x.CancellationDate < x.StartDate)
      : x.CancellationDate < x.EndDate)).length;
  let gaps = 0;
  for (const list of periodsByMember.values()) {
    list.sort((a, b) => a.StartDate.localeCompare(b.StartDate));
    for (let i = 1; i < list.length; i++) {
      const prevEnd = new Date(`${list[i - 1].EndDate}T00:00:00Z`).getTime();
      const nextStart = new Date(`${list[i].StartDate}T00:00:00Z`).getTime();
      if (nextStart - prevEnd !== 86400000) gaps++;
    }
  }
  const eventDate = new Map(events.map((e) => [e.EventKey, e.Date]));
  const regOutside = regs.filter((x) => {
    const evDate = eventDate.get(x.EventKey);
    const inPeriod = (periodsByMember.get(x.MemberNumber) ?? []).some((per) => per.StartDate <= evDate && evDate <= per.EndDate);
    return !inPeriod || x.RegisteredOn < joinOf.get(x.MemberNumber);
  }).length;
  check('periods: never start before JoinDate', badStart === 0, `${badStart} bad`);
  check('periods: EndDate > StartDate', badOrder === 0, `${badOrder} bad`);
  check('lapse ⟹ CancellationDate set (the team rule)', lapsedNoCancel === 0, `${lapsedNoCancel} missing`);
  // churn is not all non-payment — the reason column has to be worth reporting on
  const reasons = periods.filter((x) => x.CancellationReason).reduce((a, x) => (a[x.CancellationReason] = (a[x.CancellationReason] ?? 0) + 1, a), {});
  const reasonCount = Object.keys(reasons).length;
  const nonPay = Object.entries(reasons).filter(([k]) => k.startsWith('non-payment')).reduce((s, [, v]) => s + v, 0);
  const totalReasons = Object.values(reasons).reduce((s, v) => s + v, 0);
  check(`membership: churn reasons varied (${reasonCount} kinds, non-payment ${totalReasons ? Math.round(nonPay / totalReasons * 100) : 0}%)`,
    reasonCount >= 5 && (!totalReasons || nonPay / totalReasons < 0.75), 'voluntary churn must appear');
  check('CancellationDate ≥ EndDate (grace runs after)', cancelBeforeEnd === 0, `${cancelBeforeEnd} bad`);
  // PRESENCE FLOOR (same lesson as issue severity): the schema's CHECK allows five period
  // statuses and we shipped four — 8,024 periods and not one Cancelled — while every share-based
  // gate stayed green, because no gate asserted the bucket existed. Any status the CHECK permits
  // and the generator can produce must actually appear.
  {
    const produced = ['Active', 'Renewed', 'Lapsed', 'PendingRenewal', 'Cancelled'];
    const missing = produced.filter((st) => !periods.some((x) => x.Status === st));
    check(`periods: every producible status appears (${produced.length} of the CHECK's values)`, missing.length === 0,
      missing.length ? `never produced: ${missing.join(', ')}` : produced.map((st) => `${st}=${periods.filter((x) => x.Status === st).length}`).join(' '));
    // and the two terminal kinds must be distinguishable, not one relabelled
    const cancelled = periods.filter((x) => x.Status === 'Cancelled');
    const passive = new Set(R.membership.cancellation?.passiveReasons ?? []);
    const wrongReason = cancelled.filter((x) => passive.has(x.CancellationReason)).length;
    check(`periods: ${cancelled.length} cancellations all carry an active-decision reason`, wrongReason === 0,
      `${wrongReason} cancelled with a non-payment reason (nobody phones in to announce one)`);
  }
  check('renewals back-date: no gaps between periods', gaps === 0, `${gaps} gaps`);
  // THE FUNNEL EXCEPTION: a free webinar attended BEFORE joining is the whole point of
  // funnel.mjs — the prologue to a membership, not a coverage bug. Paid seats and anything
  // after the join date stay strictly inside a period.
  const freeKeys = new Set(events.filter((e) => !e.IsPaid).map((e) => e.EventKey));
  const preJoin = regs.filter((x) => {
    const evDate = eventDate.get(x.EventKey);
    return freeKeys.has(x.EventKey) && evDate < joinOf.get(x.MemberNumber);
  }).length;
  check('registrations covered by a membership period (free pre-join webinars exempt)', regOutside - preJoin === 0,
    `${regOutside} outside, ${preJoin} of them pre-membership webinars`);
}

// ---------- benchmark means + variance floors (§7.1–7.2) ----------
const byYear = {};
for (const e of renewalEvents) { (byYear[e.year] ??= { n: 0, r: 0 }); byYear[e.year].n++; byYear[e.year].r += e.renewed; }
// band/variance gates run on cohorts big enough that binomial noise doesn't dominate
const yearRates = Object.entries(byYear).filter(([, v]) => v.n >= 100).map(([y, v]) => ({ y: +y, n: v.n, rate: v.r / v.n, covid: (run.covidYears ?? [2020, 2021]).includes(+y) }));

function checkBenchmarks() {
  const M = R.membership;
  const normal = yearRates.filter((x) => !x.covid);
  const pooled = normal.reduce((s, x) => s + x.rate, 0) / normal.length;
  const stdYears = Math.sqrt(normal.reduce((s, x) => s + (x.rate - pooled) ** 2, 0) / normal.length);
  // small-sample allowance: the mean of a few wobbled years has its own SE (vanishes at
  // scale). 2×SE, not 1.5: the suite sweeps this gate across 7 seeds — at 1.5× a marginal
  // seed false-reds ~13% of sweeps (multiple comparisons; the arrow-gate lesson).
  const meanAllow = M.renewalTolerance + 2 * (stdYears / Math.sqrt(normal.length));
  check(`renewal mean ${(pooled * 100).toFixed(1)}% vs ${M.renewalTarget * 100}% ±${(meanAllow * 100).toFixed(1)} (tol + mean-SE at ${normal.length} yrs)`, Math.abs(pooled - M.renewalTarget) <= meanAllow, `${normal.length} non-covid yrs`);

  // each year's band widens by its own sampling error (converges to the pure band at scale)
  const inBand = normal.filter((x) => {
    const se = Math.sqrt((M.renewalTarget * (1 - M.renewalTarget)) / x.n);
    return x.rate >= M.yearlyBand[0] - 1.5 * se && x.rate <= M.yearlyBand[1] + 1.5 * se;
  }).length;
  check(`yearly renewal in [${M.yearlyBand}] (±1.5·SE at pilot n) for ≥75% of years`, inBand / normal.length >= 0.75, `${inBand}/${normal.length} in band`);

  // anti-smoothness floor with a chi-square small-sample discount: a sample std over few
  // years is itself noisy — only reject if it's below the 5% quantile of a true-at-floor std.
  // (chi2 5% lower quantiles by df; converges to the raw floor as years accumulate)
  // regime expression: COVID years must actually sit BELOW normal years — a shared shift
  // that gets calibrated away leaves no dip (the bug this gate exists to catch, found 2026-07-10)
  const covidYears = yearRates.filter((x) => x.covid);
  if (covidYears.length) {
    const covidMean = covidYears.reduce((s, x) => s + x.rate, 0) / covidYears.length;
    const nCovid = covidYears.reduce((s, x) => s + x.n, 0);
    const nNorm = normal.reduce((s, x) => s + x.n, 0);
    // one-sided with sampling allowance (binomial SE of the difference; strict at scale)
    const seDiff = Math.sqrt(M.renewalTarget * (1 - M.renewalTarget) * (1 / nCovid + 1 / nNorm));
    check(`regime: COVID renewal ${(covidMean * 100).toFixed(1)}% sits below normal ${(pooled * 100).toFixed(1)}% (−0.5pt required, +${(1.5 * seDiff * 100).toFixed(1)}pt SE allowance)`, covidMean < pooled - 0.005 + 1.5 * seDiff, 'regime must express, not calibrate away');
  }

  const CHI2_05 = { 1: 0.0039, 2: 0.103, 3: 0.352, 4: 0.711, 5: 1.145, 6: 1.635, 7: 2.167, 8: 2.733, 9: 3.325, 10: 3.940, 11: 4.575, 12: 5.226 };
  const df = Math.max(1, normal.length - 1);
  const floorAdj = M.yoyStdFloor * Math.sqrt((CHI2_05[Math.min(df, 12)] ?? df * 0.5) / df);
  check(`texture: YoY renewal std ${(stdYears * 100).toFixed(2)}pt ≥ floor ${(floorAdj * 100).toFixed(2)}pt (anti-smoothness, χ²-adjusted for ${normal.length} yrs)`, stdYears >= floorAdj, 'variance floor');

  // no-show rates are over PAST events only — upcoming-event registrations carry
  // Attended=null by construction (the outcome hasn't happened) and would read as no-shows
  const web = new Set(events.filter((e) => e.EventType === 'Webinar').map((e) => e.EventKey));
  const evDateOf = new Map(events.map((e) => [e.EventKey, e.Date]));
  const releaseIso = run.releaseDate;
  const pastRegs = regs.filter((x) => (evDateOf.get(x.EventKey) ?? '') <= releaseIso);
  const paid = pastRegs.filter((x) => !web.has(x.EventKey));
  const webinar = pastRegs.filter((x) => web.has(x.EventKey));
  const nsPaid = paid.filter((x) => !x.Attended).length / paid.length;
  const nsWeb = webinar.filter((x) => !x.Attended).length / webinar.length;
  const NS = R.events.noShow;
  check(`no-show paid ${(nsPaid * 100).toFixed(1)}% vs ${NS.paidInPerson.target * 100}% ±${NS.paidInPerson.tolerance * 100}`, Math.abs(nsPaid - NS.paidInPerson.target) <= NS.paidInPerson.tolerance, `${paid.length} regs`);
  check(`no-show webinar ${(nsWeb * 100).toFixed(1)}% vs ${NS.freeWebinar.target * 100}% ±${NS.freeWebinar.tolerance * 100}`, Math.abs(nsWeb - NS.freeWebinar.target) <= NS.freeWebinar.tolerance, `${webinar.length} regs`);

  // ---------- COVID expresses as a causal era, not just a renewal footnote ----------
  // Only traces that SURVIVE into shipped data are asserted here. The renewal dip is real
  // but its cohort is archived away (see regimes.covid.$archiveCaveat), so it is checked
  // through renewalEvents by the regime gate above, not through membership_periods.
  {
    const CV = R.regimes.covid, cy = CV.years;
    const pre = cy[0] - 1;
    const evOf = new Map(events.map((e) => [e.EventKey, e]));
    const regsIn = (y, type) => regs.filter((x) => { const e = evOf.get(x.EventKey); return e && e.Year === y && (type === 'web' ? e.EventType === 'Webinar' : e.EventType !== 'Webinar'); }).length;
    const ratio = (y) => regsIn(y, 'web') / Math.max(1, regsIn(y, 'inp'));
    const flipped = cy.every((y) => ratio(y) > ratio(pre) * 1.8);
    check(`covid: attendance flips to virtual (webinar:in-person ${ratio(pre).toFixed(2)} before, ${cy.map((y) => ratio(y).toFixed(2)).join('/')} during)`,
      flipped, 'online attendance surged while in-person collapsed');
    const webSched = (y) => events.filter((e) => e.Year === y && e.EventType === 'Webinar').length;
    check(`covid: more webinars scheduled (${webSched(pre)} before vs ${cy.map(webSched).join('/')})`, cy.every((y) => webSched(y) > webSched(pre)), 'programming pivots online');
    const mtgIn = (y) => cMeetings.filter((m) => m.StartDateTime.startsWith(String(y)));
    const allVirtual = cy.every((y) => { const m = mtgIn(y); return m.length && m.every((x) => x.LocationType === 'Virtual'); });
    check('covid: committee meetings all virtual in the pandemic years', allVirtual, 'governance kept meeting, but online');
    const advIn = (y) => advocacy.filter((a) => a.ActionDate.startsWith(String(y))).length;
    check(`covid: advocacy surges (${advIn(pre)} before vs ${cy.map(advIn).join('/')})`, cy.some((y) => advIn(y) > advIn(pre) * 1.5), 'relief and market-access lobbying — the era is not a uniform dip');
    // CROWD entries only: Henri is a pinned persona who enters eight a year by declaration,
    // and heroes are facts that deliberately do not respond to regimes. At pilot scale his
    // eight swamp the crowd's dip entirely, which is what made this gate false-red.
    const heroNums = new Set(R.heroes.map((h) => h.memberNumber));
    // RETENTION: the pandemic's effect on churn must be findable in the shipped data, not
    // only in the validator's private event log. The archive rule used to swallow the whole
    // 2020-21 lapse cohort, so this is the trace that was missing entirely.
    const lapsesIn = (y) => periods.filter((x) => hasEnded(x.Status) && x.EndDate.startsWith(String(y))).length;
    const cohortFloor = Math.max(3, Math.round(people.length * 0.008));
    check(`covid: the lapse cohort survives archiving (${cy.map(lapsesIn).join('/')} retained, floor ${cohortFloor})`, cy.every((y) => lapsesIn(y) >= cohortFloor), 'the era must be visible in membership history');
    const pandemicLapses = periods.filter((x) => x.CancellationReason === CV.churnReason).length;
    const eraLapses = cy.reduce((n, y) => n + lapsesIn(y), 0);
    check(`covid: ${pandemicLapses} lapses attributed to the pandemic (${Math.round(pandemicLapses / Math.max(1, eraLapses) * 100)}% of era churn)`,
      pandemicLapses > 0 && pandemicLapses < eraLapses, 'an era-specific reason, not a relabel of everything');
    const outside = periods.filter((x) => x.CancellationReason === CV.churnReason && !cy.includes(+x.EndDate.slice(0, 4))).length;
    check('covid: the pandemic reason appears ONLY in the pandemic years', outside === 0, `${outside} outside the era`);
    const compIn = (y) => compEntries.filter((e) => e.EntryYear === y && !heroNums.has(e.MemberNumber)).length;
    if (compIn(pre) >= 6) check(`covid: competition curtailed, crowd entries (${compIn(pre)} before vs ${cy.map(compIn).join('/')})`, cy.every((y) => compIn(y) < compIn(pre)), 'judging is a physical activity');
  }

  // learners don't all finish on the cohort end date, and the calendar has no blind months
  const done = enrollments.filter((e) => e.CompletedOn);
  const onEnd = done.filter((e) => { const c = courses.find((x) => x.CourseKey === e.CourseKey); return c && e.CompletedOn === iso2(addDays2(parseDate2(c.StartDate), c.DurationWeeks * 7)); }).length;
  check(`learning: completions spread off the cohort end (${done.length - onEnd}/${done.length} off-date, ${new Set(done.map((e) => e.CompletedOn)).size} distinct dates)`,
    !done.length || onEnd / done.length < 0.35, 'not every learner finishes the same day');
  check(`learning: courses start in every month (${new Set(courses.map((c) => +c.StartDate.slice(5, 7))).size}/12)`, new Set(courses.map((c) => +c.StartDate.slice(5, 7))).size >= 11, 'no blind months');

  // survey scores carry a detractor tail — a pure gaussian never produces an angry 0-2
  const npsVals = fAnswers.filter((a) => a.QuestionKey === 'post-conf-survey:nps' && a.NumericValue != null).map((a) => a.NumericValue);
  if (npsVals.length > 100) {
    // only assert the tail once enough responses exist for it to be reliably non-empty —
    // at pilot scale a 2.5% share legitimately yields zero on some seeds (the suite sweeps
    // 7 of them, so a bare "> 0" false-reds a few percent of the time)
    const det = npsVals.filter((v) => v <= 2).length;
    const expected = npsVals.length * (R.forms.answers.nps.detractorShare ?? 0);
    if (expected >= 3) check(`forms: NPS has a detractor tail (${det} scores ≤2 of ${npsVals.length}, expected ~${expected.toFixed(1)})`, det > 0, 'real surveys have angry zeros');
    const hours = new Set(fResponses.filter((r2) => r2.SubmittedAt).map((r2) => r2.SubmittedAt.slice(11, 13)));
    check(`forms: submissions spread across the day (${hours.size} distinct hours)`, hours.size >= 8, 'not one bar at noon');
  }

  // registration hygiene: one row per member+event; upcoming events aren't an empty grid,
  // and their registrations are outcome-free and booked before the release
  const pairSeen = new Set(); let dupPairs = 0;
  for (const x of regs) { const k = `${x.MemberNumber}|${x.EventKey}`; if (pairSeen.has(k)) dupPairs++; else pairSeen.add(k); }
  check('registrations: one per member+event (no duplicate pairs)', dupPairs === 0, `${dupPairs} duplicate pairs`);
  const upcomingEvents = events.filter((e) => e.Date > releaseIso);
  const futureRegs = regs.filter((x) => (evDateOf.get(x.EventKey) ?? '') > releaseIso);
  const badFuture = futureRegs.filter((x) => x.Attended !== null || x.RegisteredOn > releaseIso).length;
  if (upcomingEvents.length) {
    // the grid must not be empty; at pilot scale a far-out event can legitimately have
    // nobody signed up yet, so require the nearest ones to be populated, not all of them
    const withRegs = upcomingEvents.filter((e) => futureRegs.some((x) => x.EventKey === e.EventKey)).length;
    check(`upcoming events have early registrations (${withRegs}/${upcomingEvents.length} events, ${futureRegs.length} regs)`, futureRegs.length > 0 && withRegs >= Math.max(1, Math.floor(upcomingEvents.length * 0.4)), 'the upcoming grid must not be empty');
    check('future-event registrations: Attended null, booked on/before release', badFuture === 0, `${badFuture} bad`);
  }
  // lead-time texture: the fixed −14/−45 offsets are gone; demand a real spread
  const leads = pastRegs.map((x) => (parseDateMs(evDateOf.get(x.EventKey)) - parseDateMs(x.RegisteredOn)) / 86400000).filter((d) => d >= 0);
  const distinctLeads = new Set(leads).size;
  const sameDay = leads.filter((d) => d === 0).length / (leads.length || 1);
  check(`registration lead times vary (${distinctLeads} distinct, ${(sameDay * 100).toFixed(1)}% same-day)`, distinctLeads >= 40 && sameDay > 0.01 && sameDay < 0.30, 'no single-offset comb');
}
const parseDateMs = (s) => new Date(`${s}T00:00:00Z`).getTime();

// ---------- arrow recovery (§7.3): every causal rule re-detected, right sign and size ----------
function checkArrows() {
  // the anchor rides along as a nuisance covariate: with a DRIFTING θ, renewal selection
  // acted on past θ values the decision-year θ can't represent — omitting that history
  // attenuates neighboring coefficients (tenure especially). The anchor stands in for it.
  //
  // CONTRACT PROJECTION #2: the built-in drivers are gated by name; every DECLARED-FEATURE
  // factor in the ruleset auto-gains a column and a recovery gate — author a factor, get
  // its check, no validator edit.
  const A = R.membership.arrows;
  const declaredNames = Object.entries(A).filter(([, a]) => a.feature).map(([k]) => k);
  const X = renewalEvents.map((e) => [1, e.tenureZ, e.theta, e.anchor ?? e.theta, e.prevTheta ?? e.theta, e.employerEvent, ...declaredNames.map((k) => e[k] ?? 0)]);
  const y = renewalEvents.map((e) => e.renewed);
  const { beta, se } = logisticFit(X, y);
  const [, bTenure, bTheta, , , bEmployer, ...bDeclared] = beta;
  const [, seTenure, seTheta, , , seEmployer, ...seDeclared] = se;
  const gate = (name, got, seV, authored) => {
    const okSign = Math.sign(got) === Math.sign(authored);
    const ratio = Math.abs(got / authored);
    // strict band, with a small-sample allowance (±3·SE) that vanishes at production scale.
    // 3 (not 2.5) is the multiple-comparisons budget: ~30 gates × many seeds means a 2.5σ
    // false failure is EXPECTED occasionally (verified empirically: recoveries center on the
    // authored values; a 2.9σ outlier appeared in a 7-seed sweep exactly as statistics predicts)
    const ok = okSign && ((ratio >= 0.5 && ratio <= 2.0) || Math.abs(got - authored) <= 3 * seV);
    check(`arrow ${name}: recovered β=${got.toFixed(2)}±${seV.toFixed(2)} vs authored ${authored} (×${ratio.toFixed(2)})`, ok, okSign ? 'sign ok' : 'SIGN FLIP');
  };
  gate('tenure→renewal', bTenure, seTenure, A.tenure.beta);
  gate('engagement→renewal', bTheta, seTheta, A.engagement.beta);
  gate('employerEvent→renewal (1.15)', bEmployer, seEmployer, A.employerEvent.beta);
  declaredNames.forEach((k, i) => gate(`${k}→renewal [declared feature]`, bDeclared[i], seDeclared[i], A[k].beta));

  // the enthusiast rule's own benchmark: ~65% tier renewal while overall stays 87%.
  // COMPOSITION-ADJUSTED: the 65% is a claim about a composition-typical cohort — in a
  // small world the group can legitimately skew (e.g. mostly recent joiners → low tenure),
  // and the OTHER arrows then move its raw rate for authored reasons the recovery gates
  // already verify. So the target shifts by each recovered arrow's β × the group-vs-rest
  // gap in its measured driver. The adjustment (like every small-sample allowance here)
  // vanishes at scale: group means converge to the cohort's, and the gap → 0.
  const enth = renewalEvents.filter((e) => e.enthusiastTier === 1);
  const rest = renewalEvents.filter((e) => e.enthusiastTier !== 1);
  const enthRate = enth.reduce((s, e) => s + e.renewed, 0) / enth.length;
  const EB = R.membership.enthusiastRenewal;
  const meanOf = (rows, f) => rows.reduce((s, e) => s + e[f], 0) / rows.length;
  const compShift = [['tenure', 'tenureZ'], ['engagement', 'theta'], ['employerEvent', 'employerEvent']]
    .reduce((s, [arrow, f]) => s + A[arrow].beta * (meanOf(enth, f) - meanOf(rest, f)), 0);
  const adjTarget = 1 / (1 + Math.exp(-(Math.log(EB.target / (1 - EB.target)) + compShift)));
  const enthAllow = EB.tolerance + 1.5 * Math.sqrt((adjTarget * (1 - adjTarget)) / enth.length);
  check(`enthusiast-tier renewal ${(enthRate * 100).toFixed(1)}% vs ${(adjTarget * 100).toFixed(1)}% (target ${EB.target * 100}%, composition-adjusted ${(compShift >= 0 ? '+' : '')}${compShift.toFixed(2)} logit) ±${(enthAllow * 100).toFixed(1)}`, Math.abs(enthRate - adjTarget) <= enthAllow, `${enth.length} decisions`);

  // engagement double-check through a fully OBSERVABLE proxy (activity quartiles) —
  // attenuated by design, but it's what a customer's analyst would actually see
  const acts = new Map();
  for (const x of regs) acts.set(x.MemberNumber, (acts.get(x.MemberNumber) ?? 0) + 1);
  const activity = people.map((p) => ({ act: acts.get(p.MemberNumber) ?? 0, m: p.MemberNumber }));
  activity.sort((a, b) => a.act - b.act);
  const q = (lo, hi) => {
    const slice = activity.slice(Math.floor(activity.length * lo), Math.floor(activity.length * hi));
    const active = slice.filter((s) => ['Active', 'PendingRenewal', 'Renewed'].includes(lastStatus.get(s.m))).length;
    return active / slice.length;
  };
  const low = q(0, 0.25), high = q(0.75, 1);
  check(`arrow engagement→retention (proxy): top-quartile activity retention ${(high * 100).toFixed(0)}% > bottom ${(low * 100).toFixed(0)}%`, high > low + 0.05, 'observable proxy, attenuated by design');
}

// ---------- tiers & dues: the affluence dial made observable ----------
function checkTiers() {
  const latents = JSON.parse(readFileSync(join(OUT, 'validation-latents.json'), 'utf8'));
  const duesOf = new Map(R.membership.tiers.list.map((t) => [t.name, t.dues]));
  const badDues = periods.filter((x) => x.DuesAmount !== duesOf.get(x.MembershipTier)).length;
  check('dues: every period carries its tier\'s exact dues', badDues === 0, `${badDues} mismatched`);
  const indiv = periods.filter((x) => x.MembershipTier === 'Individual');
  check(`dues: Individual tier = $${R.membership.tiers.individualDuesTarget} exactly (the verified ACS rate)`, indiv.every((x) => x.DuesAmount === R.membership.tiers.individualDuesTarget), `${indiv.length} periods`);
  // φ must be monotone across paid tiers — the copula's second dial expressing through money
  const phiOf = (tier) => {
    const rows = latents.filter((l) => !l.hero && l.tier === tier);
    return rows.length ? rows.reduce((s, l) => s + l.phi, 0) / rows.length : null;
  };
  const pIndiv = phiOf('Individual'), pSmall = phiOf('SmallBusiness'), pCorp = phiOf('Corporate');
  const monotone = pIndiv != null && pSmall != null && pCorp != null && pIndiv < pSmall && pSmall < pCorp;
  check(`tiers: mean φ rises Individual(${pIndiv?.toFixed(2)}) < SmallBusiness(${pSmall?.toFixed(2)}) < Corporate(${pCorp?.toFixed(2)})`, monotone, 'affluence → tier, observable');
  const enthMismatch = latents.filter((l) => !l.hero && (l.tier === 'Enthusiast')).length;
  check('tiers: Enthusiast tier exists and is populated', enthMismatch > 0, `${enthMismatch} members`);
}

// ---------- learning: participation + completion, engagement expressing (3rd domain) ----------
function checkLearning() {
  const L = R.learning;
  const courseKeys = new Set(courses.map((c) => c.CourseKey));
  const badRefs = enrollments.filter((e) => !courseKeys.has(e.CourseKey) || !joinOf.has(e.MemberNumber)).length;
  check('pack refs: learning→common+courses', badRefs === 0, `${badRefs} dangling`);

  // participation: members with ≥1 enrollment per eligible year ≈ 50%. Eligible = covered
  // mid-year — the same pool the generator calibrates on; counting raw period-years instead
  // double-counts anniversary members and dilutes with partial years (measurement artifact).
  const courseYear = new Map(courses.map((c) => [c.CourseKey, c.Year]));
  const participated = new Set(enrollments.map((e) => `${e.MemberNumber}:${courseYear.get(e.CourseKey)}`));
  let activeYears = 0, partYears = 0;
  const lastYear = +run.releaseDate.slice(0, 4);
  for (const [m, list] of periodsByMember) {
    const seen = new Set();
    for (const per of list) {
      const y0 = +per.StartDate.slice(0, 4), y1 = Math.min(+per.EndDate.slice(0, 4), lastYear);
      for (let y = y0; y <= y1; y++) {
        if (seen.has(y)) continue;
        const mid = `${y}-06-15`;
        if (!(per.StartDate <= mid && mid <= per.EndDate) && !list.some((p2) => p2.StartDate <= mid && mid <= p2.EndDate)) continue;
        seen.add(y);
        activeYears++;
        if (participated.has(`${m}:${y}`)) partYears++;
      }
    }
  }
  const partRate = partYears / activeYears;
  const partAllow = L.participation.tolerance + 1.5 * Math.sqrt(L.participation.target * (1 - L.participation.target) / activeYears);
  check(`learning: participation ${(partRate * 100).toFixed(1)}% vs ${L.participation.target * 100}% ±${(partAllow * 100).toFixed(1)}`, Math.abs(partRate - L.participation.target) <= partAllow, `${activeYears} member-years`);

  // completion among terminal enrollments ≈ 72%
  const terminal = enrollments.filter((e) => e.Status !== 'InProgress');
  const compRate = terminal.filter((e) => e.Status === 'Completed').length / terminal.length;
  const compAllow = L.completion.tolerance + 1.5 * Math.sqrt(L.completion.target * (1 - L.completion.target) / terminal.length);
  check(`learning: completion ${(compRate * 100).toFixed(1)}% vs ${L.completion.target * 100}% ±${(compAllow * 100).toFixed(1)}`, Math.abs(compRate - L.completion.target) <= compAllow, `${terminal.length} terminal enrollments`);

  // engagement expresses through completion (observable proxy: anchor quartiles)
  const latents = JSON.parse(readFileSync(join(OUT, 'validation-latents.json'), 'utf8'));
  const anchorOf = new Map(latents.map((l) => [l.m, l.theta]));
  const withAnchor = terminal.filter((e) => anchorOf.has(e.MemberNumber));
  withAnchor.sort((a, b) => anchorOf.get(a.MemberNumber) - anchorOf.get(b.MemberNumber));
  const q = (lo, hi) => { const s = withAnchor.slice(Math.floor(withAnchor.length * lo), Math.floor(withAnchor.length * hi)); return s.filter((e) => e.Status === 'Completed').length / s.length; };
  check(`learning: completion rises with engagement (bottom quartile ${(q(0, 0.25) * 100).toFixed(0)}% < top ${(q(0.75, 1) * 100).toFixed(0)}%)`, q(0.75, 1) > q(0, 0.25) + 0.03, 'observable proxy');

  // enrollments only inside membership windows (carry-down, 3rd domain)
  const courseStart = new Map(courses.map((c) => [c.CourseKey, c.StartDate]));
  const outside = enrollments.filter((e) => {
    const d = courseStart.get(e.CourseKey);
    return !(periodsByMember.get(e.MemberNumber) ?? []).some((per) => per.StartDate <= d && d <= per.EndDate);
  }).length;
  check('learning: enrollments covered by a membership period', outside === 0, `${outside} outside`);
}

// ---------- the money chain: order-per-cycle, 3-part payment timing, reconciliation ----------
function checkMoney() {
  const G = R.orders.gates;
  // BO-D40 verbatim: one dues order per membership period
  const duesOrders = orders.filter((x) => x.OrderKey.startsWith('ORD-D-'));
  check('money: one dues order per membership period (order-per-cycle)', duesOrders.length === periods.length, `${duesOrders.length} orders / ${periods.length} periods`);

  // reconciliation: every Paid order's payments sum to its total; no orphan payments
  const paidByOrder = new Map();
  // failed/denied ATTEMPTS are not money — only settled/settling captures reconcile
  for (const p of payments.filter((x) => x.Status === 'Captured' || x.Status === 'InProgress')) paidByOrder.set(p.OrderKey, (paidByOrder.get(p.OrderKey) ?? 0) + p.Amount);
  const badRecon = orders.filter((x) => x.PaymentStatus === 'Paid' && paidByOrder.get(x.OrderKey) !== x.TotalGross).length;
  const paidButNo = orders.filter((x) => x.PaymentStatus !== 'Paid' && paidByOrder.has(x.OrderKey)).length; // failed attempts on aging orders are expected — excluded above
  check('money: every Paid order reconciles (payments sum = total; unpaid have none)', badRecon + paidButNo === 0, `${badRecon}+${paidButNo} bad`);

  // the 3-part timing mixture, measured
  const perByKey = new Map(periods.map((x) => [`ORD-D-${x.PeriodKey}`, x]));
  // the SETTLING payment only: a refund is a later negative row against the same order and
  // would otherwise read as "this order was paid late"
  const payDate = new Map(payments.filter((p) => p.Amount > 0 && p.Status !== 'Refunded').map((p) => [p.OrderKey, p.PaymentDate]));
  const cls = { auto: [], manual: [], net: [] };
  for (const o of duesOrders) {
    if (!payDate.has(o.OrderKey)) continue; // unpaid orders age instead
    const per = perByKey.get(o.OrderKey);
    const late = payDate.get(o.OrderKey) > o.DueDate ? 1 : 0;
    const onDue = payDate.get(o.OrderKey) === o.DueDate ? 1 : 0;
    if (['SmallBusiness', 'Corporate'].includes(per.MembershipTier)) cls.net.push(late);
    else if (per.AutoRenew) cls.auto.push(onDue);
    else cls.manual.push(late);
  }
  const rate = (a) => a.reduce((s, x) => s + x, 0) / a.length;
  const se = (p, n) => Math.sqrt(p * (1 - p) / n);
  const netLate = rate(cls.net), manualLate = rate(cls.manual), autoOn = rate(cls.auto);
  check(`money: net-terms late share ${(netLate * 100).toFixed(1)}% vs ${G.netTermsLate.target * 100}% ±${(G.netTermsLate.tolerance * 100).toFixed(0)}+SE (Atradius/CRF)`, Math.abs(netLate - G.netTermsLate.target) <= G.netTermsLate.tolerance + 1.5 * se(G.netTermsLate.target, cls.net.length), `${cls.net.length} net-terms payments`);
  check(`money: manual dues late share ${(manualLate * 100).toFixed(1)}% vs ${G.manualLate.target * 100}% ±${(G.manualLate.tolerance * 100).toFixed(0)}+SE (mirrors late_renewal_share)`, Math.abs(manualLate - G.manualLate.target) <= G.manualLate.tolerance + 1.5 * se(G.manualLate.target, cls.manual.length), `${cls.manual.length} manual payments`);
  check(`money: auto-pay lands ON the due date ${(autoOn * 100).toFixed(1)}% (≥${G.autopayOnDueMin * 100}%)`, autoOn >= G.autopayOnDueMin, `${cls.auto.length} auto-payments`);

  // event orders: card-at-checkout = paid same day, always
  const evOrders = orders.filter((x) => x.OrderKey.startsWith('ORD-E-'));
  const badEv = evOrders.filter((x) => payDate.get(x.OrderKey) !== x.OrderDate).length;
  check('money: event registrations are card-at-checkout (paid same day)', badEv === 0, `${evOrders.length} event orders, ${badEv} bad`);

  // the renewal-outreach queue exists in the money data: pending members carry an OPEN order
  const pendingMembers = periods.filter((x) => x.Status === 'PendingRenewal').map((x) => x.MemberNumber);
  const openRenewals = new Set(orders.filter((x) => x.OrderKey.startsWith('ORD-R-') && x.PaymentStatus !== 'Paid').map((x) => x.MemberNumber));
  const missing = pendingMembers.filter((m) => !openRenewals.has(m)).length;
  check(`money: every PendingRenewal member has an open renewal order (incl. Marcus)`, missing === 0 && openRenewals.has('ICF-000102'), `${pendingMembers.length} pending, ${missing} missing`);

  // ---------- the money model sells more than dues and tickets ----------
  {
    const prodTypes = new Set(products.map((p) => p.ProductType));
    check(`money: ${products.length} products across ${prodTypes.size} types (${[...prodTypes].join(', ')})`, prodTypes.size >= 6, 'an association sells more than membership and event tickets');
    // billable facts that used to generate nothing
    const certOrders = orders.filter((o) => o.OrderKey.startsWith('ORD-C')).length;
    const compOrders = orders.filter((o) => o.OrderKey.startsWith('ORD-X-')).length;
    check(`money: credentials and competitions are billed (${certOrders} certification, ${compOrders} competition orders)`, certOrders > 0 && compOrders > 0, 'these were free before');
    // orders bundle
    const linesPerOrder = orderLines.reduce((a, l) => (a[l.OrderKey] = (a[l.OrderKey] ?? 0) + 1, a), {});
    const multi = Object.values(linesPerOrder).filter((n) => n > 1).length;
    check(`money: ${multi} multi-line orders of ${orders.length}`, multi > 0, 'real orders bundle');
    // every order's TotalGross equals the sum of its lines
    const sums = orderLines.reduce((a, l) => (a[l.OrderKey] = (a[l.OrderKey] ?? 0) + l.LineTotal, a), {});
    const badTotals = orders.filter((o) => Math.abs((sums[o.OrderKey] ?? 0) - o.TotalGross) > 0.005).length;
    check('money: order totals equal the sum of their lines', badTotals === 0, `${badTotals} mismatched`);
    // prices move with time
    const duesLines = orderLines.filter((l) => l.ProductKey === 'PROD-MEM-INDIVIDUAL');
    const priceByYear = new Map();
    for (const l of duesLines) { const o = orders.find((x) => x.OrderKey === l.OrderKey); if (o) priceByYear.set(o.OrderDate.slice(0, 4), l.UnitPrice); }
    const yrs = [...priceByYear.keys()].sort();
    if (yrs.length > 4) check(`money: prices move over time (Individual dues ${priceByYear.get(yrs[0])} in ${yrs[0]} -> ${priceByYear.get(yrs[yrs.length - 1])} in ${yrs[yrs.length - 1]})`,
      priceByYear.get(yrs[yrs.length - 1]) > priceByYear.get(yrs[0]), 'thirteen years of frozen prices is not a revenue story');
    // refunds exist and are negative
    const refs = payments.filter((p) => p.Status === 'Refunded');
    check(`money: ${refs.length} refunds, all negative against a paid order`, refs.length > 0 && refs.every((p) => p.Amount < 0), 'refunds are a ledger line, not a deletion');
  }

  // temporal integrity: a payment can't precede the bill it settles (2,386 rows did, 2026-07-27)
  const orderDateOf = new Map(orders.map((o) => [o.OrderKey, o.OrderDate]));
  const timeTravelers = payments.filter((p) => p.PaymentDate < orderDateOf.get(p.OrderKey)).length;
  check('money: no payment dated before its order', timeTravelers === 0, `${timeTravelers} payments predate their order`);
  // renewal bills post ahead of the cycle (the notice), first-period bills on the join date
  const preBilled = duesOrders.filter((o) => { const per = perByKey.get(o.OrderKey); return per && o.OrderDate < per.StartDate; }).length;
  check(`money: renewal bills post ahead of the period (${preBilled}/${duesOrders.length} pre-billed)`, preBilled > duesOrders.length * 0.5, 'renewal notices go out early');
}

// ---------- engagement dynamics: decline must PRECEDE lapse (found 2026-07-10) ----------
// With a constant lifetime θ, members lapse without warning — activity is level right up to
// the cliff, Sonar trends are flat, and churn early-warning (the "save Bob" demo) has nothing
// to detect. This gate requires the drifting-θ process to actually express: lapsed members'
// final-year activity must sit below their own earlier average (within-person decline).
function checkEngagementDynamics() {
  const eventYear = new Map(events.map((e) => [e.EventKey, e.Year]));
  const regsByMemberYear = new Map();
  for (const x of regs) {
    const key = `${x.MemberNumber}:${eventYear.get(x.EventKey)}`;
    regsByMemberYear.set(key, (regsByMemberYear.get(key) ?? 0) + 1);
  }
  const isCovid = (y) => (run.covidYears ?? [2020, 2021]).includes(y);
  let finalSum = 0, earlierSum = 0, members = 0;
  for (const [m, list] of periodsByMember) {
    const last = list[list.length - 1];
    if (!hasEnded(last.Status)) continue;
    const joinYear = +list[0].StartDate.slice(0, 4);
    const lastYear = +last.EndDate.slice(0, 4);
    if (isCovid(lastYear)) continue;
    // within-person baseline: FULL non-COVID years strictly between the (partial) join year
    // and the final year — the join-year and COVID confounds bias the ratio upward otherwise
    const baselineYears = [];
    for (let y = joinYear + 1; y < lastYear; y++) if (!isCovid(y)) baselineYears.push(y);
    if (baselineYears.length < 2) continue;
    const finalActivity = regsByMemberYear.get(`${m}:${lastYear}`) ?? 0;
    const earlier = baselineYears.reduce((s, y) => s + (regsByMemberYear.get(`${m}:${y}`) ?? 0), 0) / baselineYears.length;
    finalSum += finalActivity;
    earlierSum += earlier;
    members++;
  }
  if (members >= 30) {
    const ratio = finalSum / Math.max(earlierSum, 1e-9);
    check(`dynamics: lapsers' final-year activity is ${(ratio * 100).toFixed(0)}% of their own baseline (decline precedes lapse)`, ratio < 0.92, `${members} lapsers with ≥2 clean baseline yrs`);
  } else {
    check('dynamics: decline-precedes-lapse (skipped — too few long-history lapsers at this N)', true, `${members} qualifying members`);
  }
}

// ---------- trainability (§7.4): observables only — the customer's-data-scientist test ----------
function checkTrainability() {
  const X = renewalEvents.map((e) => [1, e.tenureZ, e.autoRenew, e.employerEvent]);
  const y = renewalEvents.map((e) => e.renewed);
  const { beta } = logisticFit(X, y);
  const scored = X.map((x, i) => ({ p: x.reduce((s, v, j) => s + v * beta[j], 0), y: y[i] }));
  scored.sort((a, b) => a.p - b.p);
  const bottom = scored.slice(0, Math.floor(scored.length * 0.2));
  const top = scored.slice(-Math.floor(scored.length * 0.2));
  const churnBottom = 1 - bottom.reduce((s, x) => s + x.y, 0) / bottom.length;
  const churnTop = 1 - top.reduce((s, x) => s + x.y, 0) / top.length;
  check(`trainability: churn in model's bottom quintile ${(churnBottom * 100).toFixed(0)}% ≥ 2× top quintile ${(churnTop * 100).toFixed(0)}%`, churnBottom >= churnTop * 2, 'rank-ordering lift (N-appropriate, per spec §7.4)');
}

// ---------- composed bizapps slices: committees + forms land their targets ----------
function checkComposedApps() {
  const CC = R.committees; const FF = R.forms;
  // committee participation share (over the ACTIVE term's eligible crowd — heroes excluded from the draw)
  const activeTerm = CC.terms[CC.terms.length - 1];
  const served = new Set(cMemberships.filter((m) => m.TermKey.endsWith(activeTerm.start)).map((m) => m.MemberNumber));
  const eligible = people.filter((p) => periods.some((per) => per.MemberNumber === p.MemberNumber && per.StartDate <= activeTerm.start && activeTerm.start <= per.EndDate));
  const share = eligible.length ? [...served].filter((m) => eligible.some((p) => p.MemberNumber === m)).length / eligible.length : 0;
  const shareAllow = CC.participation.tolerance + 3 * Math.sqrt((CC.participation.shareOfEligible * (1 - CC.participation.shareOfEligible)) / Math.max(1, eligible.length)); // 3×SE: multiple comparisons across seeds+terms (arrow-gate precedent)
  check(`committees: ${(share * 100).toFixed(1)}% of eligible serve vs ${CC.participation.shareOfEligible * 100}% ±${(shareAllow * 100).toFixed(1)}`, Math.abs(share - CC.participation.shareOfEligible) <= shareAllow, `${served.size} serving / ${eligible.length} eligible`);
  // every committee-term has exactly one Chair
  const chairs = new Map();
  const populated = new Set(cMemberships.map((m) => m.TermKey));
  for (const m of cMemberships.filter((x) => x.RoleKey === 'Chair')) chairs.set(m.TermKey, (chairs.get(m.TermKey) ?? 0) + 1);
  // hero-only rosters are exempt: a pinned Member's role is a fact, so a committee whose
  // only members are pinned heroes carries an honest Chair VACANCY in a tiny world
  const crowdPopulated = new Set(cMemberships.filter((m) => !R.heroes.some((h) => h.memberNumber === m.MemberNumber)).map((m) => m.TermKey));
  const badChair = [...crowdPopulated].filter((t) => (chairs.get(t) ?? 0) !== 1).length;
  check('committees: exactly one Chair per crowd-populated committee-term', badChair === 0, `${chairs.size} chaired / ${crowdPopulated.size} crowd-populated terms`);
  // meeting attendance rate
  const present = cAttendance.filter((a) => a.AttendanceStatus === 'Present').length;
  const attRate = cAttendance.length ? present / cAttendance.length : 0;
  const attAllow = CC.meetings.attendance.tolerance + 1.5 * Math.sqrt((CC.meetings.attendance.presentTarget * (1 - CC.meetings.attendance.presentTarget)) / Math.max(1, cAttendance.length));
  check(`committees: meeting attendance ${(attRate * 100).toFixed(1)}% vs ${CC.meetings.attendance.presentTarget * 100}% ±${(attAllow * 100).toFixed(1)}`, Math.abs(attRate - CC.meetings.attendance.presentTarget) <= attAllow, `${cAttendance.length} attendance rows`);
  // survey response rate (pooled over distributions) + NPS mean band — SURVEY responses only
  // (the membership application is a separate, anonymous funnel with its own gates below)
  const surveyResponses = fResponses.filter((x) => x.FormKey === 'post-conf-survey');
  const attendees = regs.filter((x) => x.Attended === true && events.find((e) => e.EventKey === x.EventKey)?.EventType === 'Conference').length;
  const respRate = attendees ? surveyResponses.length / attendees : 0;
  const respAllow = FF.response.tolerance + 1.5 * Math.sqrt((FF.response.rateTarget * (1 - FF.response.rateTarget)) / Math.max(1, attendees));
  check(`forms: survey response rate ${(respRate * 100).toFixed(1)}% vs ${FF.response.rateTarget * 100}% ±${(respAllow * 100).toFixed(1)}`, Math.abs(respRate - FF.response.rateTarget) <= respAllow, `${surveyResponses.length} responses / ${attendees} attendees`);
  // NPS gate on NON-covid years (the covid dip is gated separately as regime expression)
  const covidDists = new Set(R.regimes.covid.years.map((y) => `post-conf-survey:${y}`));
  const respDist = new Map(fResponses.map((x) => [x.ResponseKey, x.DistributionKey]));
  const nps = fAnswers.filter((a) => a.QuestionKey === 'post-conf-survey:nps');
  const npsN = nps.filter((a) => !covidDists.has(respDist.get(a.ResponseKey)));
  const npsC = nps.filter((a) => covidDists.has(respDist.get(a.ResponseKey)));
  const mean = (xs) => xs.length ? xs.reduce((s2, a) => s2 + a.NumericValue, 0) / xs.length : 0;
  const npsAllow = FF.answers.nps.meanTolerance + 1.5 * (1.9 / Math.sqrt(Math.max(1, npsN.length)));
  check(`forms: mean NPS (non-covid) ${mean(npsN).toFixed(2)} vs ${FF.answers.nps.base} ±${npsAllow.toFixed(2)}`, Math.abs(mean(npsN) - FF.answers.nps.base) <= npsAllow, `${npsN.length} answers`);
  if (npsC.length >= 20) check(`regime: covid NPS dip expressed (${mean(npsC).toFixed(2)} < ${mean(npsN).toFixed(2)})`, mean(npsC) < mean(npsN), `${npsC.length} covid-year answers`);
  // membership application: the ANONYMOUS intake funnel (bizapps-forms' flagship feature)
  const appResp = fResponses.filter((x) => x.FormKey === 'membership-application');
  // two legitimate shapes now: anonymous public intake (session id, no member) and the named
  // application a member filled in on their way IN (member, no session id). Never both/neither.
  const anonApps = appResp.filter((x) => x.MemberNumber == null);
  const namedApps = appResp.filter((x) => x.MemberNumber != null);
  const badAnonShape = anonApps.filter((x) => !x.AnonymousSessionID).length + namedApps.filter((x) => x.AnonymousSessionID).length;
  check(`forms: applications are anonymous intake (${anonApps.length}) or named on the way in (${namedApps.length})`,
    anonApps.length > 0 && badAnonShape === 0, `${badAnonShape} malformed`);
  const appYears = FF.application.distribution.sinceYearsBeforeRelease;
  const [appLo, appHi] = [appYears * FF.application.volume.perYearMin, appYears * FF.application.volume.perYearMax];
  check(`forms: anonymous application volume ${anonApps.length} within [${appLo}, ${appHi}] (release-year partial ok)`, anonApps.length >= appLo * 0.5 && anonApps.length <= appHi, `${appYears}y window`);
  const fDistributions = load('forms', 'form_distributions');
  const badCount = fDistributions.filter((d) => d.ResponseCount !== fResponses.filter((x) => x.DistributionKey === d.DistributionKey).length).length;
  check('forms: distribution ResponseCount matches actual response rows', badCount === 0, `${fDistributions.length} distributions`);
  // their CHECK constraints are the law (caught live 2026-07-22: 'Open' isn't a legal Status)
  const badDistVals = fDistributions.filter((d) => !['Draft', 'Active', 'Closed'].includes(d.Status) || !['PublicLink', 'Embed', 'QR', 'Email'].includes(d.ChannelType)).length;
  check('forms: distribution Status/ChannelType within their CHECK constraints', badDistVals === 0, `${badDistVals} illegal`);
  // issues: severity/priority form a real triage matrix, not a wall of Medium
  const II = R.issues;
  const typeShare = new Map(II.types.map((t) => [t.name, issues.filter((x) => x.TypeKey === t.name).length / Math.max(1, issues.length)]));
  for (const level of ['Critical', 'High', 'Medium', 'Low']) {
    const want = II.types.reduce((s2, t) => s2 + (typeShare.get(t.name) ?? 0) * ((II.severity.byType[t.name].find(([l]) => l === level)?.[1]) ?? 0), 0);
    const got = issues.filter((x) => x.Severity === level).length / Math.max(1, issues.length);
    const allow = II.severity.tolerance + 3 * Math.sqrt(want * (1 - want) / Math.max(1, issues.length));
    check(`issues: severity ${level} ${(got * 100).toFixed(1)}% vs ${(want * 100).toFixed(1)}% ±${(allow * 100).toFixed(1)}`, Math.abs(got - want) <= allow, `${issues.length} issues`);
  }
  // PRESENCE FLOOR — the share gates above cannot see an empty bucket: a level whose expected
  // share is 0.5% passes its ±6pt band at exactly zero rows. That is how a support demo shipped
  // with no Critical ticket in it while every gate stayed green. Any severity the ruleset gives a
  // positive weight must actually appear.
  {
    const declared = ['Critical', 'High', 'Medium', 'Low']
      .filter((lvl) => II.types.some((t) => ((II.severity.byType[t.name] ?? []).find(([l]) => l === lvl)?.[1] ?? 0) > 0));
    const missing = declared.filter((lvl) => !issues.some((x) => x.Severity === lvl));
    check(`issues: every declared severity actually appears (${declared.length} levels)`, missing.length === 0,
      missing.length ? `never drawn: ${missing.join(', ')}` : declared.map((l) => `${l}=${issues.filter((x) => x.Severity === l).length}`).join(' '));
  }
  check('issues: severity and priority are decoupled (differ on some issues)', issues.some((x) => x.Severity !== x.Priority), `${issues.filter((x) => x.Severity !== x.Priority).length} differ`);
  // issues: assignment coverage rides the declared share; assignees are committee officers
  const assigned = issues.filter((x) => x.AssigneeMemberNumber);
  const aShare = assigned.length / Math.max(1, issues.length);
  const aAllow = II.assignment.tolerance + 1.5 * Math.sqrt(II.assignment.share * (1 - II.assignment.share) / Math.max(1, issues.length));
  check(`issues: ${(aShare * 100).toFixed(1)}% assigned vs ${II.assignment.share * 100}% ±${(aAllow * 100).toFixed(1)}`, Math.abs(aShare - II.assignment.share) <= aAllow, `${assigned.length}/${issues.length}`);
  const officerSet = new Set(cMemberships.filter((m) => ['Chair', 'Vice Chair'].includes(m.RoleKey)).map((m) => m.MemberNumber));
  check('issues: every assignee is a committee officer', assigned.every((x) => officerSet.has(x.AssigneeMemberNumber)), `${officerSet.size} officers`);
  // an assignee must already be a member when the ticket was worked (26 issues used to be
  // resolved before their assignee's JoinDate — current-term officers on 2015 tickets)
  const joinBy = new Map(people.map((p) => [p.MemberNumber, p.JoinDate]));
  const anachronistic = assigned.filter((x) => { const t = x.ResolvedAt ?? x.ClosedAt; return t && (joinBy.get(x.AssigneeMemberNumber) ?? '9999') > t.slice(0, 10); }).length;
  check('issues: no assignee predates their own join date', anachronistic === 0, `${anachronistic} anachronistic`);
  // resolution time is heavy-tailed with a same-day mass — not a uniform block.
  // The Issue table has no created column; the reported date is stated in the description.
  const reportedOn = (x) => x.Description?.match(/Reported (\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
  const resDays = issues.filter((x) => x.ResolvedAt && reportedOn(x)).map((x) => Math.round((new Date(x.ResolvedAt.slice(0, 10)) - new Date(reportedOn(x))) / 86400000)).filter((d) => d >= 0);
  const sameDayShare = resDays.filter((d) => d === 0).length / Math.max(1, resDays.length);
  const longTail = resDays.filter((d) => d > 45).length;
  check(`issues: resolution heavy-tailed (${(sameDayShare * 100).toFixed(0)}% same-day, ${longTail} over 45d, max ${Math.max(0, ...resDays)}d)`, sameDayShare >= 0.05 && longTail >= 1, 'not a uniform 3–21 block');
  // the board reads like a real queue: every type present, titles not one template
  const typeCounts = issues.reduce((a, x) => (a[x.TypeKey] = (a[x.TypeKey] ?? 0) + 1, a), {});
  const titleShare = Math.max(...Object.values(issues.reduce((a, x) => (a[x.Title.replace(/—.*$/, '').trim()] = (a[x.Title.replace(/—.*$/, '').trim()] ?? 0) + 1, a), {}))) / Math.max(1, issues.length);
  // every swimlane carries rows; the floor scales with N (Billing derives from the rare
  // overdue-order population, so a pilot-scale run legitimately has only one or two)
  const typeFloor = Math.max(1, Math.round(issues.length * 0.02));
  check(`issues: every type has volume, floor ${typeFloor} (${Object.entries(typeCounts).map(([k, v]) => k + ' ' + v).join(', ')})`, R.issues.types.every((t) => (typeCounts[t.name] ?? 0) >= typeFloor), 'no empty swimlane');
  check(`issues: no single title template dominates (${(titleShare * 100).toFixed(0)}% max)`, titleShare < 0.45, 'title variety');
  check('issues: descriptions present (the created date lives in the narrative)', issues.every((x) => x.Description && x.Description.length > 40), `${issues.filter((x) => x.Description).length}/${issues.length}`);
  // ---------- geography + name coherence ----------
  {
    const crowdP = people.filter((p) => !p._dup);
    const countries = new Set(crowdP.map((p) => p.Country).filter(Boolean));
    const cities = new Set(crowdP.map((p) => p.City));
    check(`geography: ${countries.size} countries, ${cities.size} cities represented`, countries.size >= 12 && cities.size >= 25, 'an international federation needs an international roster');
    // the subdivision code must name its own country, so no group-by can merge California
    // with Canada (both were plain 'CA' before)
    const badSub = crowdP.filter((p) => p.Country && p.State && !String(p.State).startsWith(`${p.Country}-`)).length;
    check('geography: subdivision codes are country-prefixed (no CA/California vs CA/Canada clash)', badSub === 0, `${badSub} ambiguous`);
    const euCountries = new Set(crowdP.filter((p) => p.Region === 'EU').map((p) => p.Country));
    check(`geography: Europe spans ${euCountries.size} countries`, euCountries.size >= 8, 'not just France/Denmark/Netherlands/Switzerland/UK');
    // NAMES match their country. Surnames are globally unambiguous per origin bucket, so
    // the expected origin is recoverable and checkable.
    const peopleBank = JSON.parse(readFileSync(join(ROOT, 'projects', 'morecheese', 'banks', 'people.json'), 'utf8'));
    const originOfSurname = new Map();
    for (const [b, v] of Object.entries(peopleBank.buckets)) for (const l of v.last) originOfSurname.set(l, b);
    const cityOrigin = new Map();
    for (const list of Object.values(CITIES)) for (const c of list) cityOrigin.set(c[0], c[7]);
    const misfits = [];
    for (const [origin, w] of Object.entries(peopleBank.countryWeights ?? {})) {
      const grp = crowdP.filter((p) => cityOrigin.get(p.City) === origin);
      if (grp.length < 30) continue;
      const dominant = Object.entries(w).sort((a, b) => b[1] - a[1])[0][0];
      const got = grp.filter((p) => originOfSurname.get(String(p.LastName).split('-')[0]) === dominant).length / grp.length;
      if (got < w[dominant] * 0.55) misfits.push(`${origin}: ${dominant} ${(got * 100).toFixed(0)}% vs declared ${(w[dominant] * 100).toFixed(0)}%`);
    }
    check('names: match the country they live in', misfits.length === 0, misfits.slice(0, 2).join('; ') || 'per-country weights express');
    // emails: accents transliterated, not deleted; domains cut on a word boundary
    const stripped = crowdP.filter((p) => /[^ -]/.test(`${p.FirstName}${p.LastName}`))
      .filter((p) => { const local = p.Email.split('@')[0]; return !/[a-z]/.test(local.replace(/[.\d]/g, '')) || /(?:strm|grber|rmille)/.test(local); }).length;
    check('emails: accented names transliterated (not silently deleted)', stripped === 0, `${stripped} mangled`);
  }

  // ---------- contact + voluntary self-ID demographics ----------
  // Blank rates are calibrated to associations that publish theirs (ASHA 2024/25, AIA 2024,
  // APA). The load-bearing gate is the LAST one: values must not predict outcomes.
  {
    const crowd = people.filter((p) => !p._dup);
    const share = (f) => crowd.filter(f).length / Math.max(1, crowd.length);
    const gBlank = share((p) => !p.Gender), dBlank = share((p) => !p.DateOfBirth), phBlank = share((p) => !p.Phone);
    check(`demographics: gender blank ${(gBlank * 100).toFixed(1)}% (published 8-11%, allow 5-15)`, gBlank >= 0.05 && gBlank <= 0.15, `${crowd.length} people`);
    check(`demographics: birthdate blank ${(dBlank * 100).toFixed(1)}% (published 5-21%, allow 5-25)`, dBlank >= 0.05 && dBlank <= 0.25, 'completeness varies by tenure');
    check(`contact: phone blank ${(phBlank * 100).toFixed(1)}% (allow 5-25)`, phBlank >= 0.05 && phBlank <= 0.25, `${crowd.filter((p) => p.Phone).length} with a phone`);
    // two distinct nulls: never-answered (blank) and an explicit refusal, which behave
    // differently in every published series
    const pns = crowd.filter((p) => p.Gender === 'Prefer not to say').length / Math.max(1, crowd.length);
    check(`demographics: explicit "Prefer not to say" present and small (${(pns * 100).toFixed(1)}%)`, pns > 0.005 && pns < 0.06, 'modelled separately from blank');
    // completeness rises with tenure (APA: Fellows 5.6% blank vs Associates 45.5%)
    const relIso = run.releaseDate;
    const yrs = (p) => (new Date(relIso) - new Date(p.JoinDate)) / (365.25 * 86400000);
    const newer = crowd.filter((p) => yrs(p) < 3), older = crowd.filter((p) => yrs(p) >= 8);
    if (newer.length > 30 && older.length > 30) {
      const bN = newer.filter((p) => !p.Gender).length / newer.length, bO = older.filter((p) => !p.Gender).length / older.length;
      check(`demographics: recent joiners less complete than long-tenured (${(bN * 100).toFixed(0)}% vs ${(bO * 100).toFixed(0)}% blank)`, bN > bO, 'the documented real pattern');
    }
    // DECORRELATION — the rule that keeps this data honest. Whether someone answered may
    // track tenure; WHAT they answered must not predict any outcome, or a demo "discovers"
    // a disparity we fabricated.
    const lastStatusOf = new Map();
    for (const [m, list] of periodsByMember) lastStatusOf.set(m, list[list.length - 1].Status);
    const popLapsed = crowd.filter((p) => hasEnded(lastStatusOf.get(p.MemberNumber))).length / Math.max(1, crowd.length);
    // engagement must be measured on something OBSERVABLE — the latent theta is stripped
    // from the shipped pack, so reading it here silently compares zeroes (this gate failed
    // its own negative test that way). Registrations per member is the visible proxy.
    const regCount = new Map();
    for (const x of regs) regCount.set(x.MemberNumber, (regCount.get(x.MemberNumber) ?? 0) + 1);
    const actOf = (p) => regCount.get(p.MemberNumber) ?? 0;
    const popAct = crowd.reduce((s, p) => s + actOf(p), 0) / Math.max(1, crowd.length);
    const actSd = Math.sqrt(crowd.reduce((s, p) => s + (actOf(p) - popAct) ** 2, 0) / Math.max(1, crowd.length));
    const skews = [];
    for (const g of ['Female', 'Male', 'Non-binary', 'Prefer not to say']) {
      const grp = crowd.filter((p) => p.Gender === g);
      // only assert where there is power to detect a real effect. A 65-person group on a
      // ~20% base rate has a ±10pt binomial swing of its own; asserting there reports noise
      // as a disparity (it false-redded the N=2500 build on "Prefer not to say").
      // 3·SE, not 2, because four groups are tested at once — the repo's standing
      // multiple-comparisons budget.
      if (grp.length < 120) continue;
      const lapsed = grp.filter((p) => hasEnded(lastStatusOf.get(p.MemberNumber))).length / grp.length;
      const seL = Math.sqrt(popLapsed * (1 - popLapsed) / grp.length);
      if (Math.abs(lapsed - popLapsed) > 0.03 + 3 * seL) skews.push(`${g} lapse ${(lapsed * 100).toFixed(0)}% vs ${(popLapsed * 100).toFixed(0)}%`);
      const act = grp.reduce((s, p) => s + actOf(p), 0) / grp.length;
      const seA = actSd / Math.sqrt(grp.length);
      if (Math.abs(act - popAct) > 2.5 * seA) skews.push(`${g} activity ${act.toFixed(2)} vs ${popAct.toFixed(2)}`);
    }
    check('demographics: values do NOT predict outcomes (no authored disparity)', skews.length === 0, skews.join('; ') || `lapse and activity flat across groups (pop ${(popLapsed * 100).toFixed(0)}% lapsed, ${popAct.toFixed(2)} regs)`);
    // race/ethnicity follows the same voluntary rules, and blanks run HIGHER than gender
    // in every published series (ASHA: race 17% vs gender 10%)
    const rBlank = share((p) => !p.RaceEthnicity);
    check(`demographics: race/ethnicity blank ${(rBlank * 100).toFixed(1)}% (published 15-17%, allow 10-26) and blanker than gender`, rBlank >= 0.10 && rBlank <= 0.26 && rBlank > gBlank, 'race is less complete than gender everywhere it is published');
    check('demographics: Hispanic origin asked as its own question', crowd.some((p) => p.EthnicityHispanic) && crowd.some((p) => p.RaceEthnicity && !p.EthnicityHispanic), 'separate instrument, separate blanks');
    // the same decorrelation rule applies to race — this is the one that matters most
    const raceSkews = [];
    for (const v of ['White', 'Asian', 'Black or African American', 'Prefer not to say']) {
      const grp = crowd.filter((p) => p.RaceEthnicity === v);
      if (grp.length < 120) continue;
      const lapsed = grp.filter((p) => hasEnded(lastStatusOf.get(p.MemberNumber))).length / grp.length;
      if (Math.abs(lapsed - popLapsed) > 0.03 + 3 * Math.sqrt(popLapsed * (1 - popLapsed) / grp.length)) raceSkews.push(`${v} lapse ${(lapsed * 100).toFixed(0)}%`);
      const act = grp.reduce((s, p) => s + actOf(p), 0) / grp.length;
      if (Math.abs(act - popAct) > 2.5 * (actSd / Math.sqrt(grp.length))) raceSkews.push(`${v} activity ${act.toFixed(2)}`);
    }
    check('demographics: race/ethnicity does NOT predict outcomes', raceSkews.length === 0, raceSkews.join('; ') || 'flat across groups');
    // addresses are country-shaped, not all US ZIPs
    const withAddr = crowd.filter((p) => p.AddressLine1);
    const postalShapes = new Set(withAddr.map((p) => String(p.PostalCode).replace(/[0-9]/g, '9').replace(/[A-Za-z]/g, 'A')));
    check(`addresses: ${withAddr.length} present, ${postalShapes.size} distinct postal formats`, postalShapes.size >= 6, 'a French code is not a US ZIP');
    const langs = new Set(crowd.map((p) => p.PrimaryLanguage));
    check(`demographics: ${langs.size} primary languages follow the country`, langs.size >= 6, 'not all English');
  }

  // issue comments: a readable activity feed, in order, with legal Source values
  {
    const comments = load('issues', 'issue_comments');
    const SRC = new Set(['inbound', 'outbound', 'internal']);
    check(`issues: ${comments.length} comments across ${new Set(comments.map((c) => c.IssueKey)).size} tickets`, comments.length > 0, 'every ticket used to have an empty activity feed');
    check('issues: comment Source values are legal (inbound/outbound/internal)', comments.every((c) => SRC.has(c.Source)), 'CHECK-constrained upstream');
    const byIssue = new Map();
    for (const c of comments) { if (!byIssue.has(c.IssueKey)) byIssue.set(c.IssueKey, []); byIssue.get(c.IssueKey).push(c); }
    let backwards = 0;
    for (const [, list] of byIssue) {
      const dates = list.sort((a, b) => a.Sequence - b.Sequence).map((c) => c.Body.slice(1, 11));
      for (let i = 1; i < dates.length; i++) if (dates[i] < dates[i - 1]) backwards++;
    }
    // the table has no author-settable timestamp, so the date is in the body — it still
    // has to read forward (the first version resolved a ticket before its own triage note)
    check('issues: comment threads read forward in time', backwards === 0, `${backwards} out of order`);
    const orphan = comments.filter((c) => !issues.some((i2) => i2.IssueKey === c.IssueKey)).length;
    check('issues: every comment belongs to a real ticket', orphan === 0, `${orphan} orphaned`);
  }

  // the relationship graph shows more than employment: every demo-owned type carries
  // edges, and referrals are causally sound (the referrer joined first)
  {
    const relTypes = load('common', 'relationship_types');
    const byType = relationships.reduce((a, x) => { const k = x.TypeKey ?? '(seeded)'; a[k] = (a[k] ?? 0) + 1; return a; }, {});
    const empty = relTypes.filter((t) => !(byType[t.TypeKey] > 0)).map((t) => t.TypeKey);
    check(`relationships: ${relTypes.length} demo types, all carrying edges (${Object.entries(byType).map(([k, v]) => k + ' ' + v).join(', ')})`, empty.length === 0, empty.join(', ') || 'no empty type');
    const joinOf2 = new Map(people.map((p) => [p.MemberNumber, p.JoinDate]));
    const badRef = relationships.filter((x) => x.TypeKey === 'Referred By')
      .filter((x) => (joinOf2.get(x.ToMemberNumber) ?? '9999') > (joinOf2.get(x.FromMemberNumber) ?? '')).length;
    check('relationships: every referrer joined before the member they referred', badRef === 0, `${badRef} impossible referrals`);
    // demo-owned types must never re-create bizapps-common's seeded ones (runbook F6:
    // app-seeded lookups collide BY NAME at install)
    const seededNames = Object.keys(R.relationships.seededTypeIDs ?? {});
    const collide = relTypes.filter((t) => seededNames.includes(t.TypeKey)).map((t) => t.TypeKey);
    check('relationships: no demo type collides with a bizapps-seeded type name (F6)', collide.length === 0, collide.join(', ') || `avoids ${seededNames.join('/')}`);
  }
  // credentials form a LADDER: nobody holds a credential whose prerequisite they lack,
  // and the catalogue is deep enough that a credentials page isn't three rows
  {
    const cat = load('learning', 'certifications');
    const declared = new Map(R.programs.certifications.catalog.map((c) => [c.key, c]));
    const heldBy = new Map();
    for (const mc of memberCerts) {
      if (!heldBy.has(mc.MemberNumber)) heldBy.set(mc.MemberNumber, new Set());
      heldBy.get(mc.MemberNumber).add(mc.CertKey);
    }
    const broken = [];
    for (const [m, set] of heldBy) {
      for (const k of set) {
        const pre = declared.get(k)?.prerequisite;
        if (pre && !set.has(pre)) broken.push(`${m}:${k} lacks ${pre}`);
      }
    }
    check(`certifications: ${cat.length} in the catalogue, every prerequisite satisfied`, cat.length >= 5 && broken.length === 0, broken.slice(0, 2).join('; ') || `${heldBy.size} holders`);
    check('certifications: catalogue rows carry a description', cat.every((c) => c.Description && c.Description.length > 30), `${cat.filter((c) => c.Description).length}/${cat.length}`);
  }
  // programs: pursuit + advocate shares land (over their real pools)
  const PRG = R.programs;
  const completerSet = new Set(load('learning', 'enrollments').filter((e) => e.Status === 'Completed').map((e) => e.MemberNumber));
  const crowdCompleters = [...completerSet].filter((m) => !R.heroes.some((h) => h.memberNumber === m)).length;
  const crowdCerts = memberCerts.filter((x) => !R.heroes.some((h) => h.memberNumber === x.MemberNumber)).length;
  const certShare = crowdCerts / Math.max(1, crowdCompleters);
  const certAllow = PRG.certifications.tolerance + 3 * Math.sqrt(PRG.certifications.pursuitShareOfCompleters * (1 - PRG.certifications.pursuitShareOfCompleters) / Math.max(1, crowdCompleters));
  check(`programs: cert pursuit ${(certShare * 100).toFixed(1)}% of completers vs ${PRG.certifications.pursuitShareOfCompleters * 100}% ±${(certAllow * 100).toFixed(1)}`, Math.abs(certShare - PRG.certifications.pursuitShareOfCompleters) <= certAllow, `${crowdCerts} certs / ${crowdCompleters} completers`);
  const advocates = new Set(advocacy.filter((x) => !R.heroes.some((h) => h.memberNumber === x.MemberNumber)).map((x) => x.MemberNumber)).size;
  const advShare = advocates / Math.max(1, people.length);
  const advAllow = PRG.advocacy.tolerance + 3 * Math.sqrt(PRG.advocacy.advocateShare * (1 - PRG.advocacy.advocateShare) / Math.max(1, people.length));
  check(`programs: advocates ${(advShare * 100).toFixed(1)}% vs ${PRG.advocacy.advocateShare * 100}% ±${(advAllow * 100).toFixed(1)}`, Math.abs(advShare - PRG.advocacy.advocateShare) <= advAllow, `${advocates} advocates`);

  // payment lifecycle: failure mix is part causal (low-phi), part noise — the ratio must express
  const PO2 = R.orders.paymentOutcomes;
  const latents2 = JSON.parse(readFileSync(join(OUT, 'validation-latents.json'), 'utf8'));
  const phiOf = new Map(latents2.map((x) => [x.m, x.phi]));
  const orderMember = new Map(orders.map((o) => [o.OrderKey, o.MemberNumber]));
  const cardPays = payments.filter((x) => x.Method === 'CreditCard');
  const failed = cardPays.filter((x) => x.Status === 'Failed' || x.Status === 'Denied');
  const isLow = (x) => (phiOf.get(orderMember.get(x.OrderKey)) ?? 0) < PO2.lowPhiCut;
  const lowN = cardPays.filter(isLow).length, lowF = failed.filter(isLow).length;
  const restN = cardPays.length - lowN, restF = failed.length - lowF;
  const rLow = lowF / Math.max(1, lowN), rRest = restF / Math.max(1, restN);
  check(`payments: card-failure causality expressed — low-φ ${(rLow * 100).toFixed(1)}% > rest ${(rRest * 100).toFixed(1)}% (noise floor)`, failed.length > 0 && rLow > rRest * 1.8, `${failed.length} failed/denied of ${cardPays.length} card payments`);
  const badInflight = payments.filter((x) => x.Status === 'InProgress' && x.PaymentDate < iso2(addDays2(parseDate2(run.releaseDate), -PO2.inProgressWindowDays))).length;
  check('payments: InProgress only inside the settlement window', badInflight === 0, `${payments.filter((x) => x.Status === 'InProgress').length} in-flight`);
  // relationships: every employed member has exactly one Employee edge; dissolved employers end it
  const employed = people.filter((p) => p.OrgKey).length;
  const empRels = relationships.filter((r2) => r2.RelKey.startsWith('emp:'));
  // Ended is legitimate for a dissolved employer OR a labeled stale-employer job switch (the emp-true: edge)
  const switched = new Set(relationships.filter((r2) => r2.RelKey.startsWith('emp-true:')).map((r2) => r2.FromMemberNumber));
  const endedOk = empRels.every((r2) => (r2.Status === 'Ended') === (orgByKeyG(r2.ToOrgKey)?.LifecycleEvent?.kind === 'Dissolved' || switched.has(r2.FromMemberNumber)));
  const employedProspects = prospects.filter((x) => x.OrgKey).length;
  check(`relationships: employment edges ${empRels.length} = ${employed} employed members + ${employedProspects} employed non-members, dissolution-consistent`,
    empRels.length === employed + employedProspects && endedOk, `${relationships.length} total relationships`);
  // motions: stored tallies match the vote rows; votes consistent with attendance (Absent ⇔ not Present)
  let tallyBad = 0;
  const votesByMotion = new Map();
  for (const v of cVotes) { if (!votesByMotion.has(v.MotionKey)) votesByMotion.set(v.MotionKey, []); votesByMotion.get(v.MotionKey).push(v); }
  const attStatus = new Map(cAttendance.map((a) => [`${a.MemberNumber}:${a.MeetingKey}`, a.AttendanceStatus]));
  let attBad = 0;
  for (const m of cMotions) {
    const vs = votesByMotion.get(m.MotionKey) ?? [];
    const yes = vs.filter((v) => v.VoteValue === 'Yes').length, no = vs.filter((v) => v.VoteValue === 'No').length;
    if (yes !== m.YesCount || no !== m.NoCount || m.Result !== (yes > no ? 'Passed' : 'Failed')) tallyBad++;
    for (const v of vs) {
      const st = attStatus.get(`${v.MembershipKey.split(':')[0]}:${m.MeetingKey}`);
      if ((v.VoteValue === 'Absent') !== (st !== 'Present')) attBad++;
    }
  }
  check('committees: motion tallies match votes; votes consistent with attendance', tallyBad + attBad === 0, `${cMotions.length} motions, ${cVotes.length} votes`);
  // upcoming meetings: each committee schedules ahead so the app's forward view is populated; future meetings carry no attendance
  const scheduled = cMeetings.filter((m) => m.Status === 'Scheduled');
  const wantUpcoming = CC.list.length * CC.meetings.upcomingPerCommittee;
  const futureNoAtt = scheduled.every((m) => !cAttendance.some((a) => a.MeetingKey === m.MeetingKey));
  check(`committees: upcoming Scheduled meetings = ${wantUpcoming} (each committee schedules ahead), no attendance yet`, scheduled.length === wantUpcoming && futureNoAtt, `${scheduled.length} scheduled`);
  // governance has HISTORY and CONTINUITY: terms reach back toward formation, and rosters
  // are not wiped clean every cycle (they used to carry ~4% over, against a real 50-70%)
  {
    const termYears = [...new Set(cTerms.map((t) => t.StartDate.slice(0, 4)))].sort();
    const earliestFormed = cCommittees.map((c) => c.FormationDate).sort()[0]?.slice(0, 4);
    check(`committees: history spans ${termYears.length} terms from ${termYears[0]} (earliest formed ${earliestFormed})`, termYears.length >= 4, 'governance must not start yesterday');
    const noTermBeforeFormed = cTerms.filter((t) => { const c = cCommittees.find((x) => x.CommitteeKey === t.CommitteeKey); return c && t.EndDate < c.FormationDate; }).length;
    check('committees: no term predates its committee formation', noTermBeforeFormed === 0, `${noTermBeforeFormed} bad`);
    // and no SEAT predates it either — the term guard alone left members serving on
    // committees that did not exist yet
    const seatBeforeFormed = cMemberships.filter((m) => { const c = cCommittees.find((x) => x.CommitteeKey === m.CommitteeKey); return c && m.EndDate < c.FormationDate; }).length;
    check('committees: no seat predates its committee formation', seatBeforeFormed === 0, `${seatBeforeFormed} bad`);
    const byTerm = new Map();
    for (const m of cMemberships) { const y = m.TermKey.split(':')[1]; if (!byTerm.has(y)) byTerm.set(y, new Set()); byTerm.get(y).add(m.MemberNumber); }
    const ys = [...byTerm.keys()].sort();
    let carried = 0, seats = 0;
    for (let i = 1; i < ys.length; i++) {
      const prev = byTerm.get(ys[i - 1]), cur = byTerm.get(ys[i]);
      carried += [...cur].filter((m) => prev.has(m)).length; seats += cur.size;
    }
    const rate = seats ? carried / seats : 0;
    if (seats > 40) check(`committees: roster continuity ${(rate * 100).toFixed(0)}% across terms (incumbents return)`, rate >= 0.2, 'rosters must not reset every cycle');
  }
  // tasks: every PendingRenewal member carries an outreach task
  const pendingMembers = [...lastStatus.entries()].filter(([, st]) => st === 'PendingRenewal').map(([m2]) => m2);
  const outreach = new Set(tTasks.filter((t) => t.TypeKey === 'Renewal Outreach').map((t) => t.TaskKey));
  const missingOutreach = pendingMembers.filter((m2) => !outreach.has(`otask:${m2}`)).length;
  check(`tasks: renewal-outreach task per PendingRenewal member (${pendingMembers.length})`, missingOutreach === 0, `${tTasks.length} tasks total`);
  // the board isn't one person's queue: no assignee may hold more than a third of it
  const perAssignee = tAssignments.reduce((a, x) => (a[x.AssigneeMemberNumber] = (a[x.AssigneeMemberNumber] ?? 0) + 1, a), {});
  const topShare = Math.max(0, ...Object.values(perAssignee)) / Math.max(1, tAssignments.length);
  check(`tasks: workload spread (top assignee holds ${(topShare * 100).toFixed(0)}%, ${Object.keys(perAssignee).length} assignees)`, topShare <= 0.34, 'no single-owner board');
  // task rows carry the fields a board renders: description, real completion states, hours
  const withDesc = tTasks.filter((t) => t.Description && t.Description.length > 30).length;
  check(`tasks: descriptions present (${withDesc}/${tTasks.length})`, withDesc === tTasks.length, 'a task board needs body text');
  const pctVals = new Set(tTasks.map((t) => t.PercentComplete ?? 0));
  check(`tasks: progress is granular (${pctVals.size} distinct PercentComplete values)`, pctVals.size >= 6, 'not just 0/25/50/100');
  const started = tTasks.filter((t) => t.StartedAt).length;
  const badOrder2 = tTasks.filter((t) => t.StartedAt && t.CompletedAt && t.StartedAt > t.CompletedAt).length;
  check(`tasks: StartedAt on worked tasks (${started}), never after completion`, started > 0 && badOrder2 === 0, `${badOrder2} inverted`);
  // creation isn't a single release-day batch
  const assignDays = new Set(tAssignments.map((a) => a.AssignedAt.slice(0, 10)));
  const topDay = Math.max(0, ...Object.values(tAssignments.reduce((a, x) => (a[x.AssignedAt.slice(0, 10)] = (a[x.AssignedAt.slice(0, 10)] ?? 0) + 1, a), {})));
  check(`tasks: assignment dates spread (${assignDays.size} distinct days, biggest ${topDay})`, topDay / Math.max(1, tAssignments.length) < 0.25, 'no release-day pile-up');
  // issues: numbering dense + unique
  const nums = new Set(issues.map((x) => x.IssueNumber));
  check(`issues: ${issues.length} tickets, numbering dense + unique`, nums.size === issues.length && issues.length > 0, `${[...nums].slice(0, 2)}…`);
}
const orgByKeyG = (k) => orgs.find((o) => o.OrgKey === k);

// ---------- heroes (§7.5): the pinned people load with their stories intact ----------
function checkHeroes() {
  const elena = people.find((p) => p.MemberNumber === 'ICF-000101');
  const elenaRegs = regs.filter((x) => x.MemberNumber === 'ICF-000101').length;
  const elenaYears = Math.max(1, Math.ceil((new Date(run.releaseDate) - new Date(elena.JoinDate)) / (365.25 * 86400000)));
  check('hero Elena: exists, Active, high activity', elena && ['Active', 'PendingRenewal'].includes(lastStatus.get('ICF-000101')) && elenaRegs / elenaYears >= R.heroes[0].pins.minRegistrationsPerYear, `status=${lastStatus.get('ICF-000101')}, ${elenaRegs} regs / ${elenaYears} yrs`);
  const marcus = lastPeriod.get('ICF-000102');
  const dTo = (new Date(`${marcus.EndDate}T00:00:00Z`) - new Date(`${run.releaseDate}T00:00:00Z`)) / 86400000;
  const [dLo, dHi] = R.heroes[1].pins.endDateWithinDaysOfRelease;
  check(`hero Marcus: PendingRenewal, EndDate release+${dTo}d ∈ [${dLo},${dHi}], autoRenew off`, marcus.Status === 'PendingRenewal' && dTo >= dLo && dTo <= dHi && marcus.AutoRenew === false, `status=${marcus.Status}`);

  // generic pin gates: EVERY hero loads with its declared pins intact (driven by heroes.json,
  // so a new persona gets its gates by declaration — no validator edit)
  const orgByKey = new Map(orgs.map((o) => [o.OrgKey, o]));
  for (const h of R.heroes) {
    const p = people.find((x) => x.MemberNumber === h.memberNumber);
    const per = lastPeriod.get(h.memberNumber);
    const st = lastStatus.get(h.memberNumber);
    const problems = [];
    if (!p) problems.push('missing');
    if (p && h.pins.status === 'Active' && !['Active', 'PendingRenewal'].includes(st)) problems.push(`status=${st}≠Active`);
    if (p && h.pins.status === 'Lapsed' && st !== 'Lapsed') problems.push(`status=${st}≠Lapsed`);
    if (p && h.pins.tier && per?.MembershipTier !== h.pins.tier) problems.push(`tier=${per?.MembershipTier}`);
    if (p && h.pins.cancellationReasonContains && !(per?.CancellationReason ?? '').includes(h.pins.cancellationReasonContains)) problems.push(`reason='${per?.CancellationReason}'`);
    if (p && (h.pins.employerDissolved || h.pins.employerAcquired)) {
      const ev = orgByKey.get(p.OrgKey)?.LifecycleEvent;
      const want = h.pins.employerDissolved ? ['Dissolved', h.pins.employerDissolved] : ['Acquired', h.pins.employerAcquired];
      if (ev?.kind !== want[0] || ev?.year !== want[1]) problems.push(`employerEvent=${JSON.stringify(ev)}`);
    }
    if (p && h.pins.joinedDaysBeforeRelease != null) {
      const dJoin = (new Date(`${run.releaseDate}T00:00:00Z`) - new Date(`${p.JoinDate}T00:00:00Z`)) / 86400000;
      if (Math.round(dJoin) !== h.pins.joinedDaysBeforeRelease) problems.push(`joined ${dJoin}d before release`);
    }
    if (p && h.employerName && orgByKey.get(p.OrgKey)?.Name !== h.employerName) problems.push(`employer=${orgByKey.get(p.OrgKey)?.Name}`);
    if (h.pins.certStatus) {
      // a persona can hold a LADDER of credentials, so the pin is about the one the
      // persona is defined by — the last declared — not merely "any cert they hold"
      const declared = h.certifications ?? (h.certification ? [h.certification] : []);
      const focusKey = h.pins.certKey ?? declared[declared.length - 1]?.key;
      const mc = memberCerts.find((x) => x.MemberNumber === h.memberNumber && (!focusKey || x.CertKey === focusKey));
      if (!mc || mc.Status !== h.pins.certStatus) problems.push(`cert ${focusKey ?? ''}=${mc?.Status}≠${h.pins.certStatus}`);
    }
    if (h.pins.competitionGold) {
      if (!compEntries.some((x) => x.MemberNumber === h.memberNumber && x.EntryYear === h.pins.competitionGold && x.Result === 'Gold')) problems.push(`no Gold ${h.pins.competitionGold}`);
    }
    if (h.pins.defect) {
      if (!dqLabels.some((l) => l.MemberNumber === h.memberNumber && l.DefectKind === h.pins.defect)) problems.push(`no ${h.pins.defect} label`);
    }
    // cross-app footprint: flagship heroes must be walkable through issues + forms
    if (h.pins.issueMin) {
      const n = issues.filter((x) => x.ReporterMemberNumber === h.memberNumber).length;
      if (n < h.pins.issueMin) problems.push(`issues ${n}<${h.pins.issueMin}`);
    }
    if (h.pins.formResponse) {
      if (!fResponses.some((x) => x.MemberNumber === h.memberNumber)) problems.push('no form response');
    }
    if (h.pins.advocacyMin) {
      const acts = advocacy.filter((x) => x.MemberNumber === h.memberNumber);
      if (acts.length < h.pins.advocacyMin) problems.push(`advocacy ${acts.length}<${h.pins.advocacyMin}`);
      if ((h.pins.testimonies ?? 0) > acts.filter((x) => x.Kind === 'Testimony').length) problems.push('testimonies missing');
    }
    for (const seat of h.committees ?? []) {
      for (const termName of seat.terms) {
        const t = R.committees.terms.find((x) => x.name === termName);
        const row = t && cMemberships.find((m) => m.MemberNumber === h.memberNumber && m.CommitteeKey === seat.committee && m.TermKey === `${seat.committee}:${t.start}`);
        if (!row) problems.push(`no ${seat.committee} seat (${termName})`);
        else if (row.RoleKey !== seat.role) problems.push(`${seat.committee} role=${row.RoleKey}≠${seat.role}`);
      }
    }
    check(`hero ${h.first} ${h.last} (${h.memberNumber}): pins hold`, problems.length === 0, problems.join('; ') || `status=${st}`);
  }
}

// ---------- status mix (loose at N=500) ----------
function checkStatusMix() {
  // pinned-lapse motif members are authored facts kept past the archive rule — a crowd
  // distribution gate must not count them (they'd bias the mix by construction)
  const pinnedLapse = new Set(JSON.parse(readFileSync(join(OUT, 'motifs.json'), 'utf8')).registry
    .filter((x) => x.LapseYear != null).map((x) => x.MemberNumber));
  // Same reasoning, generalised: ANY member kept past the archive rule is there because we
  // wanted the story, not because they represent current composition. A lapsed member whose
  // cancellation predates the 3-year cutoff is by definition one the rule would have removed
  // — heroes, stamped motifs, and the retained COVID cohort. This gate measures the
  // archive-ELIGIBLE population, so the era stays visible in the data without the pandemic
  // rewriting the federation's headline composition.
  const archiveCutoff = iso2(addDays2(new Date(run.releaseDate), -3 * 365 - 1));
  const keptPastArchive = new Set(periods
    .filter((x) => hasEnded(x.Status) && x.CancellationDate && x.CancellationDate < archiveCutoff)
    .map((x) => x.MemberNumber));
  const excluded = (m) => pinnedLapse.has(m) || keptPastArchive.has(m);
  const counts = { Active: 0, Lapsed: 0, Cancelled: 0, PendingRenewal: 0 };
  for (const [m, s] of lastStatus) { if (!excluded(m)) counts[s] = (counts[s] ?? 0) + 1; }
  // injected contact-duplicates (ICF-D*) are records, not members — they carry no periods
  const total = people.filter((p) => !p.MemberNumber.startsWith('ICF-D') && !excluded(p.MemberNumber)).length;
  const active = (counts.Active + counts.PendingRenewal) / total;
  const [tA] = R.statusMix.target;
  check(`status mix: active-ish ${(active * 100).toFixed(0)}% vs ~${(tA + 0.02) * 100}% ±${R.statusMix.tolerance * 100}`, Math.abs(active - (tA + 0.02)) <= R.statusMix.tolerance, JSON.stringify(counts));
}

// ---------- defects: every injected defect is labeled AND verifiable ----------
function checkDefects() {
  const D = R.defects;
  const byKind = (k) => dqLabels.filter((l) => l.DefectKind === k);
  const personBy = new Map(people.map((p) => [p.MemberNumber, p]));
  const orgByKey2 = new Map(orgs.map((o) => [o.OrgKey, o]));

  // declared counts: crowd injections + persona-declared exemplars
  const wantDup = D.duplicatePerson.count + R.heroes.filter((h) => h.pins?.duplicateOf).length;
  const wantStale = D.staleEmployer.count + R.heroes.filter((h) => h.staleEmployer).length;
  check(`defects: DuplicatePerson labels = ${wantDup}`, byKind('DuplicatePerson').length === wantDup, `${byKind('DuplicatePerson').length}`);
  check(`defects: StaleEmployer labels = ${wantStale}`, byKind('StaleEmployer').length === wantStale, `${byKind('StaleEmployer').length}`);
  check(`defects: TypoEmail labels = ${D.typoEmail.count}`, byKind('TypoEmail').length === D.typoEmail.count, `${byKind('TypoEmail').length}`);

  // every label points at real records and describes a defect that is actually present
  const problems = [];
  for (const l of dqLabels) {
    const p = personBy.get(l.MemberNumber);
    if (!p) { problems.push(`${l.LabelKey}: person missing`); continue; }
    if (l.DefectKind === 'DuplicatePerson') {
      if (!personBy.has(l.RelatedMemberNumber)) problems.push(`${l.LabelKey}: canonical missing`);
      if (l.MemberNumber.startsWith('ICF-D') && periodsByMember.has(l.MemberNumber)) problems.push(`${l.LabelKey}: shallow dup has history`);
    } else if (l.DefectKind === 'StaleEmployer') {
      const profileOrg = orgByKey2.get(p.OrgKey)?.Name;
      if (profileOrg !== l.DefectValue) problems.push(`${l.LabelKey}: profile=${profileOrg}≠${l.DefectValue}`);
      if (profileOrg === l.TruthValue) problems.push(`${l.LabelKey}: profile already correct`);
      const trueRel = relationships.find((x) => x.RelKey === `emp-true:${l.MemberNumber}`);
      if (!trueRel || trueRel.Status !== 'Active') problems.push(`${l.LabelKey}: no Active truth edge`);
      const oldRel = relationships.find((x) => x.RelKey === `emp:${l.MemberNumber}`);
      if (oldRel && oldRel.Status !== 'Ended') problems.push(`${l.LabelKey}: stale edge not Ended`);
    } else if (l.DefectKind === 'TypoEmail') {
      if (p.Email !== l.DefectValue) problems.push(`${l.LabelKey}: email=${p.Email}≠${l.DefectValue}`);
      if (p.Email === l.TruthValue) problems.push(`${l.LabelKey}: typo not applied`);
    }
  }
  check('defects: every label verifiable against the data', problems.length === 0, problems.slice(0, 3).join('; ') || `${dqLabels.length} labels`);
}

// ---------- secure messaging: threads derive from issues, message flow is coherent ----------
function checkMessaging() {
  const MM = R.messaging;
  // volume: declared share of issues + all hero issues (which always thread)
  const heroIssues = issues.filter((x) => x.IssueKey.startsWith('hero:'));
  const want = MM.threadSharePerIssue;
  const got = (smThreads.length - heroIssues.length) / Math.max(1, issues.length - heroIssues.length);
  const allow = MM.tolerance + 1.5 * Math.sqrt(want * (1 - want) / Math.max(1, issues.length));
  check(`messaging: ${(got * 100).toFixed(1)}% of crowd issues have a secure thread vs ${want * 100}% ±${(allow * 100).toFixed(1)}`, Math.abs(got - want) <= allow, `${smThreads.length} threads / ${issues.length} issues`);
  const heroMissing = heroIssues.filter((x) => !smThreads.some((t) => t.IssueKey === x.IssueKey));
  check('messaging: every hero-authored issue has a secure thread', heroMissing.length === 0, heroMissing.map((x) => x.IssueKey).join(', ') || `${heroIssues.length} hero issues`);
  // integrity: thread state mirrors its issue; message flow is coherent and inside history
  const issueByKey = new Map(issues.map((x) => [x.IssueKey, x]));
  const msgsByThread = new Map();
  for (const m of smMessages) { (msgsByThread.get(m.ThreadKey) ?? msgsByThread.set(m.ThreadKey, []).get(m.ThreadKey)).push(m); }
  const problems = [];
  for (const t of smThreads) {
    const iss = issueByKey.get(t.IssueKey);
    const ms = msgsByThread.get(t.ThreadKey) ?? [];
    const terminal = iss && (iss.StatusKey === 'Resolved' || iss.StatusKey === 'Closed');
    if (!iss) { problems.push(`${t.ThreadKey}: no issue`); continue; }
    if (terminal !== (t.Status !== 'Active')) problems.push(`${t.ThreadKey}: status ${t.Status} vs issue ${iss.StatusKey}`);
    if (!ms.length) { problems.push(`${t.ThreadKey}: no messages`); continue; }
    if (ms[0].Direction !== 'Inbound') problems.push(`${t.ThreadKey}: opener not inbound`);
    if (t.LastMessageAt !== ms[ms.length - 1].ReceivedAt) problems.push(`${t.ThreadKey}: LastMessageAt mismatch`);
    for (let i = 1; i < ms.length; i++) if (ms[i].ReceivedAt < ms[i - 1].ReceivedAt) problems.push(`${t.ThreadKey}: time order`);
    if (ms.some((m) => m.Direction === 'Outbound' && m.Status !== 'Sent')) problems.push(`${t.ThreadKey}: outbound status`);
    if (ms.some((m) => m.ReceivedAt > `${run.releaseDate}T23:59:59Z`)) problems.push(`${t.ThreadKey}: message after release`);
  }
  check('messaging: thread/message integrity (state mirrors issue, coherent flow, inside history)', problems.length === 0, problems.slice(0, 3).join('; ') || `${smMessages.length} messages in ${smThreads.length} threads`);
  // staff answer during the working week; members write whenever (the rhythm is the tell)
  const outbound = smMessages.filter((x) => x.Direction === 'Outbound');
  const offHours = outbound.filter((x) => { const d = new Date(x.ReceivedAt); return [0, 6].includes(d.getUTCDay()) || d.getUTCHours() < 8 || d.getUTCHours() > 18; }).length;
  check(`messaging: staff replies inside business hours (${offHours}/${outbound.length} off-hours)`, offHours <= Math.max(2, outbound.length * 0.03), 'no 3am Sunday replies from the desk');
  // the corpus must not visibly loop, and the wording must fit the ticket type
  const distinctContent = new Set(smMessages.map((x) => x.Content)).size;
  check(`messaging: message wording varies (${distinctContent} distinct of ${smMessages.length})`, distinctContent >= Math.min(30, smMessages.length * 0.3), 'type-aware banks, not 17 strings on a loop');
  const issueTypeOf = new Map(issues.map((x) => [x.IssueKey, x.TypeKey]));
  const misfit = smThreads.filter((t) => issueTypeOf.get(t.IssueKey) === 'Data Correction'
    && smMessages.some((x) => x.ThreadKey === t.ThreadKey && /invoice|refund|payment|balance|charge/i.test(x.Content))).length;
  check('messaging: wording matches the ticket type (no invoice talk on data-correction threads)', misfit === 0, `${misfit} mismatched threads`);
}

// ---------- motifs: every stamped archetype actually expresses ----------
// ---------- platform residue: __mj usage artifacts derive from real timelines ----------
function checkPlatform() {
  const PP = R.platform;
  const releaseMs = new Date(`${run.releaseDate}T23:59:59Z`).getTime();

  const domainBad = pUsers.filter((u) => !u.Email.endsWith(`@${PP.emailDomain}`)).length
    + (PP.emailDomain.endsWith('.example') ? 0 : 1);
  check('platform: staff emails on the reserved .example domain', domainBad === 0, pUsers.map((u) => u.Email).join(', '));

  // conversations: every token substituted, User speaks first, clock increases, inside history
  const convProblems = [];
  for (const c of pConvs) {
    const msgs = pConvDetails.filter((m) => m.ConvKey === c.ConvKey);
    if (msgs.length < 2) convProblems.push(`${c.ConvKey}: <2 turns`);
    if (msgs[0]?.Role !== 'User') convProblems.push(`${c.ConvKey}: first turn not User`);
    let prev = 0;
    for (const m of msgs) {
      if (/\{(N|HERO):/.test(m.Message)) convProblems.push(`${m.MsgKey}: unresolved token`);
      const t = new Date(m.CreatedAtTs).getTime();
      if (t <= prev) convProblems.push(`${m.MsgKey}: clock not increasing`);
      if (t > releaseMs) convProblems.push(`${m.MsgKey}: after release`);
      prev = t;
    }
  }
  check('platform: conversations coherent (tokens resolved, User-first, increasing clock, inside history)',
    convProblems.length === 0, convProblems.slice(0, 3).join('; ') || `${pConvDetails.length} turns in ${pConvs.length} conversations`);

  // TRANSCRIPT TRUTH: numbers a seeded Skip answer states must match the SHIPPED pack.
  // The transcript points the user at a query that would disprove it, so any drift here
  // is the most legible falsehood in the dataset (it quoted a pre-defects member count).
  const shippedPeople = people.length;
  const segCounts = people.reduce((a, p) => (a[p.Segment] = (a[p.Segment] ?? 0) + 1, a), {});
  const topSeg = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0] ?? ['—', 0];
  // anchor on the claim WORDING, not bare numbers — a transcript mentioning "2025" means
  // the year, not the roster size
  const claimProblems = [];
  for (const m of pConvDetails) {
    const roster = m.Message.match(/([\d,]+)\s+(?:member profiles|members\b)/i);
    if (roster) { const n = Number(roster[1].replace(/,/g, '')); if (n !== shippedPeople) claimProblems.push(`${m.MsgKey}: says ${n} members, pack ships ${shippedPeople}`); }
    const seg = m.Message.match(/segment is (\w[\w -]*?) with ([\d,]+)/i);
    if (seg) {
      const n = Number(seg[2].replace(/,/g, ''));
      if (seg[1].trim() !== topSeg[0] || n !== topSeg[1]) claimProblems.push(`${m.MsgKey}: says ${seg[1].trim()} ${n}, pack ships ${topSeg[0]} ${topSeg[1]}`);
    }
  }
  check(`platform: transcript counts are true against the shipped pack (${shippedPeople} people, top segment ${topSeg[0]} ${topSeg[1]})`,
    claimProblems.length === 0, claimProblems.slice(0, 2).join('; ') || 'no false claims');

  // every staff persona has residue: a demo LOGS IN as one of them, and an empty
  // Favourites tray and Lists node is the first thing they'd see
  {
    const favs = load('platform', 'user_favorites');
    const lists = load('platform', 'lists');
    const details = load('platform', 'list_details');
    const thin = pUsers.filter((u) => !favs.some((f) => f.UserKey === u.UserKey) || !lists.some((l) => l.UserKey === u.UserKey)
      || !pViews.some((v) => v.UserKey === u.UserKey));
    check(`platform: every staff persona has views, favourites and a list (${pUsers.length} personas)`, thin.length === 0, thin.map((u) => u.UserKey).join(', ') || 'no empty Explorer on login');
    const emptyLists = lists.filter((l) => !details.some((d) => d.ListKey === l.ListKey));
    check(`platform: no empty list (${lists.length} lists, ${details.length} items)`, emptyLists.length === 0, emptyLists.map((l) => l.Name).join(', ') || 'all populated');
  }

  // audit rows mirror pack timelines EXACTLY (derive-never-invent, and the counts must match)
  const issueByKey = new Map(issues.map((x) => [x.IssueKey, x]));
  const taskByKey = new Map(tTasks.map((x) => [x.TaskKey, x]));
  const periodByKey = new Map(periods.map((x) => [x.PeriodKey, x]));
  const personByKey = new Map(people.map((x) => [x.MemberNumber, x]));
  const relByKey = new Map(relationships.map((x) => [x.RelKey, x]));
  const rcProblems = [];
  for (const rc of pRecordChanges) {
    try { JSON.parse(rc.ChangesJSON); JSON.parse(rc.FullRecordJSON); } catch { rcProblems.push(`${rc.ChangeKey}: bad JSON`); }
    if (new Date(rc.ChangedAt).getTime() > releaseMs) rcProblems.push(`${rc.ChangeKey}: after release`);
    const expected = rc.ChangeKey.endsWith(':resolved') ? issueByKey.get(rc.RefKey)?.ResolvedAt
      : rc.ChangeKey.endsWith(':closed') ? issueByKey.get(rc.RefKey)?.ClosedAt
      : rc.RefKind === 'task' ? taskByKey.get(rc.RefKey)?.CompletedAt
      : rc.RefKind === 'period' ? `${periodByKey.get(rc.RefKey)?.StartDate}T09:00:00Z`
      : rc.RefKind === 'memberprofile' ? `${personByKey.get(rc.RefKey)?.JoinDate}T09:30:00Z`
      : rc.RefKind === 'rel' ? (rc.Type === 'Create' ? `${relByKey.get(rc.RefKey)?.StartDate}T11:05:00Z` : `${relByKey.get(rc.RefKey)?.EndDate}T11:00:00Z`)
      : undefined;
    // (rows whose source timestamp ran past release are clamped by the generator — skip equality there)
    if (expected && new Date(expected).getTime() <= releaseMs && rc.ChangedAt !== expected)
      rcProblems.push(`${rc.ChangeKey}: ChangedAt ${rc.ChangedAt} != source ${expected}`);
  }
  const heroNums = new Set(R.heroes.map((h) => h.memberNumber));
  const expCounts = {
    issue: issues.filter((x) => x.ResolvedAt).length + issues.filter((x) => x.ClosedAt).length,
    task: tTasks.filter((x) => x.CompletedAt).length,
    memberprofile: [...heroNums].filter((m) => personByKey.has(m)).length,
    period: periods.filter((x) => heroNums.has(x.MemberNumber)).length,
    rel: relationships.filter((x) => x.RelKey.startsWith('emp-true:')).reduce((n, nu) => {
      const member = nu.RelKey.slice('emp-true:'.length);
      const old = relationships.find((x) => x.RelKey.startsWith('emp:') && x.FromMemberNumber === member && x.Status === 'Ended' && x.EndDate === nu.StartDate);
      return n + 1 + (old ? 1 : 0);
    }, 0),
  };
  for (const [kind, exp] of Object.entries(expCounts)) {
    const got = pRecordChanges.filter((x) => x.RefKind === kind).length;
    if (got !== exp) rcProblems.push(`${kind}: ${got} audit rows vs ${exp} timeline facts`);
  }
  check('platform: audit backfill mirrors pack timelines (counts + timestamps + valid JSON)',
    rcProblems.length === 0, rcProblems.slice(0, 3).join('; ') || `${pRecordChanges.length} audit rows`);

  // shared views + reusable queries: known entities, non-empty predicates/SQL, and a real
  // column layout (GridState mirrors what the UI writes; a layoutless view renders blank)
  const gridOk = (v) => {
    try {
      const g = JSON.parse(v.GridState); JSON.parse(v.FilterState);
      return (g.columnSettings ?? []).filter((c) => !c.hidden).length >= 3;
    } catch { return false; }
  };
  const badView = pViews.filter((v) => !MJ_ENTITY_VAR[v.EntityName] || !v.WhereClause?.trim() || !gridOk(v)).length;
  const badQuery = pQueries.filter((q) => !q.SQL?.toUpperCase().includes('SELECT') || !q.Name).length;
  check('platform: shared views + queries well-formed (known entities, real SQL, column layout)', badView + badQuery === 0,
    `${pViews.length} views, ${pQueries.length} queries`);

  // the renewal-outreach list holds EXACTLY the pending-renewal members (derived, not invented)
  const pending = [...lastPeriod.values()].filter((per) => per.Status === 'PendingRenewal').length;
  const listRows = pListDetails.filter((d) => d.ListKey === 'renewal-outreach').length;
  check('platform: renewal-outreach list == pending-renewal members', listRows === pending, `${listRows} vs ${pending}`);

  const badNotif = pNotifs.filter((n) => (n.Unread ? n.ReadAt != null : n.ReadAt == null)).length;
  check('platform: notification read-state coherent', badNotif === 0, `${pNotifs.length} notifications`);
}

// ---------- sonar: scores re-derive from the packs, signal is honest ----------
function checkSonar() {
  // DEFINITIONS ONLY — Sonar's engine computes the scores, so the gate validates that the
  // model is well-formed and each factor is EXECUTABLE by the FactorCompiler (the "no data
  // source" class of failure). Score correctness / the Bob<Elena contrast is witnessed live
  // in Sonar after a recompute, not here.
  check('sonar: one Active WeightedSum model', snModels.length === 1 && snModels[0].Status === 'Active' && snModels[0].CombineStrategy === 'WeightedSum',
    `${snModels.length} model(s)`);

  const sorted = [...snBands].sort((a, b) => a.MinScore - b.MinScore);
  const contiguous = sorted.length >= 2 && sorted[0].MinScore === 0 && sorted[sorted.length - 1].MaxScore === 100
    && sorted.every((b, i) => i === 0 || sorted[i - 1].MaxScore === b.MinScore);
  check('sonar: bands tile 0..100 with no gaps', contiguous, sorted.map((b) => `${b.Label} ${b.MinScore}-${b.MaxScore}`).join(', '));

  // every factor is executable: Declarative + a supported aggregation + a linked source
  // related entity + an anchor; the related entity has an auto-resolve ('[]') or JSON path.
  const relByKey = new Map(snRelated.map((r) => [r.RelatedKey, r]));
  const AGG = new Set(['Count', 'Sum', 'Avg', 'Min', 'Max', 'DistinctCount', 'Exists', 'Recency', 'RatePerPeriod', 'TrendSlope']);
  const problems = [];
  for (const f of snFactors) {
    if (f.FactorType !== 'Declarative') problems.push(`${f.Slug}: FactorType ${f.FactorType}`);
    if (!AGG.has(f.Aggregation)) problems.push(`${f.Slug}: unsupported aggregation ${f.Aggregation}`);
    const rel = relByKey.get(f.SourceRelatedKey);
    if (!rel) { problems.push(`${f.Slug}: SourceRelatedKey unresolved (would be "no data source")`); continue; }
    try { const p = JSON.parse(rel.RelationshipPath); if (!Array.isArray(p)) problems.push(`${f.Slug}: RelationshipPath not a JSON array`); }
    catch { problems.push(`${f.Slug}: RelationshipPath not valid JSON ('${rel.RelationshipPath}')`); }
    if (['Sum', 'Avg', 'Min', 'Max', 'Recency'].includes(f.Aggregation) && !f.AggregateFieldName)
      problems.push(`${f.Slug}: ${f.Aggregation} needs AggregateFieldName`);
  }
  check('sonar: every factor is executable (Declarative, agg, linked related entity, JSON path)',
    problems.length === 0, problems.slice(0, 4).join('; ') || `${snFactors.length} factors`);

  // model-factors: one per factor, positive weight
  const mfFactorKeys = new Set(snModelFactors.map((x) => x.FactorKey));
  const allBound = snFactors.every((f) => mfFactorKeys.has(f.FactorKey)) && snModelFactors.every((mf) => mf.Weight > 0);
  // the published snapshot must reproduce the live config (it used to hardcode every
  // factor as Count, contradicting the Recency factor) and a model can't be effective
  // before the configuration that defines it was published
  {
    const ver = snVersions[0], mdl = snModels[0];
    const snap = JSON.parse(ver?.ConfigSnapshotJSON ?? '{}');
    const byslug = new Map((snap.factors ?? []).map((f) => [f.slug, f]));
    const mismatched = snFactors.filter((f) => byslug.get(f.Slug)?.aggregation !== f.Aggregation);
    check(`sonar: published snapshot reproduces the live factors (${(snap.factors ?? []).length})`, mismatched.length === 0, mismatched.map((f) => f.Slug).join(', ') || 'aggregations agree');
    check('sonar: model effective on/after its published version', !mdl?.EffectiveFrom || !ver?.PublishedAt || mdl.EffectiveFrom >= ver.PublishedAt, `${mdl?.EffectiveFrom} vs ${ver?.PublishedAt}`);
  }
  check('sonar: every factor bound into the model with a positive weight',allBound,
    `${snModelFactors.length} model-factors / ${snFactors.length} factors`);
}

function checkMotifs() {
  const { registry, meta } = JSON.parse(readFileSync(join(OUT, 'motifs.json'), 'utf8'));
  for (const [name, m] of Object.entries(meta)) {
    check(`motifs: ${name} stamped ${m.stamped} = min(declared ${m.declared}, pool ${m.pool})`, m.stamped === Math.min(m.declared, m.pool), JSON.stringify(m));
  }
  // employerCollapseLapse: the member really lapsed, at (or after) the stamped year
  const collapseBad = registry.filter((x) => x.Motif === 'employerCollapseLapse')
    .filter((x) => !hasEnded(lastStatus.get(x.MemberNumber)));
  check('motifs: employerCollapseLapse members all Lapsed', collapseBad.length === 0, collapseBad.map((x) => x.MemberNumber).join(', ') || 'all lapsed');
  // authored arcs express through behavior: activity (registrations + course enrollments)
  // late-in-arc vs early-in-arc — one signal alone is too thin at 6 members
  const regYears = new Map();
  const addYear = (m, y) => (regYears.get(m) ?? regYears.set(m, []).get(m)).push(y);
  for (const r2 of regs) addYear(r2.MemberNumber, +r2.RegisteredOn.slice(0, 4));
  for (const e2 of enrollments) addYear(e2.MemberNumber, +e2.EnrolledOn.slice(0, 4));
  const relYear = +run.releaseDate.slice(0, 4);
  const halves = (x) => {
    const ys = regYears.get(x.MemberNumber) ?? [];
    const mid = (x.StartYear + relYear) / 2;
    return { early: ys.filter((y) => y < mid).length, late: ys.filter((y) => y >= mid).length };
  };
  for (const [name, dir] of [['risingStar', 1], ['quietFade', -1]]) {
    const rows = registry.filter((x) => x.Motif === name);
    if (!rows.length) continue;
    let early = 0, late = 0;
    for (const x of rows) { const w = halves(x); early += w.early; late += w.late; }
    const ok = dir > 0 ? late > early : late < early;
    check(`motifs: ${name} arc expresses (${rows.length} members: first-half ${early} vs second-half ${late} activity)`, ok, `authored theta swing must show in activity`);
  }
}

// ---------- run all gates & report ----------
// FK-FIRST (feedback 2026-07-16): referential integrity is a PHASE, not a peer gate.
// If any pack-reference gate fails, causal/benchmark gates are meaningless (they'd
// measure a broken world) — report the referential failures alone and hard-fail.
checkPacks();
if (results.some((r) => !r.ok)) {
  for (const r of results) console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
  console.log('\n✋ FK-first: referential gates failed — causal gates not run');
  process.exit(1);
}
checkTemporal();
checkBenchmarks();
checkArrows();
checkTiers();
checkLearning();
checkMoney();
checkEngagementDynamics();
checkTrainability();
checkComposedApps();
checkHeroes();
checkStatusMix();
checkDefects();
checkMotifs();
checkMessaging();
checkPlatform();
checkSonar();

let failed = 0;
for (const r of results) {
  console.log(`${r.ok ? '✅' : '❌'} ${r.name}${r.detail ? `  — ${r.detail}` : ''}`);
  if (!r.ok) failed++;
}
console.log(`\n${results.length - failed}/${results.length} gates pass`);
process.exit(failed ? 1 : 0);
