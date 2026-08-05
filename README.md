# FASYL GLMS — Frontend

General Ledger Management System client. React 19 + TypeScript, Vite, Tailwind v4,
React Router 7, Zustand, React Hook Form + Zod, Axios, Recharts.

## Getting started

```bash
pnpm install
cp .env.example .env      # point VITE_API_BASE_URL at your backend
pnpm dev
```

| Command | What it does |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Typecheck (`tsc -b`) then production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Smoke tests (mount, routing, guards, directory) |

## Backend contract

`src/lib/config.ts` appends `/api` to `VITE_API_BASE_URL`, so services use paths
like `/auth/login`. Every endpoint in the Swagger contract is implemented in
`src/domains/auth/services/authService.ts`:

| Method | Path | Used by |
| --- | --- | --- |
| POST | `/api/auth/login` | Sign-in page |
| POST | `/api/auth/logout` | Sidebar and profile menu |
| GET | `/api/auth/profile` | Session restore, profile page |
| POST | `/api/auth/change-password` | Change password page |
| POST | `/api/auth/forgot-password` | Forgot password page |
| POST | `/api/auth/reset-password` | Reset password page (token from `?token=`) |

Responses are bare objects and plain strings — there is no `{ success, data }`
envelope. `src/lib/errors.ts` normalises both shapes plus Spring validation
bodies into a single message.

### No refresh endpoint

Login returns a `refreshToken`, but the backend exposes no endpoint to redeem
it. A 401 on an authenticated request therefore ends the session: tokens are
cleared and the user lands on `/login?reason=session-expired`. If a refresh
endpoint ships later, the retry belongs in the response interceptor in
`src/lib/apiClient.ts` — the token is already stored and ready.

## Not yet wired to a backend

Two modules have complete UI but no endpoints behind them. Both isolate the
fabrication in a single service file with the replacement call documented in a
header comment:

- `src/domains/users/services/userService.ts` (+ `data/users.mock.ts`)
- `src/domains/gl/services/glService.ts`

Dashboard ledger figures come from `src/domains/dashboard/data/ledger.mock.ts`.
Deleting those three files and swapping the service bodies for `apiClient` calls
is the whole integration; no screen or hook needs to change.

Permissions are likewise local (`src/domains/users/data/permissions.ts`).
`PermissionMatrix` renders whatever groups it is handed, so a fetched catalogue
drops in unchanged.

## Structure

```
src/
  components/ui/       Primitives (button, input, modal, dropdown, table bits)
  components/common/   Composed pieces (DataTable, PageHeader, EmptyState, …)
  hooks/               useApiQuery, useApiMutation, useDataTable
  lib/                 apiClient, config, token, errors, format, queryCache
  layouts/dashboard/   AppShell, sidebar, top bar, navigation
  routes/              Route guards, loader, 404
  domains/
    auth/  dashboard/  gl/  users/     types · schema · services · hooks · components · pages
```

### Data fetching without a query library

The project stays on services + Zustand. `useApiQuery` and `useApiMutation`
supply loading / error / success state, and `lib/queryCache.ts` provides
prefix-matched invalidation, so a mutation can refresh every dependent screen:

```ts
useApiMutation(userService.create, { invalidates: ["users"] });
// refreshes users:list, users:metrics, users:analytics, users:detail:*
```

## Removed

Screens and calls with no backing endpoint were deleted rather than hidden:
the OTP verification flow, the first-login `PASSWORD_CHANGE_REQUIRED` branch,
`/users/me`, `/auth/refresh-token`, the `ApiResponse<T>` envelope, the top
navigation bar, and the Chart of Accounts, Proposals, Audit Logs and Settings
sidebar entries.

## Tests

The smoke suite (`src/app.smoke.test.tsx`) covers mounting, the route guards
and the user directory. To drop it:

```bash
pnpm remove -D vitest jsdom @testing-library/react @testing-library/dom
rm src/app.smoke.test.tsx vitest.config.ts
```
