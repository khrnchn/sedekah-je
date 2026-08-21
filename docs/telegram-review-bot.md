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
