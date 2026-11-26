# Hao Tang — portfolio brief

For the consolidated current visual direction, read [design-guide.md](design-guide.md).
It supersedes the older visual experiments recorded below.

The owner has authorized a Supabase contact/feedback implementation and local
testing. See [supabase-messaging.md](supabase-messaging.md) for setup and status.
The supplied Gmail address is a private notification destination; it has not
been added as public site copy. The public form defaults to unavailable until
the hosted function and verification configuration exist. Visitor messages
use a separate PostgreSQL database, not the private SQLite source store.

Owner decisions recorded on October 17, 2026. This is project context for future
work, not copy to reproduce verbatim on the public page.

## What the website should do

Introduce Hao through the software and engineering problems he works on now.
The site should feel like a thoughtful, engaging personal portfolio with great
UX, rather than an online résumé. Describe a few projects with enough context
to make the work understandable; avoid exhaustive employment and coursework
detail.

Keep the public address `https://tanghao205.github.io/`.

## Current focus: PROS, Inc.

Confirmed directly by the owner:

- Current role: software engineer at PROS, Inc.
- Domain: real-time dynamic pricing in the airline industry.
- Work involves large amounts of airline data and models supporting airline
  offers.
- Tools: Java, Python, Jenkins, ADF pipelines, and GitHub.
- AI tools are part of everyday engineering work.

This is the primary professional story. It should be visible near the top of
the page and take precedence over GM, Battle Motors, and academic projects.

Not yet supplied: start date, public project names, precise individual
contributions, publishable outcomes, scale measurements, and permission to
show employer assets. Omit unsupported specifics. The first design can use the
confirmed domain and tools without blocking on those details. Ask for a few
concrete, public project examples when developing deeper case studies.

Do not imply ownership of model development or describe AI products solely
because the owner works with models and uses AI tools.

## Supporting experience

### General Motors

The owner worked in Austin and was backend lead of the Emerge development
team, with full-stack responsibilities. He identified Java, Azure DevOps
(ADO), MySQL, PostgreSQL, and TypeScript as relevant tools.

The private résumé lists May 2021–August 2022 and describes business workflows
for procurement, engineering, and orders; Spring Boot, Hibernate, Redis,
Angular, testing, and delivery work provide additional historical context.

### Battle Motors

The owner worked as a full-stack engineer. The private résumé lists August
2022–December 2024 and describes a truck configurator spanning quotes,
approvals, orders, and production tracking, using Java/Spring, React,
TypeScript, MySQL, and related testing and delivery tools.

Use these experiences to support selected engineering stories. Do not make
their job descriptions the structure of the whole page.

### Earlier engineering background

Manufacturing, automation, materials engineering, and physics can explain Hao's
practical approach to software. A short personal narrative is more useful here
than a complete employer or education timeline.

## Academic archive

Most original site content came from master's projects approximately six years
before this redesign, around 2020. The owner wants much less detail but likes
some of the pictures.

Retain a small selection of useful visual work, clearly labeled as academic
and historical. Suitable existing material includes image classification,
storm-data analysis, and data visualization. Do not present coursework as
recent professional delivery or a production system.

## Design direction

The owner reviewed the first local preview on October 26, 2026. The layered
"full stack" hero diagram read like semiconductor design, `[ ht. ]` beside
"The full picture" was confusing, the About writing felt generic, and the
imagery and descriptions needed more depth. Replace that diagram and mark,
strengthen the visual, and explain the work in more concrete language. The
owner invited follow-up questions for publishable details of his role.
In the next review, the painterly illustration felt like a brown/yellow mask
against the page and its narrow card placement felt weak. Use a cooler,
near-white page background and a full-width, natural-looking aviation image
with a deliberate crop on mobile. Keep copy outside the image.
The owner then asked for consistent fonts across sections, a brighter and more
attractive treatment of the dim work section, and more content about hard
engineering problems and everyday AI tool use with a small related image.
Until Hao gives a concrete public example, keep the AI and challenge wording
broad and invite him to refine it. Do not claim he builds AI products.

