#!/usr/bin/env python3
"""check-links.py - static review tool for the More Cheese website folder.

Not part of the site: nothing here is deployed and no page references it. It is
run by hand before a review to catch the four things that actually break when
static pages are hand-maintained without a templating layer.

    python3 check-links.py            # from inside website/

Checks:
  a. every relative href/src resolves to a file in this folder
  b. any href="#" (a control that goes nowhere)
  c. any occurrence of the string "intlcheese" (the old domain)
  d. lists each page's <title>

Exit code is 0 when clean, 1 when anything is reported.
"""

import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))

ATTR_RE = re.compile(r'\b(?:href|src)\s*=\s*"([^"]*)"', re.I)
TITLE_RE = re.compile(r'<title>(.*?)</title>', re.I | re.S)
ID_RE = re.compile(r'\bid\s*=\s*"([^"]+)"')
EXTERNAL = ('http://', 'https://', 'mailto:', 'tel:', 'data:', 'javascript:')


def pages():
    return sorted(f for f in os.listdir(HERE) if f.endswith('.html'))


def main():
    problems = []
    titles = []

    for page in pages():
        path = os.path.join(HERE, page)
        with open(path, encoding='utf-8') as fh:
            html = fh.read()

        m = TITLE_RE.search(html)
        titles.append((page, m.group(1).strip() if m else '(no <title>)'))
        if not m:
            problems.append('%s: no <title> element' % page)

        ids = set(ID_RE.findall(html))

        for raw in ATTR_RE.findall(html):
            val = raw.strip()

            # (b) a control that goes nowhere
            if val == '#':
                problems.append('%s: href="#" (dead control)' % page)
                continue

            if not val or val.startswith(EXTERNAL):
                continue

            # in-page anchor: the target id has to exist on this page
            if val.startswith('#'):
                if val[1:] not in ids:
                    problems.append('%s: anchor %s has no matching id' % (page, val))
                continue

            if val.startswith('/'):
                problems.append('%s: absolute local path "%s" (relative links only)' % (page, val))
                continue

            # (a) relative target must resolve inside this folder
            target = val.split('#', 1)[0].split('?', 1)[0]
            if not target:
                continue
            resolved = os.path.normpath(os.path.join(HERE, target))
            if not resolved.startswith(HERE):
                problems.append('%s: "%s" escapes the website folder' % (page, val))
            elif not os.path.isfile(resolved):
                problems.append('%s: "%s" does not resolve to a file' % (page, val))

        # (c) the old domain, anywhere, in any form
        for n, line in enumerate(html.splitlines(), 1):
            if 'intlcheese' in line:
                problems.append('%s:%d: contains "intlcheese"' % (page, n))

    print('More Cheese link check - %d pages in %s' % (len(titles), HERE))
    print()
    print('Page titles')
    print('-' * 64)
    for page, title in titles:
        print('  %-34s %s' % (page, title))
    print()

    if problems:
        print('Problems (%d)' % len(problems))
        print('-' * 64)
        for p in problems:
            print('  ' + p)
        return 1

    print('Problems (0)')
    print('-' * 64)
    print('  No unresolved relative links, no href="#", no "intlcheese".')
    return 0


if __name__ == '__main__':
    sys.exit(main())
