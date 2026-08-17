package com.glms.general_ledger_management_system.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glms.general_ledger_management_system.DTO.user.AssignRoleApprovalRequest;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.Model.ApprovalStatus;
import com.glms.general_ledger_management_system.Model.AuditLog;
import com.glms.general_ledger_management_system.Model.Role;
import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Model.UserApprovalAction;
import com.glms.general_ledger_management_system.Model.UserApprovalRequest;
import com.glms.general_ledger_management_system.Model.UserStatus;
import com.glms.general_ledger_management_system.Repository.*;

import com.glms.general_ledger_management_system.DTO.user.AssignPermissionApprovalRequest;
import com.glms.general_ledger_management_system.Model.Permission;
import com.glms.general_ledger_management_system.Repository.PermissionRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
@Transactional
public class UserApprovalRequestService {


    private final UserApprovalRequestRepository approvalRequestRepository;

    private final UserRepository userRepository;

    private final RoleRepository roleRepository;

    private final AuditLogRepository auditLogRepository;

    private final JwtTokenRepository jwtTokenRepository;

    private final RefreshTokenService refreshTokenService;
    private final PermissionRepository permissionRepository;

    private final ObjectMapper objectMapper;


    /**
     * Default lock duration (minutes) when the maker does
     * not specify one.
     */
    @Value("${security.account.lock-duration-minutes:30}")
    private long lockDurationMinutes;


    /**
     * Maximum lock duration a maker may request (minutes).
     */
    @Value("${security.account.lock-max-minutes:60}")
    private int lockMaxMinutes;


    /**
     * ============================================================
     * CREATE GENERAL APPROVAL REQUEST
     * ============================================================
     *
     * MAKER / CONTROL operation.
     *
     * This method is used for:
     *
     * ACTIVATE_USER
     * USER_DEACTIVATE
     * USER_SUSPEND
     * USER_UNSUSPEND
     * USER_LOCK
     *
     * ASSIGN_ROLE must use the dedicated
     * createRoleAssignmentApprovalRequest() method.
     *
     * PASSWORD_RESET is NOT supported.
     */
    public UserApprovalRequest createApprovalRequest(
            Long userId,
            UserApprovalAction actionType,
            String reason
    ) {

        return createApprovalRequest(
                userId,
                actionType,
                reason,
                null
        );
    }


    /**
     * Same as the three-argument version but also accepts
     * the requested lock duration (minutes) for USER_LOCK
     * requests.
     */
    public UserApprovalRequest createApprovalRequest(
            Long userId,
            UserApprovalAction actionType,
            String reason,
            Integer durationMinutes
    ) {

        validateUserId(userId);

        validateAction(actionType);

        validateReason(reason);


        /*
         * ASSIGN_ROLE requires the dedicated DTO because
         * role names must be supplied with the request.
         */
        if (actionType == UserApprovalAction.ASSIGN_ROLE) {

            throw new IllegalArgumentException(
                    "ASSIGN_ROLE requires AssignRoleApprovalRequest"
            );
        }


        User targetUser =
                findUser(userId);


        User maker =
                getAuthenticatedUser();


        /*
         * Maker cannot create a request for himself.
         */
        preventSelfRequest(
                maker,
                targetUser
        );


        /*
         * ADMIN accounts cannot be modified through
         * the Maker/Checker workflow.
         */
        preventAdminModification(
                targetUser
        );


        /*
         * Validate that the requested operation makes
         * sense for the current account state.
         */
        validateRequestedAction(
                targetUser,
                actionType
        );


        /*
         * Prevent duplicate pending requests.
         */
        preventDuplicatePendingRequest(
                targetUser,
                actionType
        );


        /*
         * USER_LOCK: persist the requested lock duration on the
         * target user so the auto-unlock timer knows how long
         * the lock lasts. Falls back to the configured default
         * when no duration is supplied.
         */
        if (actionType == UserApprovalAction.USER_LOCK) {

            targetUser.setLockDurationMinutes(
                    resolveLockDuration(durationMinutes)
            );

            userRepository.save(targetUser);
        }


        UserApprovalRequest request =
                UserApprovalRequest.builder()
                        .user(targetUser)
                        .maker(maker)
                        .actionType(actionType)
                        .status(ApprovalStatus.PENDING)
                        .reason(reason.trim())
                        .requestedAt(ZonedDateTime.now())
                        .roles(new HashSet<>())
                        .build();


        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(
                        request
                );


        createAuditLog(
                maker.getUsername(),
                "CREATE_APPROVAL_REQUEST",
                "Created approval request for user "
                        + targetUser.getUsername()
                        + " with action "
                        + actionType.name()
        );


        return savedRequest;
    }


    /**
     * ============================================================
     * RESOLVE LOCK DURATION
     * ============================================================
     *
     * Validates the maker-supplied lock duration (minutes) and
     * falls back to the configured default when not supplied.
     */
    private int resolveLockDuration(
            Integer durationMinutes
    ) {

        if (durationMinutes == null) {

            return (int) Math.min(
                    lockDurationMinutes,
                    lockMaxMinutes
            );
        }

        if (durationMinutes < 1
                || durationMinutes > lockMaxMinutes) {

            throw new IllegalArgumentException(
                    "Lock duration must be between 1 and "
                            + lockMaxMinutes
                            + " minutes"
            );
        }

        return durationMinutes;
    }


    /**
     * ============================================================
     * CREATE ROLE ASSIGNMENT APPROVAL REQUEST
     * ============================================================
     *
     * MAKER / CONTROL operation.
     *
     * This method specifically handles role assignment because
     * the requested role names must be stored in the approval
     * request until the AUTHORIZER approves it.
     *
     * No role is assigned immediately.
     */
    public UserApprovalRequest createRoleAssignmentRequest(
            Long userId,
            Set<String> roleNames,
            String reason
    ) {

        if (userId == null) {

            throw new IllegalArgumentException(
                    "User ID cannot be null"
            );
        }


        if (roleNames == null || roleNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "At least one role must be provided"
            );
        }


        if (reason == null || reason.isBlank()) {

            throw new IllegalArgumentException(
                    "Reason is required"
            );
        }


