# VEW website improvement checklist — 16 September 2026

This is a local implementation and audit, not a claim that every screenshot item
is complete. No production data, DNS, billing settings or deployment was changed.

## Implemented in this pass

- Responsive layout containment; long text wraps, wide production trackers scroll
  inside their own labelled region, and mobile dialogs fit the viewport.
- Mobile menu labels, expanded state, Escape dismissal and close-on-navigation.
- Keyboard focus outlines, skip-to-content, reduced-motion support, larger mobile
  tap targets and form text that avoids iOS zoom.
- Existing favicon retained. Page titles update when navigating; server-rendered
  home description, canonical link and social metadata added. This remains a
  single-page app: separate crawlable URLs/metadata for each product are future work.
- Responsive CDN image sizes/quality and lazy loading (hero loads eagerly).
  The public image-link check passed for all 11 URLs.
- Clickable public contact email/phone; known fake default contacts are hidden.
  Genuine CMS contact values are preserved; missing values are not invented.
- Custom 404, loading and generic error pages. Network failures/timeouts have
  actionable messages; failed RFQ reads no longer appear as an empty account.
- RFQ double-click guard and server-side idempotency for RFQs, uploads and order
  creation. No automatic mutation retries.
- 30-second public CMS cache and simultaneous-read deduplication; private account
  requests are never cached by this helper. RFQ polling slows to 30 seconds and
  pauses in hidden tabs.
- Patched sharp to 0.35.4 for GHSA-rgj7-g3m4-5g8c. npm audit reported zero known
  vulnerabilities after installation. This does not mean the app is vulnerability-free.
- Added regression tests, a safe secret-file/value scanner, and image-link checks.
- Added CI tests/build/audit workflow and a 30-minute uptime workflow. These are
  **not active until pushed/merged into the default GitHub branch**. GitHub Actions
  schedules are best-effort, may consume plan minutes, and are not an uptime SLA.
  Enable failed-workflow notifications in GitHub to receive alerts.

## Existing protections verified by regression tests

- Email verification before login; expiring, single-use verification/reset links.
- Salted scrypt password hashes; safe responses do not expose password hashes.
- Server-side owner/manager/customer permissions, RFQ/file isolation, company
  membership and invitation checks; only the owner manages managers.
- Database-backed limits for authentication/email/upload operations.
- Explicit input normalization and allowlists, UUID business IDs, upload type/size
  limits, sanitized production errors, and restrictive framing/no-sniff headers.
- Concurrent reset/verification token consumption, concurrent RFQ numbering and
  optimistic order-update conflict checks.
- Private env files are ignored. Current deliverables did not contain saved secret
  values. No private env filenames were found in locally available Git history.
  This is not a full historical or remote secret audit. Rotate any credential
  previously pasted into chat or exposed elsewhere.

## Coordinated backend hardening implemented

- Client and server now use HttpOnly/SameSite cookies (Secure in production),
  matching CSRF protection, logout revocation and protected impersonation restore.
  Users must sign in again after deployment; bearer tokens are no longer accepted.
- Authenticated write limits, bounded JSON bodies, database connection/socket
  timeouts and bounded paginated queries. This is not universal query-timeout coverage.
- Paginated RFQ/user/company/order/member lists with browser controls; aggregated
  admin statistics and query-specific database indexes.
- Upload content signatures and filename extensions checked alongside MIME and
  size. This is not malware scanning or full CAD document validation.
- Concurrent duplicate-request tests cover RFQs and uploads.
- Stronger new-password checks while preserving existing login compatibility.

## Account-level and business decisions still required

- Vercel/Resend/Atlas spending alerts, hard limits (where supported), quotas and
  least-privilege service/database accounts need account access and chosen budgets.
- Atlas backup policy, retention and an actual isolated restore rehearsal require
  an approved backup target. Do not test restoration over the live database.
- Confirm real contact details, ISO/AGMA claims, years in business, capacity and
  tolerance figures. Existing certification/capability claims were not verified.
- Confirm email domain SPF/DKIM/DMARC in Resend/GoDaddy; previous spam issues cannot
  be fixed through frontend code alone.
- Real physical-phone testing and production smoke testing after deployment remain.
  Browser viewport testing does not replace device testing.

## Not applicable to the current architecture

- SQL concatenation and SQL row-level-security settings: this app uses MongoDB;
  equivalent per-user/per-company checks are enforced in server code.
- Payment double charges and webhook signatures: there is no payment integration
  or webhook receiver. Add idempotency and provider signature checks before adding one.
- User-supplied raw HTML: reviewed screens render strings through React, not raw HTML.
- CORS `*`: not configured. Do not add wildcard credentialed CORS.

## Checks and references

Run `npm test`, `npm run build`, `node scripts/check-secrets.mjs`,
`node scripts/check-image-links.mjs`, and `npm audit --omit=dev`.
Tests use disposable MongoDB, mocked email delivery and synthetic accounts.

- [Sharp security advisory](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c)
- [OWASP session guidance](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
