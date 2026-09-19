# MJ 6.1.2 clean-install investigation — findings

**Date:** 2026-09-17
**Context:** [more-cheese#48](https://github.com/MemberJunction/more-cheese/issues/48) Stage 1 — stand up a clean MJ 6.1.2 environment via the consumer path.
**Environment:** macOS 27.0 (arm64), Node v24.20.0, npm 11.19.0, pnpm 10.33.0 (corepack), SQL Server 2022 in Docker (amd64 emulation) on `localhost:1433`, empty database, target directory outside any pnpm workspace.

**Five defects in the MJ installer, three ecosystem blockers.** Two of the installer bugs (A1, A5) each independently fail a by-the-book install, and all five are still present in current MJ source, not just in the published 6.1.2 artifacts.

The bottom line: **MJ 6.1.2 does install correctly.** Working around A1 with a single `.env` line produced a complete, functioning system — 86 migrations, 390 tables, 388 entities generated, all four packages built, MJAPI serving on :4000. The installer then reported `Installation failed` anyway, because of A5. Both the failure and the false verdict are installer bugs, not MJ platform problems.

---

## A. MJ installer defects

### A1 — Interactive prompts are unreachable for every field that has a default

**Severity: high.** This is the one that actually broke the install.

`InstallConfigDefaults` pre-populates eight fields:

```ts
// packages/MJInstaller/src/models/InstallConfig.ts
export const InstallConfigDefaults: PartialInstallConfig = {
  DatabaseHost: 'localhost',
  DatabasePort: 1433,
  DatabaseTrustCert: false,
  APIPort: 4000,
  ExplorerPort: 4200,
  AuthProvider: 'none',
  InstallMode: 'distribution',
  PackageManager: 'pnpm',
};
```

`ConfigurePhase` then guards each prompt with nullish coalescing:

```ts
// packages/MJInstaller/src/phases/ConfigurePhase.ts:309
config.DatabaseTrustCert = config.DatabaseTrustCert ?? await this.promptConfirm(
  emitter, 'db-trust-cert', 'Trust self-signed server certificate? (common for local instances)', false, yes);
```

`false ?? x` evaluates to `false`. The prompt never runs — **not for this user, not for any user**. The same holds for the other seven fields, since a default is never nullish. Only `DatabaseName`, which has no default, actually prompts.

**Observed:** the interactive wizard asked about database name, the two logins and passwords, three AI keys, and whether to create a user. It never asked about host, port, certificate trust, API port, Explorer port, auth provider, install mode, or package manager. The diagnostic report's resolved config is byte-for-byte `InstallConfigDefaults`.

**Consequences observed in one run:**

| Symptom | Cause |
|---|---|
| Install failed at `migrate` on a self-signed certificate | `DatabaseTrustCert` stayed `false`, so `ConfigurePhase.ts:476` wrote `''` instead of `DB_TRUST_SERVER_CERTIFICATE=1` |
| "Authentication provider is not configured" warning | `AuthProvider` defaulted to `'none'`; the user was never offered Entra or Auth0 |
| pnpm used on a machine with no global pnpm | `PackageManager` defaulted to `'pnpm'` |
| Explorer bound to 4200 despite the operator intending 4201 | `ExplorerPort` defaulted; no prompt |

**Blast radius:** interactive installs only. A `--config` file sets each field non-nullishly, so `??` keeps the supplied value and the correct lines get written. That is why config-file runs never surface this.

**Repro:** run `mj install -t v6.1.2` interactively against any SQL Server presenting a self-signed certificate (every Docker SQL Server, most local dev instances). Migrate fails with:

```
Error: Database connection failed: Failed to connect to localhost:1433 - self-signed certificate
→ The database is presenting a self-signed / untrusted TLS certificate.
  For a local or development instance, set DB_TRUST_SERVER_CERTIFICATE=1 in your .env
```

**Workaround:** append `DB_TRUST_SERVER_CERTIFICATE=1` to the generated `.env` and re-run. Verified: migrate then completed, **86 migrations applied in 69.3s**, leaving 390 tables in `__mj`, 388 `Entity` rows, 87 history rows.

**Suggested fix:** drop the fields that need a real decision (`DatabaseTrustCert`, `AuthProvider`, and arguably `PackageManager`) out of `InstallConfigDefaults` and let the prompt supply the default via its own `false` / `'none'` argument, which it already passes. Keep them in the `--yes` fill-in path. A regression test should assert that an interactive run with no config file emits a `db-trust-cert` prompt event.

---

### A2 — "Database connectivity verified" is a bare TCP probe

**Severity: high**, because it converts A1 from a clear failure into a misleading one.

```js
// packages/MJInstaller/src/adapters/SqlServerAdapter.ts:80 — CheckConnectivity
const socket = new net.Socket();
socket.on('connect', () => resolve({ Reachable: true, LatencyMs: latency }));
socket.connect(port, host);
```

No TLS, no login, no credentials — it proves only that something holds the port. Both `PreflightPhase.checkSqlConnectivity` and `DatabaseProvisionPhase` use it and report:

```
[PASS] SQL Server connectivity: SQL Server reachable at localhost:1433 (3ms)
Database connectivity verified at localhost:1433 (2ms)
```

Both passed on a database the installer could not actually authenticate against. The 2–3ms latency is the tell: far too fast for a TLS handshake plus login.

Note that a real check already exists — `verifyDatabaseConnection` in `MJCLI/src/lib/db-preflight.ts` opens a connection with the configured `encrypt` / `trustServerCertificate` and runs `SELECT 1`. It is called **only** from `commands/migrate`, which is precisely why the failure surfaces three phases too late.

**Suggested fix:** have the database phase call `verifyDatabaseConnection` (or an equivalent) once the config is resolved, so a TLS or credential problem fails at `database` with the config still in hand, rather than at `migrate`. Word the TCP check as "port reachable", not "connectivity verified".

---

### A3 — Turbo failure parser captures only the first failed package

**Severity: medium.** Benign in this run; capable of hiding a broken API build.

```js
// packages/MJInstaller/src/phases/DependencyPhase.ts:468
const failedPattern = /Failed:\s+([@\w][^#\s]*)#build/g;
```

Turbo prints all failed packages on one comma-separated line. The pattern requires the literal `Failed:` before each name, so only the first is captured. Observed directly:

```
Failed:    mj_generatedactions#build, mj_generatedentities#build
⚠ Build partially succeeded. Failed packages (mj_generatedactions) contain generated code
  that will be regenerated by CodeGen.
```

Turbo named two; the installer reported one.

The captured set feeds the tolerance gate, which passes only when *every* failed package is CodeGen-managed:

```ts
const onlyCodegenFailures = failedPackages.length > 0
  && failedPackages.every(pkg => CODEGEN_MANAGED_PACKAGES.some(pattern => pkg.includes(pattern)));
```

Because only the first name is parsed, the verdict depends on turbo's output ordering. `mj_generatedactions#build, mj_api#build` is tolerated and silently swallows the `mj_api` failure; the same two reversed is a hard `BUILD_FAILED`.

**Suggested fix:** split the `Failed:` line on commas and match each entry, e.g. capture the remainder of the line after `Failed:` and then match `/([@\w][^#\s]*)#\w+/g` within it. Add a unit test with a multi-package `Failed:` line.

---

### A4 — Generated `mj-db-validate.sql` always reports FAIL for `sa`

**Severity: low** (cosmetic), but it tells an operator their good database is broken.

Emitted by `packages/MJInstaller/src/phases/DatabaseProvisionPhase.ts:202`, which checks for the login as a *database* principal:

```sql
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'sa')
    PRINT '[PASS] User sa exists';
ELSE
    PRINT '[FAIL] User sa NOT found';
```

`sa` never exists as a database principal — it maps to `dbo`. So a correct setup prints `[FAIL] User sa NOT found`, twice (once each for the CodeGen and API logins).

The same generator already knows this. Its setup script skips the corresponding `CREATE USER` with an accurate comment:

```sql
-- Skipping CREATE USER [sa] — SQL Server rejects `CREATE USER FOR LOGIN [sa]` with Msg 15405
-- (special principal). sa already has implicit sysadmin permissions in every database.
```

**Suggested fix:** apply the same built-in-sysadmin check in the validation emitter — skip the principal assertion for `sa`, or assert `IS_SRVROLEMEMBER('sysadmin', …)` instead.

---

### A5 — CodeGen's post-run server smoke test always fails

**Severity: high.** This is what failed the install *after* A1 was worked around, and it fails every install.

`distribution.config.cjs` (which becomes the installed `mj.config.cjs`) ends its AFTER commands with:

```js
{
  workingDirectory: './apps/MJAPI',
  command: 'npm',
  args: ['start'],
  timeout: 30000,
  when: 'after',
},
```

`npm start` in `apps/MJAPI` launches the GraphQL server. It is a daemon — it never exits on its own, so it can only ever end by hitting that 30-second timeout. The 30s budget makes the intent obvious: boot the server, confirm it comes up, kill it. But the runner classifies the timeout-kill as a command failure:

```
Ready     http://localhost:4000/
...
Process killed after 30000 ms
COMMAND: "npm" TIMED OUT after 30.001 seconds
✖ ERROR running one or more AFTER commands
```

That propagates all the way out: CodeGen reports `{"success":false, ..., "errors":[{"context":"AFTER command", ...}]}`, the `codegen` phase fails, and the installer prints **`Installation failed.`**

**The server started perfectly.** From the same log: `Ready http://localhost:4000/`, startup 12.3s, `SQL Server · localhost:1433/MJ_Clean612 · 388 entities`, task dispatcher running, no errors. Every CodeGen sub-step before it passed — CRUD validation across 388 entities, base-view resolution, 121 AI validators, TypeScript generation, system integrity checks.

Independently verified after the run: starting MJAPI by hand reaches `Ready` in 10.3s with 388 entities, and `curl http://localhost:4000/` returns `HTTP 401 {"error":"Authentication required"}` — the correct response from a working, auth-enforcing API.

The classification is hardcoded in `packages/CodeGenLib/src/Misc/runCommand.ts:138-156` — the timeout path always resolves `success: false`:

```ts
setTimeout(() => {
  if (!cp.killed) {
    treeKill(cp.pid!);
    console.error(`COMMAND: "${command.command}" TIMED OUT after ${elapsedTime / 1000} seconds`);
    output += `Process killed after ${timeout} ms`;
  }
  resolve({ output, error: null!, success: false, elapsedTime });
}, timeout);
```

`runCodeGen.ts:556` then fails the pipeline on `results.some((r) => !r.success)`. There is no way to express "this command is a daemon; timing out is the pass." Nothing distinguishes "killed at timeout because it hung" from "killed at timeout because it is a daemon that booted fine." The `--fast` flag, documented as "skip smoke test and optimize post-codegen steps," sidesteps this — which corroborates that the command is meant as a smoke test.

**Consequence:** a fully successful install reports `Installation failed`, exits 1, and tells the operator to consult a diagnostic report. An operator has no way to tell this apart from a real failure without reading the log line by line.

**Suggested fix:** treat the AFTER-command timeout as the pass condition for a daemon — either mark the command `expectTimeout: true` (or `daemon: true`) in config, or have the runner scan stdout for the readiness banner and succeed on match. At minimum, do not fail the phase when the only error is a timeout on a command known to be long-running.

### Verification: all five are live on the shipping branches

Checked 2026-09-17 against `origin/next` @ `c4c1289a4d` (same day) and `origin/main` @ `8fa0edd8d3`. Identical on both — none of these is fixed and pending release.

| | Source | Status on `next` and `main` |
|---|---|---|
| A1 | `MJInstaller/src/models/InstallConfig.ts` (defaults) + `phases/ConfigurePhase.ts:309` (`??` guard) | present, unchanged |
| A2 | `MJInstaller/src/adapters/SqlServerAdapter.ts:84` (`new net.Socket()`) | present, unchanged |
| A3 | `MJInstaller/src/phases/DependencyPhase.ts:468` | present, unchanged |
| A4 | `MJInstaller/src/phases/DatabaseProvisionPhase.ts:202` | present, unchanged |
| A5 | `distribution.config.cjs` (the `npm start` AFTER command) + `CodeGenLib/src/Misc/runCommand.ts:138-156` + `runCodeGen.ts:556` | present, unchanged |

---

## B. Ecosystem blockers

### B1 — `bizapps-committees` Angular exact pins — RESOLVED

`committees-ng` ≤ 1.1.1 pinned five Angular packages exactly (`"@angular/core": "21.1.3"`, no caret; same for `common`, `forms`, `router`, `platform-browser`). MJExplorer ships 21.2.22, and the pin was disjoint with `forms-ng`'s `^21.2.22`, so committees and forms could not coexist.

Fixed in **1.2.0** (all four packages published, tag `v1.2.0` exists). Verified 2026-09-17:

| Check | Result |
|---|---|
| Client set — MJExplorer Angular pins + MJ 6.1.2 + all eight 6.x `-ng` packages with `committees-ng@1.2.0` | clean, 556 packages |
| Same file, `committees-ng` reverted to `1.1.1` | `ERESOLVE` — `Found: @angular/common@21.2.22` |
| Server set — eight apps' `-server` + `-entities` against MJ 6.1.2 | clean, 1614 packages |
| Copies on disk after a real install | exactly one `@angular/core@21.2.22`, one `@memberjunction/core@6.1.2` |
| Angular peer ranges across all nine `-ng` packages | no exact pins remain; all ranges intersect at 21.2.22 |

more-cheese needs no change: `mj-app.json` declares `mj-committees: ">=1.0.0 <2.0.0"`, and `mj app install` resolves app versions from git tags.

This is install-graph evidence only. Committees has not yet been *run* against 6.1.2.

### B2 — `bizapps-secure-messaging` is on MJ 5.45 — OPEN (fix merged, unreleased)

Released state: tag `v1.1.0` declares `mjVersionRange: ">=5.45.0 <6.0.0"` with peers at `^5.45.0`, and npm serves `@mj-biz-apps/secure-messaging-server@1.1.0` with those MJ 5 peers. On MJ 6 it is rejected at the install gate and pulls a second copy of `@memberjunction/core` at 5.51.3.

**The bump is already done on `next`**, checked 2026-09-17 — manifest `>=6.1.0-edge.4 <7.0.0`, and all seven packages' `@memberjunction/core` peers at `^6.1.0-edge.4`. Both accept MJ 6.1.2 (host gate ACCEPT, npm peer ok), and more-cheese's `mj-secure-messaging: ">=1.0.0 <2.0.0"` would pick the manifest's 1.2.0 with no edit here.

So this is the same shape as B3 below: the work exists, but no tag contains it, so no consumer can see it. Whether the remaining gate is still the Secure Messaging demo or merely an uncut release is worth confirming with the owner — it is the only thing blocking Stage 3 of #48.

### B3 — `Skip-Client-Open-App` has a malformed range — ✅ RESOLVED in v0.3.1 (2026-09-17)

The shipped value was `mjVersionRange: ">=5.51.0 || ^6.1.0-edge.4 <6.0.0"` at tag `v0.3.0`. It was **generated, not hand-written**: `publish.yml`'s "Sync mj-app.json" step derived it with `sed`/`cut`, which assumes a single simple peer range. Fed the union peer `^5.51.0 || ^6.1.0-edge.4`, it concatenated both alternatives into one broken string — so hand-editing the manifest would have been overwritten at the next publish.

Fixed by `c7bffc30d8` (2026-09-06): corrects the manifest to `>=5.51.0 <7.0.0 || ^6.1.0-edge.4` **and** replaces the derivation with a node script that handles unions. Merged to `next` via PR #26 — then sat **unreleased for eleven days**, because `v0.3.0` predated it and `mj app install` resolves from git tags. Released as `v0.3.1` (`87e55ca116`, 2026-09-17 18:43 UTC), with `@askskip/{server,types}@0.3.1` on npm.

**Correction to the original entry.** The empty second clause costs nothing in practice: `version-checker.ts:81` coerces a prerelease host to its base tuple before `semver.satisfies`, so an edge host is admitted by the first clause anyway. The live defect was solely the **missing upper bound** — the shipped range accepted MJ 7 and 8 as compatible.

Verified at `v0.3.1`:

| Check | Result |
|---|---|
| more-cheese's `skip-client: ">=0.3.0"` over Skip's tags | picks **0.3.1** |
| MJ host gate — 6.1.2 vs `>=5.51.0 <7.0.0 \|\| ^6.1.0-edge.4` | ACCEPT (7.0.0 now correctly rejected) |
| npm peer `@memberjunction/core: ^5.51.0 \|\| ^6.1.0-edge.4` vs 6.1.2 | ok |

more-cheese needs no change — `mj-app.json:66` is the repo's only reference to Skip, and its range is already open-ended.

**The pattern worth carrying forward: a merged fix is not a shipped fix.** Verifying a dependency's correction on its default branch proves nothing about what installs; check the newest tag, which is what consumers resolve.

---

## C. Previously recorded, still relevant

**`mj app install` does not fail on `npm install` failure.** It runs bare `npm install` with no `--legacy-peer-deps` and no `--force`; on ERESOLVE it records the app and leaves it **Disabled** rather than erroring. The output still reads as success. Check app status, not exit code.

**A host's CodeGen never runs against an installed app's schema.** `mj app install` adds the app schema to `excludeSchemas`, so an app's `migrations/` is the only channel by which its entities reach a host. Telling an operator to run `mj codegen` will not repair a missing entity — that would be a shipping defect in the app.

---

## Appendix — phase results from the by-the-book interactive run

| Phase | Result |
|---|---|
| preflight | ✓ 267ms — includes the TCP-only connectivity pass (A2) |
| scaffold | ✓ 12s |
| configure | ✓ 1m 18s — silently defaulted eight fields (A1) |
| database | ✓ 1m 1s — second TCP-only pass (A2) |
| platform | ✓ 9ms |
| dependencies | ✓ 18s — TS2307 on both generated packages, tolerated; warning under-reported one of two (A3) |
| migrate | ✗ 2s — self-signed certificate (A1); after the workaround, **86 migrations applied in 69.3s** |
| codegen (after workaround) | ✗ 2m 17s — 388 entities generated and every sub-step passed; failed only because the MJAPI smoke test timed out as designed (A5) |

The `TS2307: Cannot find module './generated/entity_subclasses.js'` errors in `dependencies` are **expected and deliberately tolerated** — those files are CodeGen output that does not exist until the CodeGen phase. An earlier diagnosis attributing the install failure to `DistributionAssembler`'s `SERVER_IGNORE` dropping `src/generated/**` is not supported: the phase reports `✓ dependencies completed` and the install proceeds.
