# Vocab Master Web

Next.js 16 + Supabase vocabulary workspace. Production: https://vocab-master-sand.vercel.app

## Development

Use Node.js 24 (22.13+ also supports the test runner):

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Fill in the Supabase URL and **anon/publishable** key. Never use a service-role key in a `NEXT_PUBLIC_` variable. `GEMMA_API_KEY` stays on the server. The app uses Webpack for reproducible builds on hosts that restrict Turbopack's child-process communication.

- `/`: home; `/login` and `/signup`: separate account flows.
- `/dashboard`: authenticated cloud collection with lists, editing, search, sorting, CSV import/export, and recall practice.
- `/demo`: editable browser-local sample collection, no account required. Demo data does not sync to cloud; export CSV to transfer it.
- `/api/health`: readiness; checks the Auth service and both vocabulary tables, returns 503 when configuration is missing or unreachable, and reports AI configuration separately without secrets.

CSV headers: `Term,Definition,Example,Notes`; first two are required. UTF-8, quoted multiline values and Chinese are supported. Imports accept up to 1,000 rows / 2 MB, reject invalid rows, and skip repeated terms in the destination list. Export uses the current search/list filter and escapes spreadsheet formulas.

## Database

For a new Supabase project, run `schema.sql`, then `migrations/20261101_web_release.sql` in SQL Editor. For an existing project, run **only the migration**. It adds indexes, checks word/list ownership, and provides transaction-safe AI updates plus a shared five-requests-per-user-per-minute limit. It does not remove vocabulary data. Apply it before enabling AI in production.

Supabase Auth URL configuration:

- Site URL: `https://vocab-master-sand.vercel.app`
- Allowed redirect URL: `https://vocab-master-sand.vercel.app/auth/callback`
- Local redirect (development only): `http://localhost:3000/auth/callback`

Keep the default confirmation URL with PKCE (open the email link in the initiating browser), or use `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email` in the confirm-signup email template for token-hash verification. Both callback formats are supported. Set Supabase's built-in Auth rate limits for your expected traffic.

## Verify

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm start
npm run test:smoke
```

Smoke tests check public routes, unauthenticated access protection, callback destinations, readiness, and headers. For production: `SMOKE_BASE_URL=https://vocab-master-sand.vercel.app SMOKE_REQUIRE_READY=1 npm run test:smoke`.

Browser verification covers adding/editing words, lists, filtered practice, wrong-answer retry, modal keyboard controls, persistence on reload, and phone layouts. Cloud signup/email delivery, RLS, and live AI must also be checked with an account in the configured Supabase project.

## Release on the existing Vercel project

1. Keep the existing repository integration and project; Root Directory must be `web-app`.
2. Configure the variables from `.env.example` in Vercel Production. `NEXT_PUBLIC_*` values are embedded at build time; changing them requires rebuilding. The existing production environment should be retained.
3. Apply the additive SQL migration in Supabase.
4. Push the verified commit to the existing production branch (`main`). Vercel automatically builds it. Do not create a desktop release tag for a web-only release.
5. Wait for Vercel's deployment status to be `success`, then run the production smoke check and test sign-in, adding a temporary test word, persistence, and AI on that test word.

Rollback: promote the preceding deployment in Vercel, or revert the release commit and push `main`. The additive migration is compatible with the preceding app; leave it applied. Trigger rollback for persistent 5xx responses, broken sign-in, or failed word saves. `/api/health` checks Auth and database reachability. The AI flag reports key presence, not provider quota or model availability.
