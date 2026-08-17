# General Ledger Management System (GLMS) — System Guide

> This guide describes the **actual, current implementation** in `src/main/java`. It covers
> the Maker/Checker (Control/Authoriser) approval workflow, JWT authentication, role-based
> access control, audit logging, and ledger management.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Core Features](#4-core-features)
5. [Roles, Permissions & Seeded Data](#5-roles-permissions--seeded-data)
6. [Setup Instructions](#6-setup-instructions)
7. [Key Components Breakdown](#7-key-components-breakdown)
8. [API Reference](#8-api-reference)
9. [Workflows Walkthrough](#9-workflows-walkthrough)
10. [Security Model](#10-security-model)
11. [Testing](#11-testing)
12. [Operational Notes & Known Caveats](#12-operational-notes--known-caveats)

---

## 1. Overview

The **General Ledger Management System (GLMS)** is a Spring Boot REST backend that manages
users, roles, permissions, approval requests, audit logs, and ledger records.

Its defining feature is a **Maker/Checker (Control/Authoriser) approval workflow**:

- A **CONTROL** user (the *maker*) initiates state-changing operations (create user, deactivate,
  suspend, lock, assign roles, change role permissions, etc.).
- The change does **not** take effect immediately. A `PENDING` approval request is created.
- An **AUTHORIZER** (the *checker*) or an **ADMIN** approves or rejects the request.
- Only after approval is the underlying operation actually executed in the database.

Administrators have **full oversight**: the ADMIN role can approve/reject/cancel any request
and can also perform several operations directly (activate, unlock, soft-delete, clear role
permissions) without going through the workflow.

Secondary pillars of the system:

- **JWT authentication** with revocable access tokens (stored server-side) and refresh tokens.
- **Mandatory first-login password change** for users created through the maker workflow.
- **RBAC** — users → roles → permissions, with both role and permission checks at the method level.
- **Audit logging** — every significant action is recorded; ADMIN can view and export the trail.
- **Ledger management** — user-owned ledger records with admin oversight.

---

## 2. Technology Stack

| Layer | Technology |
| --- | --- |
| Language | Java 21 |
| Framework | Spring Boot 4.1.0 |
| Web | Spring MVC (REST, `@RestController`) |
| Security | Spring Security, JJWT (0.12.7), BCrypt |
| Persistence | Spring Data JPA / Hibernate |
| Database | PostgreSQL (runtime), H2 (tests only) |
| Build | Maven (Maven Wrapper `mvnw`) |
| API Docs | SpringDoc OpenAPI 3 / Swagger UI |
| Email | SendGrid (dependency present; mail sending not yet wired) |
| Boilerplate | Lombok |
| Validation | Jakarta Bean Validation |
| Serialization | Jackson (JSR-310 for dates) |

Key dependencies (`pom.xml`): `spring-boot-starter-data-jpa`, `-security`,
`-security-oauth2-resource-server`, `-web`, `-validation`, `-mail`, `springdoc-openapi-starter-webmvc-ui`,
`jjwt-*`, `postgresql`, `h2` (test scope), `lombok`.

---

## 3. System Architecture

GLMS uses a classic **layered architecture**:

```text
┌────────────────────────────────────────────────────────────────┐
│  Client (frontend / curl / Swagger UI)                          │
└───────────────┬────────────────────────────────────────────────┘
                │ HTTP (JSON) — port 8083
┌───────────────▼────────────────────────────────────────────────┐
│  Security filter chain                                          │
│    CORS → CSRF(off) → stateless session                        │
│    → JwtAuthenticationFilter     (validates Bearer token)      │
│    → PasswordChangeFilter        (mandatory password change)   │
└───────────────┬────────────────────────────────────────────────┘
┌───────────────▼────────────────────────────────────────────────┐
│  REST Controllers   (Controller layer)                         │
│    AuthenticationController, UserController,                   │
│    UserApprovalRequestController, RolePermissionController,    │
│    LedgerController, AuditLogController                        │
└───────────────┬────────────────────────────────────────────────┘
┌───────────────▼────────────────────────────────────────────────┐
│  Services (business rules, @Transactional)                     │
│    AuthenticationService, UserService,                         │
│    UserApprovalRequestService, RolePermissionService,          │
│    LedgerService, AuditLogService, RefreshTokenService,        │
│    CustomUserDetailsService                                    │
└───────────────┬────────────────────────────────────────────────┘
┌───────────────▼────────────────────────────────────────────────┐
│  Repositories (Spring Data JPA)                                │
└───────────────┬────────────────────────────────────────────────┘
┌───────────────▼────────────────────────────────────────────────┐
│  Database (PostgreSQL)                                         │
└────────────────────────────────────────────────────────────────┘
```

### Request lifecycle (what happens on every call)

1. **CORS/CSRF/session** — CORS is open (`*` origin patterns, dev configuration); CSRF is
   disabled because authentication is stateless (JWT); sessions are not created.
2. **`JwtAuthenticationFilter`** — reads `Authorization: Bearer <token>`, verifies the token is
   stored in the `JWT_TOKENS` table and **not revoked**, validates signature/expiry, loads the
   `UserDetails`, and populates the Spring `SecurityContext` with the user's `ROLE_*` and
   permission authorities.
3. **`PasswordChangeFilter`** — if the authenticated user has `mustChangePassword = true`,
   only `/api/auth/change-password`, `/api/auth/logout`, and `/api/auth/refresh-token` are
   reachable; every other path returns `403 Password change required`.
4. **URL authorization** — `SecurityConfig` rules: public paths (`/api/auth/login`,
   `/forgot-password`, `/reset-password`, Swagger, `/error`, OPTIONS), `/api/admin/**`
   requires `ROLE_ADMIN`, everything else requires authentication.
5. **Method authorization** — each controller method carries `@PreAuthorize` with the specific
   roles/permissions required.
6. **Service layer** — the actual business logic, validations, and transaction boundaries.
7. **Repository layer** — JPA persistence.
8. **Database** — PostgreSQL.

### Package structure

```text
src/main/java/com/glms/general_ledger_management_system
├── GeneralLedgerManagementSystemApplication.java   (main entry)
├── Permissions.java                                 (permission constants)
├── Config/
│   ├── DatabaseInitializer.java      seeds roles + 4 system users
│   ├── PermissionInitializer.java    creates permissions + role grants
│   ├── WebConfig.java                stable PagedModel JSON for pages
│   ├── OpenApiConfig.java            Swagger/OpenAPI bean
│   └── JacksonConfig.java            Jackson date handling
├── Security/
│   ├── SecurityConfig.java           filter chain + beans
│   ├── JwtService.java               JWT create/parse/validate
│   ├── JwtAuthenticationFilter.java  bearer-token authentication
│   ├── PasswordChangeFilter.java     first-login password gate
│   └── JwtAuthenticationEntryPoint.java
├── Controller/                       REST endpoints
├── Service/                          business logic
├── Repository/                       Spring Data interfaces
├── Model/                            JPA entities + enums
├── DTO/                              request/response objects (auth, user, role, ledger, audit, common)
└── Mapper/                           entity ↔ DTO conversion
```

---

## 4. Core Features

### 4.1 JWT Authentication & Token Lifecycle

- **Login** (`POST /api/auth/login`): validates username/password (BCrypt) via Spring
  Security's `AuthenticationManager`; checks account status (rejects locked, suspended,
  inactive, password-expired); resets failed-login counters; issues an **access token**
  (JWT with `subject`, `roles` claims, unique `jti`) and a **refresh token** (UUID, persisted).
- **Access tokens are persisted** in the `JWT_TOKENS` table with a `revoked` flag — this enables
  server-side revocation (logout, password change, account deactivation/lock/suspend all revoke).
- **Refresh tokens** (`REFRESH_TOKENS`): one active refresh token per user; a new login
  deletes the previous one. `POST /api/auth/refresh-token` issues a fresh access token.
- **Logout** (`POST /api/auth/logout`): revokes the access token and all refresh tokens.
- **Account lockout**: 5 consecutive failed logins lock the account, revoke its refresh
  tokens, and write an audit entry.

### 4.2 Role-Based Access Control (RBAC)

- `User` → many `Role`s → many `Permission`s.
- On every request, `CustomUserDetailsService` builds authorities:
  - `ROLE_<NAME>` for each role (e.g. `ROLE_ADMIN`), and
  - the raw permission name as an authority (e.g. `USER_CREATE`, `LEDGER_READ`, `AUDIT_VIEW`).
- Controllers gate with `@PreAuthorize` using either `hasAnyRole(...)` or `hasAuthority(...)`.
- The `USER_ROLES` and `ROLE_PERMISSIONS` join tables enforce uniqueness per pair.

### 4.3 Maker/Checker (Control/Authoriser) Workflow

**The core rule:** every action initiated by a CONTROL (maker) user must be approved by an
AUTHORIZER (checker) **or** an ADMIN before it takes effect.

Supported controlled actions (`UserApprovalAction` enum):

| Action | What happens after approval |
| --- | --- |
| `USER_CREATE` | User becomes `ACTIVE`, roles/permissions applied |
| `USER_UPDATE` | Staged JSON payload applied to the user |
| `USER_DEACTIVATE` | Status → `INACTIVE`, tokens revoked |
| `USER_SUSPEND` | Status → `SUSPENDED`, tokens revoked |
| `USER_UNSUSPEND` | Status → `ACTIVE` |
| `USER_LOCK` | Status → `LOCKED`, tokens revoked |
| `USER_UNLOCK` | Status → `ACTIVE`, counters reset |
| `ASSIGN_ROLE` | Requested roles attached to the user |
| `ASSIGN_PERMISSION` | Permissions added to a role (no target user) |
| `REMOVE_PERMISSION` | Permission removed from a role (no target user) |

Request statuses (`ApprovalStatus`): `PENDING` → `APPROVED` / `REJECTED` / `CANCELLED`.

**Enforced invariants:**

- The **maker cannot approve or reject their own request** (`preventMakerAuthorization`) —
  applies to ADMIN as well when the admin is the maker (four-eyes principle).
- **ADMIN accounts cannot be modified through the workflow** (`preventAdminModification`) —
  neither as target user nor as target role.
- A maker cannot create a request targeting themselves.
- Duplicate `PENDING` requests for the same user+action (or role+action) are rejected.
- Permission/role names are validated to exist; requested permissions must already belong to
  the selected roles (permissions cannot be invented during user creation).
- The target user's state is re-validated **at approval time** (it may have changed since the
  maker created the request).
- Permission-assignment/removal requests carry **no target user** (`user` is nullable on
  `UserApprovalRequest`); approval routes those requests to the role instead.

### 4.4 Mandatory First-Login Password Change

- Every user created through the maker workflow is stored with `mustChangePassword = true`
  and status `INACTIVE`.
- After the creation request is approved (→ `ACTIVE`), the user can log in, but the
  `PasswordChangeFilter` blocks **everything** except change-password / logout / refresh-token
  until they set a new password.
- New passwords must be 8–100 chars with upper, lower, digit, and special character; reuse of
  the old password is rejected; all existing tokens are revoked after the change.
- **Seeded system users are exempt** — they log in directly with their default credentials.

### 4.5 Account Lifecycle Management

- Statuses (`UserStatus`): `ACTIVE`, `INACTIVE`, `SUSPENDED`, `LOCKED`, `PASSWORD_EXPIRED`.
- Deactivation, suspension, and locking revoke JWTs and refresh tokens immediately.
- Unlock resets failed-login counters and lock metadata.
- ADMIN can directly activate, unlock, and soft-delete users (bypassing the workflow);
  AUTHORIZER activates only by approving a pending request.

### 4.6 Ledger Management

- Users with `LEDGER_CREATE` create ledgers; the creator becomes the owner.
- Standard users can only read/update/delete **their own** ledgers (ownership enforced in the
  service layer); ADMIN can access all ledgers and manage statuses.
- Ledger codes are unique among non-deleted ledgers; deletion is a **soft delete**
  (`deleted` flag, `deletedAt`, `updatedBy`).
- Search endpoints: own ledgers, all ledgers (admin), keyword-based.

### 4.7 Audit Logging

- Every significant action writes an `AUDIT_LOGS` row (`username`, `action`, `description`,
  `createdAt`) — logins, logouts, password changes, approval-request creation, approvals,
  rejections, cancellations, user operations, role-permission changes, ledger operations.
- **ADMIN-only read/export endpoints** under `/api/admin/audit-logs` (see API reference),
  triple-guarded by `/api/admin/**` URL rule + `hasRole('ADMIN')` + `AUDIT_VIEW` /
  `AUDIT_EXPORT` permissions.
- Logs are append-only — there are no update/delete endpoints.

---

## 5. Roles, Permissions & Seeded Data

### 5.1 Roles

| Role | Purpose | Granted permissions (seeded) |
| --- | --- | --- |
| `CONTROL` | **Maker** — initiates approval requests | `USER_CREATE`, `USER_UPDATE`, `USER_DEACTIVATE`, `USER_SUSPEND`, `USER_LOCK`, `USER_UNSUSPEND`, `ROLE_ASSIGN_PERMISSION`, `UPDATE_PERMISSION`, `ASSIGN_ROLE`, `ASSIGN_PERMISSION`, `REMOVE_PERMISSION`, `USER_READ` |
| `AUTHORIZER` | **Checker** — approves/rejects maker requests | `USER_ACTIVATE` |
| `CREATOR` | Standard operational user (ledger work) | `LEDGER_CREATE`, `LEDGER_READ`, `LEDGER_UPDATE` |
| `ADMIN` | Full oversight — can do everything directly | **All** permissions |

> `CREATOR` is defined but **not automatically assigned** to any user. Role assignment for
> regular users happens through the approval workflow (`ASSIGN_ROLE`).

### 5.2 Permission catalog

- User mgmt: `USER_CREATE`, `USER_READ`, `USER_UPDATE`, `USER_DEACTIVATE`, `USER_ACTIVATE`,
  `USER_SUSPEND`, `USER_UNSUSPEND`, `USER_LOCK`, `USER_UNLOCK`, `USER_DELETE`
- Role mgmt: `ROLE_ASSIGN_PERMISSION`, `UPDATE_PERMISSION`, `ASSIGN_ROLE`, `ASSIGN_PERMISSION`,
  `REMOVE_PERMISSION`
- Ledger: `LEDGER_CREATE`, `LEDGER_READ`, `LEDGER_UPDATE`, `LEDGER_DELETE`, `LEDGER_VIEW_ALL`
- Audit: `AUDIT_VIEW`, `AUDIT_EXPORT`
- `PASSWORD_RESET` is defined in `PermissionInitializer` but intentionally **not part of the
  maker/checker workflow**.

### 5.3 Seeded system users

`DatabaseInitializer` runs on every startup and creates the four system users **if they do not
already exist** (values come from environment variables):

| Username (default) | Role | Notes |
| --- | --- | --- |
| `admin` | ADMIN | Full oversight; can do everything directly |
| `control` | CONTROL | Maker — creates approval requests |
| `authorizer` | AUTHORIZER | Checker — approves/rejects |
| `creator` | CREATOR | Plain operational user |

All four are seeded `ACTIVE` with `mustChangePassword = false`. Their passwords come from the
`*_PASSWORD` environment variables (see Setup). They are idempotent — re-running startup does
not duplicate them.

---

## 6. Setup Instructions

### 6.1 Prerequisites

- Java 21+
- PostgreSQL (local or hosted, e.g. Neon) with a database created
- Maven (or use the bundled `./mvnw` wrapper)

### 6.2 Environment variables

All secrets and connection details are read from environment variables (see
`src/main/resources/application.properties`):

| Variable | Purpose | Example |
| --- | --- | --- |
| `DATABASE_URL` | JDBC URL | `jdbc:postgresql://localhost:5432/glms` |
| `DATABASE_USERNAME` | DB user | `postgres` |
| `DATABASE_PASSWORD` | DB password | `postgres` |
| `JWT_SECRET` | HMAC signing key (≥ 32 bytes) | any long random string |
| `JWT_EXPIRATION` | Access token TTL (ms) | `3600000` |
| `REFRESH_EXPIRATION` | Refresh token TTL (ms) | `86400000` |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seed admin | `admin` / `admin123` |
| `CONTROL_USERNAME` / `CONTROL_PASSWORD` | Seed control | `control` / `control123` |
| `AUTHORIZER_USERNAME` / `AUTHORIZER_PASSWORD` | Seed authorizer | `authorizer` / `authorizer123` |
| `CREATOR_USERNAME` / `CREATOR_PASSWORD` | Seed creator | `creator` / `creator123` |

> The current `application.properties` requires these variables to be set — there are no
> hard-coded fallbacks in the committed config.

### 6.3 Running locally

```bash
cd general-ledger-management-system

# Option A — via Maven wrapper
export DATABASE_URL="jdbc:postgresql://localhost:5432/glms"
export DATABASE_USERNAME="postgres"
export DATABASE_PASSWORD="postgres"
export JWT_SECRET="a-long-random-secret-of-at-least-32-bytes!"
export JWT_EXPIRATION="3600000"
export REFRESH_EXPIRATION="86400000"
export ADMIN_USERNAME="admin" ADMIN_PASSWORD="admin123"
export CONTROL_USERNAME="control" CONTROL_PASSWORD="control123"
export AUTHORIZER_USERNAME="authorizer" AUTHORIZER_PASSWORD="authorizer123"
export CREATOR_USERNAME="creator" CREATOR_PASSWORD="creator123"

./mvnw spring-boot:run
```

The server starts on **port 8083**.

### 6.4 Schema management

The working configuration uses `spring.jpa.hibernate.ddl-auto=validate` — Hibernate validates
the schema against the entities but does **not** create or alter tables. Because of this you
must create the schema first (once), then keep `validate` for subsequent runs.

> ⚠️ **Warning:** the *committed* config previously used `ddl-auto=create`, which drops and
> recreates **all tables on every startup** — wiping any data you created (only the four seeded
> users come back). Never run with `create`/`create-drop` against a database holding real data.
> If you bootstrap a fresh database, start once with `create` or `update` to generate the
> schema, then switch to `validate`.

### 6.5 Docker / Render

`Dockerfile` builds with Maven (`./mvnw clean package -DskipTests`) and runs the JAR with
`-Xmx350m` (fit for Render's free tier). Exposed port: `8083`. All configuration is injected
via environment variables at runtime.

### 6.6 API documentation (Swagger)

Once running:

- Swagger UI: `http://localhost:8083/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8083/v3/api-docs`

Use the **Authorize** button in Swagger with a `Bearer <token>` from the login endpoint to try
the protected endpoints interactively.

---

## 7. Key Components Breakdown

### 7.1 Controllers

| Controller | Base path | Responsibility |
| --- | --- | --- |
| `AuthenticationController` | `/api/auth` | login, refresh-token, logout, change-password, forgot/reset-password, profile |
| `UserController` | `/api/users` | create/update/list users; staged maker actions (deactivate, suspend, unsuspend, lock, assign roles); ADMIN-direct activate/unlock/delete |
| `UserApprovalRequestController` | `/api/user-approval-requests` | create requests, approve, reject, cancel, pending queue, my requests |
| `RolePermissionController` | `/api/roles` | assign/remove/clear permissions, list all roles, list role permissions |
| `LedgerController` | `/api/ledgers` | ledger CRUD, own/all lists, searches |
| `AuditLogController` | `/api/admin/audit-logs` | ADMIN-only audit views + CSV export |

### 7.2 Services

| Service | Key responsibilities |
| --- | --- |
| `AuthenticationService` | login (status checks, failed-attempt lockout), change/reset password (complexity rules), token issuance/refresh, logout, audit logging |
| `UserService` | create user (**INACTIVE + pending request + mustChangePassword**), staged updates (JSON payload), direct ADMIN ops (activate, unlock, delete), role/permission validation |
| `UserApprovalRequestService` | create the various request types, **approve** (`executeApprovedAction` switch), reject, cancel, pending/my queues, maker-self-approval & admin-modification guards, audit logging |
| `RolePermissionService` | role CRUD helpers, permission assignment/removal, audit logging |
| `LedgerService` | ledger CRUD with ownership enforcement, soft delete, admin-only status changes, search |
| `AuditLogService` | read-only queries (all, by id, by user, by action, combined search) and CSV export with escaping |
| `RefreshTokenService` | create/verify/revoke refresh tokens (one active per user) |
| `CustomUserDetailsService` | load `UserDetails` with `ROLE_*` + permission authorities; maps account status to lock/disable/expire flags |

### 7.3 Security components

| Class | Role in the chain |
| --- | --- |
| `SecurityConfig` | builds the `SecurityFilterChain`, CORS/CSRF/session policy, URL rules, auth provider (BCrypt), registers the two filters |
| `JwtService` | generates/parses/validates JWTs; adds a unique `jti` claim so same-second logins cannot collide in the token table |
| `JwtAuthenticationFilter` | bearer-token extraction, server-side revocation check (`JwtTokenRepository`), loads user, populates context; skips public paths |
| `PasswordChangeFilter` | blocks everything except change-password/logout/refresh-token while `mustChangePassword` is true; falls back to `requestURI` when `servletPath` is empty (e.g. MockMvc) |
| `JwtAuthenticationEntryPoint` | returns 401 JSON for unauthenticated requests |

### 7.4 Configuration / initializers

| Class | Purpose |
| --- | --- |
| `PermissionInitializer` | idempotently creates the permission catalog and assigns them to roles |
| `DatabaseInitializer` | seeds the four system users (from env vars) with their roles |
| `WebConfig` | `@EnableSpringDataWebSupport(VIA_DTO)` → stable `{content, page}` JSON for all paginated endpoints |
| `OpenApiConfig` | Swagger metadata + Bearer security scheme |

### 7.5 Domain models (key entities)

| Entity | Notes |
| --- | --- |
| `User` | identity, status, `mustChangePassword`, failed-login/lock/suspend metadata, roles |
| `Role` | name + permissions; users mapped back |
| `Permission` | name + description |
| `UserApprovalRequest` | maker, authorizer, target user (nullable for role-level actions), action type, status, reason, requested roles/permissions, staged JSON payload |
| `AuditLog` | username, action, description, createdAt |
| `JwtToken` | stored access tokens with `revoked` flag |
| `RefreshToken` | UUID token, expiry, `revoked` flag |
| `PasswordResetToken` | one-time reset token with 30-minute expiry |
| `Ledger` | code, details, owner (`createdBy`), soft-delete/status fields |
| `Account`, `JournalEntry` | ledger-adjacent models (not yet wired into the maker/checker flow) |

Enums: `UserStatus`, `ApprovalStatus`, `UserApprovalAction`, `LedgerStatus`, `LedgerType`,
`RolePermissionApprovalAction`.

---

## 8. API Reference

> All endpoints except the public ones require `Authorization: Bearer <token>`.
> `401` = missing/invalid token; `403` = wrong role OR "Password change required".

### 8.1 Authentication — `/api/auth`

| Method + Path | Access | Body / notes |
| --- | --- | --- |
| `POST /api/auth/login` | Public | `{username, password}` → tokens, role, `passwordChangeRequired`, permissions |
| `POST /api/auth/refresh-token` | Public (valid refresh token) | `{refreshToken}` → new access token |
| `POST /api/auth/logout` | Authenticated | revokes access + refresh tokens |
| `POST /api/auth/change-password` | Authenticated | `{oldPassword, newPassword, confirmPassword}` |
| `POST /api/auth/forgot-password` | Public | `{email}` (token generation; mail sending TODO) |
| `POST /api/auth/reset-password` | Public | `{token, newPassword, confirmPassword}` |
| `GET /api/auth/profile` | Authenticated | current user's `UserResponse` |

### 8.2 Users — `/api/users`

| Method + Path | Access | Result |
| --- | --- | --- |
| `POST /api/users` | CONTROL, ADMIN | 201 — user created `INACTIVE` + `PENDING` request |
| `PUT /api/users/{id}` | CONTROL, ADMIN | 202 — staged `USER_UPDATE` request |
| `GET /api/users` / `GET /api/users/{id}` | ADMIN, CONTROL, AUTHORIZER | paginated user list / details |
| `PATCH /api/users/{id}/roles` | CONTROL, ADMIN | 202 — staged `ASSIGN_ROLE` request |
| `PATCH /api/users/{id}/deactivate` | CONTROL, ADMIN | 202 — staged `USER_DEACTIVATE` |
| `PUT /api/users/{id}/suspend` | CONTROL, ADMIN | 202 — staged `USER_SUSPEND` |
| `PUT /api/users/{id}/unsuspend` | CONTROL, ADMIN | 202 — staged `USER_UNSUSPEND` |
| `PUT /api/users/{id}/lock` | CONTROL, ADMIN | 202 — staged `USER_LOCK` |
| `PATCH /api/users/{id}/activate` | **ADMIN only** | 200 — immediate activation |
| `PUT /api/users/{id}/unlock` | **ADMIN only** | 200 — immediate unlock |
| `DELETE /api/users/{id}` | **ADMIN only** | 204 — soft delete |

### 8.3 Approval requests — `/api/user-approval-requests`

| Method + Path | Access | Notes |
| --- | --- | --- |
| `POST ?userId=&actionType=&reason=` | CONTROL, ADMIN | generic maker request |
| `POST /assign-role` | CONTROL, ADMIN | `{userId, roles[], reason}` |
| `PUT /{requestId}/approve` | AUTHORIZER, ADMIN | executes the action (remark optional) |
| `PUT /{requestId}/reject` | AUTHORIZER, ADMIN | remark **required**; nothing executes |
| `DELETE /{requestId}` | CONTROL, ADMIN | maker cancels own request; ADMIN cancels any |
| `GET /pending` | AUTHORIZER, ADMIN | checker queue |
| `GET /mine` | CONTROL, ADMIN | maker's own requests |
| `GET /{requestId}` | CONTROL, AUTHORIZER, ADMIN | single request |

### 8.4 Roles — `/api/roles`

| Method + Path | Access | Notes |
| --- | --- | --- |
| `GET /api/roles` | CONTROL, AUTHORIZER, ADMIN | all roles with IDs + permission names |
| `GET /api/roles/{roleId}/permissions` | CONTROL, AUTHORIZER, ADMIN | permissions of one role |
| `PUT /api/roles/{roleId}/permissions` | CONTROL, ADMIN | 202 — staged `ASSIGN_PERMISSION` |
| `DELETE /api/roles/{roleId}/permissions/{permissionName}?reason=` | CONTROL, ADMIN | 202 — staged `REMOVE_PERMISSION` |
| `DELETE /api/roles/{roleId}/permissions` | **ADMIN only** | immediate clear |

### 8.5 Ledgers — `/api/ledgers`

| Method + Path | Access |
| --- | --- |
| `POST /api/ledgers` | `LEDGER_CREATE` |
| `GET /api/ledgers/my-ledgers` | `LEDGER_READ` |
| `GET /api/ledgers/search?keyword=` | `LEDGER_READ` |
| `GET /api/ledgers` and `/search/all` | ADMIN |
| `GET /api/ledgers/{id}` | `LEDGER_READ` (ownership enforced) |
| `PUT /api/ledgers/{id}` | `LEDGER_UPDATE` (ownership enforced) |
| `DELETE /api/ledgers/{id}` | `LEDGER_DELETE` (ownership enforced, soft delete) |

### 8.6 Audit logs — `/api/admin/audit-logs` (all ADMIN-only)

| Method + Path | Guard |
| --- | --- |
| `GET /api/admin/audit-logs` | `ROLE_ADMIN` + `AUDIT_VIEW` — paginated, newest first |
| `GET /api/admin/audit-logs/{id}` | `ROLE_ADMIN` + `AUDIT_VIEW` |
| `GET /api/admin/audit-logs/user/{username}` | `ROLE_ADMIN` + `AUDIT_VIEW` |
| `GET /api/admin/audit-logs/action/{action}` | `ROLE_ADMIN` + `AUDIT_VIEW` |
| `GET /api/admin/audit-logs/search?username=&action=&from=&to=` | `ROLE_ADMIN` + `AUDIT_VIEW` |
| `GET /api/admin/audit-logs/export` (CSV) | `ROLE_ADMIN` + `AUDIT_EXPORT` |

**Pagination shape** (global, via `WebConfig`): all `Page<T>` responses serialize as

```json
{
  "content": [ ... ],
  "page": { "size": 20, "number": 0, "totalElements": 12, "totalPages": 1 }
}
```

---

## 9. Workflows Walkthrough

### 9.1 Maker creates a user → checker approves

```text
CONTROL                          AUTHORIZER/ADMIN
   │  POST /api/users                  │
   │  {firstName, lastName, username,  │
   │   email, password, roles[],       │
   │   permissions[], reason}          │
   │──────────────────────────────────>│
   │  201: user INACTIVE +             │
   │  PENDING USER_CREATE request      │
   │                                   │
   │          GET /api/user-approval-requests/pending
   │<──────────────────────────────────│
   │   PUT /{requestId}/approve        │
   │<──────────────────────────────────│
   │   user → ACTIVE, roles applied,   │
   │   mustChangePassword = true       │
```

The new user then logs in, is blocked from everything except password change, sets a new
password (complexity enforced), and only then can use the application.

### 9.2 Admin direct path (bypass)

Because an admin cannot approve their own request (maker-self-approval guard), the effective
admin flow for "create and activate" is:

```text
1. POST /api/users                       → user INACTIVE + pending request
2. PATCH /api/users/{id}/activate        → user ACTIVE immediately (ADMIN only)
3. DELETE the leftover pending request   → optional tidy-up (ADMIN can cancel any request)
```

### 9.3 Controlled user-state changes

Deactivate / suspend / lock / unsuspend / assign-role all follow the same pattern:

```text
CONTROL:  POST /api/users/{id}/deactivate {"reason": "..."}   → 202 + PENDING request
AUTHORIZER:  PUT /api/user-approval-requests/{id}/approve     → executes the change
   - or -
ADMIN:    PUT /api/user-approval-requests/{id}/approve        → same effect
```

State changes that revoke access (deactivate, suspend, lock) also revoke the target user's
JWTs and refresh tokens.

### 9.4 Role-permission changes (no target user)

```text
CONTROL: PUT /api/roles/{roleId}/permissions
         { "permissions": ["LEDGER_DELETE"], "reason": "..." }     → 202 + PENDING
CONTROL: DELETE /api/roles/{roleId}/permissions/LEDGER_DELETE?reason=... → 202 + PENDING
AUTHORIZER or ADMIN: PUT /api/user-approval-requests/{id}/approve → applies to the role
```

The request's `user` stays `null`; approval routes to the role. The `ADMIN` role itself cannot
be modified through this workflow.

### 9.5 Rejection & cancellation

- **Reject** (`PUT /{requestId}/reject`, remark required) — marks the request `REJECTED`;
  no operation executes.
- **Cancel** (`DELETE /{requestId}`) — the maker withdraws their own `PENDING` request
  (`CANCELLED`); ADMIN may cancel any pending request.

---

## 10. Security Model

| Concern | Implementation |
| --- | --- |
| Password storage | BCrypt (Spring `BCryptPasswordEncoder`) |
| Authentication | Stateless JWT; tokens validated on every request; server-side `revoked` flag |
| Token freshness | Access token TTL (`JWT_EXPIRATION`), refresh rotation (one active per user) |
| Mandatory change | `PasswordChangeFilter` gates all paths for `mustChangePassword` users |
| Brute-force protection | 5 failed logins → `LOCKED`, refresh tokens revoked |
| Authorization | URL rules (`SecurityConfig`) + method-level `@PreAuthorize` + service-layer ownership checks |
| Four-eyes | Maker cannot authorize own request; ADMIN accounts immutable via workflow |
| Auditability | Every action audited; ADMIN-only view/export |
| CSRF | Disabled (stateless JWT) |
| CORS | `*` patterns (dev); restrict to trusted origins in production |

**401 vs 403 quick reference**

- `401` — missing/invalid/revoked/expired token.
- `403` — authenticated but role/permission insufficient, maker trying to approve own request,
  or `mustChangePassword` blocking the path.

---

## 11. Testing

The test suite (`src/test/java`) includes:

- **`MakerCheckerWorkflowIntegrationTest`** — full-context end-to-end coverage of the
  maker → authorizer/admin approval flows (create user, approve, activate, deactivate,
  assign roles, permission assignment, reject, cancel, mandatory password change, token
  revocation).
- **`GeneralLedgerManagementSystemApplicationTests`** — context-load smoke test (uses the
  H2 test profile so no external DB is needed).

Run with:

```bash
./mvnw test
```

Notes on the test configuration:

- The test profile (`src/test/resources/application-test.properties`) uses an in-memory H2
  database (`create-drop`) so the full Spring context can boot without PostgreSQL.
- The integration test expects seeded users named `admin`/`admin123` etc. — if those values
  are overridden by environment variables, the test may fail on login; supply the matching
  credentials (or restore the test properties) when running locally.

---

## 12. Operational Notes & Known Caveats

1. **Schema bootstrap** — with `ddl-auto=validate` the tables must exist before startup.
   Generate them once (e.g. temporary `create`/`update`), then keep `validate`. Never run
   `create` against a database with real data — it wipes everything on boot.
2. **Environment variables are mandatory** — the committed `application.properties` has no
   fallbacks; the app fails to start if `DATABASE_URL`/`JWT_SECRET`/seed credentials are unset.
3. **Email is not yet wired** — `forgotPassword` generates and stores a reset token but the
   actual email send is a TODO (`sendgrid` dependency is present).
4. **CORS is wide open** in the committed config — replace the `*` origin patterns with the
   real frontend origin(s) before production.
5. **Password reset is deliberately excluded** from the maker/checker workflow — only the
   change/reset-password flows apply.
6. **Ledger-only modules** (`Account`, `JournalEntry`) exist as models/repositories but are not
   yet connected to controllers or the approval workflow — they are out of scope of the current
   maker/checker implementation.
7. **Pagination shape** is the stable `{content, page}` form (VIA_DTO). Any frontend code
   reading `totalElements`/`number`/`pageable` at the top level must be updated to
   `page.totalElements` etc.
