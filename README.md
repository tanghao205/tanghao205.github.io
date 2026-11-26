# Hao Tang — personal portfolio

Personal website for **https://tanghao205.github.io/**, focused on current
software engineering work at PROS, selected projects, and the engineering
experience behind them.

## Start here

- [Supabase messaging](docs/supabase-messaging.md): implementation, local tests,
  private inbox, optional notifications, and hosted setup still required.
- [Design guide](docs/design-guide.md): consolidated current layout, color,
  imagery, interaction, and contact decisions for future changes.
- [AGENTS.md](AGENTS.md): instructions for coding agents, including content,
  design, privacy, verification, and publishing boundaries.
- [Claude Code instructions](.claude/CLAUDE.md): imports the shared guardrails
  and portfolio brief for Claude Code.
- [Portfolio brief](docs/portfolio-brief.md): confirmed background, owner
  preferences, and context carried forward from the design conversation.

The direction is a project-led portfolio with polished UX, not a résumé page.
Current work in real-time airline pricing should lead; GM and Battle Motors
provide supporting experience. Master's projects belong in a small dated
archive with selected visuals.

LinkedIn is the public contact route. GitHub profile/repository links and
outbound project links are omitted; add them only when the owner supplies and
explicitly approves them for publication. Development repository URLs in this
README are not included in the website build.

## Using Claude Code

Open Claude Code in this repository. It supports project instructions in
`.claude/CLAUDE.md`; this project's file imports `AGENTS.md` and the portfolio
brief so both agents use the same requirements. Keep shared rule changes in
those source files rather than maintaining duplicate instructions.

