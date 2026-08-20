# General Ledger Management System — Technical Documentation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture](#3-architecture)
4. [Project Structure](#4-project-structure)
5. [Database Design](#5-database-design)
6. [Security Implementation](#6-security-implementation)
7. [Authentication Flow](#7-authentication-flow)
8. [Maker/Checker Workflow Implementation](#8-makerchecker-workflow-implementation)
9. [User Lifecycle State Machine](#9-user-lifecycle-state-machine)
10. [Account Locking & Auto-Unlock](#10-account-locking--auto-unlock)
11. [User Deletion Implementation](#11-user-deletion-implementation)
12. [User Rejection Implementation](#12-user-rejection-implementation)
13. [Mandatory Password Change](#13-mandatory-password-change)
14. [Error Handling Architecture](#14-error-handling-architecture)
15. [Audit Logging](#15-audit-logging)
16. [API Security Rules](#16-api-security-rules)
17. [Configuration & Environment](#17-configuration--environment)
18. [Testing Strategy](#18-testing-strategy)
19. [Deployment Guide](#19-deployment-guide)
20. [Known Constraints & Gotchas](#20-known-constraints--gotchas)

---

## 1. System Overview

The **General Ledger Management System (GLMS)** is a Spring Boot 3.x backend API that provides:

- **User lifecycle management** with Maker/Checker approval workflow
- **Role-Based Access Control (RBAC)** with fine-grained permissions
- **General Ledger CRUD** with ownership enforcement
- **Comprehensive audit trail** for all actions
- **JWT stateless authentication** with access + refresh token rotation
- **Mandatory first-login password change** for new users
- **Temporary account locking** with automatic timer-based unlock
- **Soft-delete** — users are never hard-deleted
- **User-friendly error messages** — no raw backend exceptions leak to clients

### Core Design Principles

| Principle | Implementation |
|---|---|
| **Maker/Checker** | CONTROL creates requests; AUTHORIZER or ADMIN approves/rejects |
| **Admin Override** | ADMIN can approve any request without waiting for AUTHORIZER |
| **Soft Delete** | DELETED status preserves audit trail; no hard deletes |
| **Fail Closed** | Unknown status → disabled; null user → rejected |
| **Audit Everything** | Login, logout, approval, rejection, password change, lock, delete |
| **No Secret Leakage** | Global exception handler; stack traces never exposed |

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Language | Java | 17+ |
| Framework | Spring Boot | 3.x |
| Web | Spring MVC / REST | — |
| Security | Spring Security + JWT (JJWT) | — |
| Persistence | Spring Data JPA / Hibernate | — |
| Database | PostgreSQL (Neon) | — |
| Password Hashing | BCrypt | Strength default (10) |
| Build | Maven | 3.9+ |
| API Docs | SpringDoc OpenAPI 3 / Swagger UI | — |
| Validation | Jakarta Validation API | — |
| Boilerplate | Lombok | — |
| Serialization | Jackson (ObjectMapper) | — |

---

## 3. Architecture

### Layered Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    HTTP Client                          │
└──────────────────────────┬──────────────────────────────┘
                           │ Bearer JWT
                           ▼
┌─────────────────────────────────────────────────────────┐
│              SECURITY FILTER CHAIN                      │
│                                                         │
│  1. JwtAuthenticationFilter                            │
│     → Extracts Bearer token                            │
│     → Validates signature, expiry, revoked state        │
│     → Populates SecurityContext                        │
│                                                         │
│  2. PasswordChangeFilter                               │
│     → If mustChangePassword=true, blocks all endpoints │
│     → Except: /change-password, /logout, /refresh-token│
│     → Returns 403 "Password change required"           │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              CONTROLLER LAYER                           │
│                                                         │
│  AuthenticationController  (/api/auth/*)               │
│  UserController            (/api/users/*)               │
│  UserApprovalRequestController (/api/user-approval-*)  │
│  RolePermissionController  (/api/roles/*)              │
│  LedgerController          (/api/ledgers/*)            │
│  AuditLogController        (/api/admin/audit-logs/*)   │
│                                                         │
│  @PreAuthorize annotations enforce role/permission     │
│  @Valid on @RequestBody for DTO validation             │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              SERVICE LAYER                              │
│                                                         │
│  AuthenticationService — login, logout, tokens, pwd     │
│  UserService — CRUD, activate, lock, suspend, unlock   │
│  UserApprovalRequestService — approve, reject, execute  │
│  RolePermissionService — role/permission management     │
│  LedgerService — ledger CRUD with ownership            │
│  AuditLogService — audit log queries + CSV export       │
│  RefreshTokenService — refresh token lifecycle          │
│  CustomUserDetailsService — Spring Security UserDetailsService│
│                                                         │
│  @Transactional on all write operations                 │
│  @Transactional(readOnly=true) on reads                 │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              REPOSITORY LAYER (Spring Data JPA)         │
│                                                         │
│  UserRepository, RoleRepository, PermissionRepository   │
│  UserApprovalRequestRepository, JwtTokenRepository      │
│  RefreshTokenRepository, AuditLogRepository             │
│  LedgerRepository, PasswordResetTokenRepository         │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL (Neon)                          │
│                                                         │
│  USERS, ROLES, PERMISSIONS, USER_ROLES                 │
│  ROLE_PERMISSIONS, USER_APPROVAL_REQUESTS              │
│  USER_APPROVAL_REQUEST_ROLES, USER_APPROVAL_PERMISSIONS│
│  LEDGERS, AUDIT_LOGS, JWT_TOKENS, REFRESH_TOKENS       │
│  PASSWORD_RESET_TOKENS                                 │
└─────────────────────────────────────────────────────────┘
```

### Request Processing Pipeline

```
HTTP Request
  → JwtAuthenticationFilter (validates JWT, sets SecurityContext)
  → PasswordChangeFilter (blocks if mustChangePassword=true)
  → Spring Security URL authorization (permitAll / authenticated / hasRole)
  → @PreAuthorize method-level authorization (hasRole / hasAuthority)
  → @Valid DTO validation
  → Controller method
  → Service method (@Transactional)
  → Repository (JPA/Hibernate)
  → PostgreSQL
  → Response (DTO mapped, never raw entity)
```

### Cross-Cutting Concerns

| Concern | Implementation |
|---|---|
| **Exception Handling** | `GlobalExceptionHandler` (@RestControllerAdvice) — consistent JSON error body |
| **Audit Logging** | `AuditLogRepository` — append-only, created in services |
| **Pagination** | Spring Data `Pageable` + `WebConfig` (PagedModel VIA_DTO) |
| **CORS** | Configured in `SecurityConfig` — allow all origins (dev) |
| **API Docs** | SpringDoc OpenAPI 3 at `/swagger-ui.html` and `/v3/api-docs` |
| **Scheduled Tasks** | `@Scheduled` auto-unlock sweep every 5 minutes |

---

## 4. Project Structure

```
src/main/java/com/glms/general_ledger_management_system/
│
├── GeneralLedgerManagementSystemApplication.java
├── Permissions.java                          # Permission name constants
│
├── Config/
│   ├── DatabaseInitializer.java              # Seeds roles, permissions, system users
│   ├── PermissionInitializer.java            # Seeds permissions + role assignments
│   ├── GlobalExceptionHandler.java           # @RestControllerAdvice
│   ├── JacksonConfig.java                    # Jackson ObjectMapper config
│   ├── OpenApiConfig.java                    # Swagger/OpenAPI config
│   ├── SchedulingConfig.java                 # @EnableScheduling
│   └── WebConfig.java                        # PagedModel serialization
│
├── controller/
│   ├── AuthenticationController.java         # /api/auth/*
│   ├── UserController.java                   # /api/users/*
│   ├── UserApprovalRequestController.java    # /api/user-approval-requests/*
│   ├── RolePermissionController.java         # /api/roles/*
│   ├── LedgerController.java                 # /api/ledgers/*
│   └── AuditLogController.java               # /api/admin/audit-logs/*
│
├── DTO/
│   ├── auth/                                 # LoginRequest, LoginResponse, etc.
│   ├── user/                                 # CreateUserRequest, UserResponse, etc.
│   ├── role/                                 # RoleResponse, PermissionResponse, etc.
│   ├── ledger/                               # CreateLedgerRequest, LedgerResponse, etc.
│   ├── audit/                                # AuditLogResponse
│   └── common/                               # ApiResponse
│
├── Mapper/
│   └── UserMapper.java                       # Entity ↔ DTO mapping
│
├── Model/
│   ├── User.java                             # @Entity — user account
│   ├── Role.java                             # @Entity — role catalog
│   ├── Permission.java                       # @Entity — permission catalog
│   ├── UserStatus.java                       # Enum: ACTIVE, INACTIVE, LOCKED, SUSPENDED, PASSWORD_EXPIRED, DELETED, REJECTED
│   ├── UserApprovalRequest.java              # @Entity — approval request
│   ├── UserApprovalAction.java               # Enum: USER_CREATE, USER_UPDATE, USER_DELETE, etc.
│   ├── ApprovalStatus.java                   # Enum: PENDING, APPROVED, REJECTED, CANCELLED
│   ├── Ledger.java                           # @Entity — ledger record
│   ├── LedgerType.java                       # Enum: GENERAL, SALES, PURCHASE, SUBSIDIARY, RESTRICTED
│   ├── LedgerStatus.java                     # Enum: ACTIVE, INACTIVE, SUSPENDED
│   ├── AuditLog.java                         # @Entity — audit trail
│   ├── JwtToken.java                         # @Entity — JWT token tracking
│   ├── RefreshToken.java                     # @Entity — refresh token
│   ├── PasswordResetToken.java               # @Entity — password reset token
│   └── Account.java                          # @Entity — (if used)
│
├── Repository/
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   ├── PermissionRepository.java
│   ├── UserApprovalRequestRepository.java
│   ├── JwtTokenRepository.java
│   ├── RefreshTokenRepository.java
│   ├── AuditLogRepository.java
│   ├── LedgerRepository.java
│   ├── JournalEntryRepository.java
│   ├── AccountRepository.java
│   └── PasswordResetTokenRepository.java
│
├── Security/
│   ├── SecurityConfig.java                   # SecurityFilterChain, CORS, URL rules
│   ├── JwtService.java                       # JWT generation, validation, parsing
│   ├── JwtAuthenticationFilter.java          # OncePerRequestFilter — JWT extraction
│   ├── JwtAuthenticationEntryPoint.java      # 401 JSON response
│   └── PasswordChangeFilter.java            # OncePerRequestFilter — mandatory pwd change
│
└── Service/
    ├── AuthenticationService.java            # login, logout, tokens, password ops
    ├── CustomUserDetailsService.java         # Spring Security UserDetailsService
    ├── UserService.java                      # User CRUD, lock, suspend, activate, unlock
    ├── UserApprovalRequestService.java       # Create, approve, reject, cancel, execute
    ├── RolePermissionService.java            # Role/permission CRUD
    ├── LedgerService.java                    # Ledger CRUD with ownership
    ├── AuditLogService.java                  # Audit log queries + CSV export
    └── RefreshTokenService.java              # Refresh token lifecycle
```

---

## 5. Database Design

### Entity-Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│    USERS     │──────<│   USER_ROLES     │>──────│    ROLES     │
│              │       │  user_id (FK)    │       │              │
│  id (PK)     │       │  role_id (FK)    │       │  id (PK)     │
│  username     │       └──────────────────┘       │  name        │
│  email        │                                  └──────┬───────┘
│  password     │                                         │
│  first_name   │       ┌──────────────────┐       ┌──────┴───────┐
│  last_name    │       │ROLE_PERMISSIONS  │>──────│ PERMISSIONS  │
│  status       │       │  role_id (FK)    │       │              │
│  failed_login │       │  permission_id   │       │  id (PK)     │
│  lockout_time │       └──────────────────┘       │  name        │
│  locked_at    │                                  │  description │
│  locked_by    │                                  └──────────────┘
│  lock_reason  │
│  lock_duration│       ┌──────────────────────┐
│  locked_until │──────<│USER_APPROVAL_REQUESTS│
│  suspended_at │       │                      │
│  suspended_by │       │  id (PK)             │
│  must_change  │       │  user_id (FK)        │
│  created_at   │       │  maker_id (FK)       │
│  updated_at   │       │  authorizer_id (FK)  │
└──────┬───────┘       │  action_type          │
       │                │  status               │
       │                │  reason               │
       │                │  payload_json         │
       │                │  requested_at         │
       │                │  authorized_at        │
       │                │  authorizer_remark    │
       │                └──────────────────────┘
       │
       ├──────<┌──────────────┐
       │       │   LEDGERS    │
       │       │              │
       │       │  id (PK)     │
       │       │  ledger_code │
       │       │  ledger_name │
       │       │  description │
       │       │  status      │
       │       │  ledger_type │
       │       │  created_by  │
       │       │  updated_by  │
       │       │  deleted     │
       │       │  version     │
       │       └──────────────┘
       │
       ├──────<┌──────────────┐
       │       │  JWT_TOKENS  │
       │       │  token       │
       │       │  revoked     │
       │       │  user_id(FK) │
       │       └──────────────┘
       │
       ├──────<┌──────────────┐
       │       │ REFRESH_TOKENS│
       │       │  token       │
       │       │  expiry_date │
       │       │  revoked     │
       │       │  user_id(FK) │
       │       └──────────────┘
       │
       ├──────<┌────────────────────┐
       │       │PASSWORD_RESET_TOKENS│
       │       │  token             │
       │       │  expiry_date       │
       │       │  user_id (FK)      │
       │       └────────────────────┘
       │
       └──────<┌──────────────┐
               │  AUDIT_LOGS  │
               │  username    │
               │  action      │
               │  description │
               │  created_at  │
               └──────────────┘
```

### Key Tables

#### USERS

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | SEQUENCE | Auto-generated |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Login identifier |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL | Email address |
| `password` | VARCHAR(100) | NOT NULL | BCrypt hash |
| `first_name` | VARCHAR(80) | — | First name |
| `last_name` | VARCHAR(80) | — | Last name |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | UserStatus enum (STRING) |
| `failed_login_attempts` | INTEGER | NOT NULL, DEFAULT 0 | Counter for auto-lock |
| `lockout_time` | TIMESTAMP | — | When auto-lock triggered |
| `locked_at` | TIMESTAMPTZ | — | When manual lock started |
| `locked_by` | VARCHAR | — | Who locked the account |
| `lock_reason` | VARCHAR | — | Why the account was locked |
| `lock_duration_minutes` | INTEGER | — | How long the lock lasts |
| `suspended_at` | TIMESTAMPTZ | — | When suspended |
| `suspended_by` | VARCHAR | — | Who suspended |
| `must_change_password` | BOOLEAN | NOT NULL, DEFAULT false | Forced password change |
| `created_at` | TIMESTAMP | NOT NULL | Creation timestamp |
| `updated_at` | TIMESTAMP | — | Last update timestamp |

#### USER_APPROVAL_REQUESTS

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | SEQUENCE | Auto-generated |
| `user_id` | BIGINT (FK) | — | Target user (null for role-level actions) |
| `maker_id` | BIGINT (FK) | NOT NULL | CONTROL user who created request |
| `authorizer_id` | BIGINT (FK) | — | Who approved/rejected (null while pending) |
| `action_type` | VARCHAR(50) | NOT NULL | UserApprovalAction enum |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | ApprovalStatus enum |
| `reason` | VARCHAR(1000) | — | Maker's justification |
| `payload_json` | TEXT (LOB) | — | JSON snapshot for USER_UPDATE |
| `requested_at` | TIMESTAMPTZ | NOT NULL | When created |
| `authorized_at` | TIMESTAMPTZ | — | When approved/rejected |
| `authorizer_remark` | VARCHAR(1000) | — | Checker's remark |

#### LEDGERS

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | BIGINT (PK) | SEQUENCE | Auto-generated |
| `ledger_code` | VARCHAR(20) | UNIQUE, NOT NULL | Numeric ledger code |
| `ledger_name` | VARCHAR(150) | NOT NULL | Ledger name |
| `description` | VARCHAR(500) | — | Optional description |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | LedgerStatus enum |
| `ledger_type` | VARCHAR(30) | NOT NULL | LedgerType enum |
| `created_by` | BIGINT (FK) | NOT NULL | Owner user |
| `updated_by` | BIGINT (FK) | — | Last updater |
| `deleted` | BOOLEAN | NOT NULL, DEFAULT false | Soft delete flag |
| `version` | BIGINT | — | Optimistic locking |

### Enum Values (Must Match Database)

**CRITICAL:** These enums use `@Enumerated(EnumType.STRING)`, which stores the string name in the database. If the database has CHECK constraints (from a previous Oracle migration), they must be updated to include all values.

#### UserStatus

```java
ACTIVE, INACTIVE, LOCKED, SUSPENDED, PASSWORD_EXPIRED, DELETED, REJECTED
```

#### UserApprovalAction

```java
USER_CREATE, USER_UPDATE, USER_READ, USER_DEACTIVATE, USER_SUSPEND,
USER_LOCK, USER_DELETE, USER_UNLOCK, USER_UNSUSPEND,
ROLE_ASSIGN_PERMISSION, ACTIVATE_USER, UPDATE_PERMISSION,
ASSIGN_ROLE, ASSIGN_PERMISSION, REMOVE_PERMISSION
```

#### ApprovalStatus

```java
PENDING, APPROVED, REJECTED, CANCELLED
```

---

## 6. Security Implementation

### Security Filter Chain

Configured in `SecurityConfig.java`:

```
Request
  │
  ├─ CSRF: disabled (stateless JWT)
  │
  ├─ CORS: allow all origins (dev), all methods, all headers
  │
  ├─ Session: STATELESS (no HTTP session)
  │
  ├─ Exception Handling:
  │   └─ JwtAuthenticationEntryPoint → 401 JSON
  │
  ├─ URL Authorization:
  │   ├─ /api/auth/login, /forgot-password, /reset-password → permitAll
  │   ├─ /swagger-ui/**, /v3/api-docs/** → permitAll
  │   ├─ OPTIONS /** → permitAll (CORS preflight)
  │   ├─ /api/admin/** → hasRole('ADMIN')
  │   ├─ /api/users/**, /api/roles/**, /api/ledgers/** → authenticated
  │   └─ everything else → authenticated
  │
  ├─ Authentication Provider: DaoAuthenticationProvider + BCrypt
  │
  ├─ Filter 1 (before UsernamePasswordAuthenticationFilter):
  │   └─ JwtAuthenticationFilter
  │       ├─ Extract Bearer token from Authorization header
  │       ├─ Check if token is revoked (database lookup)
  │       ├─ Extract username from JWT
  │       ├─ Load UserDetails from database
  │       ├─ Validate token signature + expiry
  │       └─ Set SecurityContext authentication
  │
  └─ Filter 2 (after JwtAuthenticationFilter):
      └─ PasswordChangeFilter
          ├─ If mustChangePassword=true:
          │   ├─ Allow: /change-password, /logout, /refresh-token
          │   └─ Block everything else → 403 "Password change required"
          └─ If mustChangePassword=false: pass through
```

### JWT Token Lifecycle

```
Login
  │
  ├─ Generate access token (HS256, configurable expiry)
  │   └─ Claims: sub=username, roles=[ROLE_CONTROL, ...], jti=UUID
  │
  ├─ Generate refresh token (UUID, persisted to database)
  │
  ├─ Save access token to JWT_TOKENS table
  │
  └─ Return both tokens to client

Subsequent Requests
  │
  ├─ Client sends: Authorization: Bearer <access_token>
  │
  ├─ JwtAuthenticationFilter:
  │   ├─ Check JWT_TOKENS table: is this token revoked?
  │   ├─ Parse JWT: extract username, validate signature
  │   ├─ Load UserDetails: build authorities from roles + permissions
  │   ├─ Validate: username matches, not expired
  │   └─ Set SecurityContext
  │
  └─ @PreAuthorize checks: hasRole('ADMIN'), hasAuthority('USER_CREATE'), etc.

Token Refresh
  │
  ├─ Client sends: POST /api/auth/refresh-token { refreshToken: "..." }
  │
  ├─ RefreshTokenService.verifyToken():
  │   ├─ Find token in REFRESH_TOKENS
  │   ├─ Check: not revoked, not expired
  │   └─ Return RefreshToken entity
  │
  ├─ Validate user status (active, not locked, etc.)
  │
  ├─ Generate new access token
  │
  ├─ Save new access token
  │
  └─ Return new access token + same refresh token

Logout
  │
  ├─ JwtAuthenticationFilter already populated SecurityContext
  │
  ├─ AuthenticationService.logout():
  │   ├─ Mark JWT token as revoked
  │   ├─ Delete all refresh tokens for user
  │   └─ Audit log
  │
  └─ SecurityContextHolder.clearContext()
```

### Authority Model

Authorities are built from **roles + permissions** in `CustomUserDetailsService`:

```
User: admin
  └─ Role: ADMIN
      └─ Permissions: [USER_CREATE, USER_READ, ..., AUDIT_EXPORT]

Authorities in SecurityContext:
  ├─ ROLE_ADMIN                    (from role name)
  ├─ USER_CREATE                   (from permission)
  ├─ USER_READ                     (from permission)
  ├─ ...
  └─ AUDIT_EXPORT                  (from permission)
```

Used in controllers:
- `@PreAuthorize("hasRole('ADMIN')")` — checks role
- `@PreAuthorize("hasAuthority('USER_CREATE')")` — checks permission
- `@PreAuthorize("hasAnyRole('CONTROL', 'ADMIN')")` — checks either role

---

## 7. Authentication Flow

### Login

```
POST /api/auth/login
{ "username": "control_user", "password": "..." }

1. Validate request (username/password not blank)
2. Find user by username (case-insensitive)
3. Validate user status:
   ├─ LOCKED → check auto-unlock → if still locked: 409
   ├─ SUSPENDED → 409 "suspended"
   ├─ DELETED → 409 "deleted"
   ├─ REJECTED → 409 "rejected"
   ├─ INACTIVE → 409 "not approved yet"
   ├─ PASSWORD_EXPIRED → 409 "password expired"
   └─ ACTIVE → continue
4. Authenticate credentials (AuthenticationManager + BCrypt)
   └─ On failure: increment failed_attempts → if >=5: LOCK account
5. Reset failed_attempts to 0
6. Generate access token (JWT)
7. Generate refresh token (persisted)
8. Save access token to JWT_TOKENS
9. Audit log: LOGIN
10. Return: { accessToken, refreshToken, username, role, passwordChangeRequired, permissions }
```

**Key:** The `login()` method uses `@Transactional(noRollbackFor = BadCredentialsException.class)` so that failed-attempt counters persist even when authentication fails.

### Refresh Token

```
POST /api/auth/refresh-token
{ "refreshToken": "uuid..." }

1. Find refresh token in database
2. Verify: not revoked, not expired
3. Get associated user
4. Validate user status (same checks as login)
5. Build UserDetails with authorities
6. Generate new access token
7. Save new access token
8. Audit log: REFRESH_TOKEN
9. Return: { accessToken, refreshToken (same), username, role, permissions }
```

### Password Change

```
POST /api/auth/change-password
Authorization: Bearer <token>
{ "oldPassword": "...", "newPassword": "...", "confirmPassword": "..." }

1. Get current user from SecurityContext
2. Verify old password matches
3. Verify new password == confirmPassword
4. Validate password complexity (8-100 chars, upper, lower, digit, special)
5. Verify new password != old password
6. Encode and save new password
7. Clear mustChangePassword flag
8. Revoke all JWT tokens
9. Revoke all refresh tokens
10. Audit log: CHANGE_PASSWORD
```

---

## 8. Maker/Checker Workflow Implementation

### Core Service: `UserApprovalRequestService`

This is the most complex service. It handles:

1. **Creating approval requests** — CONTROL proposes an action
2. **Approving requests** — AUTHORIZER or ADMIN executes the action
3. **Rejecting requests** — AUTHORIZER or ADMIN denies the action
4. **Cancelling requests** — CONTROL cancels own; ADMIN cancels any

### Request Creation Flow

```
CONTROL calls endpoint (e.g., PUT /api/users/{id}/lock)
  │
  ├─ Controller receives request
  │
  ├─ Service.createApprovalRequest(userId, actionType, reason, durationMinutes)
  │   ├─ Find target user
  │   ├─ Find maker (current authenticated user)
  │   ├─ validateAction(actionType) — is this a valid action?
  │   ├─ validateRequestedAction(user, actionType) — state checks:
  │   │   ├─ DELETED users → blocked
  │   │   ├─ REJECTED users → blocked
  │   │   ├─ INACTIVE + lock/suspend → blocked
  │   │   ├─ LOCKED + suspend → blocked
  │   │   ├─ ACTIVE + activate → "already active"
  │   │   └─ etc.
  │   ├─ Check for duplicate pending requests
  │   ├─ Create UserApprovalRequest with status=PENDING
  │   ├─ Save to database
  │   ├─ Audit log: CREATE_*_REQUEST
  │   └─ Return request (202 Accepted)
  │
  └─ Request appears in AUTHORIZER's pending queue
```

### Approval Flow

```
AUTHORIZER or ADMIN calls: PUT /api/user-approval-requests/{id}/approve
  │
  ├─ Service.approveRequest(requestId, remark)
  │   ├─ Find request (must be PENDING)
  │   ├─ Verify maker != approver ("can't approve own request")
  │   ├─ Set status = APPROVED
  │   ├─ Set authorizer = current user
  │   ├─ Set authorizedAt = now
  │   ├─ Set authorizerRemark
  │   ├─ executeApprovedAction(request):
  │   │   ├─ USER_CREATE → set user status = ACTIVE, audit
  │   │   ├─ USER_UPDATE → deserialize payload, apply changes, audit
  │   │   ├─ USER_DEACTIVATE → set INACTIVE, revoke tokens, audit
  │   │   ├─ USER_SUSPEND → set SUSPENDED, revoke tokens, audit
  │   │   ├─ USER_UNSUSPEND → set ACTIVE, audit
  │   │   ├─ USER_LOCK → set LOCKED, set lock metadata, audit
  │   │   ├─ USER_DELETE → set DELETED, revoke tokens, cancel pending requests, audit
  │   │   ├─ ASSIGN_ROLE → add roles to user, audit
  │   │   ├─ ASSIGN_PERMISSION → add permissions to role, audit
  │   │   └─ REMOVE_PERMISSION → remove permission from role, audit
  │   ├─ Save request
  │   └─ Return updated request
```

### Rejection Flow

```
AUTHORIZER or ADMIN calls: PUT /api/user-approval-requests/{id}/reject
  │
  ├─ Service.rejectRequest(requestId, remark)
  │   ├─ Find request (must be PENDING)
  │   ├─ Verify remark is provided (required)
  │   ├─ Set status = REJECTED
  │   ├─ Set authorizer = current user
  │   ├─ Set authorizedAt = now
  │   ├─ Set authorizerRemark
  │   ├─ Special handling:
  │   │   └─ USER_CREATE → set target user status = REJECTED
  │   ├─ Save request
  │   └─ Audit log: REJECT_REQUEST
```

### Cancellation Flow

```
CONTROL calls: DELETE /api/user-approval-requests/{id}
  │
  ├─ Service.cancelRequest(requestId)
  │   ├─ Find request (must be PENDING)
  │   ├─ Verify: current user is the maker OR is ADMIN
  │   ├─ Set status = CANCELLED
  │   ├─ Save request
  │   └─ Audit log: CANCEL_REQUEST
```

---

## 9. User Lifecycle State Machine

```
                    ┌─────────────┐
                    │   (created) │
                    │  INACTIVE   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────────┐
              │            │                │
              ▼            ▼                ▼
        ┌──────────┐ ┌──────────┐    ┌──────────┐
        │ APPROVED │ │ REJECTED │    │ DELETED  │
        │ (ACTIVE) │ │          │    │          │
        └────┬─────┘ └──────────┘    └──────────┘
             │                         ▲
    ┌────────┼────────┐               │
    │        │        │               │
    ▼        ▼        ▼               │
┌───────┐┌───────┐┌───────┐          │
│ LOCKED││SUSPND ││DELTD  │──────────┘
└───┬───┘└───┬───┘└───────┘
    │        │
    ▼        ▼
┌──────────────┐
│  (auto)      │
│  UNLOCKED    │
│  → ACTIVE    │
└──────────────┘
```

### Valid State Transitions

| From | To | Trigger | Who |
|---|---|---|---|
| INACTIVE | ACTIVE | USER_CREATE approved | AUTHORIZER / ADMIN |
| INACTIVE | REJECTED | USER_CREATE rejected | AUTHORIZER / ADMIN |
| INACTIVE | DELETED | USER_DELETE approved | AUTHORIZER / ADMIN |
| ACTIVE | LOCKED | USER_LOCK approved / 5 failed logins | AUTHORIZER / ADMIN / System |
| ACTIVE | SUSPENDED | USER_SUSPEND approved | AUTHORIZER / ADMIN |
| ACTIVE | DELETED | USER_DELETE approved | AUTHORIZER / ADMIN |
| ACTIVE | INACTIVE | USER_DEACTIVATE approved | AUTHORIZER / ADMIN |
| LOCKED | ACTIVE | Lock timer expires (auto-unlock) | System |
| SUSPENDED | ACTIVE | USER_UNSUSPEND approved | AUTHORIZER / ADMIN |
| REJECTED | ACTIVE | ADMIN activates directly | ADMIN |
| * | DELETED | USER_DELETE approved | AUTHORIZER / ADMIN |

### Blocked Transitions

| From | Operation | Result |
|---|---|---|
| DELETED | Any modification | *"This account has been permanently deleted and cannot be reactivated."* |
| REJECTED | Any Maker/Checker operation | *"This account was not approved and can no longer be modified through this workflow."* |
| INACTIVE | Lock/Suspend | *"Inactive accounts can't be locked/suspended - please activate it first."* |
| LOCKED | Suspend | *"This account is locked - it needs to be unlocked before it can be suspended."* |
| ACTIVE | Activate | *"Good news - this account is already active, so there's nothing to do."* |
| DELETED | Activate | *"This account has been permanently deleted and cannot be reactivated."* |
| LOCKED | Activate | *"This account is locked right now - it needs to be unlocked before it can be activated."* |

---

## 10. Account Locking & Auto-Unlock

### Lock Mechanism

```java
// UserService.java — lock via approval workflow
approvalRequestService.createApprovalRequest(
    userId,
    UserApprovalAction.USER_LOCK,
    reason,           // required
    durationMinutes   // 1-60, optional (defaults to config value)
);
```

When the `USER_LOCK` request is approved:

```java
// executeApprovedAction() — USER_LOCK case
user.setStatus(UserStatus.LOCKED);
user.setLockReason(reason);
user.setLockedAt(ZonedDateTime.now());
user.setLockedBy(approver.getUsername());
user.setLockDurationMinutes(durationMinutes);
// Revoke all tokens
// Audit log
```

### Auto-Unlock (Login-Time Check)

```java
// AuthenticationService.validateUserStatus()
if (UserStatus.LOCKED.equals(status)) {
    if (userService.unlockIfExpired(user)) {
        return; // proceed with login
    }
    throw new IllegalStateException("Your account is temporarily locked...");
}
```

```java
// UserService.unlockIfExpired()
ZonedDateTime lockStart = resolveLockStart(user);
// Falls back: lockedAt → lockoutTime → updatedAt → createdAt

long duration = user.getLockDurationMinutes() != null
    ? user.getLockDurationMinutes()
    : lockDurationMinutes; // from config (default 30)

if (lockStart.plusMinutes(duration).isAfter(ZonedDateTime.now())) {
    return false; // still locked
}

applyUnlock(user, "SYSTEM", "AUTO_UNLOCK", "Account auto-unlocked...");
return true;
```

### Auto-Unlock (Scheduled Sweep)

```java
// UserService.java
@Scheduled(fixedDelay = 300_000, initialDelay = 60_000) // every 5 minutes
public void autoUnlockExpiredLocks() {
    List<User> lockedUsers = userRepository.findAllByStatus(UserStatus.LOCKED);
    for (User user : lockedUsers) {
        unlockIfExpired(user);
    }
}
```

### Auto-Lock on Failed Attempts

```java
// AuthenticationService.increaseFailedAttempts()
int attempts = user.getFailedLoginAttempts() + 1;
user.setFailedLoginAttempts(attempts);

if (attempts >= 5) {
    user.setStatus(UserStatus.LOCKED);
    user.setLockoutTime(LocalDateTime.now());
    user.setLockedAt(ZonedDateTime.now());
    // Revoke tokens, audit log
}

userRepository.save(user); // persists because @Transactional(noRollbackFor = BadCredentialsException.class)
```

---

## 11. User Deletion Implementation

### Flow

1. **CONTROL** calls `DELETE /api/users/{id}` with `{ "reason": "..." }`
2. Controller creates `USER_DELETE` approval request
3. Request appears in AUTHORIZER/ADMIN pending queue
4. On approval:

```java
// executeApprovedAction() — USER_DELETE case
user.setStatus(UserStatus.DELETED);
userRepository.save(user);

// Revoke all tokens
revokeUserAuthentication(user);

// Cancel all pending requests for this user
cancelPendingRequestsForUser(user);

// Audit log
```

### Cancellation of Pending Requests

```java
// cancelPendingRequestsForUser()
List<UserApprovalRequest> pendingRequests =
    approvalRequestRepository.findByUserAndStatus(user, ApprovalStatus.PENDING);

for (UserApprovalRequest pending : pendingRequests) {
    pending.setStatus(ApprovalStatus.CANCELLED);
    pending.setAuthorizerRemark("Cancelled — user account was deleted");
    pending.setAuthorizedAt(ZonedDateTime.now());
    approvalRequestRepository.save(pending);
}
```

### Restrictions on DELETED Users

- Cannot log in (blocked in `validateUserStatus()`)
- Cannot be modified through Maker/Checker (blocked in `validateRequestedAction()`)
- Cannot be reactivated (blocked in `activateUser()`)
- Visible in user list with DELETED status

---

## 12. User Rejection Implementation

When a `USER_CREATE` request is rejected:

```java
// rejectRequest() — special handling for USER_CREATE
if (UserApprovalAction.USER_CREATE.equals(request.getActionType())
    && request.getUser() != null) {

    User targetUser = request.getUser();
    targetUser.setStatus(UserStatus.REJECTED);
    userRepository.save(targetUser);
}
```

### Restrictions on REJECTED Users

- Cannot log in (blocked in `validateUserStatus()`)
- Cannot be modified through Maker/Checker (blocked in `validateRequestedAction()`)
- **Can** be reactivated by ADMIN (goes straight to ACTIVE)
- Visible in user list with REJECTED status

---

## 13. Mandatory Password Change

### How It Works

1. **User creation** (`UserService.createUser()`):
   ```java
   user.setMustChangePassword(true);
   ```

2. **Login response** includes:
   ```json
   { "passwordChangeRequired": true }
   ```

3. **PasswordChangeFilter** (runs after JWT filter):
   ```java
   // If mustChangePassword=true:
   //   Allow: /change-password, /logout, /refresh-token
   //   Block everything else → 403 "Password change required"
   ```

4. **After password change**:
   ```java
   user.setMustChangePassword(false);
   userRepository.save(user);
   revokeUserTokens(user);
   refreshTokenService.revokeAllUserTokens(user.getId());
   ```

5. **User must login again** with new password.

### Exempt Paths

```java
private static final Set<String> ALLOWED_PATHS = Set.of(
    "/api/auth/change-password",
    "/api/auth/logout",
    "/api/auth/refresh-token"
);
```

### Not Applied To

Seeded system users (ADMIN, CONTROL, AUTHORIZER, CREATOR) are created with `mustChangePassword = false` in `DatabaseInitializer`.

---

## 14. Error Handling Architecture

### GlobalExceptionHandler

Every exception is converted to a consistent JSON body:

```json
{
  "timestamp": "2026-08-19T13:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable message",
  "path": "/api/users"
}
```

### Exception → HTTP Status Mapping

| Exception | HTTP Status | Example |
|---|---|---|
| `IllegalArgumentException` | 400 | Validation failures |
| `MethodArgumentNotValidException` | 400 | @Valid failures on @RequestBody |
| `HandlerMethodValidationException` | 400 | @Valid failures on @RequestParam |
| `ConstraintViolationException` | 400 | Bean validation |
| `HttpMessageNotReadableException` | 400 | Malformed JSON |
| `MissingServletRequestParameterException` | 400 | Missing required param |
| `MethodArgumentTypeMismatchException` | 400 | Wrong type for param |
| `AuthenticationException` | 401 | Bad credentials, disabled account |
| `AccessDeniedException` | 403 | Missing role/permission |
| `EntityNotFoundException` | 404 | Resource not found |
| `NoResourceFoundException` | 404 | Invalid URL |
| `IllegalStateException` | 409 | State conflict (locked, inactive, etc.) |
| `Exception` (anything else) | 500 | Unexpected error |

### Security-Specific Handlers

- **JwtAuthenticationEntryPoint** → 401 with: *"Your session has expired or is invalid. Please sign in again."*
- **PasswordChangeFilter** → 403 with: *"Password change required"*
- **Forgot Password** → Always returns the same message whether email exists or not (prevents enumeration)

---

## 15. Audit Logging

### AuditLog Entity

```java
@Entity
@Table(name = "AUDIT_LOGS")
public class AuditLog {
    private Long id;
    private String username;      // actor
    private String action;        // e.g., LOGIN, USER_CREATE, APPROVE_REQUEST
    private String description;   // human-readable description
    private LocalDateTime createdAt;
}
```

### Tracked Actions

| Action | When | Actor |
|---|---|---|
| `LOGIN` | Successful login | The user |
| `LOGOUT` | User logout | The user |
| `CHANGE_PASSWORD` | Password changed | The user |
| `FORGOT_PASSWORD` | Reset requested | The user |
| `RESET_PASSWORD` | Reset completed | The user |
| `REFRESH_TOKEN` | Access token refreshed | The user |
| `CREATE_USER_REQUEST` | CONTROL creates user | CONTROL |
| `CREATE_USER_UPDATE_REQUEST` | CONTROL creates update | CONTROL |
| `ACTIVATE_USER` | ADMIN activates user | ADMIN |
| `DEACTIVATE_USER` | User deactivated | AUTHORIZER/ADMIN |
| `SUSPEND_USER` | User suspended | AUTHORIZER/ADMIN |
| `UNSUSPEND_USER` | User unsuspended | AUTHORIZER/ADMIN |
| `LOCK_USER` | Account locked (manual or auto) | AUTHORIZER/ADMIN or System |
| `AUTO_UNLOCK` | Lock timer expired | System |
| `APPROVE_REQUEST` | Request approved | AUTHORIZER/ADMIN |
| `REJECT_REQUEST` | Request rejected | AUTHORIZER/ADMIN |
| `CANCEL_REQUEST` | Request cancelled | CONTROL/ADMIN |

### Access Control

- **ADMIN-only** endpoints under `/api/admin/audit-logs`
- Requires `AUDIT_VIEW` permission for reading
- Requires `AUDIT_EXPORT` permission for CSV export
- Audit logs are **append-only** — no update or delete endpoints

---

## 16. API Security Rules

### URL-Level Authorization

| URL Pattern | Access |
|---|---|
| `POST /api/auth/login` | Public |
| `POST /api/auth/forgot-password` | Public |
| `POST /api/auth/reset-password` | Public |
| `/swagger-ui/**`, `/v3/api-docs/**` | Public |
| `OPTIONS /**` | Public (CORS) |
| `/api/admin/**` | `hasRole('ADMIN')` |
| Everything else | Authenticated |

### Method-Level Authorization

| Endpoint | Method | @PreAuthorize |
|---|---|---|
| `POST /api/users` | `createUser` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PUT /api/users/{id}` | `updateUser` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `DELETE /api/users/{id}` | `deleteUser` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PATCH /api/users/{id}/activate` | `activateUser` | `hasRole('ADMIN')` |
| `PATCH /api/users/{id}/deactivate` | `deactivateUser` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PUT /api/users/{id}/suspend` | `suspendUser` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PUT /api/users/{id}/unsuspend` | `unsuspendUser` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PUT /api/users/{id}/lock` | `lockUser` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PATCH /api/users/{id}/roles` | `assignRole` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PUT /{id}/approve` | `approveRequest` | `hasAnyRole('AUTHORIZER', 'ADMIN')` |
| `PUT /{id}/reject` | `rejectRequest` | `hasAnyRole('AUTHORIZER', 'ADMIN')` |
| `DELETE /{id}` | `cancelRequest` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `GET /pending` | `getPendingRequests` | `hasAnyRole('AUTHORIZER', 'ADMIN')` |
| `GET /mine` | `getMyRequests` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `PUT /api/roles/{id}/permissions` | `assignPermissions` | `hasAnyRole('CONTROL', 'ADMIN')` |
| `DELETE /api/roles/{id}/permissions` | `clearPermissions` | `hasRole('ADMIN')` |
| `GET /api/admin/audit-logs` | `getAll` | `hasRole('ADMIN')` + `hasAuthority('AUDIT_VIEW')` |

### Admin Protection

ADMIN users cannot be modified through the Maker/Checker workflow:

```java
// UserService.preventAdminModification()
boolean isAdmin = user.getRoles().stream()
    .anyMatch(role -> "ADMIN".equalsIgnoreCase(role.getName()));

if (isAdmin) {
    throw new AccessDeniedException("Administrator accounts are protected...");
}
```

---

## 17. Configuration & Environment

### application.properties

```properties
# Server
server.port=${SERVER_PORT:8083}

# Database (PostgreSQL)
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DATABASE_USERNAME}
spring.datasource.password=${DATABASE_PASSWORD}
spring.datasource.driver-class-name=org.postgresql.Driver

# JPA
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# JWT
app.jwt.secret=${JWT_SECRET}
app.jwt.expiration=${JWT_EXPIRATION}
app.jwt.refresh-expiration=${REFRESH_EXPIRATION}

# System Users
admin.username=${ADMIN_USERNAME}
admin.password=${ADMIN_PASSWORD}
control.username=${CONTROL_USERNAME}
control.password=${CONTROL_PASSWORD}
authorizer.username=${AUTHORIZER_USERNAME}
authorizer.password=${AUTHORIZER_PASSWORD}
creator.username=${CREATOR_USERNAME}
creator.password=${CREATOR_PASSWORD}

# Account Lock
security.account.lock-duration-minutes=${LOCK_DURATION_MINUTES:30}
security.account.lock-max-minutes=${LOCK_MAX_MINUTES:60}

# Swagger
springdoc.api-docs.path=/v3/api-docs
springdoc.swagger-ui.path=/swagger-ui.html

# Logging
logging.level.org.springframework.security=DEBUG
logging.level.org.hibernate.SQL=DEBUG
```

### Required Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection URL (jdbc:postgresql://...) |
| `DATABASE_USERNAME` | Database username |
| `DATABASE_PASSWORD` | Database password |
| `JWT_SECRET` | HMAC secret for JWT signing (min 256 bits) |
| `JWT_EXPIRATION` | Access token lifetime in milliseconds |
| `REFRESH_EXPIRATION` | Refresh token lifetime in milliseconds |
| `ADMIN_USERNAME` | System admin login username |
| `ADMIN_PASSWORD` | System admin login password |
| `CONTROL_USERNAME` | System control user login username |
| `CONTROL_PASSWORD` | System control user login password |
| `AUTHORIZER_USERNAME` | System authorizer user login username |
| `AUTHORIZER_PASSWORD` | System authorizer user login password |
| `CREATOR_USERNAME` | System creator user login username |
| `CREATOR_PASSWORD` | System creator user login password |

### Optional Environment Variables

| Variable | Default | Description |
|---|---|---|
| `LOCK_DURATION_MINUTES` | 30 | Default lock duration when maker doesn't specify |
| `LOCK_MAX_MINUTES` | 60 | Maximum lock duration a maker can request |

---

## 18. Testing Strategy

### Test Types

| Type | Tool | Purpose |
|---|---|---|
| Unit Tests | JUnit 5 | Service logic, validation |
| Integration Tests | Spring Boot Test + H2 | End-to-end workflow verification |
| Security Tests | Spring Security Test | Role/permission enforcement |
| API Tests | MockMvc | Controller request/response |

### Key Test Scenarios

| Scenario | Expected Result |
|---|---|
| CONTROL creates user → ADMIN approves | User becomes ACTIVE |
| CONTROL creates user → ADMIN rejects | User becomes REJECTED |
| CONTROL creates user → delete request → approve | User becomes DELETED |
| 5 failed logins → account locks | Status = LOCKED |
| Locked account → lock timer expires → login | Auto-unlocks, login succeeds |
| New user login → mustChangePassword=true | Only /change-password accessible |
| ADMIN activates REJECTED user | Goes straight to ACTIVE |
| DELETED user tries to login | 409 "deleted" |
| REJECTED user tries to login | 409 "rejected" |
| CONTROL tries to approve own request | 403 "can't approve own" |
| ADMIN tries to modify another ADMIN | 403 "protected" |

### Running Tests

```bash
cd general-ledger-management-system
./mvnw test
```

### Test Database

Tests use an in-memory H2 database (configured in `application-test.properties`). The test profile is activated with `-Dspring.profiles.active=test`.

---

## 19. Deployment Guide

### Render Deployment

1. **Database:** Neon PostgreSQL (already configured)
2. **Build:** Maven (`./mvnw clean package`)
3. **Run:** `java -jar target/general-ledger-management-system-0.0.1-SNAPSHOT.jar`
4. **Environment Variables:** Set all required env vars in Render dashboard

### Pre-Deployment Checklist

- [ ] All environment variables set in Render
- [ ] Neon database has correct CHECK constraints (especially for UserStatus and UserApprovalAction)
- [ ] `spring.jpa.hibernate.ddl-auto=update` will auto-create new columns
- [ ] PostgreSQL enum types (if any) include all new values

### Database Constraints

**CRITICAL:** If the database was migrated from Oracle or has legacy CHECK constraints, they must be updated:

```sql
-- Check and update USERS status constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'users'::regclass AND contype = 'c';

-- Drop old constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check;

-- Add new constraint with all statuses
ALTER TABLE users ADD CONSTRAINT users_status_check
CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED', 'SUSPENDED', 'PASSWORD_EXPIRED', 'DELETED', 'REJECTED'));

-- Check and update USER_APPROVAL_REQUESTS action constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'user_approval_requests'::regclass AND contype = 'c';

-- Drop old constraint
ALTER TABLE user_approval_requests DROP CONSTRAINT IF EXISTS user_approval_requests_action_type_check;

-- Add new constraint with all actions
ALTER TABLE user_approval_requests ADD CONSTRAINT user_approval_requests_action_type_check
CHECK (action_type IN (
  'USER_CREATE', 'USER_UPDATE', 'USER_READ', 'USER_DEACTIVATE',
  'USER_SUSPEND', 'USER_LOCK', 'USER_DELETE', 'USER_UNLOCK', 'USER_UNSUSPEND',
  'ROLE_ASSIGN_PERMISSION', 'ACTIVATE_USER', 'UPDATE_PERMISSION',
  'ASSIGN_ROLE', 'ASSIGN_PERMISSION', 'REMOVE_PERMISSION'
));
```

---

## 20. Known Constraints & Gotchas

### 1. PostgreSQL CHECK Constraints

Hibernate's `ddl-auto=update` **cannot modify CHECK constraints**. If you add a new enum value in Java, you must manually update the database constraint.

### 2. PostgreSQL Enum Types

If using native PostgreSQL enums (not VARCHAR), `ALTER TYPE ... ADD VALUE` must be run manually. The current codebase uses `@Enumerated(EnumType.STRING)` (VARCHAR), so this is only relevant if CHECK constraints exist.

### 3. Transaction Rollback on Failed Login

The `login()` method uses `@Transactional(noRollbackFor = BadCredentialsException.class)` to ensure failed-attempt counters persist. Without this, the counter would be rolled back on each failed attempt.

### 4. Auto-Unlock Fallback

`resolveLockStart()` falls back through: `lockedAt` → `lockoutTime` → `updatedAt` → `createdAt`. This prevents accounts from being stuck locked forever if lock timestamps are missing.

### 5. ADMIN Protection

ADMIN users cannot be modified through the Maker/Checker workflow. The `preventAdminModification()` check is applied in `updateUser()`, `deactivateUser()`, `suspendUser()`, and `assignRole()`.

### 6. Seeded System Users

System users (ADMIN, CONTROL, AUTHORIZER, CREATOR) are created on startup by `DatabaseInitializer`. They have `mustChangePassword = false` and are immediately ACTIVE.

### 7. Pagination Shape

All paginated responses use Spring's `PagedModel` format:
```json
{
  "content": [...],
  "page": { "size": 20, "number": 0, "totalElements": 5, "totalPages": 1 }
}
```

### 8. CORS Configuration

Currently allows all origins (`*`). In production, restrict to trusted frontend origins.

### 9. Swagger in Production

Swagger UI is publicly accessible. Consider restricting or disabling in production.

### 10. Password Reset Email

The `forgotPassword` method generates a reset token but does **not** send an email. The `TODO` comment indicates email integration is pending.

---

*Technical documentation generated from GLMS codebase — August 2026*
