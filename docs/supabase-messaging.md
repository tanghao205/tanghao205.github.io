# Supabase messaging implementation

## Status

November 26 update: the owner authorized and explicitly approved private
IP/geolocation collection for messages and visits, external IP lookup through
ipwho.is, and a weekly digest with excerpts through Resend to his private Gmail.
Migrations `202611260001` and `202611260002` are applied. `submit-message`,
`track-visit`, and `weekly-digest` are deployed. Runtime settings and the
separate scheduler credential are uploaded; the latter is also in Vault.
Cron jobs are active: weekly digest Monday 15:00 UTC, metadata cleanup daily
04:20 UTC. Resend settings are uploaded using its own-account test sender.
One digest for November 16–22 was accepted by the provider and recorded sent;
a follow-up invocation returned “Already sent” without another provider send.
The owner supplied a Gmail screenshot confirming receipt on November 26.
The initial response failed after the ledger write because the handler parsed
an empty RPC response; that handling is fixed and regression tested.
Verify an owned sender domain for ongoing production delivery.
The owner subsequently authorized pushing, merging to master, and publishing.
Pages is configured for GitHub Actions and publishes only the public `dist/`
artifact after checks. Verify the latest workflow run for deployment status;
public-origin form and visit smoke checks follow a successful deployment.

The detailed owner flow and email setup are in `private/messaging-flow.md`.
That file is ignored and excluded from the public build.

## Enable weekly email

1. Owner creates a Resend account, then a sending-access API key under API Keys.
2. Save `RESEND_API_KEY` in `private/supabase-runtime.env`, without sharing it in
   chat. Set `NOTIFICATION_FROM` to an authorized sender and keep the existing
   private `NOTIFICATION_TO`. For an initial test to the email associated with
   the Resend account only, `Hao Portfolio <onboarding@resend.dev>` is permitted.
   Ongoing production sending needs a verified sender domain owned by Hao.
3. Stop `npm run dev` with Ctrl+C if it is running. From the repository root, run:

   ```powershell
   powershell -NoProfile -File scripts/configure-messaging.ps1 -TestDigest
   ```

   This uploads settings, ensures a random job credential exists in both the
   runtime and Vault, and invokes one digest. No credentials are printed or
   passed as command arguments. Inspect Resend records and the recipient inbox.
   The test sends the previous complete UTC week's digest, which can be empty.
   That same period will not be sent again after success.
   Restart the local preview afterward with `npm run dev`.
4. Check Supabase Cron for `portfolio-weekly-digest`; it is already active.
   Monday 15:00 UTC is 09:00 Chicago in winter and 10:00 in summer. The period
   is the preceding Monday 00:00 UTC to this Monday 00:00 UTC, end exclusive.

`weekly_digest_runs` stores a stable private snapshot, a five-minute delivery
lease, and provider acceptance. Resend gets a stable idempotency key (24-hour
provider retention). Retry within 23 hours after checking provider records;
wait five minutes for a failed attempt's lease. Older ambiguous attempts require
manual review instead of risking duplicates. Cron HTTP enqueue success alone
is not delivery success: inspect `net._http_response`, function logs, the ledger,
and provider records. There is no automatic catch-up or automatic retry loop.
Paused Free projects cannot run reliable schedules; this is not a keep-alive.

The digest includes new message/category totals, current unread count, older
messages last edited in the period, up to 20 message excerpts, recorded session
and network totals, and approximate country counts. It omits raw IPs and reply
emails. The last-edit timestamp is not a complete change/deletion audit.
Per-message notifications now require `IMMEDIATE_NOTIFICATIONS=true`; default
false gives weekly mail only. The summary is deterministic and uses no AI API.

## Visit and network records

