// Tier-2 demo for ENGINEERS: a self-contained data inspector over the generated packs.
// Usage: node demo.mjs [--out out]   (run generate.mjs first) → open out/dashboard.html
//
// What it's for: seeing and VALIDATING the generated data —
//   · Gates      — the full validator output, embedded verbatim
//   · Tables     — every pack table, raw rows, filter + sort
//   · Member     — drill into any member: profile, hidden dials, period timeline,
//                  joined registrations, per-member integrity checks
//   · Causal     — verify the invisible dials expressed in behavior (θ vs activity,
//                  renewal by tenure/auto-renew/employer-event/tier, no-show splits)
// All data embedded; opens from a file, offline. Latents come from validator-private
// files that are never part of an install.

import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRuleset } from './lib/config.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a, i, all) => (a.startsWith('--') ? [a.slice(2), all[i + 1]] : null)).filter(Boolean));
const OUT = join(HERE, args.out ?? 'out');
const load = (pack, table) => JSON.parse(readFileSync(join(OUT, 'packs', pack, `${table}.json`), 'utf8'));

const run = JSON.parse(readFileSync(join(OUT, 'run.json'), 'utf8'));
const R = await loadRuleset(run.scenario, run.project); // the inspector shows the SAME world the run was built for

// run the real validator and embed its verdicts (single source of truth)
let gateLines;
try {
  gateLines = execFileSync(process.execPath, [join(HERE, 'validate.mjs'), '--out', args.out ?? 'out'], { encoding: 'utf8' });
} catch (e) {
  gateLines = e.stdout ?? 'validator failed to run';
}

