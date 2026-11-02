#!/usr/bin/env node
/**
 * load-elections.mjs — replays data/elections/elections.plan.json into a database through bizapps-voting's engines.
 *
 * Voting encrypts every ballot's selections, hashes the roll and the ballot set, and refuses ballot-box writes outside
 * its own engines, so elections cannot go in as config JSON. This loader runs each election for real, now, and then
 * moves it to the plan's dates:
 *   1. creates it (contests, options, anchors) as the System user, then puts the plan's roll on it and freezes it;
 *      with nominations, opens them, nominates each candidate (as themself), approves them (each approval makes the
 *      candidate's ballot option), withdraws who the plan withdraws and closes nominations
 *      a standards ballot gets its document row (title, version, the ballot it recirculates) before it opens
 *   2. opens it and casts each ballot for its voter through CastEngine, entered by the certifier when not cast online,
 *      with any comment the plan gives on a standards item
 *   3. closes and tallies it, checks every contest's result against the plan, resolves each standards comment through
 *      CommentEngine (as the System user: resolving needs voting's administrator role) and records each writer's
 *      answer as that voter, and certifies it as the certifier,
 *      whose Person must be linked to an MJ User (scripts/load-spaces.mjs links everyone it seats); the loader gives
 *      each certifier voting's Election Inspector role first, so the role stays out of More Cheese's own config
 *   4. backdates it: every voting row and Record Changes row written while it loaded is mapped, in proportion and
 *      stretch by stretch, onto the plan's dates: setting up (and nominations) onto the time before it opens, voting
 *      onto its window, and closing, tallying and certifying onto the time after it closes; then each nomination's,
 *      each ballot's and each comment resolution's time is set to the plan's, and each resolution is credited to the
 *      certifier, the committee chair who resolved it. Nothing voting verifies covers a timestamp (roll hash: person, class, weight;
 *      ballot-set hash: ballot id, style hash, receipt), so the certified results and receipts still check out.
 * An election whose name is already in the database is left alone if it is Certified, and reported otherwise.
 *
 * Before running: load the spaces (scripts/load-spaces.mjs) so voters' People are linked to their Users, and load
 * @mj-biz-apps/voting-server through dynamicPackages.server in the MJ host's mj.config.cjs. Restart MJAPI afterwards:
 * it caches what it read before the backdating.
 *
 *   node scripts/load-elections.mjs --mj ../MJ                 # DB_* from the environment, as for mj sync push
 *   node scripts/load-elections.mjs --mj ../MJ --dry-run       # connect and check, write nothing
 *   node scripts/load-elections.mjs --mj ../MJ --only motion-  # only elections whose key starts with this
 *
 * Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const ENTITY = {
    elections: 'MJ_BizApps_Voting: Elections',
    voters: 'MJ_BizApps_Voting: Eligible Voters',
    contestResults: 'MJ_BizApps_Voting: Contest Results',
    nominations: 'MJ_BizApps_Voting: Nominations',
    standards: 'MJ_BizApps_Voting: Standards Ballot Elections',
    options: 'MJ_BizApps_Voting: Contest Options',
    optionResults: 'MJ_BizApps_Voting: Contest Option Results',
    people: 'MJ_BizApps_Common: People',
    roles: 'MJ: Roles',
    userRoles: 'MJ: User Roles',
};
/** Certifying needs read on results and write on certifications: voting's own inspector role. */
const CERTIFIER_ROLE = 'Election Inspector';
const VOTING_SCHEMA = '__mj_BizAppsVoting';
const VOTING_ENTITY_PREFIX = 'MJ_BizApps_Voting: ';
/** Every voting table and the time columns it keeps beyond __mj_CreatedAt/__mj_UpdatedAt. */
const TIME_COLUMNS = {
    Election: ['RollFrozenAt'],
    ElectionAnchor: [], Contest: [], ContestOption: [], EligibleVoter: [], BallotAttribution: [], ContestOptionResult: [],
    Participation: ['CastAt'],
    ContestResult: ['ComputedAt'],
    ElectionCertification: ['CertifiedAt'],
    ElectionCertifier: ['SignedAt'],
    ElectionAuditEvent: ['OccurredAt'],
    ResultSnapshot: ['SnapshotAt'],
    Nomination: ['SubmittedAt', 'DecidedAt'],
    BallotComment: [],
    CommentResolution: ['ResolvedAt'],
    StandardsBallotElection: [],
};