Retention is configurable through `NETWORK_RETENTION_DAYS` and
`VISIT_RETENTION_DAYS` in the private runtime file. Both are currently
`unlimited` at the owner's November 26 request (SQL `NULL` in the private table).
Run
`powershell -NoProfile -File scripts/configure-messaging.ps1` (stop `npm run dev`
first; restart it afterward) to apply them to
the private `messaging_settings` row and update/rebuild the local privacy notice.
Each value must be `unlimited` or an integer from 1 through 3650. The daily Cron job and
opportunistic cleanup read this row; no schedule change or function redeployment
is needed. Lower values can irreversibly remove older data on the next cleanup;
higher values cannot restore deleted data. Message bodies and digest snapshots
are unaffected; deleting a visit removes its metadata too. Keep a published
privacy notice synchronized through the separately authorized publishing flow.
Detailed examples and steps: `private/messaging-flow.md` → “Adjust IP/location
and visit retention.” Migrations `202611260003` and `202611260004` install
finite/unlimited configuration. No Edge Function redeployment is needed.

`visitor_visits` records one verified visit per tab session per UTC day. The
browser sends a random session UUID and a separate Turnstile token with action
`portfolio-visit`. There is no public visit-reading API. Do Not Track and Global
Privacy Control skip tracking. Visit verification is abandoned if it requires
human interaction, so analytics never asks readers to solve an extra challenge.
The separate message verification can still request interaction. Blocked verification and unavailable
session storage also skip tracking; counts represent recorded sessions, not
people or all page views. The server caps visit attempts at 20 per reported
network hash/hour and 500 globally/hour, separately from message limits.

Messages and visits get best-effort `reported_ip`, `approximate_location`, and
`network_recorded_at` fields. The reported IP is the rightmost valid address in
`x-forwarded-for`; its hosted trust contract is unverified. It is not proof of
identity. Public IPs are sent over HTTPS to ipwho.is, without message text,
name, email, or tokens. Store city/region/country/ISP only; no street address,
coordinates, or claim of VPN detection. Private/reserved addresses are not
looked up. Provider failure does not undo an accepted message/visit. Set
`GEO_LOOKUP_ENABLED=false` to disable external lookups. Metadata is removed
according to the configured retention periods by daily and opportunistic cleanup.
The original defaults were 30 days for metadata and 90 days for visits; both are
now unlimited. Finite cleanup can be delayed by a day or by project pausing. Provider
logs/backups follow their own policies. Existing records are not backfilled.

All new tables have RLS, no public policies, and explicit visitor revocations.
The write/summary/cleanup RPCs are callable only by the service role. Weekly
email uses a separate private job credential; JWT verification is disabled only
because the handler checks that credential itself. No public digest endpoint
can trigger email without it.

Hosted schema and both Cron schedules were inspected on November 26. The live
visit endpoint rejects an invalid token (400); the digest rejects unauthorized
requests (401). A real automated browser visit required interactive verification
and was not recorded; manual real-browser visit/IP/location confirmation remains
outstanding. Desktop and mobile layouts were inspected without horizontal
overflow. Build and private-file allowlist checks passed with 27 public files.

## Earlier setup record

Implemented locally: private contact/feedback form, Supabase Edge Function,
PostgreSQL migration, transactional submission limits, verification, optional
email notifications, and automated tests. On November 26, 2026, the owner's
Supabase project was linked, migration `202611090001` was applied, available
runtime settings were uploaded, and `submit-message` was deployed. Turnstile
is configured and its secret uploaded; the public function URL and owner-supplied
site key are connected in the local frontend configuration. Optional email
delivery remains unconfigured and the website has not been deployed.

Hosted checks confirmed OPTIONS returns 204 for the site origin, POST returns
503 before Turnstile was configured, and another origin returns 403. After the
secret upload, a deliberately invalid verification token returned 400 with a
verification rejection. Both local backend tests passed. The configured build,
public-file/privacy checks, and three simulated form browser tests passed.
The owner confirmed a successful local browser submission appeared in the hosted
`visitor_messages` table on November 26. Public Pages delivery remains untested.
A PR or Pages deployment alone will not provision the backend.

