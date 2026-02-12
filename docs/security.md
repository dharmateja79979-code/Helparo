# Helparo Security (MVP)

## Threat Model

## 1) Fake helpers
- Risk: unverified providers accept jobs.
- Mitigations:
  - `helper_profiles.kyc_status` gate (`approved` required).
  - Admin approve/reject/suspend endpoints.
  - Audit logs for moderation actions.

## 2) Fake reviews
- Risk: fabricated ratings damage trust.
- Mitigations:
  - One review per booking (`reviews.booking_id unique`).
  - Only customer can review.
  - Booking must be `paid` before review insert policy passes.

## 3) Payment disputes
- Risk: mismatch between service completion and payment status.
- Mitigations:
  - Explicit `payments` table with method/status/metadata.
  - Booking timeline events include payment action.
  - Audit log on payment record actions.
  - Cashfree webhook signature verification scaffold (`x-webhook-signature`).

## 4) Location spoofing
- Risk: helper sends fake coordinates.
- Mitigations:
  - Location accepted only for helper assigned to booking.
  - Timestamped pings stored as booking events.
  - Planned enhancement: GPS integrity checks and anomaly detection.

## 5) Account takeover
- Risk: attacker accesses customer/helper account.
- Mitigations:
  - OTP login only (Firebase phone OTP + Supabase email OTP).
  - JWT auth for all protected API routes.
  - Rate limiting by user/IP.
  - Planned enhancement: device binding and risk-based MFA.

## 6) Data scraping / privacy leakage
- Risk: bulk harvesting of PII and helper data.
- Mitigations:
  - RLS on all core tables.
  - Booking access guarded by `can_access_booking`.
  - No direct phone exposure in public helper listing.
  - Audit logs readable only by admins.

## Security Checklist (MVP)
- [x] Row Level Security enabled for all business tables.
- [x] `is_admin`, `is_helper`, `can_access_booking` DB functions.
- [x] Auth guard + role checks for all non-public endpoints.
- [x] Zod validation on route input.
- [x] Structured error normalization.
- [x] Rate limiting enabled globally + tighter on create booking/messages.
- [x] Signed upload URLs for media.
- [x] Service role key used only in backend.
- [x] Audit logs for sensitive actions.
- [x] Secrets isolated to `.env` files.

## Remaining Hardening
- Malware scanning for uploads.
- WAF/bot management and anomaly scoring.
- Secure webhook verification for live payment gateways.
- Enhanced anti-fraud on reviews and location authenticity.
