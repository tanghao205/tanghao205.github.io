# Instructions for agents working on this portfolio

Read [docs/portfolio-brief.md](docs/portfolio-brief.md) before changing content,
layout, interactions, or deployment. It records the owner's decisions so work
does not depend on access to earlier chat messages. Follow new explicit user
instructions when they supersede this document, and update the brief when the
owner changes direction.

## Purpose and content priorities

- Build Hao Tang's personal engineering portfolio for
  `https://tanghao205.github.io/`.
- Lead with his **current software engineering work at PROS, Inc.**: real-time
  dynamic pricing, large volumes of airline data, and models supporting airline
  offers. Current tools include Java, Python, Jenkins, ADF pipelines, GitHub, and
  AI tools used in daily engineering work.
- Present selected projects and engineering problems. **Do not turn the page
  into a résumé**, chronological job list, course catalog, or wall of skills.
- GM and Battle Motors are supporting professional experience. Master's work
  completed around 2020 is a small, clearly dated archive; reuse worthwhile
  pictures without restoring the old long reports and code listings.
- Explain the problem, Hao's verified contribution, and why the work matters.
  Keep deeper technical details optional and concise.

## Factual and privacy boundaries

- Treat the owner's latest statements as the primary source for current work.
  The private résumé is historical reference; it ends in December 2024 and does
  not describe his current PROS role.
- Do not invent dates, tenure, project names, metrics, customers, team sizes,
  model ownership, AI capabilities, or proprietary architecture. In particular,
  daily use of AI tools does not establish that Hao builds AI products.
- Describe employer work at the public level provided by the owner. Do not add
  customer data, internal screenshots, source code, credentials, or business
  rules from employers. Label any illustrative diagram as an illustration when
  it could otherwise be mistaken for an actual product or architecture.
- Keep the résumé and other private reference material under `private/`.
  Preserve `.gitignore` protection. Never stage, commit, upload, embed, or offer
  the résumé as a download unless the owner explicitly changes this policy.
- Git ignore rules alone do not protect website output. Build from an explicit
  list of public files, exclude private material from every publishing path,
  and verify the generated site contains no private documents or secrets.
- An email supplied for Git authentication or commit identity is not permission
  to publish it. Do not publish phone numbers, addresses, or personal contact
  details copied from the résumé. Use LinkedIn for public contact.
- Do not add public GitHub profile, repository, code, report, or demo links by
  default. The owner will choose which project links to share and explicitly
  authorize their publication. A private link supplied as reference is not
  permission to publish it. Keep the development Git remote configured and the
  `tanghao205.github.io` hosting address; these are separate from outbound links.

## UX and design expectations

- Original-site style reference: the previous site used Jekyll's Minimal
  Mistakes default skin: a white canvas, restrained gray typography and links,
  a simple masthead and author sidebar, wide photographic page banners (notably
  a Houston skyline), and image-led academic project pages. Its feel was a
  straightforward personal engineering notebook. Preserve a recognizable
  connection through spacious reading layouts and selected original project
  images, while giving current work stronger hierarchy and clearer writing.
- The owner found the first redesign's layered hero graphic too similar to a
  semiconductor diagram and the `[ ht. ]` decoration confusing. A later
  painterly airline illustration felt yellow and boxed in. Do not restore
  those treatments. Favor a clean, full-width aviation image without color
  washes, and use plain, informative labels.

- Aim for a distinctive, polished portfolio with a clear reading sequence:
  current focus, selected work, personal context, then contact. The brief is
  more important than preserving the unfinished first draft.
- Use strong typography, intentional spacing, useful imagery, and clear visual
  hierarchy. Keep text easy to scan. Avoid generic résumé templates, fake
  dashboards, decorative metrics, and repeated technology badges.
- Use one consistent font family across the page's headings and body. The
  owner found the mixed serif/sans headings distracting and the first dark
  work section too dim. Keep professional stories readable on a light surface.
- Explain daily AI tool use and the difficulty of data-intensive work at a
  public level; ask for a concrete example before claiming specific AI tasks,
  proprietary workflows, or outcomes as Hao's own.
- Add interactions when they help people explore the work: concise project
  reveals, meaningful diagrams, or clear navigation. Every visible control must
  perform its promised action. Do not add unrelated application features.
- Support mobile, tablet, and desktop layouts, keyboard navigation, visible
  focus, semantic headings, readable contrast, descriptive image text, and
  reduced-motion preferences. Essential content must remain accessible.
- Keep the site fast: use appropriately sized images, lightweight code, and
  restrained motion. Choose dependencies for concrete needs.

## Repository, preview, and publishing

- The remote is `https://github.com/tanghao205/tanghao205.github.io.git`; the
  default branch is `master`. Confirm current Git status before making changes
  and preserve unrelated local work.
- The redesign began on the local `refresh-portfolio` branch. Keep work local
  until the owner reviews a working preview.
- The owner explicitly requested **no commit or push before confirmation**.
  Also wait for explicit authorization before opening a PR, merging, deploying,
  or changing live GitHub Pages settings. Routine local edits and checks can
  proceed within the requested task without repeated permission questions.
- Do not alter global Git identity. Keep private documents, IDE state, generated
  output, and local screenshots out of Git.
- Preserve old public URLs with suitable redirects when replacing their pages.
  Retain `tanghao205.github.io` as the intended public address.
- Before handing over a UI preview, verify the build, representative desktop
  and mobile layouts, navigation, project interactions, and private-file
  exclusion. Report checks actually run and any limits honestly.
- Show the working local page for review. A code change or screenshot alone is
  not evidence that deployment has occurred. Keep the README accurate about
  which local commands work and what remains unfinished.
