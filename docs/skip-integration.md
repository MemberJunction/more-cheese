# Running Skip against MoreCheese

Verified working 2026-07-29: Skip authenticates, reads our entity metadata, generates a
component, and renders it in MJ Explorer over MoreCheese data.

Skip is **not** part of this app. It installs as its own MJ Open App
([Skip-Client-Open-App](https://github.com/BlueCypress/Skip-Client-Open-App)) into whichever
**MJ instance** serves MoreCheese. Nothing about it belongs in `packages/` here — this document
exists because getting it working took four undocumented findings, recorded below so the next
person doesn't rediscover them.

## What Skip actually does

It does **not** answer data questions with numbers. It generates an interactive **component**
(a dashboard or report) that queries your data through MJ when it renders. The chat reply is
the component. Two consequences worth knowing before debugging:

- Asking "how many active members do we have?" gets you an offer to build a dashboard, not a
  count — that is the product working as designed, not a failure.
- The Brain never called back into our MJAPI in any test. The scoped callback key provisions
  correctly, but zero inbound requests ever arrived. The callback machinery may be unused for
  this flow.

## Prerequisites

| Requirement | Note |
|---|---|
| MJ **>= 5.45.1** | the Skip app's `mjVersionRange`. Our MJExplorer/MJAPI must match. |
| `ASK_SKIP_API_KEY` | issued by the Skip team; must be activated **for the Brain API** (see F1) |
| `MJ_BASE_ENCRYPTION_KEY` | `openssl rand -base64 32`, stable across restarts |
| A reachable MJAPI | only if callbacks are ever used — see the tunnel note at the end |

## Install

```sh
mj app install https://github.com/BlueCypress/Skip-Client-Open-App --verbose
```

Then set the environment and restart MJAPI. **The registry override is required** — without it
nothing Skip generates will load (F3):

```sh
ASK_SKIP_API_KEY=skip-…
REGISTRY_API_KEY_SKIP=skip-…            # same value; the client also derives it
MJ_BASE_ENCRYPTION_KEY=…
REGISTRY_URI_OVERRIDE_SKIP=https://brain-prod.askskip.ai/registry   # ← REQUIRED, see F3
```

A healthy boot logs all of:

```
Loading Open App server packages...
[skip-client] Skip Client Open App server package registered (SkipProxyAgent + middleware).
  Loaded Open App server package: @askskip/server (ran registerSkip)
[skip-client] Skip client ready: service account and required scopes present.
```

## Findings

### F1 — a key can be issued but not activated
The key returned 401 from **both** `brain-prod` and `brain-dev` for hours, with the *same*
response as a string we invented, while a request with no key returned a different error
("API key required"). That distinction is the diagnostic: if you get "invalid" rather than
"required", the key is arriving and being rejected. It started working once the Skip team
activated it — no change on our side.

### F2 — the setup wizard cannot store the key, and misreports why
`mj app install`'s post-install hook fails with a 15-second SQL timeout on `spCreateCredential`,
then reports *"the API Key credential type is not seeded"*. The type **is** seeded, and the same
stored procedure completes in **0.26s** when called directly. Harmless — the app falls back to
`ASK_SKIP_API_KEY` from the environment — but the error message sends you hunting the wrong thing.

### F3 — the hardcoded component registry host does not exist
`skip-records.ts:129` writes `URI = 'https://registry.askskip.ai/'` into
`__mj.ComponentRegistry`. That hostname is **NXDOMAIN** from every network we tried, including
Google's public resolver. Every generated component then fails server-side in MJAPI:

```
GetRegistryComponent(registryName:"Skip", namespace:"analytics/dashboards", …)
→ RegistryError: Network error: Unable to connect to registry
   at ComponentRegistryClient.makeRequest (@memberjunction/component-registry-client-sdk)
```

`NETWORK_ERROR` rather than 404/401 is the tell: the request never leaves the machine, which is
also why Skip's own server logs show nothing.

**The registry is live — at a different URL.** It is served by the Brain host under `/registry`,
and the client appends `/api/v1/components/{namespace}/{name}` (read
`ComponentRegistryClient.js` if you need to probe it). Confirmed:

```sh
curl -H "x-api-key: $ASK_SKIP_API_KEY" \
  'https://brain-prod.askskip.ai/registry/api/v1/components/analytics%2Fdashboards/MemberSegmentDashboard'
# → 200, ~193 KB, component code included
```

Fix with `REGISTRY_URI_OVERRIDE_SKIP` (above) and update the row to match:

```sql
UPDATE __mj.ComponentRegistry SET URI = 'https://brain-prod.askskip.ai/registry' WHERE Name = 'Skip';
```

Do **not** use `brain.askskip.ai` — it is a CNAME to a decommissioned Azure app and resolves to
nothing.

### F4 — never run `mj codegen` on a multi-app MJ instance
The installer prints "run `mj codegen`" on completion. On an instance hosting the BizApps
dependency apps, that regenerates **their** entity registrations, which their metadata-syncs own
(our integration finding F5). Skip's own schema (`skip_client`) contains no tables, so there is
nothing to generate. Skip the step.

## Running MJAPI locally (what we used)

A containerised MJAPI works but makes every environment change a rebuild. Running MJ from a
release is easier to iterate on:

```sh
mj install -t v5.45.1 --dir <somewhere> --skip-db --skip-start -y
```

Two gaps to patch afterwards, both caused by the install's database phase not running:

- `packages/GeneratedEntities` and `packages/GeneratedActions` are one-line re-exports of CodeGen
  output that does not exist. Stub `dist/generated/*.js` with `export {};` — MJ resolves entities
  from metadata at runtime, so nothing is lost (and see F4 for why not to generate them).
- MJExplorer expects `src/app/generated/class-registrations-manifest.ts` (export
  `CLASS_REGISTRATIONS`) and `generated-forms.module.ts` (export `GeneratedFormsModule`). Stub
  both; entities then render with the Explorer's generic forms.

`mj app upgrade` installs the npm packages but **does not** write the `dynamicPackages.server`
entry to `mj.config.cjs` — only `mj app install` does, and it refuses if the database already
records the app as installed (which it will, if another MJAPI installed it against the same
database). Add the block by hand in that case:

```js
dynamicPackages: {
  server: [{ PackageName: '@askskip/server', StartupExport: 'registerSkip', AppName: 'skip-client', Enabled: true }],
  client: []
},
```

## Callbacks and tunnels

Skip's design has the Brain call back into MJAPI (`MJAPI_PUBLIC_URL`) with a scoped key that
provisions itself on first request. For a laptop that means a tunnel, and a `trycloudflare` quick
tunnel dies whenever the machine sleeps — each death needs a new URL and an MJAPI restart. Use
`--protocol http2` if QUIC is unstable.

If the callback key ever goes stale (Skip stored a key that no longer matches), delete it and
restart; the provisioner mints a fresh one:

```sql
DELETE FROM __mj.APIKeyScope WHERE APIKeyID IN (
  SELECT ID FROM __mj.APIKey WHERE UserID = (SELECT ID FROM __mj.[User] WHERE Email = 'skip-service@skip.internal'));
DELETE FROM __mj.APIKey WHERE UserID = (SELECT ID FROM __mj.[User] WHERE Email = 'skip-service@skip.internal');
```

**For anything beyond a local trial, host MJAPI properly** (Azure App Service or similar) and set
`MJAPI_PUBLIC_URL` to its permanent hostname — no tunnel, no churn. Note that MoreCheese's data
would have to move with it: the demo database currently lives in a local SQL Server container.
