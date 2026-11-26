# Portfolio design guide

Current direction consolidated from the owner's reviews through November 9,
2026. Use this for new visual changes. It supersedes older visual experiments
in the portfolio brief; the brief and AGENTS.md still govern facts, privacy,
and publishing.

## Purpose and reading order

- Present Hao as a software engineer working across data processing, full stack
  development, and software integration with pricing models.
- Lead with current PROS work, then the AI reading method, supporting Battle
  Motors and GM work, personal context, a small academic archive, and contact.
- Explain problems and verified contributions. Avoid a résumé, job timeline,
  large technology inventory, invented metrics, or product dashboard.

## Hero and current focus

- Lead with engineering. Aviation is the application of the current work and
  belongs in a smaller image within the PROS story, not a dominant hero photo.
- Keep CURRENT FOCUS / PROS visible before its imagery. Explain Databricks,
  Java, Python, ADF pipelines, full stack development, and adaptation/integration
  around machine learning models for pricing. Do not imply Hao trained or
  invented the models.
- Include visible graphics: the official Databricks wordmark, a code visual,
  and a labeled conceptual model-node illustration. Text alone did not satisfy
  the owner's request for these visual elements.
- Do not restore the globe, Data/Pricing/Offers buttons, semiconductor-like
  layered hero, `[ ht. ]` ornament, or yellow painterly aviation image.

## Typography, color, and cards

- Use DM Sans across headings and body, with size and weight establishing the
  hierarchy. Keep generous space and readable light surfaces.
- Use color deliberately: blue for current work, violet/teal/orange for reading
  levels, warm orange for Battle Motors, and blue for GM.
- Number major page sections. Give the two AI method descriptions plain labels;
  do not repeat the page's `01 / 02` numbering inside them.
- Inner reading cards use the same small 6px corner radius and colored top
  border treatment as supporting work cards. Keep this consistent; rejected
  experiments include large rounded top stripes and square upper corners with
  rounded lower corners. The outer AI section can retain its larger radius.
- Supporting work cards have small vehicle images with equal image heights.
  Use grid stretching to keep the two cards equal in height on desktop, including
  when a story expands. Allow natural heights when stacked on mobile.
- Vehicle images provide company context, not evidence of work on that specific
  vehicle. Preserve this distinction in captions and copy.

## Reading flow and interaction

- Show source material, then three reading levels: a fast overview, browsing
  one selected point, and an exact deep dive only when requested.
- Make the human choice to continue or stop visible. Connect the result to
  feature acceptance criteria, bug investigation, review, and verification.
- Use simple line-and-chevron arrows with enough space between cards; arrows
  point down when the flow stacks. Avoid circular arrow badges.
- Provide useful expandable explanations and restrained hover/focus feedback.
  Support keyboards and reduced motion. Every visible control must work.
- The reading workflow is general public material. The original harness photos
  and detailed notes remain private and excluded from the build.

## Contact and publication

- LinkedIn is the existing public contact route. An email used for Git or found
  in private reference material is not approved for publication.
- The owner is considering email. Recommendation: keep LinkedIn until he supplies
  an address specifically for public display. Do not treat this as authorization
  to publish any existing address.
- The owner subsequently authorized a private Supabase feedback/contact form.
  Keep LinkedIn as the fallback. The supplied email is the private notification
  recipient; the form does not expose it. Read `supabase-messaging.md` before
  configuring or deploying the backend.
- Runtime services must be independent of ChatGPT and owned by Hao. Keep code,
  migrations, and setup documentation in the repository for future maintenance.
- Keep work local for review. Commit, push, deployment, and live settings changes
  require explicit authorization.

## Image provenance (development reference only)

- Databricks wordmark: official homepage header, https://www.databricks.com/;
  preserve its original colors and proportions.
- Battle Motors photo: https://battlemotors.com/videos/hero/hero_01.jpg, found
  through the official homepage at https://battlemotors.com/.
- Chevrolet Corvette image:
  https://www.chevrolet.com/content/dam/chevrolet/na/us/english/index/Performance/2027-corvette-z06/images/masthead/my27-z06-mh-d.png,
  from https://www.chevrolet.com/performance/corvette/z06.
- Manufacturer photos are local compressed copies with company-imagery captions;
  they do not show Hao's private systems or establish work on these vehicles.
- Airport image is AI-generated and labeled. Code and model-node graphics are
  original local SVG/CSS, with the model graphic labeled conceptual.

## Verification before review

Build the public allowlist, check links and private-file exclusion, run browser
and accessibility checks, and visually inspect desktop/tablet/mobile layouts.
Keep generated output and screenshots ignored. Show a running local preview
and report which checks actually ran.
