# Helparo Runbook (MVP)

## Monorepo Structure
- `apps/api`: Fastify + TypeScript API
- `apps/mobile`: Flutter app (customer + helper)
- `supabase/migrations`: SQL schema + RLS
- `supabase/seed`: seed scripts
- `docs/openapi.yaml`: API docs
- `docs/security.md`: threat model + checklist

## Prerequisites
- Node.js 20+
- npm 10+
- Flutter 3.22+
- Supabase project
- Firebase project (phone OTP)

## 1) Configure Environment

### API
1. Copy `apps/api/.env.example` to `apps/api/.env`.
2. Fill Supabase URL/keys and bucket name.
3. Optional payment/push:
   - Set `CASHFREE_ENABLED=true` + Cashfree credentials for gateway mode.
   - Set `FCM_ENABLED=true` and Firebase Admin credentials for push dispatch.
4. Firebase bridge (for phone OTP -> API auth):
   - Set `APP_JWT_SECRET`.
   - Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.

### Mobile
1. Copy `apps/mobile/.env.example` to `apps/mobile/.env`.
2. Fill Supabase, Firebase, API URL, Maps key.
3. Keep `MAP_PROVIDER_PRIMARY=google` and fallback `osm`.

## 2) Setup Supabase
1. Run migration `supabase/migrations/0001_init.sql`.
2. Run seed `supabase/seed/seed.sql`.
3. Run migration `supabase/migrations/0003_auth_identities.sql`.
4. Run migration `supabase/migrations/0004_marketplace_extensions.sql`.
5. Create storage bucket `booking-media` (private).
6. Enable Realtime for `bookings`, `booking_events`, `messages`.

## 3) Run API
```bash
cd apps/api
npm install
npm run dev
```
API starts at `http://localhost:8080`.

## 4) Run Mobile
```bash
cd apps/mobile
flutter pub get
flutter run
```

Pass env values via dart-define (example):
```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:8080 \
  --dart-define=SUPABASE_URL=https://your-project.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=your-anon-key
```

## 5) Deploy (recommended)
- Supabase: hosted project (DB/Auth/Storage/Realtime)
- API: Railway (low-friction MVP deploy)
- Mobile: Android first, then iOS

## 6) Operational Notes
- All sensitive actions write to `audit_logs`.
- Realtime tracking endpoint:
  - `GET /bookings/:id/timeline`
- Catalog endpoints:
  - `GET /categories`
  - `GET /zones`
- Address endpoints:
  - `GET /addresses`
  - `POST /addresses`
- Commission config managed via:
  - `GET /admin/config/commission`
  - `POST /admin/config/commission`
- Default commission seed is `15%`.
- Cashfree:
  - Create order: `POST /bookings/:id/payment/cashfree/order`
  - Webhook: `POST /payments/cashfree/webhook` (`x-webhook-signature` + `x-webhook-timestamp` verified with `CASHFREE_SECRET_KEY`)
- Advanced feature endpoints:
  - `POST /bookings/:id/dispute`
  - `GET /admin/disputes`
  - `POST /admin/disputes/:id/resolve`
  - `POST /premium/subscribe`
  - `GET /premium/me`
  - `POST /corporate/accounts`
  - `POST /corporate/bookings`
  - `GET /corporate/bookings`
  - `POST /ai/estimate`

## 7) Basic QA Checklist
- Customer can create booking, message, upload media, record payment, and review.
- Helper can update profile, accept jobs, update status, and send location pings.
- Admin can approve/reject/suspend helpers and read audit logs.
- RLS blocks cross-user data access.

## 8) End-to-End QA Script
1. Create 1 customer account and 1 helper account.
2. Login helper and complete onboarding:
   - set bio/base price
   - choose at least one category and zone
3. As admin, approve helper using:
   - `POST /admin/helpers/:id/approve`
4. Login customer and create address from Profile.
5. Customer creates booking from category -> helper -> confirm.
6. Helper opens jobs:
   - verify booking appears in `Requested` tab
   - accept booking
7. Helper sets `enroute`, `started`, `completed`.
8. Customer opens booking tracking:
   - verify timeline updates
   - send message
   - upload issue photo
   - verify media preview renders via signed URL
9. Customer records payment (`upi`/`cash`/`cashfree`) and verifies booking reaches `paid`.
10. Customer submits review.
11. Helper opens earnings screen and verifies week/month/jobs numbers update.
12. Admin fetches audit logs and validates key actions exist:
   - booking accepted/status updates
   - payment recorded
   - helper moderation actions

## 9) Release Readiness Gates
1. Security gates:
   - All production secrets set (no defaults).
   - `APP_JWT_SECRET` rotated from local placeholder.
   - Supabase RLS verified in staging with non-admin test users.
2. Reliability gates:
   - API build and tests passing (`npm run api:build`, `npm run api:test`).
   - Mobile login verified for both OTP modes.
   - Realtime timeline updates verified on two devices.
3. Payment gates:
   - Manual payment record flow validated (`cash`, `upi`).
   - If Cashfree enabled: webhook signature validation tested with real payload.
4. Ops gates:
   - Logging visible for API in deployed environment.
   - Admin audit-log endpoint returns moderation and booking events.
   - Error budget policy defined for MVP (target availability and alert threshold).
5. App UX gates:
   - Session persistence and logout verified.
   - 401 invalid-session behavior forces logout and re-auth.
   - Booking media upload + signed-preview flow works on slow network.

## 10) Release Commands
1. Environment audit:
```bash
npm run release:env-audit
```
2. API compile + tests:
```bash
npm run api:build
npm run api:test
```
3. API smoke checks:
```bash
set API_BASE_URL=http://localhost:8080
set CUSTOMER_BEARER_TOKEN=<customer_token_optional>
set HELPER_BEARER_TOKEN=<helper_token_optional>
npm run release:api-smoke
```
4. Admin operations CLI:
```bash
cd apps/api
set API_BASE_URL=http://localhost:8080
set ADMIN_BEARER_TOKEN=<admin_token>
node scripts/admin-cli.mjs audit
node scripts/admin-cli.mjs approve <helper_user_id>
node scripts/admin-cli.mjs commission 15
```