const DATA = {
  run, ruleVersion: R.version,
  gates: gateLines.trim().split('\n'),
  manifests: Object.fromEntries(['common', 'membership', 'events'].map((p) => [p, JSON.parse(readFileSync(join(OUT, 'packs', p, 'manifest.json'), 'utf8'))])),
  tables: {
    'common/people': load('common', 'people'),
    'common/organizations': load('common', 'organizations'),
    'membership/membership_periods': load('membership', 'membership_periods'),
    'events/events': load('events', 'events'),
    'events/event_registrations': load('events', 'event_registrations'),
    'learning/courses': load('learning', 'courses'),
    'learning/enrollments': load('learning', 'enrollments'),
    'orders/products': load('orders', 'products'),
    'orders/orders': load('orders', 'orders'),
    'orders/order_lines': load('orders', 'order_lines'),
    'orders/payments': load('orders', 'payments'),
  },
  latents: JSON.parse(readFileSync(join(OUT, 'validation-latents.json'), 'utf8')),
  renewalEvents: JSON.parse(readFileSync(join(OUT, 'validation-events.json'), 'utf8')),
};

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>datagen inspector — seed ${run.seed}</title>
<style>
:root{--bg:#14161a;--panel:#1c1f26;--panel2:#22262f;--ink:#dde3ea;--sub:#8a93a3;--acc:#e8b23e;--ok:#59b26e;--bad:#e06c55;--blue:#5a94c9;--line:#2c313c;--mono:'SF Mono',ui-monospace,Menlo,Consolas,monospace}
*{box-sizing:border-box;margin:0}
body{font:13.5px/1.45 var(--mono);background:var(--bg);color:var(--ink);padding:0 0 60px}
header{padding:14px 22px;border-bottom:1px solid var(--line);display:flex;gap:18px;align-items:baseline;flex-wrap:wrap;position:sticky;top:0;background:var(--bg);z-index:5}
header b{color:var(--acc);font-size:15px} header .meta{color:var(--sub);font-size:12px}
nav{display:flex;gap:4px;margin-left:auto}
nav button{font:12.5px var(--mono);background:var(--panel);color:var(--sub);border:1px solid var(--line);padding:6px 14px;border-radius:7px;cursor:pointer}
nav button.on{background:var(--panel2);color:var(--acc);border-color:var(--acc)}
main{padding:18px 22px}
.view{display:none}.view.on{display:block}
.grid{width:100%;border-collapse:collapse;font-size:12.5px}
.grid th{position:sticky;top:53px;background:var(--panel2);color:var(--sub);text-align:left;padding:7px 10px;border-bottom:1px solid var(--line);cursor:pointer;white-space:nowrap}
.grid th:hover{color:var(--acc)}
.grid td{padding:5px 10px;border-bottom:1px solid var(--line);white-space:nowrap;max-width:340px;overflow:hidden;text-overflow:ellipsis}
.grid tr:hover td{background:var(--panel)}
.grid td.num{text-align:right;color:var(--blue)}
.grid td.link{color:var(--acc);cursor:pointer;text-decoration:underline dotted}
.bar{display:flex;gap:10px;align-items:center;margin:0 0 12px;flex-wrap:wrap}
input,select{font:13px var(--mono);background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:7px;padding:7px 11px}
input{min-width:280px}
.hint{color:var(--sub);font-size:12px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:14px}
.cards{display:flex;gap:14px;flex-wrap:wrap}.cards .card{flex:1 1 340px}
h3{font-size:12.5px;color:var(--sub);text-transform:uppercase;letter-spacing:.07em;margin-bottom:10px}
.ok{color:var(--ok)}.bad{color:var(--bad)}.acc{color:var(--acc)}
.kv{display:grid;grid-template-columns:auto 1fr;gap:3px 16px;font-size:12.5px}
.kv span:nth-child(odd){color:var(--sub)}
pre{font:12px var(--mono);white-space:pre-wrap}
.tl{display:flex;gap:3px;margin:8px 0;flex-wrap:wrap}
.tl .seg{height:22px;border-radius:4px;min-width:34px;display:flex;align-items:center;justify-content:center;font-size:10.5px;padding:0 6px}
svg{display:block;max-width:100%}
.pill{border:1px solid var(--line);border-radius:99px;padding:1px 9px;font-size:11px;color:var(--sub)}
</style></head><body>
<header><b>▦ datagen inspector</b>
<span class="meta">seed <b class="acc">${run.seed}</b> · release ${run.releaseDate} · ruleset v${R.version} · N=${run.n}</span>
<nav>
<button data-v="gates" class="on">Gates</button><button data-v="tables">Tables</button><button data-v="member">Member</button><button data-v="causal">Causal checks</button>
</nav></header>
<main>
<section class="view on" id="v-gates"></section>
<section class="view" id="v-tables"></section>
<section class="view" id="v-member"></section>
<section class="view" id="v-causal"></section>
</main>
<script>
const D = ${JSON.stringify(DATA)};
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '∅').replace(/[&<>]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const latentOf = new Map(D.latents.map((l) => [l.m, l]));
const eventOf = new Map(D.tables['events/events'].map((e) => [e.EventKey, e]));
const periodsOf = new Map();
for (const p of D.tables['membership/membership_periods']) { (periodsOf.get(p.MemberNumber) ?? periodsOf.set(p.MemberNumber, []).get(p.MemberNumber)).push(p); }
const regsOf = new Map();
for (const r of D.tables['events/event_registrations']) { (regsOf.get(r.MemberNumber) ?? regsOf.set(r.MemberNumber, []).get(r.MemberNumber)).push(r); }

// nav
document.querySelectorAll('nav button').forEach((b) => b.onclick = () => {
  document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.id === 'v-' + b.dataset.v));
});

// ---------- GATES: the validator's verdicts, verbatim, plus pack manifests ----------
{
  const lines = D.gates.map((l) => l.startsWith('✅') ? '<div class="ok">' + esc(l) + '</div>' : l.startsWith('❌') ? '<div class="bad">' + esc(l) + '</div>' : '<div class="acc" style="margin-top:8px"><b>' + esc(l) + '</b></div>').join('');
  const mf = Object.values(D.manifests).map((m) => '<div class="card"><h3>pack: ' + m.name + '</h3><div class="kv"><span>dependsOn</span><span>[' + m.dependsOn.join(', ') + ']</span>' + Object.entries(m.rowCounts).map(([t, n]) => '<span>' + t + '</span><span>' + n.toLocaleString() + ' rows</span>').join('') + '</div></div>').join('');
  $('#v-gates').innerHTML = '<div class="cards"><div class="card" style="flex:2 1 480px"><h3>validator output (re-run at build time — same code, same verdicts)</h3><pre>' + lines + '</pre></div><div style="flex:1 1 300px">' + mf + '</div></div>';
}

