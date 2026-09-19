/**
 * Which commit Loom's "Corpus Stability (base ⊆ head)" gate should measure the corpus against.
 *
 * THE INCIDENT. Release PR #65 (`release/v1.2.0` -> `main`) failed `changes_and_migrations` on:
 *
 *   [✗ FAIL] Corpus Stability (base ⊆ head) (n=0)
 *          Evaluation failed: No data files found in git tree at commit c6303665 for path 'generated'
 *
 * Loom picks its base from `GITHUB_BASE_REF` first. On a release pull request that is `main`, and
 * `main` in this repo is a pre-reorganization snapshot with ZERO files under `generated/` — the
 * corpus moved there after main last moved. Loom reports an empty base tree as `status: 'error'`,
 * not as "nothing to compare", so the gate failed. The same gate passed on PR #64 into `next` at
 * n=129134, which is what proves the corpus was never the problem: the BASE was.
 *
 * WHY `next` IS THE RIGHT ANSWER, not a dodge. A release branch is cut from the tip of `next` and
 * carries only the version bump — no file under `generated/`, `config/` or `data/` differs from
 * the `next` it came from. So `next` is literally the corpus's predecessor, and pointing the gate
 * at it makes the comparison real (base ⊆ head over ~129k records) instead of skipping it on the
 * one pull request whose merge publishes that corpus to npm.
 *
 * WHY AN ENV VAR. Loom's `validate` command exposes only `-p`, `-c` and `-d` at the pinned commit
 * (63aec01f); `baseRef` and `skipBaseCheck` exist on `executeValidate` but are not wired to flags.
 * `GITHUB_BASE_REF` is the only channel this repo has. If a later Loom adds `--base-ref`, this
 * should move to it — the decision below is what matters, not how it is delivered.
 *
 * WHY A MODULE. docs/release.md rejects release logic that lives in workflow YAML, because a
 * decision only ever taken while cutting a release cannot be proven by anything short of cutting
 * one. `scripts/validate-loom-data.mjs` runs its whole audit at import, so the decision could not
 * be tested inside it. Hence this file and `release-base-ref.spec.mjs`.
 */

/** The branch a release pull request targets. Its corpus predecessor is `RELEASE_SOURCE`. */
const RELEASE_TARGET = 'main';
const RELEASE_SOURCE = 'next';

/**
 * @param {Record<string, string | undefined>} env  Usually `process.env`.
 * @returns {{ ref: string, reason: string } | null}  `null` means "leave Loom's own resolution
 *   alone" — every base except a release pull request's is already correct, and overriding one
 *   would hide a real corpus regression rather than reveal one.
 */
export function resolveCorpusBaseRef(env) {
  if (env?.GITHUB_BASE_REF !== RELEASE_TARGET) return null;
  return {
    ref: RELEASE_SOURCE,
    reason:
      `Release pull request into ${RELEASE_TARGET}: measuring corpus stability against ` +
      `${RELEASE_SOURCE}, which this release branch was cut from. ${RELEASE_TARGET} predates the ` +
      `generated/ corpus, so Loom would read its tree as empty and fail the gate.`,
  };
}
