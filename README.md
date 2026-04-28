# DealDesk

UK property investor SaaS — find, analyse, and track buy-to-let deals.

The MVP build brief is the source of truth: [docs/build-brief.html](docs/build-brief.html).
Six non-negotiable architectural principles in Section 02 of the brief — every PR must respect them.

## Stack

- Next.js 15 (App Router) · TypeScript strict
- Tailwind CSS v4 · shadcn/ui (added per-component as needed)
- Postgres via Supabase (London / eu-west-2) · Drizzle ORM
- Clerk auth · Stripe Billing (test mode in dev)
- Inngest jobs · Resend email · Sentry · PostHog (EU)
- Vercel deploy

## Setup

```bash
git clone https://github.com/DealDesk007/DealDesk.git
cd DealDesk
pnpm install
cp .env.example .env.local        # then fill in real values
```

Before the first `pnpm db:push`, enable PostGIS on your dev Supabase project (SQL editor):

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

Then:

```bash
pnpm db:generate    # generate the initial Drizzle migration
pnpm db:push        # apply the schema to your dev Supabase
pnpm dev
```

### Receiving Clerk webhooks locally

```bash
ngrok http 3000
# then point your Clerk dev instance webhook at:
#   https://<your-ngrok>.ngrok-free.app/api/clerk/webhook
# subscribe to: user.created, user.updated, user.deleted
```

## Scripts

| Script              | What it does                                       |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | Next.js dev server (Turbopack)                     |
| `pnpm build`        | Production build                                   |
| `pnpm lint`         | ESLint, fail on warnings                           |
| `pnpm typecheck`    | `tsc --noEmit`                                     |
| `pnpm format`       | Prettier write                                     |
| `pnpm format:check` | Prettier check (CI)                                |
| `pnpm db:generate`  | Generate Drizzle migration from `lib/db/schema.ts` |
| `pnpm db:push`      | Apply schema to Postgres                           |
| `pnpm db:studio`    | Drizzle Studio                                     |

## Folder layout

See Section 5 of the kickoff and Section 02 of the brief.

```
/app                         # Next.js App Router
  /(marketing)
  /(authed)/dashboard | watchlist | deal/[id] | settings | onboarding/plan
  /api/clerk/webhook         # functional in week 1
  /api/stripe/webhook        # week 2
  /api/{properties,watchlist,deals,saved-filters,checkout}  # week 3+
  /sign-in, /sign-up         # Clerk catch-all routes
/features
  /auth, /billing, /watchlist
  /properties/adapters/{_interface, manual-paste, propertydata (stub)}
  /deals/engines/{_interface, _registry, btl}
/lib
  /db/{schema, client, queries}
  /events                    # domain event emitter
  /entitlements
/jobs                        # Inngest functions (week 3+)
/tests                       # Vitest (engine, entitlements, validators)
```

## Branches

- `dev` → dev.dealdesk.com (dev Supabase, Stripe test, Clerk dev)
- `main` → app.dealdesk.com (prod Supabase, Stripe live, Clerk prod)
