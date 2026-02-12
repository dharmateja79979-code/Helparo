# Helparo MVP Monorepo

Helparo is a trust-first local helper marketplace (cleaning, plumbing, electrical), starting in Bangalore with configuration hooks to scale across India.

## Stack
- Mobile: Flutter + Riverpod + go_router
- API: Node.js + TypeScript + Fastify + Zod + Pino
- Data/Auth/Storage/Realtime: Supabase (Postgres + Auth + Storage + Realtime)

## Decisions Implemented
- OTP options in app UX: Firebase phone OTP and Supabase email OTP
- Firebase phone OTP now includes backend token exchange (`/auth/firebase/exchange`)
- Maps strategy: Google Maps primary, OpenStreetMap fallback
- Payments in MVP: cash/UPI records + optional cashfree method in data model
- Cashfree integration hooks: order creation + signed webhook processing route
- Commission: default 15%, admin-configurable via API
- Zone model: supports Bangalore start and expansion across India (`service_zones.country`)

## Quick Start
See `RUNBOOK.md`.