In a new Claude Code session, run `/context` and check **Memory files** to
confirm the project instructions loaded. This setup targets Claude Code;
other IDE chat integrations using Claude may have their own instruction-file
settings. See the [Claude Code documentation](https://code.claude.com/docs/en/memory).

## Repository and review workflow

- Repository: https://github.com/tanghao205/tanghao205.github.io
- Default branch: `master`
- Current redesign branch: `refresh-portfolio`
- GitHub CLI and Git authentication are configured on the owner's machine.
- Show a working local preview before requesting approval to commit or push.
  Do not publish or change live Pages settings without explicit authorization.

## Private material

Keep the résumé, local content database, and other personal reference files in `private/`, which is
ignored by Git and excluded from the legacy Jekyll configuration. Generated
build folders, IDE state, and local screenshots are also ignored.

Website builds must include only intended public assets. A `.gitignore` entry
alone is not a guarantee that a file cannot be served or published. Do not add
a résumé download or copy private documents into public assets.

## Run in IntelliJ

Open the terminal in this project. Use Node.js 24 or newer; the local content
tool uses Node's built-in SQLite module.

```powershell
npm ci
npm run dev
```

Open **http://127.0.0.1:4173**. The preview rebuilds and reloads when public
source files change. Stop it with `Ctrl+C`. It serves only `dist/`, never the
repository or `private/`. Avoid starting a server at the repository root.

For a background preview that stays running after the launcher exits:

```powershell
powershell -NoProfile -File scripts/start-preview.ps1
```

Use the same command with `-Stop` to stop it. Logs and the tracked PID stay in
`private/preview.*`. A normal startup takes a few seconds; ongoing edits/tests
are separate from preview startup.

To run from an IntelliJ configuration, add an **npm** run configuration, choose
this project's `package.json`, select **run**, and choose the **dev** script.

## Build and verify

```powershell
npm run build
npm run check
npm run test:content
npm run test:backend
npm test
npm run format:check
```

- `build` recreates `dist/` from the public-file list in `scripts/build.mjs`.
- `check` verifies the output file list, local assets, section links, old URL
  redirects, private-file exclusion, and a 1 MB total build budget.
- `test` runs browser checks for content, mobile layouts, keyboard navigation,
  dialogs, reduced motion, automated WCAG checks, and private-file requests.
  Tests start their own server on port 4174.
- `test:content` checks the SQLite schema and private-by-default relationships.
- `format:check` checks the active site code against the shared Prettier style.

On Windows, tests use the installed Microsoft Edge. On other systems, install
the test browser once with `npx playwright install chromium` (CI uses
`--with-deps`). The production page needs no JavaScript framework or runtime
dependencies. Fonts are served locally, with their licenses included.

## Editing the site

| File | Purpose |
| --- | --- |
| `index.html` | Public content, project stories, and page structure |
| `assets/portfolio/style.css` | Responsive visual design and motion preferences |
| `assets/portfolio/main.js` | Mobile menu and project dialogs |
| `scripts/build.mjs` | Explicit public assets, legacy redirects, sitemap, 404 page |
| `tests/portfolio.spec.mjs` | Browser and accessibility checks |
| `data/schema.sql` | Local content tables for companies, tasks, timing, and materials |
| `scripts/content.mjs` | Local SQLite setup and content entry tool |

## Local content database

The empty SQLite database lives at `private/portfolio.sqlite`; it is ignored by
Git and excluded from the public build. It is a staging place for future
material, not a live database behind GitHub Pages. Nothing entered here appears
on the site until a separate, reviewed publishing step is added.

```powershell
npm run content -- init
npm run content -- add company --name "Example company"
npm run content -- add task --company-id 1 --title "Example task"
npm run content -- add timing --task-id 1 --label "Example milestone" --starts-at 2026-10-27
npm run content -- add material --task-id 1 --title "Example note" --body-file .\note.txt
npm run content -- list material
npm run content -- get material 1
```

The sample commands show the field format; use real entries only when ready.
`timing` can hold a date range or minutes spent. All entries default to private.
Run `npm run content -- help` for every field. The schema is versioned, while
the database and any source notes remain local.

The original Jekyll theme, long academic pages, and source documents remain in
the checkout for reference. The new build does not publish them. The old
`/about/`, `/ML/`, `/CC/`, `/DV/`, and `/coding/` routes redirect to relevant
sections of the new portfolio.

## GitHub Pages, after review

The local `.github/workflows/pages.yml` prepares PR checks and deployment of
only `dist/` from `master`. It has not been run on GitHub yet. Pull requests
validate the site and do not deploy.

After the owner approves publishing, change **Settings → Pages → Source** to
**GitHub Actions**, then follow the approved commit, push, PR, and merge flow.
The existing Pages source is still the legacy `master` branch configuration;
no live settings have been changed. See the
[GitHub Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Current review status

The PROS-focused version is implemented for local design review with one type
family and light professional-work sections. The AI tools section explains Hao's layered reading method,
its use with documents, tickets, features, and bugs, and how that analysis
connects to a project workflow. It includes a three-level reading flow with
human choices about when to go deeper, distinct colors, and expandable explanations.
The hero leads with data processing, full stack development, and pricing model
integration. Current PROS work includes Databricks, Java, Python, and ADF
pipelines, with a smaller airport illustration below the story. The previous
globe and domain buttons have been removed. Hao will
review this wording and supply concrete public examples before deeper case
studies are added. Buttons have clearer shapes and larger targets. The local
content database is empty and private.

The private feedback/contact form, visit records, and weekly digest backend are
implemented and deployed to the owner's Supabase project. The owner confirmed
a real local message in the inbox and a test digest delivered to Gmail on
November 26, 2026. Weekly mail runs Monday 15:00 UTC using Resend's own-account
test sender; a verified sender domain is needed for production use. Visit/IP
and approximate-location collection now uses unlimited retention at the owner's
request. Both periods can be changed in the private runtime file and applied
with `scripts/configure-messaging.ps1`, without redeploying functions.
Real-browser visit/geolocation confirmation and public
Pages delivery remain to be verified after publication. See the
Supabase messaging guide above and the private owner guide at
`private/messaging-flow.md` (ignored, never published).

Run the checks above after edits. Automated checks and a local browser preview
cannot replace review on real devices or manual assistive-technology testing.

PROS content stays at the public domain level supplied by the owner; no start
date, named customer, internal architecture, or performance claim was invented.
The owner authorized pushing the reviewed work and merging it into `master`
for GitHub Pages publication. Pages now uses the GitHub Actions workflow to
publish only the explicit `dist/` public-file build. The Supabase backend is
deployed separately. Check the latest “Portfolio checks and Pages” workflow
run for the website's current deployment status.
