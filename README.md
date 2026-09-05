# VEW--WEB

## Required environment variables

Copy `.env.example` to `.env.local` for local development. Configure the same values in Vercel for Preview and Production.

- `MONGO_URL` and `DB_NAME`: MongoDB Atlas connection.
- `AUTH_SECRET`: long random value used to sign login sessions.
- `APP_URL`: public production URL used in verification and password-reset links.
- `RESEND_API_KEY` and `EMAIL_FROM`: transactional email delivery through Resend. The sending domain must be verified in Resend.
- `OWNER_EMAIL`: `avinashreddk@gmail.com`. Only this verified email receives owner access. No default administrator is created. Register with that email and verify it; if it already exists, use password reset. Previously issued sessions and legacy demo administrators are rejected by the new authentication checks.

Customer accounts must verify their email before signing in. Verification links expire after 24 hours and password-reset links expire after one hour.

## Local checks and release

Use Node.js 24, run `npm ci`, then `npm test` and `npm run build`. Tests start their own disposable MongoDB and replace email delivery with an in-process outbox; they never connect to Atlas or send email. The first test run downloads a MongoDB binary. `npm run check:config` checks your local settings and makes a read-only database ping without displaying secrets.

In Vercel, set the environment variables above for Production, using the current database password and a verified Resend sender. `MONGODB_URI` is also accepted if your integration uses that name. Select Node.js 24 and override Install Command to `npm ci` if Vercel selects Yarn based on the legacy package-manager field. Build Command is `npm run build`; keep framework output defaults. Redeploy after changing environment variables.

Production verification must include homepage, `/api/health`, owner email verification, sign-in, reset email delivery, manager access, and customer RFQ/file isolation. Deployment is not validated by compilation alone. Changing local files does not update Vercel until those changes are deployed.

## Send a Resend test email

Set `RESEND_API_KEY` in your private `.env.local` file, replacing `re_xxxxxxxxx` with your real Resend API key. Never put the key in source code, chat, or a `NEXT_PUBLIC_` variable. Then run `npm run email:test` manually to send the Hello World example to `avinashreddk@gmail.com`.

This script uses `onboarding@resend.dev`, Resend's testing sender, which can only send to the email associated with your Resend account. A sending-only key scoped to your own domain may not allow this test sender. Production signup/reset emails still use `EMAIL_FROM` with your verified domain; this test does not change that setting. Provider acceptance does not guarantee inbox delivery. Automated tests use a mock client and send no emails.

## Access

- Owner: all business data and exclusive access to the Managers tab.
- Manager: company records, CMS content, customers, RFQs, drawings, messages, and production stages. Cannot grant/revoke staff roles, impersonate users, or edit/reset/delete owner or manager accounts.
- Customer: own RFQs, drawings and messages after verification. Internal notes are excluded.

To add a manager, ask them to register and verify their email, then add their email in Managers. Removing manager access returns them to a customer account and revokes their sessions. Company/RFQ deletion archives records to preserve business history. Customer deletion disables access and retains RFQ history. Existing company details stored on RFQs remain available there; the Companies tab maintains a separate editable contact directory.

Only verification and password-reset emails are implemented. RFQ/production notifications are not sent; the UI does not claim they are. Contact enquiries open the visitor's email application for review and sending.
