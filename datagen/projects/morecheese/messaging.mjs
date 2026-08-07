// Secure Messaging — targets bizapps-secure-messaging (slice: SecureThread/SecureMessage/
// PortalSession; PortalMagicLink is a runtime auth artifact and MessageFile/FileRequest need
// real blobs — none are generated, by design).
//
// Threads DERIVE from issues: a declared share of support tickets carry their conversation
// over the secure portal, and every hero-authored issue always does (cross-app footprint —
// Bob's billing dispute has a readable message trail). The message state machine rides the
// issue's state: opener from the member, staff reply from the ASSIGNEE (committee officer),
// optional follow-up exchanges, and a closing note when the issue resolved. Timestamps are
// strictly increasing and never pass the release date.

import { rng } from '../../engine/rng.mjs';
import { indexBy } from '../../engine/authoring.mjs';

export function buildMessaging(cfg, { people, issues }) {
  // ── inputs ── the ruleset sections this domain reads, and the upstream rows
  const { R, seed, release } = cfg;
  const M = R.messaging;
  const releaseMs = release.getTime();
  const personByKey = indexBy(people, 'MemberNumber');
  const heroIssueKeys = new Set(issues.issues.filter((x) => x.IssueKey.startsWith('hero:')).map((x) => x.IssueKey));

  const threads = [];
  const messages = [];
  const sessions = [];
  const hex = (r, n) => Array.from({ length: n }, () => '0123456789abcdef'[r.int(0, 15)]).join('');
  const fullName = (m) => { const p = personByKey.get(m); return p ? `${p.FirstName} ${p.LastName}` : null; };

  // ── decisions ── one thread per issue that earned one, then its messages
  for (const issue of issues.issues) {
    const r = rng(seed, `msgthread:${issue.IssueKey}`);
    if (!heroIssueKeys.has(issue.IssueKey) && !r.bernoulli(M.params.threadSharePerIssue.target)) continue;
    const reporter = personByKey.get(issue.ReporterMemberNumber);
    if (!reporter) continue;

    const threadKey = `thread:${issue.IssueKey}`;
    const memberName = fullName(issue.ReporterMemberNumber);
    const staffName = (issue.AssigneeMemberNumber && fullName(issue.AssigneeMemberNumber)) || M.params.staffFallbackSender;
    const terminal = issue.StatusKey === 'Resolved' || issue.StatusKey === 'Closed';

    // message timeline: opener → (reply → follow-up pairs) → closer, clock never passes release
    const opened = issue.ResolvedAt ? new Date(issue.ResolvedAt).getTime() - r.int(4, 20) * 86400000
      : releaseMs - r.int(2, Math.max(3, R.issues.params.recencyOpenDays)) * 86400000;
    // OUTBOUND (staff) messages land in the working week: no 3am Sunday replies from the
    // member-services desk. Members write whenever — evenings and weekends included, which
    // is what makes the staff/member rhythm read as real.
    //
    // WHY THIS IS TWO PASSES rather than a clock stamped as it goes. Both the old clamps —
    // `advance()` and the business-hours fixup — ended in `Math.min(…, releaseMs - 1800000)`,
    // so a conversation that reached the ceiling SATURATED there: every remaining message got
    // the same instant, 30 minutes before release, with no business-hours property left. It
    // surfaced as an off-hours gate failure at n=2500 seed 99 (7 of 136 staff replies at
    // 23:30 on a Thursday), but the off-hours part was the smaller half — one thread had SIX
    // messages stamped at the identical second, which no gate covered and which reads as
    // obviously fabricated the moment anyone opens the thread.
    //
    // A conversation cannot be squeezed into less time than it takes, so the fix is to give it
    // the time: collect the shape first with RELATIVE gaps, then anchor it late enough to look
    // recent and early enough to fit. The draw sequence is untouched — every r.int / r.pick /
    // r.bernoulli happens in the same order it did before, because stamping consumes no dice.
    const items = [];
    let gap = 0;
    const businessifyAt = (ms) => {
      const d = new Date(ms);
      if (d.getUTCHours() > 17) { d.setUTCDate(d.getUTCDate() + 1); d.setUTCHours(9 + (d.getUTCMinutes() % 3)); }
      else if (d.getUTCHours() < 9) d.setUTCHours(9 + (d.getUTCMinutes() % 3));
      const dow = d.getUTCDay();
      if (dow === 6) d.setUTCDate(d.getUTCDate() + 2);
      else if (dow === 0) d.setUTCDate(d.getUTCDate() + 1);
      return Math.max(ms, d.getTime());   // forward-only; never stamps behind an earlier message
    };
    const push = (i, dir, content, status) => {
      items.push({
        dir,
        gapMs: gap,
        row: {
          MessageKey: `${threadKey}:${i}`, ThreadKey: threadKey, SessionKey: threadKey,
          MemberNumber: dir === 'Inbound' ? issue.ReporterMemberNumber : (issue.AssigneeMemberNumber ?? null),
          Direction: dir, Sender: dir === 'Inbound' ? memberName : staffName,
          Recipient: dir === 'Inbound' ? M.params.staffFallbackSender : memberName,
          Subject: i === 0 ? issue.Title : null, Content: content, IsSecure: true,
          Status: status, ReceivedAt: null,
          IsStarred: r.bernoulli(M.params.starredShare), IsImported: false, SourceChannel: 'Portal', IsSharedDemo: true,
        },
      });
      gap = 0;
    };
    const advance = () => { gap = (1 + r.int(1, M.params.replyDelayHoursMax)) * 3600000; };

    // type-aware banks: a Data Correction thread never talks about invoices
    const bank = (b) => (M.catalog[b][issue.TypeKey] ?? M.catalog[b].General ?? M.catalog[b]);
    const replied = issue.StatusKey !== 'New';
    push(0, 'Inbound', r.pick(bank('openers')), replied ? 'Replied' : 'New');
    let idx = 1;
    if (replied) {
      advance();
      push(idx++, 'Outbound', r.pick(bank('replies')), 'Sent');
      for (let k = r.int(0, M.params.followUpPairsMax); k > 0; k--) {
        advance();
        push(idx++, 'Inbound', r.pick(bank('followUps')), 'Replied');
        advance();
        push(idx++, 'Outbound', r.pick(bank('replies')), 'Sent');
      }
      if (terminal) {
        advance();
        push(idx++, 'Outbound', r.pick(bank('closers')), 'Sent');
      } else {
        // open thread: the member had the last word, still waiting on staff
        advance();
        push(idx++, 'Inbound', r.pick(bank('followUps')), r.bernoulli(0.5) ? 'Read' : 'New');
      }
    }

    // ── stamp ── walk the collected gaps from a candidate start, snapping staff replies into
    // the working week. Snapping only ever moves a message FORWARD, so the true span is not
    // known until it has been applied — hence solve rather than compute: lay the timeline out,
    // and if its last message overruns the ceiling, start the whole conversation that much
    // earlier and lay it out again. Each pass moves every unsnapped time back by the overrun
    // and snapping cannot claw all of it forward, so this converges in a pass or two; the bound
    // is there so a pathological thread degrades to a clamp instead of spinning.
    const CEILING = releaseMs - 1800000;
    const layout = (startMs) => {
      let c = startMs;
      return items.map((it) => {
        c += it.gapMs;
        if (it.dir === 'Outbound') c = businessifyAt(c);
        return c;
      });
    };
    let start = Math.min(opened, releaseMs - 3600000);
    let times = layout(start);
    for (let pass = 0; pass < 8 && times[times.length - 1] > CEILING; pass++) {
      start -= times[times.length - 1] - CEILING;
      times = layout(start);
    }
    items.forEach((it, i) => {
      it.row.ReceivedAt = new Date(Math.min(times[i], CEILING)).toISOString().replace(/\.\d{3}Z$/, 'Z');
      messages.push(it.row);
    });

    const lastAt = messages[messages.length - 1].ReceivedAt;
    threads.push({
      ThreadKey: threadKey, IssueKey: issue.IssueKey, MemberNumber: issue.ReporterMemberNumber,
      Subject: issue.Title, Status: terminal ? (issue.StatusKey === 'Closed' ? 'Archived' : 'Closed') : 'Active',
      SourceChannel: 'Portal', LastMessageAt: lastAt, IsDeleted: false, IsSharedDemo: true,
    });
    // one portal session per thread — SecureMessage.PortalSessionID is NOT NULL
    sessions.push({
      SessionKey: threadKey, MemberNumber: issue.ReporterMemberNumber,
      TokenHash: hex(r, 64), Status: terminal ? 'Expired' : 'Active',
      ExpiresAt: new Date(new Date(lastAt).getTime() + 30 * 86400000).toISOString().replace(/\.\d{3}Z$/, 'Z'),
      LastAccessedAt: lastAt, IsSharedDemo: true,
    });
  }

  // ── shape ── assemble the named tables this domain owns
  return { threads, messages, sessions };
}
