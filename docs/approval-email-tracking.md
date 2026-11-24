# Approval email tracking

Institution approval and email delivery have separate outcomes. New single, bulk and Telegram approvals create a pending email record in the approval transaction. Sending runs after the response and updates that record. A failed send does not undo the institution approval.

The approved-institutions table and detail page show Pending, Sending, Accepted, Delivered, Failed, Bounced or Unknown. The detail page includes attempt count, last attempt, acceptance/delivery timestamps and provider message ID. No tracking row means historical delivery is unknown. There is no automatic backfill or resend of historical approvals.

MailerSend acceptance requires HTTP 202 and an `x-message-id`; acceptance is not delivery. Missing configuration and explicit provider rejection produce Failed. Network errors, ambiguous server errors and unexpected responses produce Unknown, to prevent accidental duplicate emails. An interrupted attempt stays Sending until its outcome is investigated.

Only Pending and Failed records can be sent from the admin action. The action requires an active, unbanned admin and a still-approved institution. A transactional claim prevents concurrent sends. Accepted, Delivered, Bounced, Sending and Unknown records cannot be retried through this action. Bounces require checking the recipient in MailerSend, rather than blindly resending.

## Delivery and bounce callbacks

Register a MailerSend **version 2** webhook with URL:

`https://sedekah.je/api/integrations/mailersend/webhook`

Subscribe to `activity.delivered`, `activity.soft_bounced` and `activity.hard_bounced`. Copy the webhook’s signing secret into the production Railway variable `MAILERSEND_WEBHOOK_SECRET`, then redeploy. The API token needs domain-read and webhook-management permissions to automate this setup; a sending-only token cannot manage webhooks.

The endpoint authenticates the exact raw request body with HMAC-SHA256 and a constant-time signature comparison. MailerSend’s documented fixed-key URL-validation request is accepted only for `webhook.test` and cannot change delivery state. Actual events require the private webhook secret. Provider message IDs correlate callbacks to emails. Early callbacks are retained without recipient data; duplicate or older callbacks do not overwrite newer outcomes. A persistence failure returns 503 for provider retry.

Until callbacks are connected, accepted sends remain Accepted. They are never inferred to be Delivered.

## Verification

Apply additive migration `0013_approval_email_tracking` before releasing the application. Run the email integration tests only against a disposable loopback PostgreSQL database:

```sh
DATABASE_URL=postgres://...@127.0.0.1:5432/disposable \
DIRECT_URL=postgres://...@127.0.0.1:5432/disposable \
MAILERSEND_API_KEY='' MAILERSEND_APPROVAL_TEMPLATE_ID='' \
MAILERSEND_WEBHOOK_SECRET=local-webhook-secret-for-tests \
APPROVAL_EMAIL_LOCAL_TESTS=true bun test lib/email
```

These tests send no real email. They exercise concurrent claims, explicit rejection, safe retry, missing configuration, uncertain outcomes, transaction rollback, signature authentication, early callbacks and event ordering.
