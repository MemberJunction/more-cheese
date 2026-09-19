#!/usr/bin/env node
/**
 * What a release pull request measures itself against.
 *
 * ── THE SHARED CAUSE ────────────────────────────────────────────────────────────
 * Every base-relative check in `changes.yml` was written for pull requests into `next`, and until
 * v1.2.0 no release pull request had ever run one. `main` is a pre-reorganization snapshot from
 * 2026-09-04: no `generated/`, no `config/`, and zero migrations — only `_README.md` and the
 * `.example` file. So against `main` as base, work that has been sitting on `next` for months
 * reads as brand new, and a check that asks "what does this pull request add?" gets the wrong
 * answer on the one pull request whose merge publishes to npm.
 *
 * A release branch is cut from the tip of `next` and carries only the version bump — no file under
 * `generated/`, `config/`, `data/` or `migrations/` differs from the `next` it came from. That is
 * why `next` is the honest base and not a dodge: it is literally the release branch's predecessor,
 * so the comparison stays real instead of being skipped or waved through.
 *
 * ── INCIDENT 1 — Loom corpus stability (PR #65) ─────────────────────────────────
 *   [✗ FAIL] Corpus Stability (base ⊆ head) (n=0)
 *          Evaluation failed: No data files found in git tree at commit c6303665 for path 'generated'
 *
 * Loom picks its base from `GITHUB_BASE_REF` and reports an empty base tree as `status: 'error'`,
 * not as "nothing to compare". The same gate passed on PR #64 into `next` at n=129134, which is
 * what proved the corpus was never the problem: the BASE was. Fixed by `resolveCorpusBaseRef`
 * below, and confirmed in production on PR #67 — the override fired and the gate ran at n=129134
 * instead of n=0.
 *
 * ── INCIDENT 2 — the migration gates (PR #67) ───────────────────────────────────
 *   ✗ migrations/B202607141200__v1.0.0_MoreCheese_Baseline.sql
 *       line 16030: EXEC [${mjSchema}].[spDeleteUnneededEntityFields] …
 *
 * `check-migration-no-prune.mjs` reports only the lines a pull request ADDS, which is deliberate:
 * it is a gate against new emissions, and the baseline's four pre-existing calls predate it by two
 * months (baseline 2026-07-14, gate 2026-09-10). That grandfathering is implemented entirely by
 * the added-lines filter — so against a `main` with no migrations at all, every line of all six
 * migrations reads as added and the filter evaporates. The flagged content is not new, is not
 * reachable by this release, and may not be edited anyway: an applied migration is immutable
 * (`.claude/rules/migrations.md`).
 *
 * `changes.yml` resolves the base ONCE, in `Resolve current base branch tip`, and five checks read
 * that one output — so this is fixed at the chokepoint rather than per gate. Under a `next` base
 * the release branch shows no migration changes, which makes `has_migrations` false and skips the
 * filename and timestamp checks explicitly, instead of running them against a fiction. The gates
 * stay live: a release branch that somehow DID add a migration still shows it as added against
 * `next`, and still fails.
 *
 * ── WHY A MODULE, NOT WORKFLOW YAML ─────────────────────────────────────────────
 * docs/release.md rejects release logic that lives in workflow YAML, because a decision only ever
 * taken while cutting a release cannot be proven by anything short of cutting one. Both incidents
 * above are that exact failure mode, found in production, one release cut at a time. The decision
 * lives here so `release-base-ref.spec.mjs` can prove it for free.
 *
 * ── WHY TWO EXPORTS ─────────────────────────────────────────────────────────────
 * Both callers ask the same question and share the predicate and the branch names below. They
 * differ only in what they must SAY when they override, and those sentences are the whole value of
 * the notice in the CI log — "main predates the generated/ corpus" explains nothing about
 * migrations, and vice versa. The duplication is in the prose, deliberately; the decision is not
 * duplicated at all.
 */

/** The branch a release pull request targets. Its predecessor is always `RELEASE_SOURCE`. */
const RELEASE_TARGET = 'main';
const RELEASE_SOURCE = 'next';

/**
 * Is this CI run a release pull request — the one case where the base branch is not the right
 * thing to measure against?
 *
 * @param {Record<string, string | undefined>} env  Usually `process.env`.
 */
const isReleasePullRequest = (env) => env?.GITHUB_BASE_REF === RELEASE_TARGET;

/**
 * Which commit Loom's "Corpus Stability (base ⊆ head)" check should measure the corpus against.
 *
 * Delivered to Loom as `GITHUB_BASE_REF`, because Loom's `validate` exposes only `-p`, `-c` and
 * `-d` at the pinned commit (63aec01f) — `baseRef` and `skipBaseCheck` exist on `executeValidate`
 * but are not wired to flags. If a later Loom adds `--base-ref`, this should move to it; the
 * decision is what matters, not how it is delivered.
 *
 * @param {Record<string, string | undefined>} env  Usually `process.env`.
 * @returns {{ ref: string, reason: string } | null}  `null` means "leave Loom's own resolution
 *   alone" — every base except a release pull request's is already correct, and overriding one
 *   would hide a real corpus regression rather than reveal one.
 */
export function resolveCorpusBaseRef(env) {
  if (!isReleasePullRequest(env)) return null;
  return {
    ref: RELEASE_SOURCE,
    reason:
      `Release pull request into ${RELEASE_TARGET}: measuring corpus stability against ` +
      `${RELEASE_SOURCE}, which this release branch was cut from. ${RELEASE_TARGET} predates the ` +
      `generated/ corpus, so Loom would read its tree as empty and fail the gate.`,
  };
}

/**
 * Which branch tip the base-relative checks in `changes.yml` should measure against.
 *
 * @param {Record<string, string | undefined>} env  Usually `process.env`.
 * @returns {{ ref: string, reason: string } | null}  `null` means "use the pull request's own
 *   base" — on every pull request into `next` that is already the right answer, and overriding it
 *   would blind the gates to exactly what the pull request adds.
 */
export function resolveGateBaseRef(env) {
  if (!isReleasePullRequest(env)) return null;
  return {
    ref: RELEASE_SOURCE,
    reason:
      `Release pull request into ${RELEASE_TARGET}: measuring the base-relative gates against ` +
      `${RELEASE_SOURCE}, which this release branch was cut from. ${RELEASE_TARGET} carries no ` +
      `migrations, so against it every migration already on ${RELEASE_SOURCE} reads as added by ` +
      `this pull request and the gates judge months-old content as new.`,
  };
}

/**
 * CLI form, consumed by `changes.yml`: the resolved ref on stdout so `$(…)` can capture it, the
 * reason on stderr so a substitution never swallows the one line explaining what just happened.
 */
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const base = process.env.GITHUB_BASE_REF;
  if (!base) {
    // Without this, the caller gets an empty ref and `git fetch origin ""` fails a dozen lines
    // later with nothing pointing back to here. changes.yml only ever runs on pull_request.
    console.error('::error::GITHUB_BASE_REF is unset — this resolves a pull request base and has nothing to resolve without one.');
    process.exit(1);
  }
  const override = resolveGateBaseRef(process.env);
  if (override) console.error(`::notice::${override.reason}`);
  console.log(override ? override.ref : base);
}
