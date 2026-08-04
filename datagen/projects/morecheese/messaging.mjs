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

export function buildMessaging(cfg, { people, issues }) {
  const { R, seed, release } = cfg;
  const M = R.messaging;
  const releaseMs = release.getTime();
  const personByKey = new Map(people.map((p) => [p.MemberNumber, p]));
  const heroIssueKeys = new Set(issues.issues.filter((x) => x.IssueKey.startsWith('hero:')).map((x) => x.IssueKey));

  const threads = [];
  const messages = [];
  const sessions = [];
  const hex = (r, n) => Array.from({ length: n }, () => '0123456789abcdef'[r.int(0, 15)]).join('');
  const fullName = (m) => { const p = personByKey.get(m); return p ? `${p.FirstName} ${p.LastName}` : null; };

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
    let clock = Math.min(opened, releaseMs - 3600000);
    // OUTBOUND (staff) messages land in the working week: no 3am Sunday replies from the
    // member-services desk. Members write whenever — evenings and weekends included, which
    // is what makes the staff/member rhythm read as real.
    // forward-only, and it MOVES the clock (never stamps behind an earlier message)
    const businessify = () => {
      const d = new Date(clock);
      if (d.getUTCHours() > 17) { d.setUTCDate(d.getUTCDate() + 1); d.setUTCHours(9 + (d.getUTCMinutes() % 3)); }
      else if (d.getUTCHours() < 9) d.setUTCHours(9 + (d.getUTCMinutes() % 3));
      const dow = d.getUTCDay();
      if (dow === 6) d.setUTCDate(d.getUTCDate() + 2);
      else if (dow === 0) d.setUTCDate(d.getUTCDate() + 1);
      clock = Math.max(clock, Math.min(d.getTime(), releaseMs - 1800000));
    };
    const msgAt = (dir) => { if (dir === 'Outbound') businessify(); return new Date(clock).toISOString().replace(/\.\d{3}Z$/, 'Z'); };
    const push = (i, dir, content, status) => messages.push({
      MessageKey: `${threadKey}:${i}`, ThreadKey: threadKey, SessionKey: threadKey,
      MemberNumber: dir === 'Inbound' ? issue.ReporterMemberNumber : (issue.AssigneeMemberNumber ?? null),
      Direction: dir, Sender: dir === 'Inbound' ? memberName : staffName,
      Recipient: dir === 'Inbound' ? M.params.staffFallbackSender : memberName,
      Subject: i === 0 ? issue.Title : null, Content: content, IsSecure: true,
      Status: status, ReceivedAt: msgAt(dir),
      IsStarred: r.bernoulli(M.params.starredShare), IsImported: false, SourceChannel: 'Portal', IsSharedDemo: true,
    });
    const advance = () => { clock = Math.min(clock + (1 + r.int(1, M.params.replyDelayHoursMax)) * 3600000, releaseMs - 1800000); };

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

  return { threads, messages, sessions };
}