        User targetUser =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "User not found: " + userId
                                )
                        );


        User maker =
                getAuthenticatedUser();


        /*
         * Maker cannot assign roles to himself.
         */
        if (maker.getId().equals(targetUser.getId())) {

            throw new AccessDeniedException(
                    "You cannot create a role assignment request for yourself"
            );
        }


        /*
         * ADMIN accounts cannot be modified through
         * the normal Maker-Checker workflow.
         */
        if (isAdmin(targetUser)) {

            throw new AccessDeniedException(
                    "Administrator account cannot be modified through the approval workflow"
            );
        }


        /*
         * Clean and validate role names.
         */
        Set<String> cleanedRoleNames =
                roleNames.stream()
                        .filter(java.util.Objects::nonNull)
                        .map(String::trim)
                        .filter(name -> !name.isBlank())
                        .collect(Collectors.toSet());


        if (cleanedRoleNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "No valid roles were provided"
            );
        }


        /*
         * Make sure every requested role exists.
         */
        for (String roleName : cleanedRoleNames) {

            roleRepository
                    .findByNameIgnoreCase(roleName)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Role not found: " + roleName
                            )
                    );
        }


        /*
         * Prevent duplicate pending role-assignment requests
         * for the same user.
         */
        boolean pending =
                approvalRequestRepository
                        .existsByUserAndActionTypeAndStatus(
                                targetUser,
                                UserApprovalAction.ASSIGN_ROLE,
                                ApprovalStatus.PENDING
                        );


        if (pending) {

            throw new IllegalStateException(
                    "A pending role assignment request already exists for this user"
            );
        }


        /*
         * Create the approval request.
         */
        UserApprovalRequest request =
                UserApprovalRequest.builder()
                        .user(targetUser)
                        .maker(maker)
                        .actionType(
                                UserApprovalAction.ASSIGN_ROLE
                        )
                        .status(
                                ApprovalStatus.PENDING
                        )
                        .reason(
                                reason.trim()
                        )
                        .requestedAt(
                                ZonedDateTime.now()
                        )
                        .roles(
                                cleanedRoleNames
                        )
                        .build();


        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(request);


        /*
         * Audit the Maker operation.
         */
        createAuditLog(
                maker.getUsername(),
                "CREATE_ROLE_ASSIGNMENT_REQUEST",
                "Created role assignment approval request for user "
                        + targetUser.getUsername()
                        + " with roles "
                        + cleanedRoleNames
        );


        return savedRequest;
    }



    /**
     * ============================================================
     * CREATE ROLE PERMISSION ASSIGNMENT REQUEST
     * ============================================================
     *
     * MAKER / CONTROL operation.
     *
     * The permission is NOT immediately assigned to the role.
     *
     * The permission is stored in the approval request and will
     * only be assigned after AUTHORIZER approval.
     */
    public UserApprovalRequest createRolePermissionAssignmentRequest(
            Long roleId,
            Set<String> permissionNames,
            String reason
    ) {

        if (roleId == null) {
            throw new IllegalArgumentException(
                    "Role ID cannot be null"
            );
        }

        if (permissionNames == null
                || permissionNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "At least one permission must be provided"
            );
        }

        validateReason(reason);

        User maker = getAuthenticatedUser();

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Role not found: " + roleId
                                )
                        );

        /*
         * ADMIN role should not be modified through the
         * normal Maker-Checker workflow.
         */
        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "ADMIN role permissions cannot be modified through this workflow"
            );
        }

        /*
         * Clean permission names.
         */
        Set<String> cleanedPermissionNames =
                permissionNames.stream()
                        .filter(java.util.Objects::nonNull)
                        .map(String::trim)
                        .filter(name -> !name.isBlank())
                        .collect(Collectors.toSet());

        if (cleanedPermissionNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "No valid permissions were provided"
            );
        }

        /*
         * Validate that every permission exists.
         */
        for (String permissionName : cleanedPermissionNames) {

            permissionRepository
                    .findByNameIgnoreCase(permissionName)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Permission not found: "
                                            + permissionName
                            )
                    );
        }

        /*
         * Prevent duplicate pending permission requests
         * for the same role.
         */
        if (hasPendingPermissionRequest(
                role,
                UserApprovalAction.ASSIGN_PERMISSION
        )) {

            throw new IllegalStateException(
                    "A pending permission assignment request already exists for role "
                            + role.getName()
            );
        }

        /*
         * Create pending approval request.
         *
         * IMPORTANT:
         * The role is NOT modified here.
         *
         * The target role name is stored inside the request so the
         * Authorizer/Admin can act on it without ambiguity.
         */
        UserApprovalRequest request =
                UserApprovalRequest.builder()
                        .maker(maker)
                        .actionType(
                                UserApprovalAction.ASSIGN_PERMISSION
                        )
                        .status(
                                ApprovalStatus.PENDING
                        )
                        .reason(
                                reason.trim()
                        )
                        .requestedAt(
                                ZonedDateTime.now()
                        )
                        .roles(
                                new HashSet<>(
                                        java.util.Collections.singleton(
                                                role.getName()
                                        )
                                )
                        )
                        .permissions(
                                cleanedPermissionNames
                        )
                        .build();

        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(
                        request
                );

        createAuditLog(
                maker.getUsername(),
                "CREATE_PERMISSION_ASSIGNMENT_REQUEST",
                "Requested permissions "
                        + cleanedPermissionNames
                        + " for role "
                        + role.getName()
        );

        return savedRequest;
    }



    /**
     * ============================================================
     * CREATE ROLE PERMISSION REMOVAL REQUEST
     * ============================================================
     *
     * Removes ONE permission from a role after authorization.
     *
     * The permission is NOT removed immediately.
     */
    public UserApprovalRequest createRolePermissionRemovalRequest(
            Long roleId,
            String permissionName,
            String reason
    ) {

        if (roleId == null) {

            throw new IllegalArgumentException(
                    "Role ID cannot be null"
            );
        }

        if (permissionName == null
                || permissionName.isBlank()) {

            throw new IllegalArgumentException(
                    "Permission name is required"
            );
        }

        validateReason(reason);

        User maker =
                getAuthenticatedUser();

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Role not found: "
                                                + roleId
                                )
                        );

        /*
         * ADMIN protection.
         */
        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "ADMIN role permissions cannot be modified through this workflow"
            );
        }

        Permission permission =
                permissionRepository
                        .findByNameIgnoreCase(
                                permissionName.trim()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Permission not found: "
                                                + permissionName
                                )
                        );

        /*
         * Verify that the permission is actually assigned
         * to this role.
         */
        if (role.getPermissions() == null
                || !role.getPermissions()
                .contains(permission)) {

            throw new IllegalStateException(
                    "Permission "
                            + permissionName
                            + " is not assigned to role "
                            + role.getName()
            );
        }

        /*
         * Store exactly ONE permission in the request.
         *
         * This allows the Maker to remove permissions
         * individually.
         */
        Set<String> permissionNames =
                new HashSet<>();

        permissionNames.add(
                permission.getName()
        );

        /*
         * Prevent duplicate pending removal requests
         * for the same role.
         */
        if (hasPendingPermissionRequest(
                role,
                UserApprovalAction.REMOVE_PERMISSION
        )) {

            throw new IllegalStateException(
                    "A pending permission removal request already exists for role "
                            + role.getName()
            );
        }

        UserApprovalRequest request =
                UserApprovalRequest.builder()
                        .maker(maker)
                        .actionType(
                                UserApprovalAction.REMOVE_PERMISSION
                        )
                        .status(
                                ApprovalStatus.PENDING
                        )
                        .reason(
                                reason.trim()
                        )
                        .requestedAt(
                                ZonedDateTime.now()
                        )
                        .roles(
                                new HashSet<>(
                                        java.util.Collections.singleton(
                                                role.getName()
                                        )
                                )
                        )
                        .permissions(
                                permissionNames
                        )
                        .build();

        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(
                        request
                );

        createAuditLog(
                maker.getUsername(),
                "CREATE_PERMISSION_REMOVAL_REQUEST",
                "Requested removal of permission "
                        + permission.getName()
                        + " from role "
                        + role.getName()
        );

        return savedRequest;
    }



    /**
     * ============================================================
     * APPROVE REQUEST
     * ============================================================
     *
     * CHECKER / AUTHORIZER operation.
     *
     * The requested operation is executed only after
     * successful authorization.
     */
    public UserApprovalRequest approveRequest(
            Long requestId,
            String remark
    ) {

        UserApprovalRequest request =
                findPendingRequest(
                        requestId
                );


        User authorizer =
                getAuthenticatedUser();


        /*
         * Maker cannot authorize his own request.
         */
        preventMakerAuthorization(
                request,
                authorizer
        );


        /*
         * Permission assignment/removal requests do not target a
         * user account; they target a role.
         */
        if (
                request.getActionType()
                        == UserApprovalAction.ASSIGN_PERMISSION
                        ||
                        request.getActionType()
                        == UserApprovalAction.REMOVE_PERMISSION
        ) {

            if (request.getRoles() == null
                    || request.getRoles().isEmpty()) {

                throw new IllegalStateException(
                        "Approval request has no target role"
                );
            }


            request.setAuthorizer(
                    authorizer
            );

            request.setStatus(
                    ApprovalStatus.APPROVED
            );

            request.setAuthorizerRemark(
                    normalizeRemark(remark)
            );

            request.setAuthorizedAt(
                    ZonedDateTime.now()
            );


            /*
             * Execute the permission change on the role.
             */
            executeApprovedAction(
                    request
            );


            UserApprovalRequest savedRequest =
                    approvalRequestRepository.save(
                            request
                    );


            createAuditLog(
                    authorizer.getUsername(),
                    "APPROVE_PERMISSION_REQUEST",
                    "Approved request "
                            + request.getId()
                            + " for role "
                            + request.getRoles().iterator().next()
                            + " with action "
                            + request.getActionType().name()
            );


            return savedRequest;
        }


        User targetUser =
                request.getUser();


        if (targetUser == null) {

            throw new IllegalStateException(
                    "Approval request has no target user"
            );
        }


        /*
         * ADMIN protection is checked again at approval time.
         *
         * This protects against the target user becoming ADMIN
         * after the request was created.
         */
        if (request.getActionType()
                != UserApprovalAction.USER_CREATE) {

            preventAdminModification(
                    targetUser
            );
        }


        /*
         * Validate the current account state again.
         *
         * The state may have changed after the maker created
         * the request.
         */
        validateRequestedAction(
                targetUser,
                request.getActionType()
        );


        /*
         * Record authorization information.
         */
        request.setAuthorizer(
                authorizer
        );

        request.setStatus(
                ApprovalStatus.APPROVED
        );

        request.setAuthorizerRemark(
                normalizeRemark(remark)
        );

        request.setAuthorizedAt(
                ZonedDateTime.now()
        );


        /*
         * Execute the actual user-management operation.
         */
        executeApprovedAction(
                request
        );


        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(
                        request
                );


        createAuditLog(
                authorizer.getUsername(),
                "APPROVE_USER_REQUEST",
                "Approved request "
                        + request.getId()
                        + " for user "
                        + targetUser.getUsername()
                        + " with action "
                        + request.getActionType().name()
        );


        return savedRequest;
    }




    /**
     * ============================================================
     * APPROVE USER CREATION
     * ============================================================
     *
     * Called only by the Authorizer after approving a
     * CREATE_USER request.
     *
     * The user changes from:
     *
     *     INACTIVE
     *
     * to:
     *
     *     ACTIVE
     */
    private void approveUserCreation(
            UserApprovalRequest request
    ) {

        User user =
                request.getUser();


        if (user == null) {

            throw new IllegalStateException(
                    "Approval request has no target user"
            );
        }


        /*
         * User must still be inactive.
         */
        if (user.getStatus()
                != UserStatus.INACTIVE) {

            throw new IllegalStateException(
                    "User creation cannot be approved because the account is no longer inactive"
            );
        }


        /*
         * ADMIN must never be created through this
         * Maker-Checker workflow.
         */
        if (isAdmin(user)) {

            throw new AccessDeniedException(
                    "Administrator account cannot be created through this workflow"
            );
        }


        /*
         * Verify that roles are still valid.
         */
        Set<Role> roles =
                resolveRolesFromApproval(
                        request.getRoles()
                );


        /*
         * Verify permissions are still valid.
         */
        Set<Permission> permissions =
                resolvePermissionsFromApproval(
                        request.getPermissions()
                );


        /*
         * Verify permissions still belong to
         * the requested roles.
         */
        validatePermissionsBelongToRoles(
                roles,
                permissions
        );


        /*
         * Apply roles.
         */
        user.setRoles(
                new HashSet<>(roles)
        );


        /*
         * IMPORTANT:
         *
         * Only now does the user become ACTIVE.
         */
        user.setStatus(
                UserStatus.ACTIVE
        );


        user.setUpdatedAt(
                LocalDateTime.now()
        );


        userRepository.save(
                user
        );


        createAuditLog(
                request.getAuthorizer().getUsername(),
                "APPROVE_USER_CREATION",
                "Approved creation and activation of user "
                        + user.getUsername()
        );
    }




    /**
     * ============================================================
     * RESOLVE ROLES FROM APPROVAL REQUEST
     * ============================================================
     */
    private Set<Role> resolveRolesFromApproval(
            Set<String> roleNames
    ) {

        if (roleNames == null
                || roleNames.isEmpty()) {

            throw new IllegalStateException(
                    "No roles were supplied for user creation"
            );
        }


        return roleNames
                .stream()
                .filter(
                        name -> name != null
                )
                .map(String::trim)
                .filter(
                        name -> !name.isBlank()
                )
                .map(
                        roleName ->
                                roleRepository
                                        .findByNameIgnoreCase(
                                                roleName
                                        )
                                        .orElseThrow(() ->
                                                new IllegalArgumentException(
                                                        "Role no longer exists: "
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
     * RESOLVE PERMISSIONS FROM APPROVAL REQUEST
     * ============================================================
     */
    private Set<Permission> resolvePermissionsFromApproval(
            Set<String> permissionNames
    ) {

        if (permissionNames == null
                || permissionNames.isEmpty()) {

            throw new IllegalStateException(
                    "No permissions were supplied for user creation"
            );
        }


        return permissionNames
                .stream()
                .filter(
                        name -> name != null
                )
                .map(String::trim)
                .filter(
                        name -> !name.isBlank()
                )
                .map(
                        permissionName ->
                                permissionRepository
                                        .findByNameIgnoreCase(
                                                permissionName
                                        )
                                        .orElseThrow(() ->
                                                new IllegalArgumentException(
                                                        "Permission no longer exists: "
                                                                + permissionName
                                                )
                                        )
                )
                .collect(
                        Collectors.toSet()
                );
    }


    /**
     * ============================================================
     * VALIDATE PERMISSIONS BELONG TO ROLES
     * ============================================================
     */
    private void validatePermissionsBelongToRoles(
            Set<Role> roles,
            Set<Permission> requestedPermissions
    ) {

        Set<String> rolePermissionNames =
                roles.stream()
                        .filter(
                                role -> role != null
                        )
                        .filter(
                                role ->
                                        role.getPermissions() != null
                        )
                        .flatMap(
                                role ->
                                        role.getPermissions()
                                                .stream()
                        )
                        .filter(
                                permission ->
                                        permission != null
                        )
                        .map(
                                Permission::getName
                        )
                        .filter(
                                name -> name != null
                        )
                        .map(String::toUpperCase)
                        .collect(
                                Collectors.toSet()
                        );


        for (Permission permission :
                requestedPermissions) {

            if (permission == null
                    || permission.getName() == null) {

                continue;
            }


            String permissionName =
                    permission
                            .getName()
                            .toUpperCase();


            if (!rolePermissionNames.contains(
                    permissionName
            )) {

                throw new IllegalArgumentException(
                        "Permission "
                                + permissionName
                                + " is not assigned to the selected role(s)"
                );
            }
        }
    }

    /**
     * ============================================================
     * REJECT REQUEST
     * ============================================================
     *
     * CHECKER / AUTHORIZER operation.
     *
     * No user-management operation is executed.
     */
    public UserApprovalRequest rejectRequest(
            Long requestId,
            String remark
    ) {

        if (remark == null
                || remark.isBlank()) {

            throw new IllegalArgumentException(
                    "Rejection remark is required"
            );
        }


        UserApprovalRequest request =
                findPendingRequest(
                        requestId
                );


        User authorizer =
                getAuthenticatedUser();


        /*
         * Maker cannot reject his own request.
         */
        preventMakerAuthorization(
                request,
                authorizer
        );


        request.setAuthorizer(
                authorizer
        );

        request.setStatus(
                ApprovalStatus.REJECTED
        );

        request.setAuthorizerRemark(
                remark.trim()
        );

        request.setAuthorizedAt(
                ZonedDateTime.now()
        );


        /*
         * IMPORTANT:
         *
         * No user-management action is executed here.
         */
        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(
                        request
                );


        createAuditLog(
                authorizer.getUsername(),
                "REJECT_USER_REQUEST",
                "Rejected request "
                        + request.getId()
                        + " for user "
                        + request.getUser().getUsername()
                        + " with action "
                        + request.getActionType().name()
        );


        return savedRequest;
    }


    /**
     * ============================================================
     * GET PENDING REQUESTS
     * ============================================================
     *
     * CHECKER / AUTHORIZER queue.
     */
    @Transactional(readOnly = true)
    public Page<UserApprovalRequest> getPendingRequests(
            Pageable pageable
    ) {

        return approvalRequestRepository.findByStatus(
                ApprovalStatus.PENDING,
                pageable
        );
    }


    /**
     * ============================================================
     * GET MY REQUESTS
     * ============================================================
     *
     * Requests created by the authenticated maker.
     */
    @Transactional(readOnly = true)
    public Page<UserApprovalRequest> getMyRequests(
            Pageable pageable
    ) {

        User maker =
                getAuthenticatedUser();

        return approvalRequestRepository.findByMakerId(
                maker.getId(),
                pageable
        );
    }


    /**
     * ============================================================
     * CANCEL REQUEST
     * ============================================================
     *
     * MAKER operation.
     *
     * The maker can withdraw his own pending request.
     *
     * ADMIN can cancel any pending request.
     */
    public UserApprovalRequest cancelRequest(
            Long requestId
    ) {

        UserApprovalRequest request =
                findPendingRequest(
                        requestId
                );


        User maker =
                getAuthenticatedUser();


        boolean isAdmin =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getAuthorities()
                        .stream()
                        .anyMatch(
                                authority ->
                                        "ROLE_ADMIN".equals(
                                                authority.getAuthority()
                                        )
                        );


        if (!isAdmin
                && (request.getMaker() == null
                || !request.getMaker().getId()
                .equals(maker.getId()))) {

            throw new AccessDeniedException(
                    "Only the maker or an administrator can cancel this request"
            );
        }


        request.setStatus(
                ApprovalStatus.CANCELLED
        );

        request.setAuthorizerRemark(
                "Cancelled by " + maker.getUsername()
        );


        UserApprovalRequest savedRequest =
                approvalRequestRepository.save(
                        request
                );


        createAuditLog(
                maker.getUsername(),
                "CANCEL_APPROVAL_REQUEST",
                "Cancelled approval request "
                        + request.getId()
        );


        return savedRequest;
    }


    /**
     * ============================================================
     * EXECUTE APPROVED ACTION
     * ============================================================
     *
     * This method is called ONLY after authorization.
     */
    private void executeApprovedAction(
            UserApprovalRequest request
    ) {

        User user =
                request.getUser();


        UserApprovalAction action =
                request.getActionType();


        if (action == null) {

            throw new IllegalStateException(
                    "Approval request has no action"
            );
        }


        /*
         * Permission requests target a role, not a user account.
         * All other actions require a target user.
         */
        boolean isPermissionAction =
                action == UserApprovalAction.ASSIGN_PERMISSION
                        ||
                        action == UserApprovalAction.REMOVE_PERMISSION;


        if (user == null
                && !isPermissionAction) {

            throw new IllegalStateException(
                    "Approval request has no target user"
            );
        }


        switch (action) {


            /*
             * ====================================================
             * ACTIVATE USER
             * ====================================================
             */
            case ACTIVATE_USER -> {

                if (user.getStatus()
                        == UserStatus.ACTIVE) {

                    throw new IllegalStateException(
                            "User account is already active"
                    );
                }


                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "Locked account must be unlocked before activation"
                    );
                }


                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "Suspended account must be unsuspended before activation"
                    );
                }


                user.setStatus(
                        UserStatus.ACTIVE
                );

                user.setUpdatedAt(
                        LocalDateTime.now()
                );
            }


            /*
             * ====================================================
             * DEACTIVATE USER
             * ====================================================
             */
            case USER_DEACTIVATE -> {

                preventAdminModification(user);


                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "User account is already inactive"
                    );
                }


                user.setStatus(
                        UserStatus.INACTIVE
                );

                user.setUpdatedAt(
                        LocalDateTime.now()
                );


                /*
                 * Immediately revoke authentication.
                 */
                revokeUserAuthentication(
                        user
                );
            }


            /*
             * ====================================================
             * SUSPEND USER
             * ====================================================
             */
            case USER_SUSPEND -> {

                preventAdminModification(user);


                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "User account is already suspended"
                    );
                }


                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "Inactive account cannot be suspended"
                    );
                }


                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "Locked account must be unlocked before suspension"
                    );
                }


                user.setStatus(
                        UserStatus.SUSPENDED
                );


                user.setSuspendedAt(
                        ZonedDateTime.now()
                );


                user.setSuspendedBy(
                        request.getMaker()
                                .getUsername()
                );


                user.setUpdatedAt(
                        LocalDateTime.now()
                );


                /*
                 * Immediately revoke authentication.
                 */
                revokeUserAuthentication(
                        user
                );
            }


            /*
             * ====================================================
             * UNSUSPEND USER
             * ====================================================
             */
            case USER_UNSUSPEND -> {

                if (user.getStatus()
                        != UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "User account is not suspended"
                    );
                }


                user.setStatus(
                        UserStatus.ACTIVE
                );


                user.setSuspendedAt(
                        null
                );


                user.setSuspendedBy(
                        null
                );


                user.setUpdatedAt(
                        LocalDateTime.now()
                );
            }


            /*
             * ====================================================
             * LOCK USER
             * ====================================================
             */
            case USER_LOCK -> {

                preventAdminModification(user);


                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "User account is already locked"
                    );
                }


                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "Inactive account cannot be locked"
                    );
                }


                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "Suspended account cannot be locked"
                    );
                }


                user.setStatus(
                        UserStatus.LOCKED
                );


                user.setLockedAt(
                        ZonedDateTime.now()
                );


                user.setLockedBy(
                        request.getMaker()
                                .getUsername()
                );


                user.setLockReason(
                        request.getReason() != null
                                && !request.getReason().isBlank()
                                ? request.getReason().trim()
                                : "Locked through approval workflow"
                );


                /*
                 * Ensure the lock has a duration for the
                 * auto-unlock timer (default when absent).
                 */
                if (user.getLockDurationMinutes() == null) {

                    user.setLockDurationMinutes(
                            (int) Math.min(
                                    lockDurationMinutes,
                                    lockMaxMinutes
                            )
                    );
                }


                user.setUpdatedAt(
                        LocalDateTime.now()
                );


                /*
                 * Immediately revoke authentication.
                 */
                revokeUserAuthentication(
                        user
                );
            }


            /*
             * ====================================================
             * ASSIGN ROLE
             * ====================================================
             *
             * Roles were stored in the approval request when
             * the Maker created the request.
             *
             * They are only applied now after authorization.
             */
            case ASSIGN_ROLE -> {

                preventAdminModification(user);


                assignRequestedRoles(
                        request
                );


                user.setUpdatedAt(
                        LocalDateTime.now()
                );
            }

            case ASSIGN_PERMISSION -> {

                assignPermissionsToRole(
                        request
                );
            }


            case REMOVE_PERMISSION -> {

                removePermissionFromRole(
                        request
                );
            }

            case USER_CREATE -> {

                /*
                 * Full creation flow: resolve the roles and
                 * permissions stored in the request, validate them,
                 * apply the roles and activate the account.
                 */
                if (
                        request.getRoles() != null
                                && !request.getRoles().isEmpty()
                                && request.getPermissions() != null
                                && !request.getPermissions().isEmpty()
                ) {

                    approveUserCreation(
                            request
                    );

                    break;
                }


                /*
                 * Fallback for USER_CREATE requests that carry no
                 * roles/permissions (created through the general
                 * request endpoint): just activate the account.
                 */
                if (user.getStatus() != UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "User must be inactive before creation approval"
                    );
                }

                user.setStatus(
                        UserStatus.ACTIVE
                );

                user.setUpdatedAt(
                        LocalDateTime.now()
                );
            }


            /*
             * ====================================================
             * UPDATE USER
             * ====================================================
             *
             * Applies the staged profile changes only after
             * AUTHORIZER/ADMIN approval.
             */
            case USER_UPDATE -> {

                preventAdminModification(user);

                applyUpdateFromPayload(
                        request
                );

                user.setUpdatedAt(
                        LocalDateTime.now()
                );
            }


            /*
             * ====================================================
             * UNSUPPORTED ACTION
             * ====================================================
             *
             * PASSWORD_RESET intentionally ends up here.
             */
            default -> throw new IllegalArgumentException(
                    "Unsupported approval action: "
                            + action
            );
        }


        /*
         * Permission actions target a role and have no target user.
         */
        if (user != null) {

            userRepository.save(
                    user
            );
        }
    }



    /**
     * ============================================================
     * ASSIGN PERMISSIONS TO ROLE
     * ============================================================
     *
     * Called ONLY after AUTHORIZER approval.
     */
    private void assignPermissionsToRole(
            UserApprovalRequest request
    ) {

        if (request.getPermissions() == null
                || request.getPermissions().isEmpty()) {

            throw new IllegalStateException(
                    "No permissions were supplied"
            );
        }

        /*
         * The role ID should be stored in the approval request.
         */
        if (request.getRoles() == null) {

            throw new IllegalStateException(
                    "Approval request has no target role"
            );
        }

        String roleName =
                request.getRoles()
                        .iterator()
                        .next();


        Role role =
                roleRepository
                        .findByNameIgnoreCase(roleName)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Role not found: " + roleName
                                )
                        );

        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "ADMIN role cannot be modified through this workflow"
            );
        }

        if (role.getPermissions() == null) {

            role.setPermissions(
                    new HashSet<>()
            );
        }

        Set<Permission> permissions =
                request.getPermissions()
                        .stream()
                        .map(String::trim)
                        .filter(
                                name -> !name.isBlank()
                        )
                        .map(
                                name ->
                                        permissionRepository
                                                .findByNameIgnoreCase(
                                                        name
                                                )
                                                .orElseThrow(() ->
                                                        new IllegalArgumentException(
                                                                "Permission not found: "
                                                                        + name
                                                        )
                                                )
                        )
                        .collect(Collectors.toSet());

        role.getPermissions()
                .addAll(permissions);

        roleRepository.save(role);

        createAuditLog(
                request.getAuthorizer().getUsername(),
                "ASSIGN_ROLE_PERMISSIONS",
                "Assigned permissions "
                        + request.getPermissions()
                        + " to role "
                        + role.getName()
        );
    }



    /**
     * ============================================================
     * REMOVE PERMISSION FROM ROLE
     * ============================================================
     *
     * Removes exactly one requested permission from a role.
     *
     * Called ONLY after AUTHORIZER approval.
     */
    private void removePermissionFromRole(
            UserApprovalRequest request
    ) {

        if (request.getPermissions() == null
                || request.getPermissions().size() != 1) {

            throw new IllegalStateException(
                    "Exactly one permission must be supplied for removal"
            );
        }

        if (request.getRoles() == null) {

            throw new IllegalStateException(
                    "Approval request has no target role"
            );
        }

        String roleName =
                request.getRoles()
                        .iterator()
                        .next();

        String permissionName =
                request.getPermissions()
                        .iterator()
                        .next();

        Role role =
                roleRepository
                        .findByNameIgnoreCase(roleName)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Role not found: " + roleName
                                )
                        );

        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "ADMIN role cannot be modified through this workflow"
            );
        }

        Permission permission =
                permissionRepository
                        .findByNameIgnoreCase(
                                permissionName
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Permission not found: "
                                                + permissionName
                                )
                        );

        if (!role.getPermissions().contains(permission)) {
            throw new IllegalStateException(
                    "Permission "
                            + permissionName
                            + " is not assigned to role "
                            + roleName
            );
        }

        /*
         * Remove ONLY this permission.
         *
         * Other permissions remain untouched.
         */
        role.getPermissions()
                .remove(permission);

        roleRepository.save(role);

        createAuditLog(
                request.getAuthorizer().getUsername(),
                "REMOVE_ROLE_PERMISSION",
                "Removed permission "
                        + permissionName
                        + " from role "
                        + role.getName()
        );
    }


    /**
     * ============================================================
     * ASSIGN REQUESTED ROLES
     * ============================================================
     *
     * Adds the requested roles to the user's existing roles.
     *
     * It does NOT replace the user's existing roles.
     *
     * CREATOR is NOT automatically assigned.
     */
    private void assignRequestedRoles(
            UserApprovalRequest request
    ) {

        if (request.getRoles() == null
                || request.getRoles().isEmpty()) {

            throw new IllegalStateException(
                    "No roles were supplied for role assignment"
            );
        }


        Set<Role> roles =
                request.getRoles()
                        .stream()
                        .map(String::trim)
                        .filter(
                                name ->
                                        !name.isBlank()
                        )
                        .map(
                                roleName ->
                                        roleRepository
                                                .findByNameIgnoreCase(
                                                        roleName
                                                )
                                                .orElseThrow(() ->
                                                        new IllegalArgumentException(
                                                                "Role not found: "
                                                                        + roleName
                                                        )
                                                )
                        )
                        .collect(
                                Collectors.toSet()
                        );


        if (roles.isEmpty()) {

            throw new IllegalStateException(
                    "No valid roles were supplied for role assignment"
            );
        }


        /*
         * IMPORTANT:
         *
         * addAll() preserves the user's existing roles.
         *
         * Example:
         *
         * Existing:
         *     CREATOR
         *
         * Requested:
         *     CONTROL
         *
         * Result:
         *     CREATOR
         *     CONTROL
         */
        if (request.getUser().getRoles() == null) {

            request.getUser().setRoles(
                    new HashSet<>()
            );
        }


        request.getUser()
                .getRoles()
                .addAll(roles);
    }


    /**
     * ============================================================
     * RESOLVE ROLE NAMES
     * ============================================================
     *
     * Validates role names before creating the approval request.
     */
    private Set<String> resolveRoleNames(
            Set<String> requestedRoleNames
    ) {

        if (requestedRoleNames == null
                || requestedRoleNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "At least one role must be provided"
            );
        }


        return requestedRoleNames
                .stream()
                .map(String::trim)
                .filter(
                        name ->
                                !name.isBlank()
                )
                .map(
                        roleName -> {

                            roleRepository
                                    .findByNameIgnoreCase(
                                            roleName
                                    )
                                    .orElseThrow(() ->
                                            new IllegalArgumentException(
                                                    "Role not found: "
                                                            + roleName
                                            )
                                    );


                            return roleName;
                        }
                )
                .collect(
                        Collectors.toSet()
                );
    }


    /**
     * ============================================================
     * VALIDATE ACTION
     * ============================================================
     *
     * Explicitly prevents PASSWORD_RESET from entering
     * the Maker/Checker workflow.
     */
    private void validateAction(
            UserApprovalAction actionType
    ) {

        if (actionType == null) {

            throw new IllegalArgumentException(
                    "Approval action is required"
            );
        }


        if (actionType.name()
                .equalsIgnoreCase("PASSWORD_RESET")) {

            throw new IllegalArgumentException(
                    "PASSWORD_RESET is not supported by the user approval workflow"
            );
        }


        boolean supported =
                switch (actionType.name()) {

                    case "ACTIVATE_USER",
                         "USER_DEACTIVATE",
                         "USER_SUSPEND",
                         "USER_UNSUSPEND",
                         "USER_LOCK",
                         "USER_CREATE",
                         "ASSIGN_ROLE" -> true;

                    default -> false;
                };


        if (!supported) {

            throw new IllegalArgumentException(
                    "Unsupported approval action: "
                            + actionType
            );
        }
    }


    /**
     * ============================================================
     * VALIDATE REQUESTED ACTION
     * ============================================================
     *
     * Checks the target user's current status before the request
     * is created and again before it is approved.
     */
    private void validateRequestedAction(
            User user,
            UserApprovalAction actionType
    ) {

        if (user == null) {

            throw new IllegalArgumentException(
                    "User cannot be null"
            );
        }


        if (actionType == null) {

            throw new IllegalArgumentException(
                    "Approval action cannot be null"
            );
        }


        switch (actionType) {

            case ACTIVATE_USER -> {

                if (user.getStatus()
                        == UserStatus.ACTIVE) {

                    throw new IllegalStateException(
                            "User account is already active"
                    );
                }


                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "Locked account must be unlocked before activation"
                    );
                }


                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "Suspended account must be unsuspended before activation"
                    );
                }
            }


            case USER_CREATE -> {

                if (user.getStatus() != UserStatus.INACTIVE) {
                    throw new IllegalStateException(
                            "User creation request is no longer pending"
                    );
                }
            }


            case USER_DEACTIVATE -> {

                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "User account is already inactive"
                    );
                }
            }


            case USER_SUSPEND -> {

                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "User account is already suspended"
                    );
                }


                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "Inactive account cannot be suspended"
                    );
                }


                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "Locked account must be unlocked before suspension"
                    );
                }
            }


            case USER_UNSUSPEND -> {

                if (user.getStatus()
                        != UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "User account is not suspended"
                    );
                }
            }


            case USER_LOCK -> {

                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "User account is already locked"
                    );
                }


                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "Inactive account cannot be locked"
                    );
                }


                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "Suspended account cannot be locked"
                    );
                }
            }


            case ASSIGN_ROLE,
                 ASSIGN_PERMISSION,
                 REMOVE_PERMISSION,
                 USER_UPDATE -> {
                // No user-status restriction for these actions.
            }


            default -> throw new IllegalArgumentException(
                    "Unsupported approval action: "
                            + actionType
            );
        }
    }


    /**
     * ============================================================
     * HAS PENDING PERMISSION REQUEST
     * ============================================================
     *
     * Checks whether a pending ASSIGN_PERMISSION / REMOVE_PERMISSION
     * request already exists for the given role.
     */
    private boolean hasPendingPermissionRequest(
            Role role,
            UserApprovalAction actionType
    ) {

        return approvalRequestRepository
                .findByActionTypeAndStatus(
                        actionType,
                        ApprovalStatus.PENDING
                )
                .stream()
                .anyMatch(
                        pendingRequest ->
                                pendingRequest.getRoles() != null
                                        && pendingRequest.getRoles()
                                        .contains(role.getName())
                );
    }


    /**
     * ============================================================
     * APPLY UPDATE FROM PAYLOAD
     * ============================================================
     *
     * Called ONLY after AUTHORIZER/ADMIN approval of a USER_UPDATE
     * request.
     *
     * Applies the staged profile changes to the target user.
     *
     * Status changes are NOT permitted through this path; account
     * status transitions must use their dedicated approval actions.
     */
    private void applyUpdateFromPayload(
            UserApprovalRequest request
    ) {

        if (request.getPayloadJson() == null
                || request.getPayloadJson().isBlank()) {

            throw new IllegalStateException(
                    "Approval request has no update payload"
            );
        }


        UpdateUserRequest updateRequest;

        try {

            updateRequest =
                    objectMapper.readValue(
                            request.getPayloadJson(),
                            UpdateUserRequest.class
                    );

        } catch (JsonProcessingException exception) {

            throw new IllegalStateException(
                    "Unable to parse update payload",
                    exception
            );
        }


        if (updateRequest == null) {

            throw new IllegalStateException(
                    "Invalid update payload"
            );
        }


        User user =
                request.getUser();


        /*
         * Re-validate username uniqueness before applying.
         */
        if (updateRequest.getUsername() != null
                && !updateRequest.getUsername().trim()
                .equalsIgnoreCase(user.getUsername())) {

            String newUsername =
                    updateRequest.getUsername().trim();

            userRepository.findByUsername(newUsername)
                    .filter(
                            existing ->
                                    !existing.getId()
                                            .equals(user.getId())
                    )
                    .ifPresent(
                            existing -> {
                                throw new IllegalArgumentException(
                                        "Username already exists"
                                );
                            }
                    );
        }


        /*
         * Re-validate email uniqueness before applying.
         */
        if (updateRequest.getEmail() != null
                && !updateRequest.getEmail().trim()
                .equalsIgnoreCase(user.getEmail())) {

            String newEmail =
                    updateRequest.getEmail().trim();

            userRepository.findByEmail(newEmail)
                    .filter(
                            existing ->
                                    !existing.getId()
                                            .equals(user.getId())
                    )
                    .ifPresent(
                            existing -> {
                                throw new IllegalArgumentException(
                                        "Email already exists"
                                );
                            }
                    );
        }


        /*
         * Status cannot be changed through a USER_UPDATE request.
         */
        if (updateRequest.getStatus() != null
                && updateRequest.getStatus() != user.getStatus()) {

            throw new IllegalStateException(
                    "Account status cannot be changed through an update request"
            );
        }


        /*
         * Apply profile fields only.
         */
        if (updateRequest.getFirstName() != null) {

            user.setFirstName(
                    updateRequest.getFirstName().trim()
            );
        }

        if (updateRequest.getLastName() != null) {

            user.setLastName(
                    updateRequest.getLastName().trim()
            );
        }

        if (updateRequest.getUsername() != null) {

            user.setUsername(
                    updateRequest.getUsername().trim()
            );
        }

        if (updateRequest.getEmail() != null) {

            user.setEmail(
                    updateRequest.getEmail().trim()
            );
        }
    }


    /**
     * ============================================================
     * PREVENT DUPLICATE PENDING REQUEST
     * ============================================================
     */
    private void preventDuplicatePendingRequest(
            User user,
            UserApprovalAction actionType
    ) {

        boolean pending =
                approvalRequestRepository
                        .existsByUserAndActionTypeAndStatus(
                                user,
                                actionType,
                                ApprovalStatus.PENDING
                        );


        if (pending) {

            throw new IllegalStateException(
                    "A pending approval request already exists for this user and action"
            );
        }
    }


    /**
     * ============================================================
     * PREVENT SELF REQUEST
     * ============================================================
     */
    private void preventSelfRequest(
            User maker,
            User targetUser
    ) {

        if (maker == null
                || targetUser == null) {

            throw new IllegalArgumentException(
                    "Maker and target user are required"
            );
        }


        if (maker.getId()
                .equals(targetUser.getId())) {

            throw new AccessDeniedException(
                    "You cannot create an approval request for yourself"
            );
        }
    }


    /**
     * ============================================================
     * PREVENT MAKER AUTHORIZATION
     * ============================================================
     */
    private void preventMakerAuthorization(
            UserApprovalRequest request,
            User authorizer
    ) {

        if (request.getMaker() != null
                && authorizer != null
                && request.getMaker()
                .getId()
                .equals(authorizer.getId())) {

            throw new AccessDeniedException(
                    "The maker cannot authorize their own request"
            );
        }
    }


    /**
     * ============================================================
     * PREVENT ADMIN MODIFICATION
     * ============================================================
     */
    private void preventAdminModification(
            User user
    ) {

        if (user == null) {

            throw new IllegalArgumentException(
                    "User cannot be null"
            );
        }


        if (isAdmin(user)) {

            throw new AccessDeniedException(
                    "Administrator account cannot be modified through this workflow"
            );
        }
    }


    /**
     * ============================================================
     * CHECK ADMIN ROLE
     * ============================================================
     */
    private boolean isAdmin(
            User user
    ) {

        if (user == null
                || user.getRoles() == null
                || user.getRoles().isEmpty()) {

            return false;
        }


        return user.getRoles()
                .stream()
                .anyMatch(
                        role ->
                                role != null
                                        && role.getName() != null
                                        && "ADMIN".equalsIgnoreCase(
                                        role.getName()
                                )
                );
    }


    /**
     * ============================================================
     * REVOKE USER AUTHENTICATION
     * ============================================================
     *
     * Revokes both JWT tokens and refresh tokens.
     */
    private void revokeUserAuthentication(
            User user
    ) {

        /*
         * Revoke JWT tokens.
         */
        var tokens =
                jwtTokenRepository
                        .findAllByUser(user);


        if (tokens != null
                && !tokens.isEmpty()) {

            tokens.forEach(
                    token ->
                            token.setRevoked(true)
            );


            jwtTokenRepository.saveAll(
                    tokens
            );
        }


        /*
         * Revoke refresh tokens.
         */
        refreshTokenService
                .revokeAllUserTokens(
                        user.getId()
                );
    }


    /**
     * ============================================================
     * FIND USER
     * ============================================================
     */
    private User findUser(
            Long userId
    ) {

        return userRepository
                .findById(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found: "
                                        + userId
                        )
                );
    }


    /**
     * ============================================================
     * FIND PENDING REQUEST
     * ============================================================
     */
    @Transactional(readOnly = true)
    public UserApprovalRequest findPendingRequest(
            Long requestId
    ) {

        if (requestId == null) {

            throw new IllegalArgumentException(
                    "Approval request ID cannot be null"
            );
        }


        return approvalRequestRepository
                .findByIdAndStatus(
                        requestId,
                        ApprovalStatus.PENDING
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Approval request not found or has already been processed"
                        )
                );
    }


    /**
     * ============================================================
     * GET AUTHENTICATED USER
     * ============================================================
     */
    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (authentication == null
                || !authentication.isAuthenticated()) {

            throw new AccessDeniedException(
                    "User is not authenticated"
            );
        }


        String username =
                authentication.getName();


        if (username == null
                || username.isBlank()) {

            throw new AccessDeniedException(
                    "Authenticated username is unavailable"
            );
        }


        return userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "Authenticated user not found"
                        )
                );
    }


    /**
     * ============================================================
     * VALIDATE USER ID
     * ============================================================
     */
    private void validateUserId(
            Long userId
    ) {

        if (userId == null) {

            throw new IllegalArgumentException(
                    "User ID cannot be null"
            );
        }
    }


    /**
     * ============================================================
     * VALIDATE REASON
     * ============================================================
     */
    private void validateReason(
            String reason
    ) {

        if (reason == null
                || reason.isBlank()) {

            throw new IllegalArgumentException(
                    "Reason is required"
            );
        }


        if (reason.trim().length() > 1000) {

            throw new IllegalArgumentException(
                    "Reason cannot exceed 1000 characters"
            );
        }
    }


    /**
     * ============================================================
     * NORMALIZE AUTHORZIER REMARK
     * ============================================================
     */
    private String normalizeRemark(
            String remark
    ) {

        if (remark == null
                || remark.isBlank()) {

            return null;
        }


        String normalized =
                remark.trim();


        if (normalized.length() > 1000) {

            throw new IllegalArgumentException(
                    "Authorizer remark cannot exceed 1000 characters"
            );
        }


        return normalized;
    }


    /**
     * ============================================================
     * CREATE AUDIT LOG
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