For the current local real-verification test, the private runtime settings allow
`http://127.0.0.1:4173` alongside the public site origin. These settings were
uploaded to Supabase and a live OPTIONS request confirmed the local origin is
accepted (204). The owner added `127.0.0.1` to the Turnstile hostname list.
Save that Cloudflare setting before testing. Remove the local origin and widget
hostname after testing, or use a separate development setup for ongoing work.

## Ownership and independence

Use accounts owned by Hao for Supabase, verification, and optional email
delivery. The site runs on GitHub Pages and the backend runs on Supabase;
neither requires ChatGPT, a chat session, or a ChatGPT connector to operate.
Source code, migrations, tests, and setup instructions stay in this repository.
Messages are stored in PostgreSQL and can be exported from Supabase for migration.
Account authentication is still needed before remote provisioning can proceed.

## Submission flow

The static GitHub Pages form calls `submit-message`. The Edge Function checks
origin, payload, a honeypot, and a Turnstile token (including hostname/action).
Only then does it call a server-only database function. That transaction checks
rate limits and inserts the message. There is no public message-reading API.
The browser never receives a service-role key or notification credentials.

`visitor_messages` stores name, optional reply email, category, body, creation
time, and status (`new`, `read`, `archived`). Contact requests require a reply
email; portfolio feedback does not. All messages remain private. This is an
inbox, not a public comment system.

The existing `private/portfolio.sqlite` is untouched. It is a separate local
source-material store and is never uploaded to Supabase.

## Files

| File | Purpose |
| --- | --- |
| `assets/portfolio/contact-config.js` | Public function URL and Turnstile site key only |
| `assets/portfolio/contact.js` | Form, verification, delivery/error states |
| `supabase/functions/submit-message/index.js` | Deno entry point |
| `supabase/functions/submit-message/handler.js` | Validated submission endpoint |
| `supabase/migrations/202611090001_visitor_messages.sql` | Tables, permissions, atomic limits/write function |
| `supabase/runtime.env.example` | Empty secret template |
| `tests/message-api.test.mjs` | Handler and PostgreSQL permissions/integration tests |
| `tests/contact.spec.mjs` | Browser form states using simulated external services |

## Hosted setup

1. Create a Supabase project in your own account and keep its database password
   private. Install/run the Supabase CLI from the repository root:

   ```powershell
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push --remote
   ```

   Review the pending migration before applying it to any existing project.

2. Create a Cloudflare Turnstile widget allowing `tanghao205.github.io`.
   For development, also allow `127.0.0.1` with a separate test widget/config.
   The function requires action `portfolio-message` and a hostname matching the
   allowed request origin. The browser site key is public; the secret is private.

3. Copy `supabase/runtime.env.example` to `private/supabase-runtime.env` if the
   private file does not already exist. A local template has been prepared with
   a random rate-limit secret and Hao's supplied notification recipient; the
   Turnstile and optional Resend keys still need configuration. Do not print or
   commit this file. Set `ALLOWED_ORIGINS` to the exact live site origin. Use
   comma-separated localhost origins only for local testing, not as wildcards.

   ```powershell
   npx supabase secrets set --env-file private/supabase-runtime.env
   npx supabase functions deploy submit-message track-visit weekly-digest --remote
   ```

   Supabase supplies `SUPABASE_URL` and the legacy
   `SUPABASE_SERVICE_ROLE_KEY` inside the function. `config.toml` disables JWT
   verification for this visitor endpoint only; Turnstile, input checks, and
   database permissions remain mandatory. If your project disables legacy keys,
   adapt the server's REST authentication to your project's supported secret key
   before enabling the form.