In the next review, the owner approved the wide aviation image but asked for a
shorter crop. He requested 8–10 AI/tooling points: each first-layer point at
most 30 words, with an optional expansion of at most 100 words. He described
two app/repo efforts, one for AI-assisted code review and one for reading
materials or specifications in layers, so readers can expand a specific point
and save attention for more important work. Keep descriptions public and avoid
inventing names, implementation details, or measured outcomes. Include a small
AI-related image and give buttons visible, inviting shapes.

On October 27, the owner clarified that the first eight drafted AI points do
not reflect the list he intends. He will provide that list later. Keep the AI
section brief for now and do not present the draft points as his practices.
The owner also asked whether the code had been restructured hierarchically;
formatting alone should not be described as a structural refactor.

The owner also requested a small local SQLite content store prepared before
he has content to enter. Its company, task, timing, and material tables should
default to private. Do not publish its entries or imply the static site reads
directly from SQLite. The meaning of timing can cover a milestone/date range
or time spent until he provides a narrower definition.

Original-site style, confirmed from the repository: it used Jekyll Minimal
Mistakes' default light theme, a simple masthead/author sidebar, white and
gray reading surfaces, broad photographic banners (including a Houston
skyline), and illustrated academic project pages. Carry forward the spacious,
image-led personal feel and reuse selected genuine project images; do not
restore the long course list or reports.

Public PROS product material describes request-specific pricing and offer
optimization, as well as offer marketing that connects search traffic to
flight shopping. These explain the industry setting, but they do not establish
that Hao owns a named model, product, or Google integration. Use public context
sparingly and keep his own contribution within what he confirms.
Reference pages: https://pros.com/solutions/airline-offer-optimization/ and
https://pros.com/learn/blog/google-flights-indexing-i/ and
https://marketplace.pros.com/products/pros-fastsearch .

- Current professional identity first; selected projects next.
- Concise descriptions with optional deeper exploration.
- Strong visual craft: typography, spacing, images, responsive composition,
  and purposeful interaction.
- Accessible navigation, readable content, keyboard support, and reduced motion.
- The warm neutral palette, sage artwork, dark section, and interactive stack
  diagram in the unfinished first draft are exploratory choices, not approved
  requirements. Reconsider them against the current brief.
- Avoid a résumé layout, long job lists, oversized skills inventories, and
  decorative interaction that obscures the content.

## Links and source material

- GitHub account: `tanghao205` — development reference only; do not link the
  profile or repositories from the public page.
- LinkedIn: `https://www.linkedin.com/in/hao-tang-825182b`
- Local résumé: `private/Hao_Tang Resume.docx` — private, ignored, never a public
  download under the current instructions.

The owner requested removal of direct GitHub links. Keep project descriptions
and images on the page without outbound code, report, or demo links by default.
The owner will supply and explicitly approve links if they want to share them;
do not publish private reference links automatically. LinkedIn remains the
public contact route. The website address and Git remote remain unchanged.

LinkedIn blocked automated retrieval during the initial review. Do not claim
its contents were read. The private résumé predates the PROS role. New owner
statements supersede older material where they differ.

## Review and delivery agreement

Work locally, show the modified page, and let the owner review it before any
commit or push. No publishing or live settings changes are authorized yet.
The GitHub CLI is installed and authenticated, and the repository remote is
configured; those facts do not authorize publication.

## Implementation status

The owner subsequently authorized implementation. The local version now leads
with PROS and real-time airline pricing, followed by concise GM and Battle
Motors project stories, personal engineering context, and three academic
explorations. The old employment and education timelines were removed.

The static build, local preview, fonts, and browser checks are implemented.
The current local revision adds the shorter banner, a short AI section with an
AI mark, clearer buttons, and an empty private SQLite content store. The
earlier eight-point draft was removed pending the owner's own list.
Run the current checks and inspect the preview before handing it over. The site
is not published. Refer to the README for run instructions.

