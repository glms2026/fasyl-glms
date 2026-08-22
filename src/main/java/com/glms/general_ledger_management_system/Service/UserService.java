package com.glms.general_ledger_management_system.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glms.general_ledger_management_system.DTO.user.AssignRoleRequest;
import com.glms.general_ledger_management_system.DTO.user.CreateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UserResponse;
import com.glms.general_ledger_management_system.Mapper.UserMapper;
import com.glms.general_ledger_management_system.Model.postgres.*;

import com.glms.general_ledger_management_system.Repository.postgres.*;
import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    private final RoleRepository roleRepository;

    private final PermissionRepository permissionRepository;

    private final AuditLogRepository auditLogRepository;

    private final PasswordEncoder passwordEncoder;

    private final UserMapper userMapper;

    private final RefreshTokenService refreshTokenService;

    private final JwtTokenRepository jwtTokenRepository;

    private final UserApprovalRequestRepository
            approvalRequestRepository;

    private final ObjectMapper objectMapper;


    /**
     * How long a locked account stays locked (minutes)
     * before it is auto-unlocked without approval.
     */
    @Value("${security.account.lock-duration-minutes:30}")
    private long lockDurationMinutes;


    /**
     * ============================================================
     * CREATE USER
     * ============================================================
     *
     * MAKER operation.
     *
     * Flow:
     *
     * Maker
     *   ↓
     * Create User Request
     *   ↓
     * Validate Roles
     *   ↓
     * Validate Requested Permissions
     *   ↓
     * Create User as INACTIVE
     *   ↓
     * Create USER_CREATE approval request
     *   ↓
     * Authorizer approves
     *   ↓
     * User becomes ACTIVE
     *
     *
     * RBAC:
     *
     * User
     *   ↓
     * Role
     *   ↓
     * Permission
     *
     * Permissions are NOT assigned directly to User.
     */
    @Transactional
    public UserResponse createUser(
            CreateUserRequest request
    ) {

        /*
         * ========================================================
         * 1. VALIDATE REQUEST
         * ========================================================
         */
        if (request == null) {
            throw new IllegalArgumentException(
                    "Please provide the new user's details."
            );
        }


        /*
         * ========================================================
         * 2. VALIDATE USERNAME
         * ========================================================
         */
        validateUsername(
                request.getUsername()
        );


        /*
         * ========================================================
         * 3. VALIDATE EMAIL
         * ========================================================
         */
        validateEmail(
                request.getEmail()
        );


        /*
         * ========================================================
         * 4. VALIDATE PASSWORD
         * ========================================================
         */
        if (request.getPassword() == null
                || request.getPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "Please set a password for the new user."
            );
        }


        /*
         * ========================================================
         * 5. VALIDATE ROLES
         * ========================================================
         */
        if (request.getRoles() == null
                || request.getRoles().isEmpty()) {

            throw new IllegalArgumentException(
                    "Please assign at least one role to the new user."
            );
        }


        /*
         * ========================================================
         * 6. VALIDATE PERMISSIONS
         * ========================================================
         *
         * The Maker must specify the permissions that are expected
         * to come from the selected roles.
         */
        if (request.getPermissions() == null
                || request.getPermissions().isEmpty()) {

            throw new IllegalArgumentException(
                    "Please assign at least one permission to the new user."
            );
        }


        /*
         * ========================================================
         * 7. GET CURRENT MAKER
         * ========================================================
         */
        User maker =
                getCurrentAuthenticatedUser();


        /*
         * ========================================================
         * 8. PREVENT SELF-CREATION
         * ========================================================
         */
        if (maker.getUsername()
                .equalsIgnoreCase(
                        request.getUsername()
                )) {

            throw new AccessDeniedException(
                    "You can't create an account with your own username - try a different one."
            );
        }


        /*
         * ========================================================
         * 9. RESOLVE ROLES
         * ========================================================
         */
        Set<Role> roles =
                resolveRequestedRoles(
                        request.getRoles()
                );


        if (roles.isEmpty()) {

            throw new IllegalArgumentException(
                    "None of the roles you selected are valid - please check and try again."
            );
        }


        /*
         * ========================================================
         * 10. RESOLVE PERMISSIONS
         * ========================================================
         */
        Set<Permission> requestedPermissions =
                resolveRequestedPermissions(
                        request.getPermissions()
                );


        if (requestedPermissions.isEmpty()) {

            throw new IllegalArgumentException(
                    "None of the permissions you selected are valid - please check and try again."
            );
        }


        /*
         * ========================================================
         * 11. VALIDATE ROLE / PERMISSION RELATIONSHIP
         * ========================================================
         *
         * Every requested permission must already exist on at
         * least one of the selected roles.
         */
        validatePermissionsBelongToRoles(
                roles,
                requestedPermissions
        );


        /*
         * ========================================================
         * 12. CREATE USER ENTITY
         * ========================================================
         */
        User user =
                userMapper.toEntity(
                        request
                );


        /*
         * ========================================================
         * 13. ENCODE PASSWORD
         * ========================================================
         */
        user.setPassword(
                passwordEncoder.encode(
                        request.getPassword()
                )
        );


        /*
         * ========================================================
         * 14. ASSIGN ROLES
         * ========================================================
         *
         * Roles are assigned to the user immediately, but the
         * account itself remains INACTIVE.
         *
         * Therefore, the user cannot authenticate until approval.
         */
        user.setRoles(
                new HashSet<>(roles)
        );


        /*
         * ========================================================
         * 15. INITIAL ACCOUNT STATUS
         * ========================================================
         *
         * The Maker creates the account,
         * but the Authorizer activates it.
         */
        user.setStatus(
                UserStatus.INACTIVE
        );


        /*
         * ========================================================
         * 16. SECURITY DEFAULTS
         * ========================================================
         */
        user.setFailedLoginAttempts(0);

        user.setLockoutTime(null);


        /*
         * ========================================================
         * 16a. MANDATORY PASSWORD CHANGE
         * ========================================================
         *
         * Every new user must change their password on first login.
         */
        user.setMustChangePassword(true);


        /*
         * ========================================================
         * 17. SUSPENSION DEFAULTS
         * ========================================================
         */
        user.setSuspendedAt(null);

        user.setSuspendedBy(null);


        /*
         * ========================================================
         * 18. LOCK DEFAULTS
         * ========================================================
         */
        user.setLockedAt(null);

        user.setLockedBy(null);

        user.setLockReason(null);


        /*
         * ========================================================
         * 19. SAVE USER
         * ========================================================
         */
        User savedUser =
                userRepository.save(
                        user
                );


        /*
         * ========================================================
         * 20. CREATE USER-CREATE APPROVAL REQUEST
         * ========================================================
         *
         * The request stores the Maker's proposed roles and
         * permissions.
         *
         * Nothing is activated yet.
         */
        UserApprovalRequest approvalRequest =
                UserApprovalRequest.builder()

                        .user(savedUser)

                        .maker(maker)

                        .actionType(
                                UserApprovalAction.USER_CREATE
                        )

                        .status(
                                ApprovalStatus.PENDING
                        )

                        .reason(
                                request.getReason() != null
                                        && !request.getReason().isBlank()
                                        ? request.getReason().trim()
                                        : "New user creation request"
                        )

                        .roles(
                                new HashSet<>(
                                        request.getRoles()
                                )
                        )

                        .permissions(
                                new HashSet<>(
                                        request.getPermissions()
                                )
                        )

                        .requestedAt(
                                ZonedDateTime.now()
                        )

                        .build();


        /*
         * ========================================================
         * 21. SAVE APPROVAL REQUEST
         * ========================================================
         */
        approvalRequestRepository.save(
                approvalRequest
        );


        /*
         * ========================================================
         * 22. AUDIT LOG
         * ========================================================
         */
        createAuditLog(
                maker.getUsername(),
                "CREATE_USER_REQUEST",
                "Created user creation request for "
                        + savedUser.getUsername()
                        + " with roles: "
                        + request.getRoles()
                        + " and permissions: "
                        + request.getPermissions()
                        + ". User remains INACTIVE pending authorization."
        );


        /*
         * ========================================================
         * 23. RETURN RESPONSE
         * ========================================================
         */        return userMapper.toResponse(
                savedUser
        );
    }





    /**
     * ============================================================
     * UPDATE USER
     * ============================================================
     *
     * MAKER operation.
     *
     * The proposed changes are NOT applied immediately.
     *
     * A USER_UPDATE approval request is created containing a JSON
     * snapshot of the requested changes.
     *
     * The changes are applied only after an AUTHORIZER or ADMIN
     * approves the request.
     */
    @Transactional
    public UserApprovalRequest updateUser(
            Long id,
            UpdateUserRequest request
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Please provide the updated details for this user."
            );
        }


        User user =
                findUser(id);


        preventAdminModification(user);


        /*
         * Validate username uniqueness if it is being changed.
         */
        if (request.getUsername() != null
                && !request.getUsername().trim()
                .equalsIgnoreCase(user.getUsername())) {

            validateUsername(
                    request.getUsername()
            );
        }


        /*
         * Validate email uniqueness if it is being changed.
         */
        if (request.getEmail() != null
                && !request.getEmail().trim()
                .equalsIgnoreCase(user.getEmail())) {

            validateEmail(
                    request.getEmail()
            );
        }


        User maker =
                getCurrentAuthenticatedUser();


        /*
         * Maker cannot create an update request for himself.
         */
        if (maker.getId().equals(user.getId())) {

            throw new AccessDeniedException(
                    "You can't update your own account through this workflow - please ask a colleague to review it for you."
            );
        }


        /*
         * Prevent duplicate pending update requests.
         */
        boolean pending =
                approvalRequestRepository
                        .existsByUserAndActionTypeAndStatus(
                                user,
                                UserApprovalAction.USER_UPDATE,
                                ApprovalStatus.PENDING
                        );

        if (pending) {

            throw new IllegalStateException(
                    "This user already has a pending update request - please wait for it to be resolved first."
            );
        }


        /*
         * Serialize the proposed changes.
         */
        String payload;

        try {

            payload =
                    objectMapper.writeValueAsString(
                            request
                    );

        } catch (JsonProcessingException exception) {

            throw new IllegalArgumentException(
                    "We couldn't process the update details - please try again.",
                    exception
            );
        }


        UserApprovalRequest approvalRequest =
                UserApprovalRequest.builder()
                        .user(user)
                        .maker(maker)
                        .actionType(
                                UserApprovalAction.USER_UPDATE
                        )
                        .status(
                                ApprovalStatus.PENDING
                        )
                        .reason(
                                "User update request"
                        )
                        .payloadJson(payload)
                        .requestedAt(
                                ZonedDateTime.now()
                        )
                        .build();


        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(
                        approvalRequest
                );


        createAuditLog(
                maker.getUsername(),
                "CREATE_USER_UPDATE_REQUEST",
                "Created user update approval request for user "
                        + user.getUsername()
        );


        return savedRequest;
    }



    /**
     * ============================================================
     * GET USER BY ID
     * ============================================================
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(
            Long id
    ) {

        User user =
                findUser(id);

        return userMapper.toResponse(
                user
        );
    }


    /**
     * ============================================================
     * GET ALL USERS
     * ============================================================
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(
            Pageable pageable
    ) {

        if (pageable == null) {
            throw new IllegalArgumentException(
                    "Please provide valid pagination information."
            );
        }

        return userRepository
                .findAll(pageable)
                .map(userMapper::toResponse);
    }


    /**
     * ============================================================
     * ACTIVATE USER
     * ============================================================
     *
     * ADMIN-only direct operation.
     */
    public void activateUser(
            Long id
    ) {

        User user =
                findUser(id);

        if (user.getStatus()
                == UserStatus.ACTIVE) {

            throw new IllegalStateException(
                    "Good news - this account is already active, so there's nothing to do."
            );
        }

        if (user.getStatus()
                == UserStatus.DELETED) {

            throw new IllegalStateException(
                    "This account has been permanently deleted and cannot be reactivated."
            );
        }

        if (user.getStatus()
                == UserStatus.LOCKED) {

            throw new IllegalStateException(
                    "This account is locked right now - it needs to be unlocked before it can be activated."
            );
        }

        if (user.getStatus()
                == UserStatus.SUSPENDED) {

            throw new IllegalStateException(
                    "This account is suspended - it needs to be unsuspended before it can be activated."
            );
        }

        user.setStatus(
                UserStatus.ACTIVE
        );

        user.setUpdatedAt(
                LocalDateTime.now()
        );

        userRepository.save(user);

        createAuditLog(
                getCurrentUsername(),
                "ACTIVATE_USER",
                "Activated user: "
                        + user.getUsername()
        );
    }


    /**
     * ============================================================
     * DEACTIVATE USER
     * ============================================================
     */
    public void deactivateUser(
            Long id
    ) {

        User user =
                findUser(id);

        preventAdminModification(user);

        if (user.getStatus()
                == UserStatus.INACTIVE) {

            throw new IllegalStateException(
                    "This account is already inactive - nothing to do here."
            );
        }

        user.setStatus(
                UserStatus.INACTIVE
        );

        user.setUpdatedAt(
                LocalDateTime.now()
        );

        userRepository.save(user);

        /*
         * Revoke JWT tokens.
         */
        revokeUserTokens(user);

        /*
         * Revoke refresh tokens.
         */
        refreshTokenService
                .revokeAllUserTokens(
                        user.getId()
                );

        createAuditLog(
                getCurrentUsername(),
                "DEACTIVATE_USER",
                "Deactivated user: "
                        + user.getUsername()
        );
    }


    /**
     * ============================================================
     * ASSIGN ROLE TO USER
     * ============================================================
     */
    public void assignRole(
            Long id,
            AssignRoleRequest request
    ) {

        User user =
                findUser(id);

        preventAdminModification(user);

        if (request == null
                || request.getRoles() == null
                || request.getRoles().isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select at least one role to continue."
            );
        }

        Set<Role> roles =
                resolveRequestedRoles(
                        request.getRoles()
                );

        if (user.getRoles() == null) {

            user.setRoles(
                    new HashSet<>()
            );
        }

        user.getRoles()
                .addAll(roles);

        user.setUpdatedAt(
                LocalDateTime.now()
        );

        userRepository.save(user);

        createAuditLog(
                getCurrentUsername(),
                "ASSIGN_ROLE",
                "Assigned roles "
                        + request.getRoles()
                        + " to user "
                        + user.getUsername()
        );
    }


    /**
     * ============================================================
     * SUSPEND USER
     * ============================================================
     */
    public void suspendUser(
            Long id
    ) {

        User user =
                findUser(id);

        preventAdminModification(user);

        if (user.getStatus()
                == UserStatus.SUSPENDED) {

            throw new IllegalStateException(
                    "This account is already suspended - nothing to do here."
            );
        }

        if (user.getStatus()
                == UserStatus.INACTIVE) {

            throw new IllegalStateException(
                    "Inactive accounts can't be suspended - please activate it first."
            );
        }

        if (user.getStatus()
                == UserStatus.LOCKED) {

            throw new IllegalStateException(
                    "This account is locked - it needs to be unlocked before it can be suspended."
            );
        }

        user.setStatus(
                UserStatus.SUSPENDED
        );

        user.setSuspendedAt(
                ZonedDateTime.now()
        );

        user.setSuspendedBy(
                getCurrentUsername()
        );

        user.setUpdatedAt(
                LocalDateTime.now()
        );

        userRepository.save(user);

        revokeUserTokens(user);

        refreshTokenService
                .revokeAllUserTokens(
                        user.getId()
                );

        createAuditLog(
                getCurrentUsername(),
                "SUSPEND_USER",
                "Suspended user: "
                        + user.getUsername()
        );
    }


    /**
     * ============================================================
     * UNSUSPEND USER
     * ============================================================
     */
    public void unsuspendUser(
            Long id
    ) {

        User user =
                findUser(id);

        if (user.getStatus()
                != UserStatus.SUSPENDED) {

            throw new IllegalStateException(
                    "This account isn't suspended, so there's nothing to unsuspend."
            );
        }

        user.setStatus(
                UserStatus.ACTIVE
        );

        user.setSuspendedAt(null);

        user.setSuspendedBy(null);

        user.setUpdatedAt(
                LocalDateTime.now()
        );

        userRepository.save(user);

        createAuditLog(
                getCurrentUsername(),
                "UNSUSPEND_USER",
                "Unsuspended user: "
                        + user.getUsername()
        );
    }


    /**
     * ============================================================
     * AUTO-UNLOCK EXPIRED LOCKS
     * ============================================================
     *
     * Locks are temporary. Once the configured duration has
     * passed, the account is unlocked automatically without
     * any approval. Returns true if the user was unlocked.
     */
    public boolean unlockIfExpired(
            User user
    ) {

        if (user == null
                || user.getStatus() != UserStatus.LOCKED) {

            return false;
        }


        ZonedDateTime lockStart =
                resolveLockStart(user);

        if (lockStart == null) {

            return false;
        }


        long durationMinutes =
                user.getLockDurationMinutes() != null
                        ? user.getLockDurationMinutes()
                        : lockDurationMinutes;

        if (lockStart.plusMinutes(durationMinutes)
                .isAfter(ZonedDateTime.now())) {

            return false;
        }


        applyUnlock(
                user,
                "SYSTEM",
                "AUTO_UNLOCK",
                "Account auto-unlocked after lock duration expired: "
        );

        return true;
    }


    /**
     * Resolve the timestamp the lock started, preferring
     * lockedAt (manual locks) and falling back to lockoutTime
     * (automatic locks after repeated failed logins).
     */
    private ZonedDateTime resolveLockStart(
            User user
    ) {

        if (user.getLockedAt() != null) {

            return user.getLockedAt();
        }

        if (user.getLockoutTime() != null) {

            return user.getLockoutTime()
                    .atZone(ZoneId.systemDefault());
        }

        /*
         * Defensive fallback for locks that carry no explicit
         * timestamp (legacy or edge states): fall back to when the
         * row was last updated or created, so an account can never
         * be stuck locked forever.
         */
        if (user.getUpdatedAt() != null) {

            return user.getUpdatedAt()
                    .atZone(ZoneId.systemDefault());
        }

        if (user.getCreatedAt() != null) {

            return user.getCreatedAt()
                    .atZone(ZoneId.systemDefault());
        }

        return null;
    }


    /**
     * Shared unlock transition used by the manual admin
     * unlock and the automatic lock-expiry unlock.
     */
    private void applyUnlock(
            User user,
            String actor,
            String auditAction,
            String auditDescription
    ) {

        user.setStatus(
                UserStatus.ACTIVE
        );

        user.setFailedLoginAttempts(0);

        user.setLockoutTime(null);

        user.setLockedAt(null);

        user.setLockedBy(null);

        user.setLockReason(null);

        user.setLockDurationMinutes(null);

        user.setUpdatedAt(
                LocalDateTime.now()
        );

        userRepository.save(user);

        createAuditLog(
                actor,
                auditAction,
                auditDescription
                        + user.getUsername()
        );
    }


    /**
     * Scheduled sweep: every 5 minutes, unlock any LOCKED
     * accounts whose lock duration has expired.
     */
    @Scheduled(
            fixedDelay = 300_000,
            initialDelay = 60_000
    )
    public void autoUnlockExpiredLocks() {

        List<User> lockedUsers =
                userRepository.findAllByStatus(
                        UserStatus.LOCKED
                );

        for (User user : lockedUsers) {

            unlockIfExpired(user);
        }
    }


    /**
     * ============================================================
     * RESOLVE ROLES
     * ============================================================
     */
    private Set<Role> resolveRequestedRoles(
            Set<String> roleNames
    ) {

        if (roleNames == null
                || roleNames.isEmpty()) {

            return new HashSet<>();
        }

        return roleNames
                .stream()
                .filter(name -> name != null)
                .map(String::trim)
                .filter(name -> !name.isBlank())
                .map(roleName ->
                        roleRepository
                                .findByNameIgnoreCase(
                                        roleName
                                )
                                .orElseThrow(() ->
                                        new IllegalArgumentException(
                                                "We couldn't find the role: "
                                                        + roleName
                                        )
                                )
                )
                .collect(
                        Collectors.toSet()
                );
    }


    /**
     * ============================================================
     * RESOLVE PERMISSIONS
     * ============================================================
     */
    private Set<Permission> resolveRequestedPermissions(
            Set<String> permissionNames
    ) {
        if (permissionNames == null
                || permissionNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select at least one permission to continue."
            );
        }


        Set<Permission> permissions =
        permissionNames
                .stream()
                .filter(name -> name != null)
                .map(String::trim)
                .filter(name -> !name.isBlank())
                .map(permissionName ->
                        permissionRepository
                                .findByNameIgnoreCase(
                                        permissionName
                                )
                                .orElseThrow(() ->
                                        new IllegalArgumentException(
                                                "We couldn't find the permission: "
                                                        + permissionName
                                        )
                                )
                )
                .collect(
                        Collectors.toSet()
                );

        if (permissions.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select at least one valid permission to continue."
            );
        }

        return permissions;
    }


    /**
     * ============================================================
     * VALIDATE PERMISSIONS AGAINST ROLES
     * ============================================================
     *
     * A requested permission must already be assigned
     * to at least one of the selected roles.
     *
     * This prevents user creation from modifying
     * global role permissions.
     */


    /**
     * ============================================================
     * VALIDATE PERMISSIONS BELONG TO ROLES
     * ============================================================
     *
     * Verifies that every permission requested during user creation
     * is already assigned to at least one of the selected roles.
     *
     * RBAC:
     *
     *      User
     *        ↓
     *      Role
     *        ↓
     *      Permission
     *
     * Example:
     *
     * CONTROL
     *    ├── USER_CREATE
     *    ├── USER_UPDATE
     *    └── USER_LOCK
     *
     * Valid request:
     *
     * roles:
     *      CONTROL
     *
     * permissions:
     *      USER_CREATE
     *      USER_LOCK
     *
     * Invalid request:
     *
     * roles:
     *      CONTROL
     *
     * permissions:
     *      USER_DELETE
     *
     * if USER_DELETE is not assigned to CONTROL.
     */
    private void validatePermissionsBelongToRoles(
            Set<Role> roles,
            Set<Permission> requestedPermissions
    ) {

        /*
         * ========================================================
         * VALIDATE ROLES
         * ========================================================
         */
        if (roles == null || roles.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select at least one role to continue."
            );
        }

        /*
         * ========================================================
         * VALIDATE REQUESTED PERMISSIONS
         * ========================================================
         */
        if (requestedPermissions == null
                || requestedPermissions.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select at least one permission to continue."
            );
        }

        /*
         * ========================================================
         * COLLECT PERMISSIONS FROM SELECTED ROLES
         * ========================================================
         */
        Set<String> rolePermissionNames =
                roles.stream()
                        .filter(Objects::nonNull)
                        .filter(role ->
                                role.getPermissions() != null
                        )
                        .flatMap(role ->
                                role.getPermissions()
                                        .stream()
                        )
                        .filter(Objects::nonNull)
                        .map(Permission::getName)
                        .filter(Objects::nonNull)
                        .map(String::trim)
                        .filter(name -> !name.isBlank())
                        .map(String::toUpperCase)
                        .collect(Collectors.toSet());

        /*
         * ========================================================
         * VALIDATE EVERY REQUESTED PERMISSION
         * ========================================================
         */
        for (Permission requestedPermission :
                requestedPermissions) {

            if (requestedPermission == null
                    || requestedPermission.getName() == null
                    || requestedPermission.getName().isBlank()) {

                throw new IllegalArgumentException(
                        "One of the permissions you provided isn't valid - please check and try again."
                );
            }

            String permissionName =
                    requestedPermission
                            .getName()
                            .trim()
                            .toUpperCase();

            /*
             * Permission must belong to at least one
             * of the selected roles.
             */
            if (!rolePermissionNames.contains(
                    permissionName
            )) {

                throw new IllegalArgumentException(
                        "The permission '"
                                + permissionName
                                + "' isn't available on any of the selected roles"
                );
            }
        }
    }


    /**
     * ============================================================
     * VALIDATE USERNAME
     * ============================================================
     */
    private void validateUsername(
            String username
    ) {

        if (username == null
                || username.isBlank()) {

            throw new IllegalArgumentException(
                    "Please enter a username for this user."
            );
        }

        if (userRepository
                .findByUsername(username)
                .isPresent()) {

            throw new IllegalArgumentException(
                    "That username is already taken - please try a different one."
            );
        }
    }


    /**
     * ============================================================
     * VALIDATE EMAIL
     * ============================================================
     */
    private void validateEmail(
            String email
    ) {

        if (email == null
                || email.isBlank()) {

            throw new IllegalArgumentException(
                    "Please enter an email address for this user."
            );
        }

        if (userRepository
                .findByEmail(email)
                .isPresent()) {

            throw new IllegalArgumentException(
                    "That email is already registered to another account."
            );
        }
    }


    /**
     * ============================================================
     * FIND USER
     * ============================================================
     */
    private User findUser(
            Long id
    ) {

        if (id == null) {

            throw new IllegalArgumentException(
                    "Please provide the user ID."
            );
        }

        return userRepository
                .findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "We couldn't find the user: " + id
                        )
                );
    }


    /**
     * ============================================================
     * PREVENT ADMIN MODIFICATION
     * ============================================================
     */
    private void preventAdminModification(
            User user
    ) {

        if (user.getRoles() == null) {
            return;
        }

        boolean isAdmin =
                user.getRoles()
                        .stream()
                        .filter(
                                role -> role != null
                        )
                        .anyMatch(
                                role ->
                                        role.getName() != null
                                                && "ADMIN"
                                                .equalsIgnoreCase(
                                                        role.getName()
                                                )
                        );

        if (isAdmin) {

            throw new AccessDeniedException(
                    "Administrator accounts are protected and can't be modified through this operation."
            );
        }
    }


    /**
     * ============================================================
     * REVOKE JWT TOKENS
     * ============================================================
     */
    private void revokeUserTokens(
            User user
    ) {

        var tokens =
                jwtTokenRepository
                        .findAllByUser(user);

        if (tokens == null
                || tokens.isEmpty()) {

            return;
        }

        tokens.forEach(
                token ->
                        token.setRevoked(true)
        );

        jwtTokenRepository.saveAll(
                tokens
        );
    }


    /**
     * ============================================================
     * CURRENT USERNAME
     * ============================================================
     */
    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new AccessDeniedException(
                    "Your session isn't authenticated - please sign in again."
            );
        }

        return authentication.getName();
    }


    private User getCurrentAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new AccessDeniedException(
                    "Your session isn't authenticated - please sign in again."
            );
        }

        String username =
                authentication.getName();

        if (username == null
                || username.isBlank()) {

            throw new AccessDeniedException(
                    "We couldn't identify your session - please sign in again."
            );
        }

        return userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "We couldn't find the account tied to your session - please sign in again."
                        )
                );
    }


    /**
     * ============================================================
     * AUDIT LOG
     * ============================================================
     */
    private void createAuditLog(
            String username,
            String action,
            String description
    ) {

        AuditLog auditLog =
                AuditLog.builder()
                        .username(username)
                        .action(action)
                        .description(description)
                        .createdAt(
                                LocalDateTime.now()
                        )
                        .build();

        auditLogRepository.save(
                auditLog
        );
    }


}

