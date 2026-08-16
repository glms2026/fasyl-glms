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
the services under `src/domains/{auth,users}/services/`:

| Area | Service | Endpoints |
| --- | --- | --- |
| Auth | `authService.ts` | `/auth/login`, `/logout`, `/profile`, `/change-password`, `/forgot-password`, `/reset-password` |
| Users | `userService.ts` | `/users` (paginated list, create), `/users/{id}` (get, update, delete), `/users/{id}/roles`, `/activate`, `/deactivate`, `/lock`, `/unlock`, `/suspend`, `/unsuspend` |
| Approvals | `approvalService.ts` | `/user-approval-requests/pending`, `/mine`, `/{id}`, `/{id}/approve`, `/{id}/reject`, `/assign-role` |
| Roles | `roleService.ts` | `/roles` (catalogue), `/roles/{roleId}/permissions` (get, assign, remove all, remove one) |

Responses are bare objects and plain strings — there is no `{ success, data }`
envelope. `src/lib/errors.ts` normalises both shapes plus Spring validation
bodies into a single message.

### Maker-checker flow

Most sensitive user writes are approval-gated: create, update, lock, suspend,
unsuspend, deactivate and role changes return a `UserApprovalRequest` and only
take effect once an authorizer approves it via the Approvals screens. Only
`activate`, `unlock` and `delete` act instantly — and those three are
ADMIN-only on the backend.

### Roles & permissions

The role-permission endpoints take a numeric `roleId`. Role names are resolved
to IDs through `GET /api/roles`, the live role catalogue (id, name and
permission names per role). `roleService.listRoles()` + `useRolesCatalogue`
drive the Roles & Permissions screen, the role filters and the role pickers.
The permission names offered in the assignment matrix mirror the backend's
seeded `PermissionInitializer` catalogue.

### First-login password change

Created users log in with a temporary password and `mustChangePassword = true`
on the backend. The login response carries `passwordChangeRequired`; while it
is set, the backend's `PasswordChangeFilter` answers 403 "Password change
required" to every endpoint except change-password, logout and refresh-token.
The client honours that contract: the flag is kept in the auth store (and
survives a page reload via the 403 on `/auth/profile`), the `MustChangePassword`
route guard locks the app, and the user is shown a full-screen `/force-password-
change` screen (no shell, no cancel, with a sign-out escape hatch). Changing the
password clears the flag server-side and revokes every token, so the client
signs the user out and lands them on `/login?reason=password-changed`.

### No refresh endpoint

Login returns a `refreshToken`, but the backend exposes no endpoint to redeem
it. A 401 on an authenticated request therefore ends the session: tokens are
cleared and the user lands on `/login?reason=session-expired`. If a refresh
endpoint ships later, the retry belongs in the response interceptor in
`src/lib/apiClient.ts` — the token is already stored and ready.

## Not yet wired to a backend

The GL module still has UI with no endpoints behind it:

- `src/domains/gl/services/glService.ts`

Dashboard ledger figures come from `src/domains/dashboard/data/ledger.mock.ts`.
The users module is fully integrated; dashboard user figures and the pending-
approvals panel derive from live `/users` and `/user-approval-requests` calls.

Permissions are likewise local (`src/domains/users/data/permissions.ts`),
mirroring the backend's seeded catalogue. `PermissionMatrix` renders whatever
groups it is handed, so a fetched catalogue drops in unchanged.

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
the OTP verification flow, `/users/me`, `/auth/refresh-token`, the
`ApiResponse<T>` envelope, the top navigation bar, and the Chart of Accounts,
Proposals, Audit Logs and Settings sidebar entries.

## Tests

The smoke suite (`src/app.smoke.test.tsx`) covers mounting, the route guards
and the user directory. To drop it:

```bash
pnpm remove -D vitest jsdom @testing-library/react @testing-library/dom
rm src/app.smoke.test.tsx vitest.config.ts
```
