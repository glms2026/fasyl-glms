# General Ledger Management System (GLMS) — User Documentation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [System Architecture](#2-system-architecture)
3. [Roles & Permissions](#3-roles--permissions)
4. [Authentication & Security](#4-authentication--security)
5. [Maker/Checker Workflow](#5-makerchecker-workflow)
6. [User Management](#6-user-management)
7. [Role & Permission Management](#7-role--permission-management)
8. [Ledger Management](#8-ledger-management)
9. [Audit Logs](#9-audit-logs)
10. [Account Locking & Auto-Unlock](#10-account-locking--auto-unlock)
11. [User Deletion](#11-user-deletion)
12. [User Rejection](#12-user-rejection)
13. [Error Handling](#13-error-handling)
14. [Complete API Reference](#14-complete-api-reference)
15. [Environment Variables](#15-environment-variables)

---

## 1. System Overview

The **General Ledger Management System (GLMS)** is an enterprise-grade backend API built with Spring Boot. It provides:

- **User lifecycle management** with a strict Maker/Checker approval workflow
- **Role-based access control (RBAC)** with fine-grained permissions
- **General ledger CRUD** operations
- **Comprehensive audit trail** for all actions
- **JWT-based stateless authentication** with refresh tokens
- **Mandatory password change** for newly created users
- **Temporary account locking** with automatic unlock after a configured duration
- **User-friendly error messages** across all endpoints

### Key Design Principles

| Principle | Description |
|---|---|
| **Maker/Checker** | Every sensitive action requires a maker (CONTROL) to propose and a checker (AUTHORIZER or ADMIN) to approve |
| **Soft Delete** | Users are never hard-deleted; status changes to DELETED |
| **Audit Everything** | Every login, logout, approval, rejection, and password change is logged |
| **No Secrets in Errors** | All error responses are user-friendly; stack traces never leak |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Client)                 │
│              React / Vue / Angular / Mobile          │
└──────────────────────┬──────────────────────────────┘
                       │  HTTP (JWT Bearer Token)
                       ▼
┌─────────────────────────────────────────────────────┐
│               Spring Boot Backend API               │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Auth Filter  │→ │Pwd Chg Filter│→ │Controller │ │
│  │  (JWT)       │  │(enforce pwd  │  │  Layer    │ │
│  │              │  │  change)     │  │           │ │
│  └──────────────┘  └──────────────┘  └─────┬─────┘ │
│                                            │       │
│  ┌─────────────────────────────────────────▼─────┐ │
│  │              Service Layer                    │ │
│  │  AuthenticationService                        │ │
│  │  UserService                                  │ │
│  │  UserApprovalRequestService                   │ │
│  │  RolePermissionService                        │ │
│  │  LedgerService                                │ │
│  │  AuditLogService                              │ │
│  │  RefreshTokenService                          │ │
│  └─────────────────────────────────────────┬─────┘ │
│                                            │       │
│  ┌─────────────────────────────────────────▼─────┐ │
│  │           Repository Layer (JPA)              │ │
│  └─────────────────────────────────────────┬─────┘ │
│                                            │       │
│  ┌─────────────────────────────────────────▼─────┐ │
│  │         PostgreSQL (Neon DB)                  │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌─────────────┐  ┌───────────────┐                │
│  │ Global      │  │ Database      │                │
│  │ Exception   │  │ Initializer   │                │
│  │ Handler     │  │ (seeds data)  │                │
│  └─────────────┘  └───────────────┘                │
└─────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.x |
| Language | Java 17+ |
| Database | PostgreSQL (Neon) |
| ORM | Hibernate / JPA |
| Authentication | JWT (access + refresh tokens) |
| Password Hashing | BCrypt |
| API Documentation | Swagger / OpenAPI 3 |
| Build Tool | Maven |

---

## 3. Roles & Permissions

### System Roles

The system comes with **4 seeded roles** created automatically on startup:

| Role | Purpose | Key Permissions |
|---|---|---|
| **ADMIN** | Full system oversight. Can do everything. Approves without waiting for AUTHORIZER. | ALL permissions |
| **CONTROL** | Maker. Creates approval requests for user actions. | USER_CREATE, USER_UPDATE, USER_DELETE, USER_SUSPEND, USER_LOCK, USER_UNSUSPEND, USER_DEACTIVATE, ASSIGN_ROLE, ASSIGN_PERMISSION, REMOVE_PERMISSION, UPDATE_PERMISSION, ROLE_ASSIGN_PERMISSION |
| **AUTHORIZER** | Checker. Approves or rejects requests made by CONTROL. | USER_ACTIVATE (approval authority) |
| **CREATOR** | Ledger management. Creates and manages ledger entries. | LEDGER_CREATE, LEDGER_READ, LEDGER_UPDATE |

### Complete Permission Catalog

| Permission | Description |
|---|---|
| `USER_CREATE` | Create a new user account |
| `USER_READ` | View user accounts |
| `USER_UPDATE` | Update an existing user |
| `USER_DELETE` | Permanently delete (soft-delete) a user account |
| `USER_DEACTIVATE` | Deactivate a user account |
| `USER_SUSPEND` | Suspend a user account |
| `USER_LOCK` | Lock a user account temporarily |
| `USER_UNSUSPEND` | Remove suspension from a user |
| `USER_ACTIVATE` | Activate a user account (approval authority) |
| `ASSIGN_ROLE` | Assign roles to users |
| `ASSIGN_PERMISSION` | Assign permissions to a role |
| `REMOVE_PERMISSION` | Remove permissions from a role |
| `UPDATE_PERMISSION` | Update role/permission configuration |
| `ROLE_ASSIGN_PERMISSION` | Assign roles and permissions to users |
| `LEDGER_CREATE` | Create a ledger |
| `LEDGER_READ` | Read ledger information |
| `LEDGER_UPDATE` | Update a ledger |
| `LEDGER_DELETE` | Delete a ledger |
| `LEDGER_VIEW_ALL` | View all ledgers across users |
| `AUDIT_VIEW` | View audit logs |
| `AUDIT_EXPORT` | Export audit logs as CSV |

---

## 4. Authentication & Security

### Login Flow

```
Client                         Backend
  │                               │
  │  POST /api/auth/login         │
  │  { username, password }       │
  │──────────────────────────────►│
  │                               │  1. Find user
  │                               │  2. Check status (ACTIVE?)
  │                               │  3. Authenticate credentials
  │                               │  4. Check failed attempts
  │                               │  5. Generate access token (JWT)
  │                               │  6. Generate refresh token
  │                               │  7. Audit log
  │  { accessToken, refreshToken, │
  │    username, role,            │
  │    passwordChangeRequired,    │
  │    permissions }              │
  │◄──────────────────────────────│
```

### Login Response

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "username": "control_user",
  "role": "CONTROL",
  "passwordChangeRequired": false,
  "permissions": ["USER_CREATE", "USER_UPDATE", ...]
}
```

### Token Lifecycle

| Event | Action |
|---|---|
| **Login** | Access token + refresh token issued |
| **Token expiry** | Client uses refresh token to get a new access token |
| **Logout** | Both access and refresh tokens revoked |
| **Password change** | All tokens revoked; user must re-login |
| **Account lock** | All refresh tokens revoked |
| **Account deletion** | All tokens revoked |

### Password Requirements

- Minimum 8 characters, maximum 100
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)
- Cannot reuse the current password

### Mandatory Password Change

When a new user is created through the Maker/Checker workflow:
1. The user is created with `mustChangePassword = true`
2. On first login, the response includes `passwordChangeRequired: true`
3. The `PasswordChangeFilter` blocks all endpoints except `/api/auth/change-password`
4. After changing the password, the flag is cleared and all tokens are revoked
5. The user logs in again with the new password

> **Note:** Seeded system users (ADMIN, CONTROL, AUTHORIZER, CREATOR) do **NOT** have mandatory password change.

---

## 5. Maker/Checker Workflow

This is the **core governance model** of the system. Every sensitive action follows this pattern:

### The Workflow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  MAKER   │         │  REQUEST │         │ CHECKER  │
│ (CONTROL)│───────►│ PENDING  │◄───────│(AUTH/ADM)│
└──────────┘         └────┬─────┘         └──────────┘
                          │
                  ┌───────┴───────┐
                  │               │
                  ▼               ▼
            ┌──────────┐   ┌──────────┐
            │ APPROVED │   │ REJECTED │
            │ (action  │   │ (action  │
            │ executes)│   │ denied)  │
            └──────────┘   └──────────┘
```

### Who Does What

| Role | Operation | Endpoint |
|---|---|---|
| **CONTROL** (Maker) | Creates the request | `POST /api/users`, `PUT /api/users/{id}`, `PUT /api/users/{id}/lock`, etc. |
| **AUTHORIZER** (Checker) | Approves or rejects | `PUT /api/user-approval-requests/{id}/approve` or `/reject` |
| **ADMIN** | Can approve **or** reject **any** request without waiting for AUTHORIZER | Same approve/reject endpoints |
| **CONTROL** (Maker) | Can cancel own pending requests | `DELETE /api/user-approval-requests/{id}` |
| **ADMIN** | Can cancel **any** pending request | Same cancel endpoint |

### Request Lifecycle

1. **CONTROL** sends a request (e.g., create user, lock user, assign role)
2. The system creates a `UserApprovalRequest` with status `PENDING`
3. The request appears in the **AUTHORIZER's** pending queue
4. Either **AUTHORIZER** or **ADMIN** approves or rejects
5. On **APPROVE**: the action is executed (user created, locked, role assigned, etc.)
6. On **REJECT**: the action is not executed; for USER_CREATE, the target user is set to REJECTED status
7. The **Maker** can cancel their own pending request before it's approved

### Actions That Go Through Maker/Checker

| Action | Description |
|---|---|
| `USER_CREATE` | Create a new user (created as INACTIVE, activated on approval) |
| `USER_UPDATE` | Update user details (changes apply on approval) |
| `USER_DEACTIVATE` | Deactivate a user account |
| `USER_SUSPEND` | Suspend a user account |
| `USER_UNSUSPEND` | Remove suspension |
| `USER_LOCK` | Temporarily lock a user for N minutes |
| `USER_DELETE` | Permanently soft-delete a user (with reason) |
| `ASSIGN_ROLE` | Assign roles to a user |
| `ASSIGN_PERMISSION` | Assign permissions to a role |
| `REMOVE_PERMISSION` | Remove permissions from a role |

### Actions That Are ADMIN-Only (Direct, No Maker/Checker)

| Action | Description |
|---|---|
| `ACTIVATE_USER` | Activate an INACTIVE, REJECTED, or SUSPENDED user |
| Clear all permissions from a role | `DELETE /api/roles/{roleId}/permissions` |

---

## 6. User Management

### User Statuses

| Status | Meaning | Can Log In? |
|---|---|---|
| `ACTIVE` | Fully operational account | ✅ Yes |
| `INACTIVE` | Created but not yet approved | ❌ No |
| `LOCKED` | Temporarily locked (auto-unlocks after duration) | ❌ No (until unlocked) |
| `SUSPENDED` | Suspended by admin/authorizer action | ❌ No |
| `PASSWORD_EXPIRED` | Must reset password | ❌ No |
| `DELETED` | Permanently soft-deleted | ❌ No |
| `REJECTED` | User creation was rejected | ❌ No |

### User Lifecycle

```
                    ┌─────────────┐
                    │   Created   │
                    │ (INACTIVE)  │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ APPROVED │ │ REJECTED │ │ DELETED  │
        │(ACTIVE)  │ │(REJECTED)│ │(DELETED) │
        └────┬─────┘ └──────────┘ └──────────┘
             │                    ▲
    ┌────────┼────────┐          │
    │        │        │          │
    ▼        ▼        ▼          │
┌───────┐┌───────┐┌───────┐     │
│ LOCKED││SUSPND ││DELTD  │─────┘
└───┬───┘└───┬───┘└───────┘
    │        │
    ▼        ▼
┌──────────────┐
│  (auto)      │
│  UNLOCKED    │
│  → ACTIVE    │
└──────────────┘
```

### Creating a User (Full Flow)

**Step 1 — CONTROL creates the user**

```
POST /api/users
Authorization: Bearer <token>

{
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Secure@Pass123",
  "roles": ["CREATOR"],
  "permissions": ["LEDGER_CREATE", "LEDGER_READ"],
  "reason": "New team member joining accounting"
}
```

Response: `201 Created`
```json
{
  "id": 4,
  "firstName": "John",
  "lastName": "Doe",
  "username": "johndoe",
  "email": "john@example.com",
  "status": "INACTIVE",
  "roles": ["CREATOR"]
}
```

> The user is created as **INACTIVE**. A `USER_CREATE` approval request is automatically created.

**Step 2 — AUTHORIZER or ADMIN approves**

```
PUT /api/user-approval-requests/{requestId}/approve
Authorization: Bearer <authorizer_token>

{
  "remark": "Approved - new hire verified"
}
```

Response: `200 OK`
```json
{
  "id": 1,
  "action": "USER_CREATE",
  "status": "APPROVED",
  "username": "johndoe",
  "remark": "Approved - new hire verified"
}
```

> The user is now **ACTIVE** and can log in.

### Viewing Users

```
GET /api/users?page=0&size=20
Authorization: Bearer <token>
```

Response (paginated):
```json
{
  "content": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@glms.com",
      "status": "ACTIVE",
      "roles": ["ADMIN"]
    }
  ],
  "page": {
    "size": 20,
    "number": 0,
    "totalElements": 4,
    "totalPages": 1
  }
}
```

### Getting a User by ID

```
GET /api/users/{id}
Authorization: Bearer <token>
```

---

## 7. Role & Permission Management

### Viewing All Roles

```
GET /api/roles
Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "name": "ADMIN",
    "permissions": ["USER_CREATE", "USER_READ", "USER_UPDATE", ...]
  },
  {
    "id": 2,
    "name": "CONTROL",
    "permissions": ["USER_CREATE", "USER_READ", "USER_UPDATE", ...]
  },
  {
    "id": 3,
    "name": "AUTHORIZER",
    "permissions": ["USER_ACTIVATE"]
  },
  {
    "id": 4,
    "name": "CREATOR",
    "permissions": ["LEDGER_CREATE", "LEDGER_READ", "LEDGER_UPDATE"]
  }
]
```

### Viewing Role Permissions

```
GET /api/roles/{roleId}/permissions
Authorization: Bearer <token>
```

### Assigning Permissions to a Role (Maker/Checker)

```
PUT /api/roles/{roleId}/permissions
Authorization: Bearer <control_token>

{
  "permissions": ["LEDGER_DELETE", "LEDGER_VIEW_ALL"],
  "reason": "CREATOR role needs delete and view-all for quarterly reporting"
}
```

Response: `202 Accepted` — creates an approval request.

### Removing a Permission from a Role (Maker/Checker)

```
DELETE /api/roles/{roleId}/permissions/{permissionName}?reason=No+longer+needed
Authorization: Bearer <control_token>
```

### Clearing All Permissions from a Role (ADMIN-Only)

```
DELETE /api/roles/{roleId}/permissions
Authorization: Bearer <admin_token>
```

> This is a direct action — no Maker/Checker workflow.

---

## 8. Ledger Management

### Creating a Ledger

```
POST /api/ledgers
Authorization: Bearer <token>

{
  "ledgerCode": "1001",
  "ledgerName": "Cash in Hand",
  "description": "Primary cash account",
  "ledgerType": "ASSET"
}
```

### Viewing My Ledgers

```
GET /api/ledgers/my-ledgers?page=0&size=20
Authorization: Bearer <token>
```

### Searching Ledgers

```
GET /api/ledgers/search?keyword=cash&page=0&size=20
Authorization: Bearer <token>
```

### Viewing All Ledgers (ADMIN)

```
GET /api/ledgers?page=0&size=20
Authorization: Bearer <admin_token>
```

### Updating a Ledger

```
PUT /api/ledgers/{id}
Authorization: Bearer <token>

{
  "ledgerName": "Cash in Hand - Updated",
  "description": "Updated description"
}
```

### Deleting a Ledger

```
DELETE /api/ledgers/{id}
Authorization: Bearer <token>
```

---

## 9. Audit Logs

Audit logs are **ADMIN-only** and are append-only (never modified or deleted).

### Viewing All Audit Logs

```
GET /api/admin/audit-logs?page=0&size=20
Authorization: Bearer <admin_token>
```

### Viewing Audit Logs by Username

```
GET /api/admin/audit-logs/user/{username}?page=0&size=20
Authorization: Bearer <admin_token>
```

### Viewing Audit Logs by Action

```
GET /api/admin/audit-logs/action/LOGIN?page=0&size=20
Authorization: Bearer <admin_token>
```

### Searching Audit Logs

```
GET /api/admin/audit-logs/search?username=admin&action=LOGIN&from=2026-08-01T00:00:00&to=2026-08-20T23:59:59&page=0&size=20
Authorization: Bearer <admin_token>
```

### Exporting Audit Logs as CSV

```
GET /api/admin/audit-logs/export?username=admin&action=LOGIN
Authorization: Bearer <admin_token>
```

Response: CSV file download.

### Audit Log Response

```json
{
  "id": 1,
  "username": "admin",
  "action": "LOGIN",
  "description": "User logged in successfully",
  "createdAt": "2026-08-19T10:30:00"
}
```

### Tracked Actions

| Action | When |
|---|---|
| `LOGIN` | Successful login |
| `LOGOUT` | User logout |
| `CHANGE_PASSWORD` | Password changed |
| `FORGOT_PASSWORD` | Password reset requested |
| `RESET_PASSWORD` | Password reset completed |
| `REFRESH_TOKEN` | Access token refreshed |
| `USER_CREATE` | New user created (via approval) |
| `USER_UPDATE` | User details updated (via approval) |
| `USER_DELETE` | User deleted (via approval) |
| `USER_DEACTIVATE` | User deactivated |
| `USER_SUSPEND` | User suspended |
| `USER_LOCK` | User locked |
| `USER_UNSUSPEND` | User unsuspended |
| `LOCK_USER` | Account auto-locked (5 failed attempts) |
| `APPROVE_REQUEST` | Approval request approved |
| `REJECT_REQUEST` | Approval request rejected |
| `CANCEL_REQUEST` | Approval request cancelled |

---

## 10. Account Locking & Auto-Unlock

### How Locking Works

1. **CONTROL** creates a lock request with a reason and duration (1–60 minutes)
2. **AUTHORIZER** or **ADMIN** approves the request
3. The account is locked — the user cannot log in
4. When the lock duration expires, the account **automatically unlocks** — no approval needed

### Lock Request

```
PUT /api/users/{id}/lock
Authorization: Bearer <control_token>

{
  "reason": "Suspicious login activity detected",
  "durationMinutes": 30
}
```

Response: `202 Accepted` — approval request created.

### Automatic Unlock

When a locked user tries to log in after the lock duration has elapsed:

1. The system checks `lockedAt + lockDurationMinutes`
2. If the time has passed, the account is automatically set to ACTIVE
3. The login proceeds normally

> **No manual unlock endpoint exists.** The timer is the only way to unlock.

### Auto-Lock on Failed Attempts

After **5 consecutive failed login attempts**:
1. The account is automatically locked
2. The lock uses the default duration (configurable via `LOCK_DURATION_MINUTES`, default 30 minutes)
3. All refresh tokens are revoked
4. An audit log entry is created

### Lock Response on Login (When Still Locked)

```json
{
  "timestamp": "2026-08-19T13:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Your account is temporarily locked. It will unlock automatically in a few minutes - please try again shortly.",
  "path": "/api/auth/login"
}
```

---

## 11. User Deletion

User deletion follows the Maker/Checker workflow — it is **never immediate**.

### Flow

1. **CONTROL** creates a delete request with a required `reason`
2. The request appears in the **AUTHORIZER** and **ADMIN** pending queues
3. **AUTHORIZER** or **ADMIN** approves → user status becomes `DELETED`
4. All pending approval requests for that user are automatically **cancelled**
5. All tokens (JWT + refresh) are revoked
6. The user can **never log in again** and **cannot be reactivated**

### Delete Request

```
DELETE /api/users/{id}
Authorization: Bearer <control_token>

{
  "reason": "Employee left the company - HR reference #12345"
}
```

Response: `202 Accepted`
```json
{
  "id": 5,
  "action": "USER_DELETE",
  "status": "PENDING",
  "reason": "Employee left the company - HR reference #12345"
}
```

### What Happens on Approval

- User status → `DELETED`
- All PENDING approval requests for that user → `CANCELLED` with remark "Cancelled — user account was deleted"
- All JWT tokens → revoked
- All refresh tokens → revoked
- Login attempt → blocked with: *"This account has been deleted. Please contact your administrator if you believe this is a mistake."*

### Restrictions on DELETED Users

| Operation | Allowed? |
|---|---|
| Log in | ❌ No |
| Be modified (update, lock, suspend, etc.) | ❌ No |
| Be reactivated | ❌ No |
| Appear in user list | ✅ Yes (with DELETED status) |

---

## 12. User Rejection

When a `USER_CREATE` approval request is **rejected**, the target user's status is set to `REJECTED` (not INACTIVE).

### What Happens

1. **CONTROL** creates a user → user status is `INACTIVE`
2. **AUTHORIZER** or **ADMIN** rejects the request with a remark
3. User status changes from `INACTIVE` → `REJECTED`
4. The user **cannot log in**
5. The user **cannot be modified** through the Maker/Checker workflow

### Login Attempt by REJECTED User

```json
{
  "timestamp": "2026-08-19T14:00:00",
  "status": 409,
  "error": "Conflict",
  "message": "Your account was not approved. Please contact your administrator for assistance.",
  "path": "/api/auth/login"
}
```

### Admin Can Reactivate a REJECTED User

```
PATCH /api/users/{id}/activate
Authorization: Bearer <admin_token>
```

The user goes directly from `REJECTED` → `ACTIVE`.

---

## 13. Error Handling

All error responses follow a consistent JSON format:

```json
{
  "timestamp": "2026-08-19T13:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Please provide the required 'userId' value.",
  "path": "/api/users"
}
```

### HTTP Status Codes

| Status | Meaning | Examples |
|---|---|---|
| `400` | Bad Request | Missing fields, invalid email, malformed JSON |
| `401` | Unauthorized | Wrong password, unknown user, expired token |
| `403` | Forbidden | User lacks required role/permission |
| `404` | Not Found | User or role doesn't exist |
| `409` | Conflict | Account locked, suspended, inactive, deleted, rejected |
| `500` | Server Error | Unexpected error (no details leaked) |

### Common Error Messages

| Scenario | Message |
|---|---|
| Wrong password | *"We couldn't match that username and password. Please double-check your details and try again."* |
| Account not approved | *"You haven't been approved yet - your account is waiting for an Authorizer to activate it."* |
| Account locked | *"Your account is temporarily locked. It will unlock automatically in a few minutes - please try again shortly."* |
| Account suspended | *"Your account has been suspended. Please contact your administrator for assistance."* |
| Account deleted | *"This account has been deleted. Please contact your administrator if you believe this is a mistake."* |
| Account rejected | *"Your account was not approved. Please contact your administrator for assistance."* |
| Password expired | *"Your password has expired - let's get you a new one. Please set a fresh password to continue."* |
| Already active | *"Good news - this account is already active, so there's nothing to do."* |
| Maker can't approve own | *"The person who created this request can't approve it - it needs a second pair of eyes."* |
| Session expired | *"Your session has expired - please sign in again."* |
| Reject without remark | *"Please add a remark explaining why you're rejecting this request."* |
| Inactive can't be locked | *"Inactive accounts can't be locked - please activate it first."* |

---

## 14. Complete API Reference

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | ❌ | Login with username/password |
| `POST` | `/api/auth/refresh-token` | ❌ | Get new access token using refresh token |
| `POST` | `/api/auth/logout` | ✅ | Logout and revoke tokens |
| `POST` | `/api/auth/change-password` | ✅ | Change current password |
| `POST` | `/api/auth/forgot-password` | ❌ | Request password reset |
| `POST` | `/api/auth/reset-password` | ❌ | Reset password with token |
| `GET` | `/api/auth/profile` | ✅ | Get current user profile |

### User Management Endpoints

| Method | Endpoint | Roles Required | Workflow | Description |
|---|---|---|---|---|
| `POST` | `/api/users` | CONTROL, ADMIN | Maker | Create user (INACTIVE + approval request) |
| `GET` | `/api/users` | ADMIN, CONTROL, AUTHORIZER | Read | Get all users (paginated) |
| `GET` | `/api/users/{id}` | ADMIN, CONTROL, AUTHORIZER | Read | Get user by ID |
| `PUT` | `/api/users/{id}` | CONTROL, ADMIN | Maker | Update user (staged) |
| `DELETE` | `/api/users/{id}` | CONTROL, ADMIN | Maker | Delete user (soft-delete via approval) |
| `PATCH` | `/api/users/{id}/activate` | ADMIN only | Direct | Activate user |
| `PATCH` | `/api/users/{id}/deactivate` | CONTROL, ADMIN | Maker | Deactivate user (via approval) |
| `PUT` | `/api/users/{id}/suspend` | CONTROL, ADMIN | Maker | Suspend user (via approval) |
| `PUT` | `/api/users/{id}/unsuspend` | CONTROL, ADMIN | Maker | Unsuspend user (via approval) |
| `PUT` | `/api/users/{id}/lock` | CONTROL, ADMIN | Maker | Lock user (via approval, with duration) |
| `PATCH` | `/api/users/{id}/roles` | CONTROL, ADMIN | Maker | Assign roles (via approval) |

### Approval Request Endpoints

| Method | Endpoint | Roles Required | Description |
|---|---|---|---|
| `POST` | `/api/user-approval-requests` | CONTROL, ADMIN | Create approval request |
| `POST` | `/api/user-approval-requests/assign-role` | CONTROL, ADMIN | Create role assignment request |
| `PUT` | `/api/user-approval-requests/{id}/approve` | AUTHORIZER, ADMIN | Approve request |
| `PUT` | `/api/user-approval-requests/{id}/reject` | AUTHORIZER, ADMIN | Reject request (remark required) |
| `DELETE` | `/api/user-approval-requests/{id}` | CONTROL, ADMIN | Cancel request (maker own or ADMIN any) |
| `GET` | `/api/user-approval-requests/pending` | AUTHORIZER, ADMIN | View pending requests |
| `GET` | `/api/user-approval-requests/mine` | CONTROL, ADMIN | View own requests |
| `GET` | `/api/user-approval-requests/{id}` | CONTROL, AUTHORIZER, ADMIN | View specific request |

### Role & Permission Endpoints

| Method | Endpoint | Roles Required | Workflow | Description |
|---|---|---|---|---|
| `GET` | `/api/roles` | CONTROL, AUTHORIZER, ADMIN | Read | Get all roles with permissions |
| `GET` | `/api/roles/{id}/permissions` | CONTROL, AUTHORIZER, ADMIN | Read | Get role permissions |
| `PUT` | `/api/roles/{id}/permissions` | CONTROL, ADMIN | Maker | Assign permissions to role (via approval) |
| `DELETE` | `/api/roles/{id}/permissions/{name}` | CONTROL, ADMIN | Maker | Remove permission from role (via approval) |
| `DELETE` | `/api/roles/{id}/permissions` | ADMIN only | Direct | Clear all permissions from role |

### Ledger Endpoints

| Method | Endpoint | Permission Required | Description |
|---|---|---|---|
| `POST` | `/api/ledgers` | LEDGER_CREATE | Create ledger |
| `GET` | `/api/ledgers` | ADMIN | Get all ledgers |
| `GET` | `/api/ledgers/{id}` | LEDGER_READ | Get ledger by ID |
| `GET` | `/api/ledgers/my-ledgers` | LEDGER_READ | Get own ledgers |
| `GET` | `/api/ledgers/search?keyword=` | LEDGER_READ | Search own ledgers |
| `GET` | `/api/ledgers/search/all?keyword=` | ADMIN | Search all ledgers |
| `PUT` | `/api/ledgers/{id}` | LEDGER_UPDATE | Update ledger |
| `DELETE` | `/api/ledgers/{id}` | LEDGER_DELETE | Delete ledger |

### Audit Log Endpoints (ADMIN-Only)

| Method | Endpoint | Permission Required | Description |
|---|---|---|---|
| `GET` | `/api/admin/audit-logs` | AUDIT_VIEW | Get all audit logs |
| `GET` | `/api/admin/audit-logs/{id}` | AUDIT_VIEW | Get audit log by ID |
| `GET` | `/api/admin/audit-logs/user/{username}` | AUDIT_VIEW | Get logs by username |
| `GET` | `/api/admin/audit-logs/action/{action}` | AUDIT_VIEW | Get logs by action |
| `GET` | `/api/admin/audit-logs/search` | AUDIT_VIEW | Search with filters |
| `GET` | `/api/admin/audit-logs/export` | AUDIT_EXPORT | Export as CSV |

---

## 15. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection URL |
| `DATABASE_USERNAME` | ✅ | — | Database username |
| `DATABASE_PASSWORD` | ✅ | — | Database password |
| `JWT_SECRET` | ✅ | — | Secret key for JWT signing |
| `JWT_EXPIRATION` | ✅ | — | Access token lifetime (ms) |
| `REFRESH_EXPIRATION` | ✅ | — | Refresh token lifetime (ms) |
| `ADMIN_USERNAME` | ✅ | — | System admin username |
| `ADMIN_PASSWORD` | ✅ | — | System admin password |
| `CONTROL_USERNAME` | ✅ | — | System control user username |
| `CONTROL_PASSWORD` | ✅ | — | System control user password |
| `AUTHORIZER_USERNAME` | ✅ | — | System authorizer user username |
| `AUTHORIZER_PASSWORD` | ✅ | — | System authorizer user password |
| `CREATOR_USERNAME` | ✅ | — | System creator user username |
| `CREATOR_PASSWORD` | ✅ | — | System creator user password |
| `LOCK_DURATION_MINUTES` | ❌ | 30 | Default lock duration when maker doesn't specify |
| `LOCK_MAX_MINUTES` | ❌ | 60 | Maximum lock duration a maker can request |

---

## Quick Start

1. Set all required environment variables
2. Start the application (`mvn spring-boot:run` or deploy to Render)
3. The system auto-seeds: ADMIN, CONTROL, AUTHORIZER, CREATOR users + all permissions + roles
4. Login as **ADMIN** to start managing users
5. Login as **CONTROL** to create approval requests
6. Login as **AUTHORIZER** to approve/reject requests

### First-Time Login Flow

```
1. Login as CONTROL → create a new user
2. Login as AUTHORIZER → approve the request
3. Login as the new user → forced to change password
4. After password change → login again with new password
5. Full access granted
```

---

*Documentation generated from GLMS codebase — August 2026*
