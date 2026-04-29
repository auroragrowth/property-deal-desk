# DealDesk — Claude Code context

This file is read automatically by Claude Code at the start of every session. It is the single source of truth for "what is this project, what are the rules, what should I do without asking."

## Project

DealDesk — UK property investor SaaS for buy-to-let investors. Founder: Paul (Peterborough, UK; dyslexic — keep responses concise and plain-language).

- Source-of-truth brief: [docs/build-brief.html](docs/build-brief.html) — read end-to-end on first session.
- Design system: [docs/design-tokens.md](docs/design-tokens.md) — read on first session, apply to all UI.
- Repo: https://github.com/DealDesk007/DealDesk (public).

## Stack — pinned, do not relitigate

Next.js 15 (App Router) · TypeScript strict · pnpm · Tailwind CSS + shadcn/ui · Postgres (Supabase, London eu-west-2) · Drizzle ORM · Clerk · Stripe Billing + Customer Portal + Stripe Tax · Inngest · Resend · Vercel · Sentry · PostHog (EU cloud) · postcodes.io.

Deferred (do not install, do not import): Cloudflare R2, Twilio, Anthropic Claude API, Mapbox, Algolia.

## Six non-negotiable architectural principles (from brief §02)

1. **Feature-folder modularity** — every feature in `/features/{name}` with its own routes, components, server logic, tests.
2. **Feed adapters via interface** — all property data sources implement `PropertyFeedAdapter`. New source = one new file.
3. **Strategy engines as plugins** — engines implement `StrategyEngine`, registered in `_registry.ts`. v1 ships only `btl`.
4. **Entitlements behind one function** — every plan check goes through `getEntitlements(userId)`. No inline plan logic anywhere.
5. **Append-only deal results** — `deal_results` rows are inserted, never updated. Same for `audit_log`.
6. **Event-driven hooks** — emit `property.ingested`, `deal.analysed`, `watchlist.added` from day one.

If any change would violate one of these, refactor instead of merging.

## Engineering rules

- Money is integer pence. Never floats. Display layer formats.
- TypeScript strict. No `any` without an inline comment justifying it.
- No magic strings for plans. Use Stripe `lookup_key` (`starter_monthly`, `pro_monthly`, `elite_monthly`).
- All user-scoped tables get RLS policies in the same migration as the table itself.
- Postcodes are normalised on insert: uppercase, no spaces.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Vitest for unit tests (engine, entitlements, validators). Playwright deferred to week 11.
- No new dependencies without flagging. Stack above is the stack.

## v1 scope discipline

- BTL strategy engine only. BRRR/HMO/SA are deferred — leave registry stubs.
- No partner marketplace, no team seats, no SMS, no PDF packs, no AI summaries, no comparison view.
- Manual-paste property adapter only for v1 dev. PropertyData adapter is a stub file with a TODO.
- Stripe test mode in dev. Live mode at launch.

If a feature isn't on the brief's "definitely in scope" list (§01), don't build it. Write a `// TODO:` comment and move on.

## Working autonomously — what to ask vs what to just do

**Just do, don't ask:**

- File edits inside the project folder
- `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, `pnpm test`
- `git add`, `git commit`, `git status`, `git diff`, `git checkout`, `git branch`, `git log`
- Drizzle commands: `pnpm db:generate`, `pnpm db:push`, `pnpm db:migrate`
- Creating folders, moving files within the project
- Reading any file in the project
- Conventional Commit messages — pick a sensible one, don't ask me to approve

**Confirm before doing:**

- `git push` to any branch (so I can see what's leaving)
- Force push, rebase, history rewrites
- `rm -rf` of anything
- Running `curl`/`fetch` against external APIs with my credentials
- Adding a new dependency (`pnpm add`)
- Editing files outside the project folder
- Anything that costs money (deploys to paid tiers, API calls with metered billing)

**Default behaviour at end of a logical chunk of work:**

1. Run `pnpm lint && pnpm typecheck && pnpm build`
2. If green: stage, commit with a descriptive Conventional Commit message, then ask me to confirm push
3. If red: report the failure, propose a fix, ask before applying it

## Communication style

- I'm dyslexic. Responses should be short, plain English, scannable. Lead with the answer, not the reasoning.
- When you finish a task, summarise in this shape: **what's built · what's broken · what I need to do next**.
- Don't ask multi-part questions. One question at a time, with concrete options.
- If I write a typo, infer intent and proceed. Don't query spelling.
- I rarely need long technical justifications. If you make an architectural choice, one sentence on why is enough.

## Where things live

- `/app` — Next.js App Router pages and API routes
- `/features/{name}` — feature folders (`auth`, `billing`, `properties`, `watchlist`, `deals`)
- `/lib/db` — Drizzle schema, client, queries, migrations
- `/lib/entitlements` — single plan-gate function
- `/lib/events` — domain event emitter
- `/jobs` — Inngest functions
- `/tests` — Vitest tests
- `/docs` — `build-brief.html` (canonical scope) + `design-tokens.md` (design system)

## Current state (update this when major milestones land)

- ✅ Week 1: scaffold, schema, Clerk auth, CI, RLS policies
- ✅ Week 2: Stripe products, Checkout, webhooks, entitlements wired, design tokens
- ✅ Week 3: properties + manual-paste adapter (paste a Rightmove/Zoopla/Purplebricks URL → property row)
- ⏳ Week 4: PropertyData stub remains (manual-paste only for v1 dev). Likely add Inngest serve endpoint here when batch ingest needs cron.
- ⏳ Weeks 5–12: per brief §12

When a week's deliverables ship, update the markers above and commit.