4. Put the public function URL and Turnstile site key into
   `assets/portfolio/contact-config.js`. Example endpoint:
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-message`.
   Never put a service-role key or a Turnstile secret in that file.

5. Build and test locally, then deploy the frontend through the separately
   approved Pages workflow. Perform the hosted smoke checks below before
   treating message delivery as operational.

## Reading and managing messages

Sign into your Supabase dashboard. Open Table Editor → `visitor_messages`,
sort by `created_at` descending, and filter status `new`. Read a message,
reply using your email client, then set status `read` or `archived`. Delete
messages when no longer needed. Dashboard access is the initial admin backend;
there is no additional public admin route or visitor account requirement.

Both message/rate tables have RLS enabled and no visitor policies. Table access
is revoked from `anon` and `authenticated`, and RPC execution is granted only
to `service_role`. The signed-in dashboard operator manages the inbox with
project-level access. An ordinary app login does not grant inbox access.

## Optional Gmail notifications

The supplied Gmail address is a private notification destination, not public
website copy. Set `RESEND_API_KEY`, `NOTIFICATION_FROM` (a verified sender),
and `NOTIFICATION_TO` in server secrets to enable notifications. The notification
contains the message reference and category, not visitor content or email.
It prompts you to read the inbox in Supabase. No Gmail password is needed.

Notifications are best effort; a provider error does not undo a saved message
or report failure to the visitor. Check Supabase even if no email arrives.
Notification delivery/retries and hosted mail configuration are not verified
locally. Leaving these three values blank disables email and keeps the inbox.

## Limits and privacy

- Three accepted messages per hourly sender bucket, and a global cap of fifty
  per hour. The database increments/checks counters atomically. This is a small
  portfolio's starting limit, not a guarantee against denial of service.
- Bucket keys are HMAC hashes of the normalized reply email or, for anonymous
  feedback, the reported IP. Raw IPs and location estimates are now stored
  privately as described above. Verify
  the deployed gateway overwrites `x-forwarded-for`; origin checks alone are
  not authentication and clients can spoof headers outside a browser.
- Stored email/body are intentionally private inbox data. Avoid logging request
  bodies, verification tokens, or keys. Provider request logs are governed by
  the provider's own settings.
- Maximum 24 KB JSON body, name 80 characters, message 20–4,000 characters, and
  email 254 characters. Messages are plain text; never render them as raw HTML.
- Review/export/delete inbox entries regularly. Free Supabase projects can
  pause after low activity, so evaluate the plan before relying on availability.
- There is no automatic retry or idempotency key: if delivery times out after
  saving, the visitor sees “could not be confirmed,” retains their text, and a
  manual retry may produce a duplicate.

## Verification

```powershell
npm run test:backend
npm run test:content
npm run build
npm run check
npm test
npm run format:check
```

Backend tests use PGlite (PostgreSQL compiled to WASM, development only) to run
the actual migration and exercise database permissions, successful inserts,
rate limits, invalid inputs, failed verification, storage outages, and optional
notification failure. Turnstile and network calls are simulated. Browser tests
cover disabled/unconfigured state, accepted submission, and rate-limit errors.
The site build remains an explicit allowlist and does not serve SQL, backend
code, private databases, or secret configuration.

Hosted smoke checks still required: submit a real verified message from Pages;
see it in the dashboard; confirm visitors cannot read or directly insert via
the Data API or invoke the RPC; test the fourth submission's rate limit;
verify hostname/origin rejection; and verify a real notification if enabled.
The hosted migration and function deployment are complete; successful real browser
verification and message delivery, hosted permission/rate-limit checks, and email
delivery remain unverified.

Local verification on November 9, 2026: both backend tests, the private SQLite
test, all seven browser tests (including accessibility), build/privacy checks,
and formatting passed. The form was visually inspected at desktop and mobile
sizes; overflow checks passed at widths 1440, 768, 390, and 320 pixels.

## References

- [Supabase function configuration](https://supabase.com/docs/guides/functions/function-configuration)
- [Supabase database functions and privileges](https://supabase.com/docs/guides/database/functions)
- [Supabase server secrets](https://supabase.com/docs/guides/functions/secrets)
- [Turnstile server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Resend email API](https://resend.com/docs/api-reference/emails/send-email)