// ---------- TABLES: raw rows, filter + click-to-sort; member keys drill through ----------
{
  const el = $('#v-tables');
  el.innerHTML = '<div class="bar"><select id="tsel">' + Object.keys(D.tables).map((t) => '<option>' + t + '</option>').join('') + '</select><input id="tfilter" placeholder="filter rows (substring, any column)…"><span class="hint" id="tcount"></span></div><div id="tgrid" style="overflow-x:auto"></div>';
  let sortCol = null, sortDir = 1;
  const render = () => {
    const table = $('#tsel').value, q = $('#tfilter').value.toLowerCase();
    let rows = D.tables[table];
    if (q) rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    if (sortCol) rows = [...rows].sort((a, b) => (a[sortCol] > b[sortCol] ? 1 : a[sortCol] < b[sortCol] ? -1 : 0) * sortDir);
    const cols = Object.keys(rows[0] ?? D.tables[table][0] ?? {});
    $('#tcount').textContent = rows.length.toLocaleString() + ' of ' + D.tables[table].length.toLocaleString() + ' rows' + (rows.length > 300 ? ' (showing first 300)' : '');
    $('#tgrid').innerHTML = '<table class="grid"><tr>' + cols.map((c) => '<th data-c="' + c + '">' + c + (sortCol === c ? (sortDir > 0 ? ' ▲' : ' ▼') : '') + '</th>').join('') + '</tr>' +
      rows.slice(0, 300).map((r) => '<tr>' + cols.map((c) => {
        const v = r[c];
        if (c === 'MemberNumber') return '<td class="link" onclick="openMember(\\'' + v + '\\')">' + esc(v) + '</td>';
        return '<td class="' + (typeof v === 'number' ? 'num' : '') + '">' + esc(typeof v === 'object' && v ? JSON.stringify(v) : v) + '</td>';
      }).join('') + '</tr>').join('') + '</table>';
    document.querySelectorAll('#tgrid th').forEach((th) => th.onclick = () => { const c = th.dataset.c; sortDir = sortCol === c ? -sortDir : 1; sortCol = c; render(); });
  };
  $('#tsel').onchange = () => { sortCol = null; render(); };
  $('#tfilter').oninput = render;
  render();
}

