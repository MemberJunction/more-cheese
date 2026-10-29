#!/usr/bin/env node
/**
 * load-spaces.mjs — replays data/spaces/spaces.plan.json into a database through collaboration's own rules.
 *
 * `mj sync push` saves every record as the System user, and collaboration only lets a space's owner create it
 * and seat people, so spaces cannot go in as config JSON. This loader saves each record as the person the
 * rules expect, the way bizapps-collaboration's own IntegrationTests world loader does:
 *   1. each root space by its owner, each child space by its parent's owner, then the owner's own seat
 *   2. every other seat by the space's owner; an invitation by one of the space's admins; a removed seat is
 *      saved Active by the owner and then removed by the owner
 *   3. anchors (a committee space on its Committees record) by the space's owner
 *   4. a committee's action items filed into its space (the item by the owner, the task link by System)
 *   5. chats from data/spaces/chats/<key>.json: started by the owner, each message posted by its author
 *   6. closes, each its own save, dated from the plan (after the content: a closed space takes nothing new)
 *   7. links each seated Person to their User (Person.LinkedUserID), as System
 *   8. backdates the created/updated stamps of spaces, seats and new chats to the plan's dates
 * Re-running is safe: spaces, seats, anchors, filed tasks and chats that already exist are left alone.
 *
 * Before running: push config/ (it carries the users in config/users/.space-users.json), and load
 * @mj-biz-apps/collaboration-server through dynamicPackages.server in the MJ host's mj.config.cjs. Without
 * that package the collaboration rules don't run, and the loader refuses to start.
 *
 *   node scripts/load-spaces.mjs --mj ../MJ                # DB_* from the environment, as for mj sync push
 *   node scripts/load-spaces.mjs --mj ../MJ --dry-run      # connect and check, write nothing
 *   node scripts/load-spaces.mjs --mj ../MJ --presenter you@example.org
 *       # also seat a presenter's sign-in user wherever the plan seats the template user (plan.presenter);
 *       # `mj user clone` copies the template's settings but not its space seats
 *
 * Run from the repo root.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ENTITY = {
    spaces: 'MJ_BizApps_Collaboration: Spaces',
    members: 'MJ_BizApps_Collaboration: Space Members',
    anchors: 'MJ_BizApps_Collaboration: Space Anchors',
    types: 'MJ_BizApps_Collaboration: Space Types',
    roles: 'MJ_BizApps_Collaboration: Space Role Types',
    statuses: 'MJ_BizApps_Collaboration: Space Type Status',
    people: 'MJ_BizApps_Common: People',
    entities: 'MJ: Entities',
    chats: 'MJ_BizApps_Collaboration: Space Chats',
    items: 'MJ_BizApps_Collaboration: Space Items',
    tasks: 'MJ_BizApps_Tasks: Tasks',
    taskLinks: 'MJ_BizApps_Tasks: Task Links',
};
const COLLAB_SCHEMA = '__mj_BizAppsCollaboration';

function args(argv) {
    const out = { plan: 'data/spaces/spaces.plan.json', mj: process.env.MJ_DIR ?? null, dryRun: false, presenters: [] };
    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--mj') out.mj = argv[++i];
        else if (argv[i] === '--plan') out.plan = argv[++i];
        else if (argv[i] === '--dry-run') out.dryRun = true;
        else if (argv[i] === '--presenter') out.presenters.push(String(argv[++i]).toLowerCase());
        else throw new Error(`unknown argument ${argv[i]}`);
    }
    if (!out.mj) throw new Error('--mj <path to the MJ repo or host that has mj.config.cjs> is required (or set MJ_DIR)');
    out.mj = path.resolve(out.mj);
    return out;
}

const q = (s) => String(s).replace(/'/g, "''");
const sameId = (a, b) => String(a ?? '').toUpperCase() === String(b ?? '').toUpperCase();
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

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
        processId: CliProcessId('spaces:load'),
        tier: 'server',
        config,
        configFilePath: configFile,
        log: { info: () => {}, verbose: () => {}, warn: (m, e) => console.error(m, e instanceof Error ? e.message : e ?? '') },
    });
    const core = await fromSync('@memberjunction/core');
    const global = await fromSync('@memberjunction/global');
    const registered = global.MJGlobal.Instance.ClassFactory.GetRegistration(core.BaseEntity, ENTITY.spaces);
    if (!registered) {
        throw new Error(`no server class is registered for ${ENTITY.spaces}: add @mj-biz-apps/collaboration-server to dynamicPackages.server ` +
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
    // The content calls (conversations, messages, filing) come from the same collaboration build the host loaded
    const collabServer = createRequire(path.join(mjDir, 'package.json')).resolve('@mj-biz-apps/collaboration-server');
    const collab = await importer(path.dirname(path.dirname(collabServer)))('@mj-biz-apps/collaboration-core-entities-server');
    return { core, pool, UserCache, collab };
}

export async function load(opts) {
    const plan = JSON.parse(fs.readFileSync(opts.plan, 'utf8'));
    for (const s of plan.spaces) {
        const template = s.seats.find((x) => x.user === plan.presenter);
        if (template) for (const p of opts.presenters ?? []) s.seats.push({ ...template, user: p });
    }
    const { core, pool, UserCache, collab } = await bootstrap(opts.mj);
    const md = new core.Metadata();
    const system = UserCache.Instance.GetSystemUser?.() ?? UserCache.Instance.UserByName('System', false);
    const run = async (entity, filter, fields, user = system) => {
        const r = await new core.RunView().RunView({ EntityName: entity, ExtraFilter: filter, Fields: fields, ResultType: 'simple' }, user);
        if (!r.Success) throw new Error(`${entity}: ${r.ErrorMessage}`);
        return r.Results;
    };
    const save = async (record, what) => {
        if (opts.dryRun) return;
        if (!(await record.Save())) throw new Error(`${what}: ${record.LatestResult?.CompleteMessage ?? 'save failed'}`);
    };

    // Users: every seat names one, and they must already be in (config push).
    const users = new Map();
    for (const u of UserCache.Instance.Users) users.set(String(u.Email).toLowerCase(), u);
    const needed = new Set(plan.spaces.flatMap((s) => s.seats.map((x) => x.user)));
    const missing = [...needed].filter((e) => !users.has(e));
    if (missing.length) throw new Error(`${missing.length} seated users are not in the database (push config/ first), e.g. ${missing.slice(0, 3).join(', ')}`);
    const user = (email) => users.get(email);

    const typeId = new Map((await run(ENTITY.types, '', ['ID', 'Code'])).map((t) => [t.Code, t.ID]));
    const roleId = new Map((await run(ENTITY.roles, '', ['ID', 'Code'])).map((t) => [t.Code, t.ID]));
    const statuses = await run(ENTITY.statuses, '', ['ID', 'Code', 'SpaceTypeID']);
    const statusId = (type, code) => statuses.find((s) => sameId(s.SpaceTypeID, typeId.get(type)) && s.Code === code)?.ID;
    for (const s of plan.spaces) if (!typeId.has(s.type)) throw new Error(`space type ${s.type} is not installed`);
    const entityId = new Map();
    for (const name of new Set(plan.spaces.flatMap((s) => s.anchors.map((a) => a.entity)))) {
        const [row] = await run(ENTITY.entities, `Name = '${q(name)}'`, ['ID']);
        if (!row) throw new Error(`entity ${name} is not installed`);
        entityId.set(name, row.ID);
    }

    const existingSpaces = new Set((await run(ENTITY.spaces, '', ['ID'])).map((r) => r.ID.toUpperCase()));
    const seatsOf = async (spaceId) => new Map((await run(ENTITY.members, `SpaceID = '${spaceId}'`, ['ID', 'UserID', 'Status'])).map((r) => [r.UserID.toUpperCase(), r]));
    const byKey = new Map(plan.spaces.map((s) => [s.key, s]));
    const counts = { spaces: 0, seats: 0, removed: 0, invited: 0, anchors: 0, tasks: 0, chats: 0, messages: 0, closed: 0, linked: 0 };

    const seat = async (space, x, saver) => {
        const rec = await md.GetEntityObject(ENTITY.members, user(saver));
        rec.NewRecord();
        rec.SpaceID = space.id;
        rec.UserID = user(x.user).ID;
        rec.SpaceRoleTypeID = roleId.get(x.role);
        rec.Band = 'Shared';
        rec.Status = 'Active';
        if (x.person) rec.PersonID = x.person;
        await save(rec, `seat ${x.user} on ${space.key}`);
        return rec;
    };

    // Spaces, parents first; the owner seats themselves before anyone else is seated.
    const pending = [...plan.spaces];
    const done = new Set();
    while (pending.length) {
        const ready = pending.filter((s) => !s.parent || done.has(s.parent));
        if (!ready.length) throw new Error(`cannot order spaces: ${pending.map((s) => s.key).join(', ')}`);
        for (const s of ready) {
            pending.splice(pending.indexOf(s), 1);
            done.add(s.key);
            if (existingSpaces.has(s.id.toUpperCase())) continue;
            const creator = s.parent ? byKey.get(s.parent).owner : s.owner;
            const rec = await md.GetEntityObject(ENTITY.spaces, user(creator));
            rec.NewRecord();
            rec.ID = s.id;
            rec.Name = s.name;
            rec.Description = s.description ?? null;
            rec.SpaceTypeID = typeId.get(s.type);
            rec.OwnerID = user(s.owner).ID;
            rec.ParentID = s.parent ? byKey.get(s.parent).id : null;
            rec.InheritsMembership = !s.sealed && !!s.parent;
            rec.StartedAt = s.startedAt ? new Date(`${s.startedAt}T00:00:00Z`) : null;
            rec.PlannedCloseAt = s.plannedCloseAt ? new Date(`${s.plannedCloseAt}T00:00:00Z`) : null;
            await save(rec, `space ${s.key}`);
            counts.spaces++;
            const own = s.seats.find((x) => x.user === s.owner && x.role === 'owner');
            await seat(s, own, s.owner);
            counts.seats++;
        }
    }
    log(`spaces: ${counts.spaces} created, ${plan.spaces.length - counts.spaces} already there`);

    // Every other seat, then invitations and removals.
    for (const s of plan.spaces) {
        const have = opts.dryRun ? new Map() : await seatsOf(s.id);
        const admin = s.seats.find((x) => x.role === 'admin' && x.status === 'Active')?.user;
        // A closed space takes no new seats and cannot be reopened, so seats added after the close are skipped.
        const closed = s.closedAt && !opts.dryRun && (await run(ENTITY.spaces, `ID = '${s.id}' AND ClosedAt IS NOT NULL`, ['ID'])).length > 0;
        for (const x of s.seats) {
            if (x.user === s.owner && x.role === 'owner') continue;
            const current = have.get(String(user(x.user).ID).toUpperCase());
            if (!current && closed) {
                log(`skipped ${x.user} on ${s.key}: the space is closed`);
                continue;
            }
            if (x.status === 'Invited') {
                if (current) continue;
                if (!admin) throw new Error(`${s.key} has an invitation but no admin to send it`);
                const rec = await seat(s, x, admin);
                if (!opts.dryRun && rec.Status.trim() !== 'Invited') throw new Error(`${x.user} on ${s.key} saved as ${rec.Status}, plan says Invited`);
                counts.invited++;
                continue;
            }
            let rec = null;
            if (!current) { rec = await seat(s, x, s.owner); counts.seats++; }
            if (x.status === 'Removed' && current?.Status?.trim() !== 'Removed') {
                const r = await md.GetEntityObject(ENTITY.members, user(s.owner));
                if (!opts.dryRun) {
                    if (!(await r.Load(rec?.ID ?? current.ID))) throw new Error(`cannot reload ${x.user} on ${s.key}`);
                    r.Status = 'Removed';
                    await save(r, `remove ${x.user} from ${s.key}`);
                }
                counts.removed++;
            }
        }
    }
    log(`seats: ${counts.seats} active, ${counts.invited} invited, ${counts.removed} removed`);

    // Anchors.
    for (const s of plan.spaces) {
        for (const a of s.anchors) {
            const eid = entityId.get(a.entity);
            const rid = `ID|${a.recordId}`;
            if ((await run(ENTITY.anchors, `SpaceID = '${s.id}' AND EntityID = '${eid}' AND RecordID = '${q(rid)}' AND Role = '${q(a.role)}'`, ['ID'])).length) continue;
            const rec = await md.GetEntityObject(ENTITY.anchors, user(s.owner));
            rec.NewRecord();
            rec.SpaceID = s.id;
            rec.SpaceTypeID = typeId.get(s.type);
            rec.EntityID = eid;
            rec.RecordID = rid;
            rec.Role = a.role;
            rec.IsPrimary = !!a.isPrimary;
            rec.Sequence = 0;
            await save(rec, `anchor of ${s.key}`);
            counts.anchors++;
        }
    }

    // Tasks: a committee's action items filed into its space, as createSpaceTask files a new one — the space item
    // by the owner, the task link by System.
    const tasksEntity = md.EntityByName(ENTITY.tasks);
    const spacesEntity = md.EntityByName(ENTITY.spaces);
    for (const s of plan.spaces.filter((x) => x.tasks?.length)) {
        const filed = new Set((await run(ENTITY.items, `SpaceID = '${s.id}' AND EntityID = '${tasksEntity.ID}'`, ['RecordID'])).map((r) => r.RecordID.replace(/^ID\|/, '').toUpperCase()));
        for (const taskId of s.tasks) {
            if (filed.has(taskId.toUpperCase())) continue;
            const item = await md.GetEntityObject(ENTITY.items, user(s.owner));
            collab.vouchStoredFile(item);
            item.NewRecord();
            item.SpaceID = s.id;
            item.EntityID = tasksEntity.ID;
            item.RecordID = taskId;
            item.Band = 'Team';
            await save(item, `file task ${taskId} in ${s.key}`);
            const link = await md.GetEntityObject(ENTITY.taskLinks, system);
            link.NewRecord();
            link.TaskID = taskId;
            link.EntityID = spacesEntity.ID;
            link.RecordID = s.id;
            link.Description = 'Space';
            await save(link, `link task ${taskId} to ${s.key}`);
            counts.tasks++;
        }
    }

    // Chats: data/spaces/chats/<key>.json, the conversation started by the owner and each message posted by its
    // author, then dated as the file says. A chat that already exists is left alone.
    const chatDir = path.join(path.dirname(opts.plan), 'chats');
    const stamps = [];
    for (const s of plan.spaces) {
        const file = path.join(chatDir, `${s.key}.json`);
        if (!fs.existsSync(file)) continue;
        const chat = JSON.parse(fs.readFileSync(file, 'utf8'));
        if ((await run(ENTITY.chats, `SpaceID = '${s.id}' AND Name = '${q(chat.chat)}'`, ['ID'])).length) continue;
        if (opts.dryRun) { counts.chats++; counts.messages += chat.messages.length; continue; }
        const started = await collab.createSpaceConversation(core.Metadata.Provider, user(s.owner), { SpaceID: s.id, Name: chat.chat, Kind: chat.kind ?? 'General' });
        if (!started.ok) throw new Error(`chat in ${s.key}: ${started.message}`);
        const posted = [];
        for (const m of chat.messages) {
            const r = await collab.postSpaceMessage(core.Metadata.Provider, user(m.author), { spaceId: s.id, conversationId: started.conversationId, text: m.text });
            if (!r.ok) throw new Error(`message by ${m.author} in ${s.key}: ${r.message}`);
            posted.push({ id: r.detailId, at: `${m.date}:00Z` });
        }
        stamps.push({ conversationId: started.conversationId, spaceChatId: started.spaceChatId, posted });
        counts.chats++;
        counts.messages += posted.length;
    }
    log(`tasks filed: ${counts.tasks}; chats: ${counts.chats} with ${counts.messages} messages`);

    // Closes: their own save, by the owner, with the plan's date. They come after the content, because a closed
    // space takes no new seats, chats or messages.
    for (const s of plan.spaces.filter((x) => x.closedAt)) {
        const rec = await md.GetEntityObject(ENTITY.spaces, user(s.owner));
        if (opts.dryRun) { counts.closed++; continue; }
        if (!(await rec.Load(s.id))) throw new Error(`cannot load ${s.key} to close it`);
        if (rec.ClosedAt) continue;
        rec.StatusID = statusId(s.type, 'closed');
        rec.ClosedAt = new Date(`${s.closedAt}T17:00:00Z`);
        await save(rec, `close ${s.key}`);
        counts.closed++;
    }
    log(`anchors: ${counts.anchors} added; closed: ${counts.closed}`);

    // People ↔ users.
    const persons = new Map();
    for (const s of plan.spaces) for (const x of s.seats) if (x.person) persons.set(x.person.toUpperCase(), x.user);
    const unlinked = [];
    const ids = [...persons.keys()];
    for (let i = 0; i < ids.length; i += 500) {
        const chunk = ids.slice(i, i + 500);
        unlinked.push(...await run(ENTITY.people, `ID IN (${chunk.map((x) => `'${x}'`).join(',')}) AND LinkedUserID IS NULL`, ['ID']));
    }
    for (const p of unlinked) {
        const rec = await md.GetEntityObject(ENTITY.people, system);
        if (opts.dryRun) { counts.linked++; continue; }
        if (!(await rec.Load(p.ID))) throw new Error(`cannot load person ${p.ID}`);
        rec.LinkedUserID = user(persons.get(p.ID.toUpperCase())).ID;
        await save(rec, `link person ${p.ID}`);
        counts.linked++;
    }
    log(`people linked to their users: ${counts.linked}`);

    // Backdate: the created/updated stamps follow the plan, so the space tree reads as history.
    if (!opts.dryRun) {
        const tx = pool.request();
        let n = 0;
        for (const s of plan.spaces) {
            const started = `${s.startedAt}T15:00:00Z`;
            const updated = s.closedAt ? `${s.closedAt}T17:00:00Z` : started;
            await tx.query(`UPDATE ${COLLAB_SCHEMA}.Space SET __mj_CreatedAt = '${started}', __mj_UpdatedAt = '${updated}' WHERE ID = '${s.id}'`);
            const r = await tx.query(`UPDATE ${COLLAB_SCHEMA}.SpaceMember SET __mj_CreatedAt = '${started}', __mj_UpdatedAt = '${updated}' WHERE SpaceID = '${s.id}' AND Status <> 'Invited'`);
            n += r.rowsAffected[0] ?? 0;
        }
        for (const c of stamps) {
            for (const p of c.posted) await tx.query(`UPDATE __mj.ConversationDetail SET __mj_CreatedAt = '${p.at}', __mj_UpdatedAt = '${p.at}' WHERE ID = '${p.id}'`);
            const first = c.posted[0]?.at;
            const last = c.posted.at(-1)?.at;
            if (!first) continue;
            await tx.query(`UPDATE __mj.Conversation SET __mj_CreatedAt = '${first}', __mj_UpdatedAt = '${last}' WHERE ID = '${c.conversationId}'`);
            await tx.query(`UPDATE ${COLLAB_SCHEMA}.SpaceChat SET __mj_CreatedAt = '${first}', __mj_UpdatedAt = '${last}' WHERE ID = '${c.spaceChatId}'`);
        }
        log(`backdated ${plan.spaces.length} spaces, ${n} seats and ${stamps.length} new chats`);
    }
    await pool.close();
    return counts;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    load(args(process.argv.slice(2)))
        .then((c) => { log('done', JSON.stringify(c)); process.exit(0); })
        .catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1); });
}