The PROS diagram is a labeled conceptual illustration, not an internal system
diagram. Deeper current-project stories still need the owner's public details.

## Reading and analysis method (owner clarification, November 9, 2026)

Hao wants to showcase how he reads documents and ticket descriptions and
analyzes feature requirements and bugs. His private work photos show two
related parts: a reusable, layered reading/summary method and an agent/workflow
harness adapted to a particular engineering project. The reusable method first
extracts goals, expected behavior, scope, constraints, assumptions, risks, and
open questions; Hao then expands only the points needing deeper analysis and
traces claims to their sources. The project harness carries that analysis into
specification, implementation, review, and verification, distinguishing
instructions from checks that are actually enforced.

The private reading record is `private/work-harness-notes.md`. Do not publish
the photos, internal repository details, or this private note. A public story
can explain the general method, but a specific feature or bug case study still
needs Hao's confirmed contribution, publishable example, and verified outcome.
The photographed material does not itself demonstrate a specific bug diagnosis
or prove that the reusable summary templates automate source retrieval.

The local AI tools section now presents the two parts and a three-level
reading flow. Level 1 helps a person scan the whole source, Level 2 lets them
browse one chosen point, and Level 3 gives exact detail only when requested.
Human choice between levels and the handoff to feature or bug work should be
clear in the visual. This is a draft for Hao's visual and wording review.

The next review requested stronger color, more visible arrows, useful motion,
and clearer typography hierarchy. Reserve numbered section labels for the main
page structure; the two AI method labels are plain text. The reading levels
now use violet, teal, and orange with expandable explanations and reduced-motion
support. Replace the current-focus globe and domain buttons with a wide,
clearly labeled AI-generated airport illustration and a new text layout below.
Use color to distinguish the supporting project cards as well. Keep the one
font family, readable light surfaces, and existing private-material boundaries.

Latest owner direction supersedes the aviation-led hero: lead with data
processing, full stack development, and software integration/adaptation around
machine learning models used for pricing. The owner confirms Databricks is
part of the current work alongside Java, Python, and ADF pipelines. Do not
infer ownership of model research, training, or a particular internal design.
Keep the current PROS focus prominent and place a smaller aviation image
within that story. The hero now uses an editorial engineering-focus panel.
Inner reading tiles should have straight top corners and rounded lower
corners, with simple line-and-chevron connectors instead of circular arrows.

The owner rejected the square-topped reading cards: match the small, consistent
corner radius of the supporting professional-work cards instead. He also
requires visual elements for Databricks and machine learning, not text alone.
The current-focus section now includes the official Databricks wordmark,
a code illustration, and a labeled conceptual model-node illustration.
Databricks logo source: official homepage header at https://www.databricks.com/;
brand reference: https://brand.databricks.com/. Preserve the original colors
and proportions. The code and model illustrations are original local SVG/CSS.

The November 26 contact-form review requested a less intrusive verification
display and a better aligned send button. Turnstile now uses interaction-only
appearance: routine success stays out of view, while required visitor interaction
remains visible. The centered teal button says “Send message” and changes to
“Sending…” during submission. Keep verification enforced on the backend.

On November 26, the owner authorized private IP and approximate-geolocation
records for messages and page visits, and a weekly digest to his private Gmail
destination. He explicitly approved sending IPs to ipwho.is and digest excerpts
through Resend. Raw IP/location retention defaults to 30 days; visit records
expire after 90 days. Record one verified visit per browser-tab session per UTC
day, respect Do Not Track/Global Privacy Control, and describe these as session
and network estimates rather than identified people. Explain collection in the
public privacy text. No street-address inference or reliable VPN detection is
claimed. Detailed owner instructions live in `private/messaging-flow.md`.

