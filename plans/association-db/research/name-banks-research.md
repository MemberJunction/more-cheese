# Name Banks — Research Brief (fixing the mad-libs problem)

**Status:** research complete + banks AUTHORED and wired (2026-07-13) — `datagen/projects/morecheese/banks/{orgs,people}.json`; component clearance run via web-search agents, flags culled.
**Problem (now fixed):** `banks.mjs` BUILT names by chaining cheese words ("Whey Rind
Creamery Co.") — structurally the same weakness as Faker's company provider; it read
instantly fake. **The fix:** names become AUTHORED content (like heroes) — large
curated JSON banks, reviewed in git, safety-cleared once at authoring time; the generator
samples without replacement from its dice. Determinism and zero-dependency unchanged.

---

## 1. How real artisan cheese/dairy businesses are named

Corpus: ACS 2024/2025 competition winner lists, state guild directories, industry supplier
directories.

| Pattern | Real examples | Register |
|---|---|---|
| [Family surname] + Farmstead / Dairy / Cheese | Fantello Farmstead Creamery, Stuyt Dairy, Marieke Gouda | farmstead; often immigrant surnames (Dutch/Italian/Portuguese are common in US dairying) |
| [Place/toponym] + Creamery / Cheese Co. | Nicasio Valley Cheese Co., Oakdale Cheese, Cabot Creamery | mid-size producer |
| [Landscape compound] + Farm / Hollow / Meadow | Jasper Hill Farm, Nettle Meadow, Pleasant Lane Farms | farmstead/romantic: plant/animal/mineral + hill/meadow/brook/ridge |
| [Animal or persona] + Creamery / Farm | Cowgirl Creamery, Fat Sheep Farm, Beehive Cheese | whimsical artisan |
| State/region + generic | Vermont Creamery, Prairie Farms | co-op / commodity scale |
| European loanwords | Fromagerie [X] (FR/QC), Caseificio (IT), Käserei (DE/CH), Kaasboerderij (NL) | regional flavoring |
| Suppliers | Dairy Connection, Glengarry Cheesemaking Supply, New England Cheesemaking Supply Co. | [Region] + Cheesemaking Supply; [Function] + Connection/Systems |
| Retailers | — | [Name]'s Cheese Shop, [Place] Cheesemonger, [Surname] & Daughters Fine Cheese |
| Guilds/educators | California Artisan Cheese Guild, Vermont Cheese Council | [State] Cheese Guild/Council; [Place] Cheese School; Center for Dairy [X] |

**The confirmed anti-pattern:** real names almost never chain two cheese words. They anchor
in *surname, place, or landscape*, with the cheese term appearing once, as the generic.
(Cheese *product* names are a different morphology — single evocative words like "Bijou",
"Red Hawk" — a separate bank if products ever get names.)

Sources: cheesesociety.org 2024/2025 winners PDFs · cacheeseguild.org · vtcheese.com ·
mainecheeseguild.org · cheesereporter.com/supplier-directory · culturecheesemag.com.

## 2. Person names

Public-domain building blocks:
- **US Census 2010 surnames** (162k surnames with frequency + origin percentages) —
  census.gov/topics/population/genealogy/data/2010_surnames.html
- **SSA baby names by birth year** (1880–present) — ssa.gov/oact/babynames/limits.html
- EU/APAC seeds: Faker locale data files (MIT), github.com/sigpwned/popular-names-by-country-dataset;
  sanity-check against forebears.io (commercial — inform, don't scrape).

Best-practice findings:
1. **Weight by frequency** — uniform sampling over-represents rare names and reads fake
   (Faker's own `use_weighting` default exists for this reason). Coarse tiers
   (common/uncommon) suffice at n=2000.
2. **Condition first names on birth decade** — a 58-year-old draws from ~1968 SSA data
   (Debra, Gary), a 28-year-old from ~1998 (Emily, Tyler). The single biggest realism lever
   for a membership dataset.
3. **Origin-consistent pairing** — pick an origin bucket first, then draw first+last within
   it ("Hiroshi O'Sullivan" at scale reads fake); allow ~5–10% deliberate cross-bucket mixing.
4. Family clusters (same surname, same org) fit a family-farm-heavy industry.
5. Decide + document name ordering for JP/KR/CN names (family-name-first conventions).

## 3. Safety/hygiene (why fake-but-plausible is a requirement, not a style)

- **Vendor precedent:** Microsoft's fictional stable (Contoso, Fabrikam, Northwind,
  Adventure Works…) and Salesforce's (Cloud Kicks, Ursa Major Solar) — plausible morphology,
  **invented lexical core**, reused consistently. Emails/domains: RFC 2606 reserved domains
  (`example.com`) or one registered demo domain — never `<orgname>.com`.
- **The specific hazard for OUR demo:** we depict orgs dissolving, being acquired, going
  delinquent. Attaching those events to an identifiable real business is the classic
  trade-libel fact pattern — and the artisan-cheese namespace is DENSE with small real
  businesses holding unregistered common-law marks that a USPTO search won't surface.
  So the highest-value check is a plain web search, not the trademark database.

**Per-name clearance checklist (recorded in each bank entry as a `cleared` field):**
1. Web search `"<exact name>"` and `"<distinctive core>" cheese|creamery|dairy` — no real
   business in or near the industry.
2. USPTO tmsearch on the distinctive element (class 29; 35/41 as relevant); EUIPO for
   EU-flavored names.
3. No famous marks or near-misses/sound-alikes (dilution needs no confusion).
4. No PDO/protected names (Roquefort etc.) as the distinctive element.
5. **Invented toponyms only** ("Stonewick" safe; "Nicasio Valley" taken because Nicasio is real).
6. No real people (check surname+firstname org names against real cheesemakers).
7. Re-clear on any rename; CI check that every entry carries a `cleared` stamp.
8. **Stricter second pass for names slated for negative storylines** (dissolution,
   delinquency) — that's where the defamation-adjacent risk concentrates.

## 4. Mechanics: curated bank beats grammar and runtime-LLM

- Grammar/templates (current): unbounded but low realism ceiling — Faker's company provider
  has the same architecture and the same reputation.
- Runtime LLM: non-deterministic, unreviewable, and can't be trademark-cleared in advance.
  Disqualified twice over.
- **Curated bank + seeded sample-without-replacement:** deterministic, git-reviewable,
  cleared once, no runtime collision handling (Faker's `unique` retry/exception path and its
  birthday-paradox warning simply don't arise). The bank IS the version — reproducibility
  Faker explicitly can't promise across releases.

## Recommended design (for the authoring step)

- **Org banks: ~800–900 names for ~300 org slots** (~2.5–3× headroom; extra in producers
  because the demo churns orgs). Registers: producer.farmstead / producer.creamery /
  producer.coop / producer.international / retailer / supplier / distributor / educator /
  association — allocated to match `orgs` mix in the ruleset.
- **Shared invented-toponym pool** so producer, retailer, and festival names cross-reference
  the same fictional geography (big realism win, and it concentrates the "is it real?"
  clearance onto one list).
- **People: bank components, not full names** — ~120–150 surnames + ~80–100 first names per
  origin bucket (buckets weighted to the ruleset's geography mix), first names tagged with
  birth decades. ~1,000–1,200 curated tokens → >100k combinations; uniqueness enforced on
  (first, last) pairs only.
- Entry shape: `{ name, register, pattern, region_flavor, short_name, cleared: {web, uspto, by} }`.
- Banks live per-project (`datagen/projects/<p>/banks/*.json`) — a second project brings its
  own; the generator's only contract is "sample without replacement from the declared bank."
