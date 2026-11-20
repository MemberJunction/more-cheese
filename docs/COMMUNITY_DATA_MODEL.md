# ICF BizApps Community Data Model & Operator Runbook

MoreCheese models the **International Cheese Federation (ICF)** online member community on top of MemberJunction's [`@mj-biz-apps/community-*`](https://github.com/MemberJunction/bizapps-community) and [`@mj-biz-apps/collaboration-*`](https://github.com/MemberJunction/bizapps-collaboration) Open Apps.

Rather than static `config/` JSON fixtures, the community dataset is deterministically generated from a declarative Loom ruleset ([`data/ruleset/community-rules.json`](../data/ruleset/community-rules.json)) into [`data/community/community.plan.json`](../data/community/community.plan.json), and replayed into a live MJ database through server entities by [`scripts/load-community.mjs`](../scripts/load-community.mjs).

---

## Architecture Overview

```
data/ruleset/community-rules.json  ──┐
data/spaces/spaces.plan.json       ──┼──▶ scripts/build-community-plan.mjs ──▶ data/community/community.plan.json
generated/people, orders, heroes   ──┘                                                   │
                                                                                         ▼
                                   scripts/load-community.mjs ──▶ MJ Server Entities + Backdate T-SQL
```

1. **Plan separation**: Community entities live in `__mj_BizAppsCommunity` and `__mj_BizAppsCollaboration` (never in MoreCheese's own `migrations/`). All primary keys in `generated/` and `config/` remain untouched.
2. **Authoritative entity writes**: Community server entities enforce parent-before-child post hierarchies, moderation & pin/lock permissions, Q&A canon verification by moderators, caller-owned reactions, and 100-point quadratic ideation wallet budgets. Replaying through `load-community.mjs` exercises those rules directly and then backdates `__mj_CreatedAt` / `__mj_UpdatedAt` to the historical 2019–2026 timeline.

---

## The 9 ICF Community Spaces & 29 Forums

Every Community Space is an IS-A extension (`MJ_BizApps_Community: Community Spaces`) of a Collaboration Space (`MJ_BizApps_Collaboration: Spaces`):

| Space Key | Origin | Community Kind | Forums | Default Forum |
|---|---|---|---|---|
| `icf-member-commons` | Created by `load-community.mjs` | Association Wide | 5 | `commons-town-square` |
| `chapter-california` | Attached to `spaces.plan.json` | Special Interest Group | 3 | `ca-general` |
| `chapter-wisconsin` | Attached to `spaces.plan.json` | Special Interest Group | 3 | `wi-general` |
| `chapter-new-england` | Attached to `spaces.plan.json` | Special Interest Group | 3 | `ne-general` |
| `chapter-pacific-northwest` | Attached to `spaces.plan.json` | Special Interest Group | 3 | `pnw-general` |
| `chapter-france` | Attached to `spaces.plan.json` | Special Interest Group | 3 | `fr-general` |
| `committee-food-safety` | Attached to `spaces.plan.json` | Working Group | 3 | `fs-announcements-discussion` |
| `committee-education` | Attached to `spaces.plan.json` | Working Group | 3 | `edu-general-discussion` |
| `committee-awards-and-competition` | Attached to `spaces.plan.json` | Working Group | 3 | `wcc-general-discussion` |

Across the **9 Community Spaces**, the **29 Forums** exercise all 6 seeded `ForumType` archetypes from `bizapps-community`:

- **`general-discussion`** — Town squares, chapter announcements, and member introductions.
- **`qa-knowledge-base`** — Cheesemaker, herd, cave, and FSMA Q&A threads with accepted answers and moderator-verified `Canon Verified` / `Partially Outdated` epistemic status.
- **`ideation-campaign`** — `ForumIdeaCampaign` IS-A forums running 100-point quadratic voting (`QuadraticVotes = sqrt(PointsAllocated)`) across 4 federation campaigns.
- **`playbooks-and-docs`** — Living SOPs, unit-economics workbooks, and sensory calibration decks backed by `MJ: Artifacts`, `MJ: Artifact Versions`, `Space Items`, and `ForumArtifactPost`.
- **`peer-case-rounds`** — Structured Situation / Action / Outcome case reviews (`ForumCasePost`), including moderator-confirmed anonymized recall/Listeria cases.
- **`live-events-and-amas`** — Scheduled town halls and masterclasses (`ForumAMAPost`) with host attribution and recaps.

---

## Declarative Loom Ruleset (`data/ruleset/community-rules.json`)

- **Era Multipliers (2019–2026+)**: Modulates monthly thread volume across ICF's historical eras (founding growth, 2020 pandemic wholesale-to-D2C pivot, 2021–2023 post-pandemic expansion, 2024–2025 regulatory/recall focus, and 2026 stabilization), with `defaultPost2026Multiplier` for ongoing months.
- **Topic Taxonomy (52 slugs)**: Domain-scoped `ForumTopicTag` records covering Affinage & Caves, Cultures & Make-Room, Food Safety, Milk & Herd Science, Regulation & Policy, Creamery Business, Education & CCP, Competition & Awards, Sustainability, Retail & Logistics, and Events & Chapters.
- **Hero Participation & Exclusions**: Pins hero activity weights and canon reviewers (`HERO-ICF-001`, `HERO-ICF-004`, `HERO-ICF-006`–`009`, `HERO-ICF-011`, `HERO-ICF-013`, `HERO-ICF-015`) while strictly excluding `HERO-ICF-012` (planted duplicate) and the presenter account (`demo.user@morecheese.org`) from historical authorship.
- **100-Point Quadratic Ideation**: Enforces per-campaign `DefaultBudgetPoints` (100), `MaxPointsPerIdea` caps, and cumulative wallet spending across months.
- **Living Thread Synthesis**: Populates `SummaryMarkdown`, `SummaryGeneratedAt`, and `SummaryReplyWatermark` whenever a root thread reaches its `ForumType` synthesis threshold.

---

## Monthly Growth Workflow

`scripts/monthly-run.mjs` tracks the community plan horizon (`community.asOf`) independently alongside blog, Loom plan, and internal staff cycles:

```bash
# 1. Inspect due monthly work (Step 4 checks data/community/community.plan.json)
node scripts/monthly-run.mjs status --today 2026-12-01

# 2. Extend the community plan append-only through the completed month
npm run community:plan -- --through 2026-11

# 3. Verify determinism & byte-identity
npm run community:plan -- --check
```

Extending `--through YYYY-MM` is strictly **append-only**: all prior cycles (`2019-01`..`2026-10`) retain identical deterministic UUIDv5 primary keys, timestamps, and cumulative quadratic wallet totals.

---

## `scripts/load-community.mjs` Operator Runbook

### Prerequisites (Live Load)

1. Target MJ host (`--mj <path>`) has `mj.config.cjs` configured with `@mj-biz-apps/collaboration-server` and `@mj-biz-apps/community-server` in `dynamicPackages.server`.
2. MoreCheese `generated/` and `config/` metadata (including `config/users/` and the presenter user) have been pushed via `mj sync push`.
3. `scripts/load-spaces.mjs` has been run so the 8 chapter and committee Collaboration Spaces exist.

### Commands

```bash
# Offline validation & dry-run (no --mj or DB connection required)
node scripts/load-community.mjs --dry-run
node scripts/load-community.mjs --dry-run --limit 25

# Full live replay against a target MJ host, seating the presenter across all spaces/forums
node scripts/load-community.mjs --mj ../MJ --presenter demo.user@morecheese.org

# Smoke subset live replay (preserves parent-before-child post closure)
node scripts/load-community.mjs --mj ../MJ --limit 50
```

### Execution Order & Idempotency

1. **Spaces**: Creates the flagship `icf-member-commons` Collaboration Space and its seats (if absent), and attaches `CommunitySpace` IS-A rows onto all 9 Collaboration Spaces.
2. **Forums & Setup**: Creates all 29 `Forum` rows (including 4 `ForumIdeaCampaign` IS-A rows with `VotingClosesAt` initially deferred), sets `CommunitySpace.DefaultForumID`, and loads `ForumMember`, `ForumTopicTag`, and `CommunityMemberProfile`.
3. **Presenter Seating**: Seats `--presenter` as an active Collaboration `admin`, `forum-admin` on all 29 forums, `CommunityMemberProfile` in all 9 spaces, and `ForumSubscription` across all 29 forums.
4. **Posts & Subtypes**: Topologically sorts `ForumPost` records parent-before-child and saves `ForumQuestionPost`, `ForumAnswerPost`, `ForumIdeaPost`, `ForumCasePost`, `ForumAMAPost`, and `ForumArtifactPost` (including `MJ: Artifacts`, `MJ: Artifact Versions`, and `Space Items`), then applies moderator canon verification and question acceptance.
5. **Engagement & Wallet**: Saves `ForumPostTag`, caller-owned `ForumPostReaction`, caller-owned `ForumIdeaAllocation` (then pins `ForumIdeaCampaign.VotingClosesAt`), and `ForumSubscription`.
6. **Historical Backdating**: Executes trigger-guarded (`DISABLE TRIGGER ALL` / `ENABLE TRIGGER ALL`) batched T-SQL updates to align `__mj_CreatedAt`, `__mj_UpdatedAt`, `LastActivityAt`, `SummaryGeneratedAt`, `VerifiedAt`, and `ResolvedAt` with the plan's 2019–2026 timestamps.

Re-running `load-community.mjs` is safe and idempotent: existing spaces, forums, posts, tags, reactions, allocations, and subscriptions are left intact.