The owner asked for explicit retention adjustment instructions. Retention now
uses private `NETWORK_RETENTION_DAYS` and `VISIT_RETENTION_DAYS` settings, applied
by `scripts/configure-messaging.ps1` to a private database configuration row.
The same command synchronizes the two numbers in the local public privacy
notice and rebuilds/checks the site. Defaults remain 30 and 90 days. Do not
change retention implicitly; a published notice also needs an authorized update.

Latest owner direction: set both IP/location and visit retention to unlimited.
Use `unlimited` in the private environment file and SQL NULL in the private
settings row; keep explicit finite values supported. Unlimited disables automatic
expiry and does not imply unlimited hosting capacity. Update the privacy notice
accordingly. The owner also requested small circular UIUC, University of Florida,
and Sun Yat-sen University badges beside his name. Use authentic university marks,
preserve their colors, and keep the row compact on mobile. Do not infer degree
names, years, or endorsements from the request.

The local preview can be started as a hidden background process with
`powershell -NoProfile -File scripts/start-preview.ps1`; use `-Stop` to stop the
tracked process. Its PID and logs remain private. Keep the preview at
http://127.0.0.1:4173 available for owner review.

University mark sources: https://cdn.brand.illinois.edu/logos/block-i.svg;
https://brandcenter.p01.wp.it.ufl.edu/wp-content/uploads/sites/57/2023/06/UF_Monogram_Orange.png;
http://www.sysu.edu.cn/sysuen/images/logo.png (the seal is framed with CSS).

The owner rejected the first university badge row as visually rough and asked
for cleaner candidates at a smaller size. Replace the orange UF tile with the
official blue-on-white UF monogram, and the cropped low-resolution SYSU header
with a full green vector seal. Use quiet white circular backgrounds, 32px on
desktop and 26px on mobile. Keep the authentic Illinois Block I proportionate.
Replacement UF source:
https://brandcenter.ufl.edu/wp-content/uploads/sites/57/2025/03/UF-blue-150x150.jpg .
SYSU SVG source: https://github.com/sikouhjw/sysu-logo, green standalone seal
in the 校徽校名校训 directory; the repository traces it to the university's
visual identity manual at https://home3.sysu.edu.cn/sysuvi/ .

Latest badge review: keep the existing 32px/26px circle sizes, but increase the
gap after Hao's name to 0.5 CSS inch (48 CSS pixels) on desktop and mobile.
The UF mark should be sharper; use a vector monogram sourced from
https://commons.wikimedia.org/wiki/File:UF_Monogram.svg (attributed to UF).
The owner found the SYSU seal too crowded and Illinois Block I too heavy.
Use compact SYSU and UIUC typographic badges as simpler alternatives, keeping
their school names accessible; these are text labels, not invented official
university logos. No seal or block-I image is included in the current build.

Latest correction: restore the orange Illinois I, choosing the official orange
and white variant without the heavy navy outline for a lighter appearance.
Source: https://cdn.brand.illinois.edu/logos/block-i/orange-and-white.svg .
Keep its proportions; render it at 24px high on desktop and 20px on mobile.
Remove the outer border and circular background from UF and the SYSU text.
Keep Illinois's small circle, the existing mark slots, and the 48px name gap.

The owner subsequently requested removing the Illinois circle too. All three
university marks now have transparent backgrounds and no outer border, while
keeping the orange I, current sizes, and 48px gap after the name.

The owner has reviewed the local preview and authorized committing and pushing
the portfolio work to GitHub. Use the existing `refresh-portfolio` branch;
keep private material, secrets, IDE state, and generated output excluded.
Opening a PR, merging to master, publishing Pages, and live hosting changes
still require separate authorization.

The owner subsequently explicitly authorized “Yes, merge and publish.” The
reviewed branch was fast-forwarded into master, and Pages was switched from
legacy root publishing to the prepared Actions workflow. Publish only the
allowlisted dist artifact and verify workflow completion and the live page.
Private source notes, runtime secrets, and local preview artifacts remain
excluded. No additional permission is needed to complete this authorized release.
