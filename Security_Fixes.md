# Security Fixes — March Madness Tracker

Reviewed on: 2026-04-08

## Findings

| Severity | Finding | Status | Notes |
|---|---|---|---|
| Critical | `/api/admin/*` routes allowed any authenticated user to perform admin actions | ✅ Remediated | Added `requireAdmin` and enforced admin-only access in `src/routes/admin.routes.ts` |
| High | `/metrics` endpoint was publicly exposed | ✅ Remediated in code | Protected by `auth` + `requireAdmin` unless `PUBLIC_METRICS=true`; still keep behind network controls in production |
| High | `.env` file was present in the repo without a matching `.env.example` / ignore policy | ✅ Remediated in repo | Added `.gitignore`, added `.env.example`, and removed `.env` from git tracking; rotate any real secrets if they were ever used |
| High | Auth/profile endpoints accepted untrusted values without strict type checks, allowing query-shape abuse and NoSQL-style injection attempts | ✅ Remediated | Added strict string validation, normalization, rate limiting, and safer auth handling |
| Medium | Raw exception messages were returned to clients in multiple routes | ✅ Remediated | Routes now log internally and return generic server errors externally |
| Medium | Bracket ID route params were not validated before Mongoose queries | ✅ Remediated | Invalid IDs now return `400` before any database lookup |
| Medium | CORS was fully open via `cors()` instead of an allow-list | ✅ Remediated | `CORS_ORIGIN` allow-list with safe default now enforced |
| Medium | JWT verification did not enforce optional issuer/audience claims when configured | ✅ Remediated | Verification now honors `JWT_ISSUER` and `JWT_AUDIENCE` in both middleware and Passport strategy |

## Remediation plan

- [x] Add admin RBAC middleware and protect `/api/admin/*`
- [x] Lock down `/metrics`
- [x] Add strict auth input validation and safer error handling
- [x] Validate route IDs before DB queries
- [x] Add `.gitignore` and `.env.example`
- [x] Re-run static verification after changes

## Ops follow-up

- Rotate any previously used values for `JWT_SECRET`, `COOKIE_SECRET`, and third-party API keys if a real `.env` was ever committed.
- Keep `/metrics` behind both application auth and infrastructure/network restrictions in production.
- Set `ADMIN_EMAILS` and `CORS_ORIGIN` explicitly in each deployed environment.