function args(argv) {
    const out = { plan: 'data/elections/elections.plan.json', mj: process.env.MJ_DIR ?? null, dryRun: false, only: null };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--mj') out.mj = argv[++i];
        else if (argv[i] === '--plan') out.plan = argv[++i];
        else if (argv[i] === '--dry-run') out.dryRun = true;
        else if (argv[i] === '--only') out.only = argv[++i];
        else throw new Error(`unknown argument ${argv[i]}`);
    }
    if (!out.mj) throw new Error('--mj <path to the MJ repo or host that has mj.config.cjs> is required (or set MJ_DIR)');
    out.mj = path.resolve(out.mj);
    return out;
}

const q = (s) => String(s).replace(/'/g, "''");
const sameId = (a, b) => String(a ?? '').toUpperCase() === String(b ?? '').toUpperCase();
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
const minutes = (iso, n) => new Date(Date.parse(iso) + n * 60000).toISOString();
/** A plan comment as CastEngine takes it. */
const wireComment = (c) => ({ CommentType: c.type, DocumentReference: c.reference, Comment: c.comment, ProposedChange: c.proposedChange ?? undefined });

/** Imports a package the way the MJ host resolves it, so the loader shares the host's singletons. */
function importer(fromDir) {
    const req = createRequire(path.join(fromDir, 'package.json'));
    return (name) => import(pathToFileURL(req.resolve(name)).href);
}

async function bootstrap(mjDir) {
    const configFile = path.join(mjDir, 'mj.config.cjs');
    if (!fs.existsSync(configFile)) throw new Error(`no mj.config.cjs in ${mjDir}`);
    const fromCli = importer(path.join(mjDir, 'packages', 'MJCLI'));
    const fromSync = importer(path.join(mjDir, 'packages', 'MetadataSync'));
    await fromCli('@memberjunction/server-bootstrap-lite/mj-class-registrations');
    const { LoadDynamicPackages, CliProcessId } = await fromCli('@memberjunction/dynamic-packages');
    const config = createRequire(configFile)(configFile);
    const report = await LoadDynamicPackages({
        processId: CliProcessId('elections:load'),
        tier: 'server',
        config,
        configFilePath: configFile,
        log: { info: () => {}, verbose: () => {}, warn: (m, e) => console.error(m, e instanceof Error ? e.message : e ?? '') },
    });
    const core = await fromSync('@memberjunction/core');
    const global = await fromSync('@memberjunction/global');
    if (!global.MJGlobal.Instance.ClassFactory.GetRegistration(core.BaseEntity, ENTITY.elections)) {
        throw new Error(`no server class is registered for ${ENTITY.elections}: add @mj-biz-apps/voting-server to dynamicPackages.server ` +
            `in ${configFile} (loaded ${report.Loaded.length}, failed ${report.Failed.length})`);
    }

    const sql = (await fromSync('mssql')).default;
    const pool = new sql.ConnectionPool({
        server: process.env.DB_HOST,
        port: Number(process.env.DB_PORT ?? 1433),
        database: process.env.DB_DATABASE,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        requestTimeout: 120000,
        options: { encrypt: false, trustServerCertificate: /^(y|true)$/i.test(process.env.DB_TRUST_SERVER_CERTIFICATE ?? ''), enableArithAbort: true },
    });
    await pool.connect();
    const { SQLServerProviderConfigData, setupSQLServerClient } = await fromSync('@memberjunction/sqlserver-dataprovider');
    await setupSQLServerClient(new SQLServerProviderConfigData(pool, config.mjCoreSchema ?? '__mj'), { mode: 'task' });
    const { UserCache } = await fromSync('@memberjunction/generic-database-provider');
    // The engines must be the very build the host loaded, or their singletons and registrations are a second copy.
    const voting = await importer(mjDir)('@mj-biz-apps/voting-server');
    return { core, pool, UserCache, voting };
}

const unwrap = (result, what) => {
    if (!result.Success) throw new Error(`${what}: ${result.Code} — ${result.ErrorMessage}`);
    return result.Value;
};

export async function load(opts) {
    const plan = JSON.parse(fs.readFileSync(opts.plan, 'utf8'));
    const elections = plan.elections.filter((e) => !opts.only || e.key.startsWith(opts.only));
    const unwritten = elections.flatMap((e) => e.ballots.flatMap((b) => b.contests.filter((c) => c.comment && !(c.comment.comment && c.comment.resolution.response))));
    if (unwritten.length) throw new Error(`${unwritten.length} standards comments have no wording: run scripts/build-election-comments-gemini.mjs, then the plan builder`);
    const { core, pool, UserCache, voting } = await bootstrap(opts.mj);
    const system = UserCache.Instance.GetSystemUser?.() ?? UserCache.Instance.UserByName('System', false);
    const provider = core.Metadata.Provider;
    const systemCtx = { ContextUser: system, Provider: provider };
    const run = async (entity, filter, fields, user = system) => {
        // A roll runs past RunView's default row cap.
        const r = await new core.RunView().RunView({ EntityName: entity, ExtraFilter: filter, Fields: fields, ResultType: 'simple', MaxRows: 1000000 }, user);
        if (!r.Success) throw new Error(`${entity}: ${r.ErrorMessage}`);
        return r.Results;
    };
    const dbNow = async () => (await pool.request().query('SELECT SYSDATETIMEOFFSET() AS t')).recordset[0].t;

    // Certifiers (who also enter paper and in-person ballots) act as their MJ User, found through their Person's link.
    const people = [...new Set(elections.map((e) => e.certifier))];
    const userOfPerson = new Map();
    for (let i = 0; i < people.length; i += 500) {
        const rows = await run(ENTITY.people, `ID IN (${people.slice(i, i + 500).map((p) => `'${p}'`).join(',')}) AND LinkedUserID IS NOT NULL`, ['ID', 'LinkedUserID']);
        for (const r of rows) userOfPerson.set(r.ID.toUpperCase(), UserCache.Instance.Users.find((u) => sameId(u.ID, r.LinkedUserID)));
    }
    const certifiers = new Set(elections.map((e) => e.certifier));
    const unlinked = [...certifiers].filter((p) => !userOfPerson.get(p));
    if (unlinked.length) throw new Error(`${unlinked.length} certifiers have no linked MJ User (run scripts/load-spaces.mjs first), e.g. ${unlinked.slice(0, 3).join(', ')}`);
    const [inspector] = await run(ENTITY.roles, `Name = '${q(CERTIFIER_ROLE)}'`, ['ID']);
    if (!inspector) throw new Error(`the ${CERTIFIER_ROLE} role is missing: push bizapps-voting's metadata first`);
    let granted = 0;
    for (const u of new Set([...certifiers].map((p) => userOfPerson.get(p)))) {
        if (u.UserRoles.some((r) => sameId(r.RoleID, inspector.ID)) || opts.dryRun) continue;
        const rec = await new core.Metadata().GetEntityObject(ENTITY.userRoles, system);
        rec.NewRecord();
        rec.UserID = u.ID;
        rec.RoleID = inspector.ID;
        if (!(await rec.Save())) throw new Error(`grant ${CERTIFIER_ROLE} to ${u.Email}: ${rec.LatestResult?.CompleteMessage ?? 'save failed'}`);
        granted++;
    }
    if (granted) {
        await UserCache.Instance.RefreshNow();
        for (const [p, u] of userOfPerson) userOfPerson.set(p, UserCache.Instance.Users.find((x) => sameId(x.ID, u.ID)));
        log(`${CERTIFIER_ROLE} granted to ${granted} certifiers`);
    }

    /**
     * Nominations: the window opens now for an hour, each nominee nominates themself (as the voter they are on the
     * roll, the way a ballot-page nomination arrives), every nomination is approved (which makes the candidate's ballot
     * option), withdrawals are marked, and nominations close. Returns when nominations opened and closed, for the
     * backdating.
     */
    const nominate = async (e, electionId) => {
        const election = await new core.Metadata().GetEntityObject(ENTITY.elections, system);
        if (!(await election.Load(electionId))) throw new Error(`${e.key}: cannot load the election`);
        election.NominationsOpenAt = new Date(Date.now() - 60000);
        election.NominationsCloseAt = new Date(Date.now() + 3600000);
        if (!(await election.Save())) throw new Error(`${e.key}: nomination window: ${election.LatestResult?.CompleteMessage}`);
        unwrap(await voting.ElectionAdministrationEngine.Instance.OpenNominations(electionId, systemCtx), `open nominations ${e.key}`);
        const nominationsOpened = await dbNow();
        const graph = unwrap(await voting.LoadElectionGraph(electionId, systemCtx), `graph of ${e.key}`);
        const office = graph.Contests.find((c) => c.Kind === 'Office');
        const voterOf = new Map((await run(ENTITY.voters, `ElectionID = '${electionId}'`, ['ID', 'PersonID'])).map((v) => [v.PersonID.toUpperCase(), v.ID]));
        for (const n of e.nominations.entries) {
            if (!voterOf.has(n.person)) throw new Error(`${e.key}: nominee ${n.person} is not on the roll`);
            const self = { ElectionID: electionId, EligibleVoterID: voterOf.get(n.person), Via: 'MJSession', CredentialMethodCode: 'mj-session' };
            const { NominationID } = unwrap(await voting.NominationEngine.Instance.SubmitNomination(
                { ContestID: office.ID, NomineePersonID: n.person, Statement: n.statement ?? undefined }, self, systemCtx), `nominate ${n.person} in ${e.key}`);
            const { ContestOptionID } = unwrap(await voting.NominationEngine.Instance.DecideNomination({ NominationID, Decision: 'Approved' }, systemCtx), `approve ${n.person} in ${e.key}`);
            if (!n.withdrawn) continue;
            for (const [entity, id] of [[ENTITY.nominations, NominationID], [ENTITY.options, ContestOptionID]]) {
                const rec = await new core.Metadata().GetEntityObject(entity, system);
                if (!(await rec.Load(id))) throw new Error(`${e.key}: cannot load ${entity} ${id}`);
                rec.Status = 'Withdrawn';
                if (!(await rec.Save())) throw new Error(`${e.key}: withdraw ${n.person}: ${rec.LatestResult?.CompleteMessage}`);
            }
        }
        unwrap(await voting.ElectionAdministrationEngine.Instance.CloseNominations(electionId, systemCtx), `close nominations ${e.key}`);
        return { nominationsOpened, nominationsClosed: await dbNow() };
    };

    /** A standards ballot's document row; a recirculation names the certified ballot it follows. */
    const describe = async (e, electionId) => {
        const election = await new core.Metadata().GetEntityObject(ENTITY.elections, system);
        if (!(await election.Load(electionId))) throw new Error(`${e.key}: cannot load the election`);
        const child = await election.EnsureISAChild(ENTITY.standards);
        if (!child) throw new Error(`${e.key}: no ${ENTITY.standards} row could be made`);
        child.DocumentTitle = e.standards.documentTitle;
        child.DocumentVersion = e.standards.documentVersion;
        child.RecirculationRound = e.standards.round;
        if (e.standards.prior) {
            const prior = existing.get(e.standards.prior);
            if (prior?.Status !== 'Certified') throw new Error(`${e.key}: it recirculates "${e.standards.prior}", which is not loaded and certified`);
            child.PriorElectionID = prior.ID;
        }
        if (!(await child.Save())) throw new Error(`${e.key}: standards details: ${child.LatestResult?.CompleteMessage}`);
    };

    /**
     * The Standards Committee's resolution of each comment, and its writer's answer. Returns, per comment, what the
     * backdating pins: when it was resolved and answered.
     */
    const resolve = async (e, electionId, contests, voterOf) => {
        const rows = (await pool.request().input('election', electionId).query(
            `SELECT bc.ID, bc.ContestID, v.PersonID FROM [${VOTING_SCHEMA}].[BallotComment] bc JOIN [${VOTING_SCHEMA}].[Participation] p ON p.ID = bc.ParticipationID ` +
            `JOIN [${VOTING_SCHEMA}].[EligibleVoter] v ON v.ID = p.EligibleVoterID WHERE p.ElectionID = @election`)).recordset;
        const idOf = new Map(rows.map((r) => [`${r.PersonID.toUpperCase()}:${contests.findIndex((c) => sameId(c.ID, r.ContestID))}`, r.ID]));
        const done = [];
        for (const b of e.ballots) {
            for (const [i, s] of b.contests.entries()) {
                if (!s.comment) continue;
                const id = idOf.get(`${b.person}:${i}`);
                if (!id) throw new Error(`${e.key}: ${b.person}'s comment on item ${i + 1} was not written`);
                const r = s.comment.resolution;
                unwrap(await voting.CommentEngine.Instance.ResolveComment({ BallotCommentID: id, Disposition: r.disposition, Response: r.response }, systemCtx), `resolve ${s.comment.key}`);
                if (r.commenter) {
                    const self = { ElectionID: electionId, EligibleVoterID: voterOf.get(b.person).ID, Via: 'MJSession', CredentialMethodCode: 'mj-session' };
                    unwrap(await voting.CommentEngine.Instance.RecordCommenterResponse(id, r.commenter, self, systemCtx), `answer ${s.comment.key}`);
                }
                done.push({ id, resolvedAt: r.at, answeredAt: r.answeredAt ?? r.at });
            }
        }
        return done;
    };

    const existing = new Map((await run(ENTITY.elections, '', ['ID', 'Name', 'Status'])).map((r) => [r.Name, r]));
    const counts = { loaded: 0, skipped: 0, ballots: 0 };
    const problems = [];
    for (const e of elections) {
        const found = existing.get(e.name);
        if (found) {
            if (found.Status === 'Certified') counts.skipped++;
            else problems.push(`${e.key}: already in the database as ${found.Status}; delete it to reload`);
            continue;
        }
        if (opts.dryRun) { counts.loaded++; counts.ballots += e.ballots.length; continue; }
        const certifier = userOfPerson.get(e.certifier);
        const started = await dbNow();

        const electionId = unwrap(await voting.ElectionAdministrationEngine.Instance.CreateElection({
            ElectionTypeCode: e.type,
            Name: e.name,
            Description: e.description,
            Anchors: e.anchors.map((a) => ({ EntityName: a.entity, RecordID: a.recordId, Role: a.role, IsPrimary: a.isPrimary })),
            // The roll is the plan's, added below: the source itself contributes nobody.
            EligibilitySource: { Code: 'entity-query', Settings: { EntityName: ENTITY.people, PersonIDField: 'ID', ExtraFilter: '1=0' } },
            Contests: e.contests.map((c) => ({
                Name: c.name, Kind: c.kind, TallyMethodCode: c.tally, Threshold: c.threshold, ThresholdBasis: c.basis,
                AllowAbstain: c.allowAbstain, Seats: c.seats, Options: c.options?.map((o) => ({ Label: o.label, CandidatePersonID: o.person })),
            })),
            SecrecyMode: e.secrecy,
            ResultsTiming: e.resultsTiming,
            ResultsAudience: e.resultsAudience,
        }, systemCtx), `create ${e.key}`).ElectionID;
        unwrap(await voting.VoterRollEngine.Instance.AmendRoll({ ElectionID: electionId, Add: e.roll.map((r) => ({ PersonID: r.person, VotingClass: r.class, Weight: r.weight })) }, systemCtx), `roll of ${e.key}`);
        const marks = { started };
        if (e.standards) await describe(e, electionId);
        if (e.nominations) Object.assign(marks, await nominate(e, electionId));
        else unwrap(await voting.VoterRollEngine.Instance.FreezeRoll(electionId, systemCtx), `freeze ${e.key}`);
        unwrap(await voting.ElectionAdministrationEngine.Instance.OpenElection(electionId, systemCtx), `open ${e.key}`);
        marks.opened = await dbNow();

        const graph = unwrap(await voting.LoadElectionGraph(electionId, systemCtx), `graph of ${e.key}`);
        const contests = [...graph.Contests].sort((a, b) => a.Sequence - b.Sequence);
        const voterOf = new Map((await run(ENTITY.voters, `ElectionID = '${electionId}'`, ['ID', 'PersonID', 'VotingClass'])).map((v) => [v.PersonID.toUpperCase(), v]));
        const styles = new Map();
        for (const b of e.ballots) {
            const voter = voterOf.get(b.person);
            if (!voter) throw new Error(`${e.key}: ${b.person} casts a ballot but is not on the roll`);
            const cls = voter.VotingClass ?? null;
            if (!styles.has(cls)) styles.set(cls, (await voting.BallotStyleBuilder.Instance.Build(graph, cls, 'en', systemCtx)).Hash);
            const submission = {
                Contests: b.contests.map((s, i) => {
                    const contest = contests[i];
                    if (s.abstain) return { ContestID: contest.ID, Abstain: true, Selections: [] };
                    const options = [...graph.OptionsByContestID].find(([id]) => sameId(id, contest.ID))?.[1] ?? [];
                    // An option by its label, or a candidate by their Person.
                    const pick = (choice) => {
                        const o = options.find((x) => (choice.person ? sameId(x.CandidatePersonID, choice.person) : x.Label === choice));
                        if (!o) throw new Error(`${e.key}: contest "${contest.Name}" has no option for ${choice.person ?? choice}`);
                        return o.ID;
                    };
                    const ranked = s.ranks ?? [s.option];
                    return { ContestID: contest.ID, Selections: ranked.map((label, r) => ({ OptionID: pick(label), ...(s.ranks ? { Rank: r + 1 } : {}) })), ...(s.comment ? { Comments: [wireComment(s.comment)] } : {}) };
                }),
            };
            unwrap(await voting.CastEngine.Instance.Cast({
                ElectionID: electionId,
                EligibleVoterID: voter.ID,
                BallotStyleHash: styles.get(cls),
                Submission: submission,
                Channel: b.channel,
                ...(b.channel === 'Online' ? {} : { EnteredByUserID: certifier.ID }),
            }, systemCtx), `cast ${e.key} for ${b.person}`);
            counts.ballots++;
        }

        marks.closing = await dbNow();
        unwrap(await voting.ElectionAdministrationEngine.Instance.CloseElection(electionId, systemCtx), `close ${e.key}`);
        unwrap(await voting.TallyEngine.Instance.Tally(electionId, undefined, systemCtx), `tally ${e.key}`);
        if (e.talliedAt) marks.tallied = await dbNow();
        const results = await run(ENTITY.contestResults, `ContestID IN (${contests.map((c) => `'${c.ID}'`).join(',')}) AND IsFinal = 1`, ['ID', 'ContestID', 'Outcome']);
        const optionResults = results.length ? await run(ENTITY.optionResults, `ContestResultID IN (${results.map((r) => `'${r.ID}'`).join(',')})`, ['ContestResultID', 'ContestOptionID', 'Outcome']) : [];
        e.expect.forEach((x, i) => {
            const r = results.find((y) => sameId(y.ContestID, contests[i].ID));
            if (x.result && r?.Outcome !== x.result) problems.push(`${e.key}: contest ${i + 1} came out ${r?.Outcome ?? 'with no result'}, the plan says ${x.result}`);
            if (x.elected) {
                const options = [...graph.OptionsByContestID].find(([id]) => sameId(id, contests[i].ID))?.[1] ?? [];
                const elected = optionResults.filter((o) => r && sameId(o.ContestResultID, r.ID) && o.Outcome === 'Elected')
                    .map((o) => options.find((x) => sameId(x.ID, o.ContestOptionID))?.CandidatePersonID?.toUpperCase()).sort();
                if (elected.join() !== [...x.elected].sort().join()) problems.push(`${e.key}: contest ${i + 1} elected ${elected.join(', ') || 'nobody'}, the plan says ${x.elected.join(', ')}`);
            }
        });
        const resolutions = e.standards ? await resolve(e, electionId, contests, voterOf) : [];
        unwrap(await voting.CertificationEngine.Instance.Certify(electionId, e.certifyNotes, { ContextUser: certifier, Provider: provider }), `certify ${e.key}`);
        marks.certified = await dbNow();
        // MJ writes Record Changes after the commit; give them a moment so they fall inside the window.
        await new Promise((r) => setTimeout(r, 500));
        marks.finished = await dbNow();

        await backdate(pool, electionId, e, marks, resolutions, certifier.ID);
        existing.set(e.name, { ID: electionId, Name: e.name, Status: 'Certified' });
        counts.loaded++;
        if (counts.loaded % 10 === 0) log(`loaded ${counts.loaded} of ${elections.length}`);
    }
    log(`elections: ${counts.loaded} loaded (${counts.ballots} ballots), ${counts.skipped} already certified`);
    for (const p of problems) log('PROBLEM', p);
    await pool.close();
    return { ...counts, problems };
}

/**
 * Moves one election's rows from the real load onto the plan's dates, keeping their order, stretch by stretch: setting
 * up onto created..opens (with nominations, created..nominations open..nominations close..opens), the voting onto
 * opensAt..closesAt, and closing, tallying and certifying onto closesAt..certified (through talliedAt when the plan gives
 * one; certifying itself lands on certifiedAt). Then it sets the election's dates, each nomination's, each ballot's and
 * each comment resolution's times exactly.
 */
async function backdate(pool, electionId, e, real, resolutions = [], certifierUserId = null) {
    const created = e.createdAt ?? minutes(e.opensAt, -1);
    const certified = e.certifiedAt ?? minutes(e.closesAt, 2);
    const pairs = [
        [real.started, created],
        ...(e.nominations ? [[real.nominationsOpened, e.nominations.opensAt], [real.nominationsClosed, e.nominations.closesAt]] : []),
        [real.opened, e.opensAt],
        [real.closing, e.closesAt],
        // Comments are resolved between the tally and certifying, so a plan with them says when it was tallied.
        ...(e.talliedAt ? [[real.tallied, e.talliedAt]] : []),
        [real.certified, certified],
        [real.finished, new Date(Date.parse(certified) + 60000).toISOString()],
    ];
    const marks = pairs.map(([r]) => r);
    const plan = pairs.map(([, p]) => new Date(p));
    const last = pairs.length - 1;
    // DATEADD takes an int, and a month of milliseconds overflows one: add whole seconds, then the milliseconds left.
    const offset = (col, i) => `CAST(DATEDIFF_BIG(ms, @r${i}, ${col}) * @k${i} AS bigint)`;
    const stretch = (col, i) => `WHEN ${col} BETWEEN @r${i} AND @r${i + 1} ` +
        `THEN DATEADD(ms, ${offset(col, i)} % 1000, DATEADD(second, ${offset(col, i)} / 1000, @p${i}))`;
    const map = (col) => `${col} = CASE ${marks.slice(0, last).map((_, i) => stretch(col, i)).join(' ')} ELSE ${col} END`;
    const inWindow = (col) => `${col} BETWEEN @r0 AND @r${last}`;
    const statements = Object.entries(TIME_COLUMNS).map(([table, cols]) => {
        const all = ['__mj_CreatedAt', '__mj_UpdatedAt', ...cols];
        return `UPDATE [${VOTING_SCHEMA}].[${table}] SET ${all.map(map).join(', ')} WHERE ${all.map(inWindow).join(' OR ')};`;
    });
    statements.push(`UPDATE rc SET ${map('rc.ChangedAt').replace(/^rc\./, '')} FROM [__mj].[RecordChange] rc JOIN [__mj].[Entity] en ON en.ID = rc.EntityID ` +
        `WHERE en.Name LIKE '${VOTING_ENTITY_PREFIX.replace(/_/g, '[_]')}%' AND ${inWindow('rc.ChangedAt')};`);
    // The events that mark the plan's own moments happen exactly then.
    statements.push(`UPDATE [${VOTING_SCHEMA}].[ElectionAuditEvent] SET OccurredAt = CASE EventType WHEN 'Opened' THEN @opensAt WHEN 'Closed' THEN @closesAt` +
        `${e.nominations ? " WHEN 'NominationsOpened' THEN @nomOpen WHEN 'NominationsClosed' THEN @nomClose" : ''} END ` +
        `WHERE ElectionID = @election AND EventType IN ('Opened', 'Closed'${e.nominations ? ", 'NominationsOpened', 'NominationsClosed'" : ''});`);
    statements.push(`UPDATE [${VOTING_SCHEMA}].[Election] SET OpensAt = @opensAt, ClosesAt = @closesAt, RecordDate = @recordDate` +
        `${e.nominations ? ', NominationsOpenAt = @nomOpen, NominationsCloseAt = @nomClose' : ''} WHERE ID = @election;`);
    if (e.nominations) {
        // Each nomination when the plan says it came in, decided the day after nominations closed; the audit trail and
        // the candidate's option follow.
        const noms = e.nominations.entries.map((n) => `('${n.person}', '${n.submittedAt}')`).join(',');
        statements.push(`UPDATE n SET n.SubmittedAt = x.at, n.DecidedAt = DATEADD(day, 1, @nomClose), n.__mj_CreatedAt = x.at, n.__mj_UpdatedAt = DATEADD(day, 1, @nomClose) ` +
            `FROM [${VOTING_SCHEMA}].[Nomination] n JOIN [${VOTING_SCHEMA}].[Contest] c ON c.ID = n.ContestID JOIN (VALUES ${noms}) x(person, at) ON n.NomineePersonID = x.person WHERE c.ElectionID = @election;`);
        statements.push(`UPDATE o SET o.__mj_CreatedAt = n.DecidedAt, o.__mj_UpdatedAt = n.DecidedAt FROM [${VOTING_SCHEMA}].[ContestOption] o ` +
            `JOIN [${VOTING_SCHEMA}].[Nomination] n ON n.ContestOptionID = o.ID JOIN [${VOTING_SCHEMA}].[Contest] c ON c.ID = n.ContestID WHERE c.ElectionID = @election;`);
        statements.push(`UPDATE a SET a.OccurredAt = CASE a.EventType WHEN 'NominationSubmitted' THEN n.SubmittedAt ELSE n.DecidedAt END ` +
            `FROM [${VOTING_SCHEMA}].[ElectionAuditEvent] a JOIN [${VOTING_SCHEMA}].[Nomination] n ON n.ID = TRY_CONVERT(uniqueidentifier, JSON_VALUE(a.Details, '$.NominationID')) ` +
            `WHERE a.ElectionID = @election AND a.EventType IN ('NominationSubmitted', 'NominationDecided');`);
    }
    const casts = e.ballots.map((b) => `('${b.person}', '${b.at}')`).join(',');
    if (casts) {
        statements.push(`UPDATE p SET p.CastAt = c.at, p.__mj_CreatedAt = c.at, p.__mj_UpdatedAt = c.at FROM [${VOTING_SCHEMA}].[Participation] p ` +
            `JOIN [${VOTING_SCHEMA}].[EligibleVoter] v ON v.ID = p.EligibleVoterID JOIN (VALUES ${casts}) c(person, at) ON v.PersonID = c.person WHERE p.ElectionID = @election;`);
        statements.push(`UPDATE ba SET ba.__mj_CreatedAt = p.CastAt, ba.__mj_UpdatedAt = p.CastAt FROM [${VOTING_SCHEMA}].[BallotAttribution] ba ` +
            `JOIN [${VOTING_SCHEMA}].[Participation] p ON p.ID = ba.ParticipationID WHERE p.ElectionID = @election;`);
    }
    if (resolutions.length) {
        // Each comment dates from its ballot; each resolution is the chair's, on the plan's day, and the writer's answer
        // (the resolution's last update) follows it.
        statements.push(`UPDATE bc SET bc.__mj_CreatedAt = p.CastAt, bc.__mj_UpdatedAt = p.CastAt FROM [${VOTING_SCHEMA}].[BallotComment] bc ` +
            `JOIN [${VOTING_SCHEMA}].[Participation] p ON p.ID = bc.ParticipationID WHERE p.ElectionID = @election;`);
        const rows = resolutions.map((r) => `('${r.id}', '${r.resolvedAt}', '${r.answeredAt}')`).join(',');
        statements.push(`UPDATE cr SET cr.ResolvedAt = x.resolvedAt, cr.__mj_CreatedAt = x.resolvedAt, cr.__mj_UpdatedAt = x.answeredAt, cr.ResolvedByUserID = @certifierUser ` +
            `FROM [${VOTING_SCHEMA}].[CommentResolution] cr JOIN (VALUES ${rows}) x(comment, resolvedAt, answeredAt) ON cr.BallotCommentID = x.comment;`);
        statements.push(`UPDATE a SET a.OccurredAt = cr.ResolvedAt, a.ActorUserID = @certifierUser FROM [${VOTING_SCHEMA}].[ElectionAuditEvent] a ` +
            `JOIN [${VOTING_SCHEMA}].[CommentResolution] cr ON cr.BallotCommentID = TRY_CONVERT(uniqueidentifier, JSON_VALUE(a.Details, '$.BallotCommentID')) ` +
            `WHERE a.ElectionID = @election AND a.EventType = 'CommentResolved';`);
    }
    const req = pool.request();
    req.input('certifierUser', certifierUserId);
    marks.forEach((t, i) => req.input(`r${i}`, t));
    plan.forEach((t, i) => req.input(`p${i}`, t));
    for (let i = 0; i < last; i++) req.input(`k${i}`, (plan[i + 1] - plan[i]) / Math.max(1, marks[i + 1] - marks[i]));
    req.input('opensAt', new Date(e.opensAt));
    req.input('closesAt', new Date(e.closesAt));
    req.input('recordDate', new Date(e.recordDate ?? e.opensAt));
    if (e.nominations) {
        req.input('nomOpen', new Date(e.nominations.opensAt));
        req.input('nomClose', new Date(e.nominations.closesAt));
    }
    req.input('election', electionId);
    // The tables' update triggers would stamp __mj_UpdatedAt with now; they are off only inside this transaction.
    const triggers = (verb) => Object.keys(TIME_COLUMNS).map((t) => `${verb} TRIGGER ALL ON [${VOTING_SCHEMA}].[${t}];`).join(' ');
    await req.query(`SET XACT_ABORT ON; BEGIN TRAN; ${triggers('DISABLE')}\n${statements.join('\n')}\n${triggers('ENABLE')} COMMIT;`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    load(args(process.argv.slice(2))).then((r) => process.exit(r.problems.length ? 1 : 0)).catch((err) => {
        console.error(err instanceof Error ? err.stack : err);
        process.exit(1);
    });
}