// ---------- MEMBER: drill-down with per-member integrity checks ----------
window.openMember = (m) => {
  document.querySelectorAll('nav button').forEach((x) => x.classList.toggle('on', x.dataset.v === 'member'));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('on', v.id === 'v-member'));
  $('#msearch').value = m; renderMember(m);
};
{
  $('#v-member').innerHTML = '<div class="bar"><input id="msearch" placeholder="member number or name — e.g. ICF-000102 or Chen"><span class="hint">try the heroes: ICF-000101 (Elena) · ICF-000102 (Marcus) — or click any MemberNumber anywhere</span></div><div id="mbody"></div>';
  $('#msearch').oninput = (e) => {
    const q = e.target.value.toLowerCase();
    if (q.length < 3) return;
    const p = D.tables['common/people'].find((x) => x.MemberNumber.toLowerCase() === q) ??
      D.tables['common/people'].find((x) => x.MemberNumber.toLowerCase().includes(q) || (x.FirstName + ' ' + x.LastName).toLowerCase().includes(q));
    if (p) renderMember(p.MemberNumber);
  };
}
function renderMember(m) {
  const p = D.tables['common/people'].find((x) => x.MemberNumber === m);
  if (!p) return;
  const lat = latentOf.get(m);
  const org = D.tables['common/organizations'].find((o) => o.OrgKey === p.OrgKey);
  const pers = (periodsOf.get(m) ?? []).slice().sort((a, b) => a.StartDate.localeCompare(b.StartDate));
  const rs = (regsOf.get(m) ?? []).slice().sort((a, b) => (eventOf.get(a.EventKey).Date).localeCompare(eventOf.get(b.EventKey).Date));

  // per-member integrity checks — the same rules the validator enforces globally
  const checks = [];
  checks.push(['periods start ≥ JoinDate', pers.every((x) => x.StartDate >= p.JoinDate)]);
  checks.push(['periods contiguous (renewals back-date, no gaps)', pers.every((x, i) => i === 0 || (new Date(x.StartDate) - new Date(pers[i - 1].EndDate)) === 86400000)]);
  checks.push(['lapse ⟹ CancellationDate = EndDate + ~2mo grace', pers.filter((x) => x.Status === 'Lapsed' && x.CancellationDate).every((x) => { const d = (new Date(x.CancellationDate) - new Date(x.EndDate)) / 86400000; return d > 55 && d < 66; })]);
  checks.push(['every registration inside a membership window', rs.every((r) => { const d = eventOf.get(r.EventKey).Date; return pers.some((x) => x.StartDate <= d && d <= x.EndDate); })]);

  const segColor = { Renewed: 'var(--ok)', Active: 'var(--ok)', PendingRenewal: 'var(--acc)', Lapsed: 'var(--bad)' };
  const tl = pers.map((x) => '<div class="seg" style="background:' + segColor[x.Status] + ';color:#14161a" title="' + x.StartDate + ' → ' + x.EndDate + ' (' + x.Status + ')">' + x.StartDate.slice(0, 4) + '</div>').join('');

  $('#mbody').innerHTML =
    '<div class="cards"><div class="card"><h3>' + esc(p.FirstName + ' ' + p.LastName) + ' — ' + m + (lat?.hero ? ' <span class="pill">HERO (pinned)</span>' : '') + '</h3>' +
    '<div class="kv"><span>segment</span><span>' + p.Segment + '</span><span>location</span><span>' + p.City + ', ' + p.State + ' (' + p.Region + ') @ ' + p.Latitude + ',' + p.Longitude + '</span><span>employer</span><span>' + (org ? esc(org.Name) + (org.LifecycleEvent ? ' <b class="bad">⚠ ' + org.LifecycleEvent.kind + ' ' + org.LifecycleEvent.year + '</b>' : '') : '—') + '</span><span>joined</span><span>' + p.JoinDate + '</span></div></div>' +
    '<div class="card"><h3>hidden dials (validator-private — never installed)</h3><div class="kv">' + (lat ? '<span>engagement θ</span><span class="' + (lat.theta > 0 ? 'ok' : 'bad') + '">' + lat.theta.toFixed(2) + '</span><span>affluence φ</span><span>' + lat.phi.toFixed(2) + '</span>' : '<span colspan=2>n/a</span>') + '<span>behavior check</span><span>' + rs.length + ' registrations, ' + rs.filter((r) => r.Attended).length + ' attended — ' + (lat && ((lat.theta > 0.5 && rs.length >= 4) || (lat.theta < -0.5 && rs.length <= 6) || Math.abs(lat.theta) <= 0.5) ? '<b class="ok">consistent with θ</b>' : '<b class="acc">eyeball it</b>') + '</span></div></div>' +
    '<div class="card"><h3>integrity checks (this member)</h3>' + checks.map(([n, ok]) => '<div class="' + (ok ? 'ok' : 'bad') + '">' + (ok ? '✅ ' : '❌ ') + n + '</div>').join('') + '</div></div>' +
    '<div class="card"><h3>membership timeline — ' + pers.length + ' periods</h3><div class="tl">' + tl + '</div><table class="grid"><tr><th>PeriodKey</th><th>Start</th><th>End</th><th>Status</th><th>CancellationDate</th><th>Reason</th><th>AutoRenew</th></tr>' + pers.map((x) => '<tr><td>' + x.PeriodKey + '</td><td>' + x.StartDate + '</td><td>' + x.EndDate + '</td><td style="color:' + segColor[x.Status] + '">' + x.Status + '</td><td>' + esc(x.CancellationDate) + '</td><td>' + esc(x.CancellationReason) + '</td><td>' + x.AutoRenew + '</td></tr>').join('') + '</table></div>' +
    '<div class="card"><h3>registrations — joined to events</h3><table class="grid"><tr><th>Date</th><th>Event</th><th>Type</th><th>Where</th><th>RegisteredOn</th><th>Attended</th></tr>' + rs.map((r) => { const e = eventOf.get(r.EventKey); return '<tr><td>' + e.Date + '</td><td>' + esc(e.Name) + '</td><td>' + e.EventType + '</td><td>' + (e.City ? e.City + ', ' + e.State : 'virtual') + '</td><td>' + r.RegisteredOn + '</td><td class="' + (r.Attended ? 'ok' : 'bad') + '">' + (r.Attended ? 'yes' : 'NO-SHOW') + '</td></tr>'; }).join('') + '</table></div>';
}

