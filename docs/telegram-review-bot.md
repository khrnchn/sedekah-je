# Telegram institution review bot

The Telegram bot provides a private, button-driven review queue for pending
institutions. Community submissions and automated bulk imports are separate
queues.

## Configuration

Keep all values in the deployment environment or an ignored local `.env` file.
Never commit real Telegram or user identifiers.

```dotenv
TELEGRAM_BOT_TOKEN="..."
TELEGRAM_CHAT_ID="..."
TELEGRAM_WEBHOOK_SECRET="at-least-16-random-characters"
TELEGRAM_ADMIN_BASE_URL="https://your-deployment.example"

# Optional when the database has exactly one active, non-banned admin.
TELEGRAM_REVIEWER_USER_ID="your-better-auth-admin-user-id"
```

The bot accepts review actions only when both the Telegram sender ID and private
chat ID equal `TELEGRAM_CHAT_ID`. Every decision is also attributed to an active
sedekah.je administrator. If multiple active administrators exist,
`TELEGRAM_REVIEWER_USER_ID` is required.

`TELEGRAM_ADMIN_BASE_URL` falls back to `BETTER_AUTH_URL` when omitted.

## Local development

Ensure the bot has no active webhook, then run:

```bash
bun run telegram:review:dev
```

This uses Telegram long polling and does not print credentials or update
payloads. Stop it with Ctrl+C.

## Production webhook

After deploying the webhook route and configuring the environment, register it:

```bash
bun run telegram:webhook:set
```

The command registers only `message` and `callback_query` updates. Telegram
sends `TELEGRAM_WEBHOOK_SECRET` in its webhook header; the route rejects missing
or incorrect values before parsing the update.

## Review upgrade and database rollout

Apply `db/migrations/0011_true_goliath.sql` through the normal migration workflow
**before** running this version of the app. It adds `institutions.review_metadata`
and `telegram_review_operations`; institution statuses remain unchanged.

Cards show the image, locally decoded recipient, ownership warnings, address and
brief AI status. The full copyable QR payload appears in the photo caption;
when it cannot fit, it is automatically sent in full as replies below the card.
Space is reserved for AI status changes so completion keeps the payload in its
original place. Missing coordinates and suspected duplicates appear as warnings.

The main actions are **Approve**, **Reject**, **Skip**, **Hold** (or **Resume
submission**), **Review tools**, and **Web admin** when configured. Review tools
opens evidence confirmation, location editing, QR recovery/replacement, duplicate
comparison, AI details/retry, and QR diagnostics/full payload. Checksum validity
checks payload integrity only; it does not verify recipient ownership. AI provider
failures show their HTTP status on the card. Submissions with missing payloads
are included in search and navigation.

- **Edit location** accepts address text, a replied Telegram pin, or explicit
  corrections such as `{"city":"Petaling Jaya","state":"Selangor"}`. A pin changes
  coordinates only. Every preview shows the complete before/after location and
  source; fields remain unchanged until confirmation.
- **Find address** queries name, city and state, then proposes a result with a
  conflict warning and the actual provider (Google or Nominatim). It never saves automatically. Manual editing works without
  Google credentials or billing.
- **Retry/replace QR** tries native-resolution decoding within the pixel limit,
  then bounded scaling, contrast and overlapping crops.
  Reply to its prompt with a JPEG, PNG or WebP photo/document under 10 MB to replace
  it. Downloads validate the actual image, byte limit and pixel limit. New images
  are staged under immutable R2 keys; confirmation updates the image reference and
  payload in one database transaction. Audit history retains the prior pair.
  Abandoned previews may leave unreferenced staged objects; never delete prior
  audit references when cleaning storage.
- **Confirm evidence** requires ownership confirmation: the recipient belongs to
  the institution and is not an individual. Reply `PHYSICAL` to attest a photo of
  its physical display. NGO (`kebajikan`)/tahfiz graphics may instead use an official
  HTTPS source URL the admin has opened and verified. A second confirmation saves
  that attestation. Image byte hashes are checked again before quick approval.
- **Compare duplicates** shows exact payload matches, similar names in the same
  state and approved institutions within 300 metres. Nearby is a suggestion.
  Choose **Different institution** or confirm rejection as a duplicate of the
  displayed ID. Alternate QR data remains stored. Exact payload matches always
  block quick approval; changed comparison records require a fresh decision.
