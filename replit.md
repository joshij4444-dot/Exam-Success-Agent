# ExamCrack AI Coach

An AI-powered competitive exam preparation platform for Rajasthan Basic Computer Instructor aspirants — with syllabus tracking, daily mission planning, progress analytics, and an AI teacher.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, path `/api`)
- `pnpm --filter @workspace/exam-coach run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, shadcn/ui, Recharts, Wouter routing
- Auth: Clerk (via `@clerk/react` + `@clerk/express`)
- API: Express 5, path prefix `/api`
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (ESM bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema: `profiles.ts`, `syllabus.ts`, `planner.ts`
- `lib/api-client-react/src/generated/` — Orval-generated hooks and Zod schemas (do not edit)
- `artifacts/api-server/src/routes/` — Express route handlers (onboarding, profile, syllabus, planner, progress, dashboard, ai)
- `artifacts/exam-coach/src/pages/` — React pages: Home, Dashboard, Syllabus, Planner, Progress, AITeacher, Onboarding
- `artifacts/exam-coach/src/components/layout/AppLayout.tsx` — sidebar layout with onboarding gate

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks used everywhere. Never write raw fetch calls.
- Clerk auth via proxy middleware: `clerkProxyMiddleware` in `api-server` + `publishableKeyFromHost` in client.
- Mock AI responses: all AI endpoints return hardcoded data. OpenAI integration ready to add when key is available.
- Onboarding gate: `AppLayout` checks `useGetOnboardingStatus` and redirects to `/onboarding` if not completed.
- Syllabus topics seeded in DB at setup time (28 topics across 7 subjects for Rajasthan Basic Computer Instructor exam).

## Product

- **Landing page**: Public hero page with product pitch and CTA
- **Onboarding**: 4-step form collecting personal info, exam details, study preferences, and self-assessment
- **Dashboard**: Mission control — today's tasks, streak, syllabus %, selection probability gauge, motivation message
- **Syllabus Tracker**: Topic-by-topic mastery sliders, AI priority recommendations (Study/Revise/Skip)
- **Daily Planner**: Auto-generated study tasks, weekly calendar view, study hour logging
- **Progress**: Subject mastery charts, 30-day activity heatmap, streak data, selection probability trend
- **AI Teacher**: Topic explanation (Beginner/Intermediate/Advanced), practice MCQ generation with answer reveal

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- esbuild externals: `@clerk/express`, `@clerk/shared`, `@clerk/shared/keys`, `http-proxy-middleware` must be listed as external in `artifacts/api-server/build.mjs`
- Orval-generated query hooks take ONE optional `options` arg — not `(undefined, options)`. Pattern: `useGetSyllabus({ query: { queryKey: getGetSyllabusQueryKey() } })`
- Clerk proxy middleware is disabled in dev (NODE_ENV !== 'production'); 504s on `/__clerk` in dev are expected and harmless
- Syllabus topics must be seeded before the app is useful. Run the seed script or check `syllabus_topics` table count.
- Always run `pnpm --filter @workspace/db run push` after schema changes, then restart the API server workflow

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