// ---------- CAUSAL: verify the dials expressed in behavior ----------
{
  const el = $('#v-causal');
  // θ vs activity scatter
  const pts = D.latents.filter((l) => !l.hero).map((l) => ({ t: l.theta, a: (regsOf.get(l.m) ?? []).length, m: l.m }));
  const W = 560, H = 300, pad = 40;
  const tMin = Math.min(...pts.map((p) => p.t)), tMax = Math.max(...pts.map((p) => p.t));
  const aMax = Math.max(...pts.map((p) => p.a));
  const sx = (t) => pad + ((t - tMin) / (tMax - tMin)) * (W - 2 * pad);
  const sy = (a) => H - pad - (a / aMax) * (H - 2 * pad);
  let scatter = '<svg viewBox="0 0 ' + W + ' ' + H + '">';
  scatter += '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" stroke="var(--line)"/><line x1="' + sx(0) + '" y1="' + pad + '" x2="' + sx(0) + '" y2="' + (H - pad) + '" stroke="var(--line)" stroke-dasharray="4 4"/>';
  scatter += '<text x="' + (W - pad) + '" y="' + (H - 12) + '" text-anchor="end" font-size="11" fill="var(--sub)">engagement θ (hidden) →</text><text x="14" y="' + pad + '" font-size="11" fill="var(--sub)">regs ↑</text>';
  for (const p of pts) scatter += '<circle cx="' + sx(p.t) + '" cy="' + sy(p.a) + '" r="3" fill="var(--acc)" opacity=".45"><title>' + p.m + ': θ=' + p.t.toFixed(2) + ', ' + p.a + ' regs</title></circle>';
  scatter += '</svg>';

  // splits from validation-events (renewal decisions with ground truth)
  const rate = (rows) => rows.length ? (rows.reduce((s, e) => s + e.renewed, 0) / rows.length) : NaN;
  const ev = D.renewalEvents;
  const splits = [
    ['auto-renew ON', rate(ev.filter((e) => e.autoRenew)), 'auto-renew OFF', rate(ev.filter((e) => !e.autoRenew)), 'authored β ' + ${JSON.stringify(R.membership.arrows.autoRenew.beta)}],
    ['employer event', rate(ev.filter((e) => e.employerEvent)), 'no employer event', rate(ev.filter((e) => !e.employerEvent)), 'authored β ' + ${JSON.stringify(R.membership.arrows.employerEvent.beta)}],
    ['enthusiast tier', rate(ev.filter((e) => e.enthusiastTier)), 'professional tiers', rate(ev.filter((e) => !e.enthusiastTier)), 'authored β ' + ${JSON.stringify(R.membership.arrows.enthusiastTier.beta)}],
    ['tenure above median', rate(ev.filter((e) => e.tenureZ > 0)), 'tenure below median', rate(ev.filter((e) => e.tenureZ <= 0)), 'authored β ' + ${JSON.stringify(R.membership.arrows.tenure.beta)}],
    ['θ top third', rate(ev.filter((e) => e.theta > 0.43)), 'θ bottom third', rate(ev.filter((e) => e.theta < -0.43)), 'authored β ' + ${JSON.stringify(R.membership.arrows.engagement.beta)}],
  ];
  const splitRows = splits.map(([la, va, lb, vb, note]) => '<tr><td>' + la + '</td><td class="num ok">' + (va * 100).toFixed(1) + '%</td><td>' + lb + '</td><td class="num">' + (vb * 100).toFixed(1) + '%</td><td class="num ' + (va - vb >= 0 ? 'ok' : 'bad') + '">' + ((va - vb) * 100).toFixed(1) + 'pt</td><td class="hint">' + note + '</td></tr>').join('');

  el.innerHTML = '<div class="cards">' +
    '<div class="card"><h3>the hidden dial expresses: θ (never stored) vs event registrations (stored)</h3>' + scatter + '<div class="hint">Each dot is a member. The upward drift IS the causal model working — an analyst who computes activity has unknowingly recovered θ.</div></div>' +
    '<div class="card"><h3>renewal-rate splits — raw group differences vs the authored arrows</h3><table class="grid"><tr><th>group A</th><th>rate</th><th>group B</th><th>rate</th><th>Δ</th><th></th></tr>' + splitRows + '</table><div class="hint" style="margin-top:8px">Directions must match the authored signs (the validator regression-tests exact magnitudes; these are the eyeball version over ' + ev.length.toLocaleString() + ' renewal decisions).</div></div></div>';
}
</script>
</body></html>`;

writeFileSync(join(OUT, 'dashboard.html'), html);
console.log(`inspector → ${join(OUT, 'dashboard.html')}`);