- **Hold** keeps a record `pending` but removes it from ordinary next navigation.
  Use **Held submissions** or `/find ID`, then **Resume submission** to return it
  to its original queue. Community and bulk-import queues remain separate.
- Approvals and rejections advance the corresponding queue and use the existing
  review service for attribution, cache invalidation and approval email. **Undo**
  is bound to the latest saved review and expires with its operation. Rejection
  notes and changes remain in audit history even after undo.

Reply prompts and confirmations expire after 15 minutes, are single-use, and are
bound to the authorized chat, institution, Telegram prompt message and record
snapshot. Saving and approving lock and recheck current data in PostgreSQL.
Long plain-text previews and AI reports are split without truncation. Confirmation
buttons are bound to the final preview message. Older approval/undo confirmations
must be reopened after this upgrade.

## Optional AI assessment

```dotenv
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-flash-latest"
TELEGRAM_AI_ENABLED="false"
```

For the verified Claude-compatible gateway, use server-only settings:

```dotenv
TELEGRAM_AI_PROVIDER="anthropic-compatible"
TELEGRAM_AI_BASE_URL="https://gateway.ta-0.com/claude-v1/v1"
TELEGRAM_AI_MODEL="claude-sonnet-5-5"
TELEGRAM_AI_API_KEY=""
TELEGRAM_AI_ENABLED="false"
```

Use the provider key only in the server environment and keep automatic analysis
disabled until previously reviewed real images have been checked. The gateway
accepted a synthetic image assessment on 27 October 2026. Direct Gemini access
was still returning a billing-related 403 at the last check. Manual tools do not
depend on either provider.

When enabled, saving an ordinary community or partner submission persists queued
work before scheduling it through Next.js `after`. Bulk imports and untouched
backlog require **Retry analysis**. Opening a card recovers queued or interrupted
work and validates an existing assessment's cache against current image bytes.
Atomic claims prevent concurrent API calls. The worker makes at most three
attempts total for transient network/timeout/408/429/5xx errors with backoff; 403
and malformed responses are permanent until an explicit retry. Expired processing
leases recover without resetting that attempt count or erasing unchanged reviewer
confirmations. Response-body timeouts are transient, just like failures before
response headers; malformed JSON and schema failures remain permanent.

The selected provider receives image bytes, institution name/location and the recipient decoded
locally from those bytes. Contributor names/IDs/emails, notes and full payloads
are excluded from the text input. Image text is untrusted evidence. Output is
schema-validated and can only describe image type, visible text, recipient
relationship, conflicts and an explanation. It cannot edit, approve or reject.
The gateway currently rejects Claude's native `output_config.format`; its adapter
requests the exact JSON schema in the prompt and validates every response locally.
A single Markdown fence around otherwise valid JSON is accepted. If local QR
validation fails, an AI claim that the recipient is an institution becomes
**unclear** because image text cannot verify who receives payment.
Assessments are cached by image bytes, institution details, payload, provider endpoint/model and
prompt version. Relevant changes invalidate assessments and evidence. Results or
**AI unavailable** reports are sent to the configured review chat. AI errors do
not prevent submission or manual review.

PayNet's DuitNow QR payload format indicator is `02`. The local TLV and CRC
validator checks this value; older approved records with missing QR payloads or
other payment formats still need manual recovery or web review.

## Local verification

Focused tests:

```bash
bun test lib/integrations/telegram lib/features/institution-review
bun run type-check
bun run build
```

`review-database.test.ts` opts out by default. Use a **disposable loopback
PostgreSQL database with this schema**, then explicitly opt in. These tests delete
all institution and operation rows in that test database. They refuse a remote
hostname. Disable real Telegram credentials and use the mock-only Gemini key:

```bash
TELEGRAM_REVIEW_LOCAL_TESTS=true \
DATABASE_URL=postgresql://postgres@127.0.0.1:55438/postgres \
TELEGRAM_AI_ENABLED=true GEMINI_API_KEY=local-review-test \
TELEGRAM_BOT_TOKEN='' TELEGRAM_CHAT_ID='' \
bun test lib/integrations/telegram/review-database.test.ts
```

The suite uses synthetic evidence for physical posters, NGO/tahfiz artwork,
truncated/generic and individual labels, Al-Istiqlal-style location conflicts,
and UPM-style same-institution/different-QR comparisons. Validate provider
assessments separately against previously reviewed images before enabling AI.
