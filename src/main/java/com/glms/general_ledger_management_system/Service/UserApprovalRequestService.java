package com.glms.general_ledger_management_system.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.Model.postgres.ApprovalStatus;
import com.glms.general_ledger_management_system.Model.postgres.AuditLog;
import com.glms.general_ledger_management_system.Model.postgres.Ledger;
import com.glms.general_ledger_management_system.Model.postgres.LedgerStatus;
import com.glms.general_ledger_management_system.Model.postgres.Role;
import com.glms.general_ledger_management_system.Model.postgres.User;
import com.glms.general_ledger_management_system.Model.postgres.UserApprovalAction;
import com.glms.general_ledger_management_system.Model.postgres.UserApprovalRequest;
import com.glms.general_ledger_management_system.Model.postgres.UserStatus;

import com.glms.general_ledger_management_system.Model.postgres.Permission;
import com.glms.general_ledger_management_system.Repository.postgres.*;

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

    private final LedgerRepository ledgerRepository;


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
                    "Role assignments must be submitted through the dedicated role-assignment form."
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
                            + " minutes - please pick a shorter window."
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
                    "Please provide the user ID."
            );
        }


        if (roleNames == null || roleNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select at least one role to continue."
            );
        }


        if (reason == null || reason.isBlank()) {

            throw new IllegalArgumentException(
                    "Please provide a reason for this request."
            );
        }


        User targetUser =
                userRepository.findById(userId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "We couldn't find the user: " + userId
                                )
                        );


        User maker =
                getAuthenticatedUser();


        /*
         * Maker cannot assign roles to himself.
         */
        if (maker.getId().equals(targetUser.getId())) {

            throw new AccessDeniedException(
                    "You can't assign roles to yourself through this workflow - please ask a colleague to handle it."
            );
        }


        /*
         * ADMIN accounts cannot be modified through
         * the normal Maker-Checker workflow.
         */
        if (isAdmin(targetUser)) {

            throw new AccessDeniedException(
                    "Administrator accounts are protected and can't be changed through the approval workflow."
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
                    "None of the roles you selected are valid - please check and try again."
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
                                    "We couldn't find the role: " + roleName
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
                    "This user already has a pending role-assignment request - please wait for it to be resolved first."
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
                    "Please provide the role ID."
            );
        }

        if (permissionNames == null
                || permissionNames.isEmpty()) {

            throw new IllegalArgumentException(
                    "Please select at least one permission to continue."
            );
        }

        validateReason(reason);

        User maker = getAuthenticatedUser();

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "We couldn't find the role: " + roleId
                                )
                        );

        /*
         * ADMIN role should not be modified through the
         * normal Maker-Checker workflow.
         */
        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "The ADMIN role's permissions are protected and can't be changed through the approval workflow."
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
                    "None of the permissions you selected are valid - please check and try again."
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
                                    "We couldn't find the permission: "
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
                    "There's already a pending permission request for the "
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
                    "Please provide the role ID."
            );
        }

        if (permissionName == null
                || permissionName.isBlank()) {

            throw new IllegalArgumentException(
                    "Please provide the permission name."
            );
        }

        validateReason(reason);

        User maker =
                getAuthenticatedUser();

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "We couldn't find the role: "
                                                + roleId
                                )
                        );

        /*
         * ADMIN protection.
         */
        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "The ADMIN role's permissions are protected and can't be changed through the approval workflow."
            );
        }

        Permission permission =
                permissionRepository
                        .findByNameIgnoreCase(
                                permissionName.trim()
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "We couldn't find the permission: "
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
                    "The permission '"
                            + permissionName
                            + "' isn't currently assigned to the "
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
                    "There's already a pending permission-removal request for the "
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
                        ||
                        request.getActionType()
                        == UserApprovalAction.LEDGER_CREATE
        ) {

            if (request.getRoles() == null
                    || request.getRoles().isEmpty()) {

                throw new IllegalStateException(
                        "This request doesn't specify a target role - please create it again."
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
                    "This request doesn't specify a target user - please create it again."
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
                    "This request doesn't specify a target user - please create it again."
            );
        }


        /*
         * User must still be inactive.
         */
        if (user.getStatus()
                != UserStatus.INACTIVE) {

            throw new IllegalStateException(
                    "This account is no longer awaiting activation, so the creation request can't be approved anymore."
            );
        }


        /*
         * ADMIN must never be created through this
         * Maker-Checker workflow.
         */
        if (isAdmin(user)) {

            throw new AccessDeniedException(
                    "Administrator accounts can't be created through the approval workflow."
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
                    "The creation request didn't include any roles - please create it again."
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
                                                        "This role no longer exists: "
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
                    "The creation request didn't include any permissions - please create it again."
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
                                                        "This permission no longer exists: "
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
                        "The permission '"
                                + permissionName
                                + "' isn't available on the selected roles"
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
                    "Please add a remark explaining why you're rejecting this request."
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
         * If this is a USER_CREATE request, mark the
         * target user as REJECTED so they no longer
         * appear as pending/INACTIVE.
         */
        if (request.getActionType()
                == UserApprovalAction.USER_CREATE
                && request.getUser() != null) {

            User targetUser = request.getUser();

            if (targetUser.getStatus()
                    == UserStatus.INACTIVE) {

                targetUser.setStatus(
                        UserStatus.REJECTED
                );

                targetUser.setUpdatedAt(
                        LocalDateTime.now()
                );

                userRepository.save(targetUser);
            }
        }


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
                    "Only the person who created this request (or an administrator) can cancel it."
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
                    "This request doesn't specify an action - please create it again."
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
                    "This request doesn't specify a target user - please create it again."
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
                            "Good news - this account is already active, so there's nothing to do."
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
                            "This account is already inactive - nothing to do here."
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
                            "This account isn't suspended, so there's nothing to unsuspend."
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
                            "This account is already locked - nothing to do here."
                    );
                }


                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "Inactive accounts can't be locked - please activate it first."
                    );
                }


                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "Suspended accounts can't be locked - please unsuspend it first."
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
                            "This account is no longer awaiting activation, so the creation approval can't proceed."
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
             * DELETE USER
             * ====================================================
             *
             * Soft-delete: status → DELETED.
             * All tokens revoked, all pending requests
             * for this user cancelled.
             */
            case USER_DELETE -> {

                if (user.getStatus()
                        == UserStatus.DELETED) {

                    throw new IllegalStateException(
                            "This account has already been deleted."
                    );
                }


                user.setStatus(
                        UserStatus.DELETED
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


                /*
                 * Cancel all other pending requests
                 * for this user.
                 */
                cancelPendingRequestsForUser(
                        user
                );
            }


            /*
             * ====================================================
             * LEDGER CREATE
             * ====================================================
             *
             * When a ledger creation request is approved,
             * the ledger status changes from PROCESSING to SUBMITTED.
             *
             * PROCESSING = submitted by maker, awaiting approval
             * SUBMITTED  = approved, active and in the DB
             */
            case LEDGER_CREATE -> {

                Ledger ledger = findLedgerFromRequest(request);

                if (ledger.getStatus() == LedgerStatus.SUBMITTED) {
                    throw new IllegalStateException(
                            "This ledger has already been submitted and approved — nothing to do here."
                    );
                }

                if (ledger.getStatus() != LedgerStatus.PROCESSING) {
                    throw new IllegalStateException(
                            "This ledger is not in processing status — current status: "
                                    + ledger.getStatus()
                    );
                }

                ledger.setStatus(LedgerStatus.SUBMITTED);
                ledger.setUpdatedAt(LocalDateTime.now());

                ledgerRepository.save(ledger);
            }


            /*
             * ====================================================
             * UNSUPPORTED ACTION
             * ====================================================
             *
             * PASSWORD_RESET intentionally ends up here.
             */
            default -> throw new IllegalArgumentException(
                    "This approval action isn't supported: "
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
                    "The request didn't include any permissions - please create it again."
            );
        }

        /*
         * The role ID should be stored in the approval request.
         */
        if (request.getRoles() == null) {

            throw new IllegalStateException(
                    "This request doesn't specify a target role - please create it again."
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
                                        "We couldn't find the role: " + roleName
                                )
                        );

        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "The ADMIN role's permissions are protected and can't be changed through the approval workflow."
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
                                                                "We couldn't find the permission: "
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
                    "Please choose exactly one permission to remove."
            );
        }

        if (request.getRoles() == null) {

            throw new IllegalStateException(
                    "This request doesn't specify a target role - please create it again."
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
                                        "We couldn't find the role: " + roleName
                                )
                        );

        if ("ADMIN".equalsIgnoreCase(role.getName())) {

            throw new AccessDeniedException(
                    "The ADMIN role's permissions are protected and can't be changed through the approval workflow."
            );
        }

        Permission permission =
                permissionRepository
                        .findByNameIgnoreCase(
                                permissionName
                        )
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "We couldn't find the permission: "
                                                + permissionName
                                )
                        );

        if (!role.getPermissions().contains(permission)) {
            throw new IllegalStateException(
                    "The permission '"
                            + permissionName
                            + "' isn't currently assigned to the "
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
                    "The request didn't include any roles - please create it again."
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
                                                                "We couldn't find the role: "
                                                                        + roleName
                                                        )
                                                )
                        )
                        .collect(
                                Collectors.toSet()
                        );


        if (roles.isEmpty()) {

            throw new IllegalStateException(
                    "None of the roles in the request are valid - please create it again."
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
                    "Please select at least one role to continue."
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
                                                    "We couldn't find the role: "
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
                    "Please specify the approval action."
            );
        }


        if (actionType.name()
                .equalsIgnoreCase("PASSWORD_RESET")) {

            throw new IllegalArgumentException(
                    "Password resets don't go through the approval workflow - please use the password reset flow instead."
            );
        }


        boolean supported =
                switch (actionType.name()) {

                    case "ACTIVATE_USER",
                         "USER_DEACTIVATE",
                         "USER_DELETE",
                         "USER_SUSPEND",
                         "USER_UNSUSPEND",
                         "USER_LOCK",
                         "USER_CREATE",
                         "ASSIGN_ROLE",
                         "LEDGER_CREATE" -> true;

                    default -> false;
                };


        if (!supported) {

            throw new IllegalArgumentException(
                    "This approval action isn't supported: "
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
                    "Please provide a valid user account."
            );
        }


        if (actionType == null) {

            throw new IllegalArgumentException(
                    "Please specify the approval action."
            );
        }


        /*
         * DELETED users cannot be acted upon.
         */
        if (user.getStatus() == UserStatus.DELETED) {

            throw new IllegalStateException(
                    "This account has been permanently deleted and can no longer be modified."
            );
        }


        /*
         * REJECTED users cannot be acted upon.
         */
        if (user.getStatus() == UserStatus.REJECTED) {

            throw new IllegalStateException(
                    "This account was not approved and can no longer be modified through this workflow."
            );
        }


        switch (actionType) {

            case ACTIVATE_USER -> {

                if (user.getStatus()
                        == UserStatus.ACTIVE) {

                    throw new IllegalStateException(
                            "Good news - this account is already active, so there's nothing to do."
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
            }


            case USER_CREATE -> {

                if (user.getStatus() != UserStatus.INACTIVE) {
                    throw new IllegalStateException(
                            "This creation request is no longer pending - it may have already been processed."
                    );
                }
            }


            case USER_DEACTIVATE -> {

                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "This account is already inactive - nothing to do here."
                    );
                }
            }


            case USER_DELETE -> {

                if (user.getStatus()
                        == UserStatus.DELETED) {

                    throw new IllegalStateException(
                            "This account has already been deleted."
                    );
                }

                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "This account is locked - it needs to be unlocked before it can be deleted."
                    );
                }

                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "This account is suspended - it needs to be unsuspended before it can be deleted."
                    );
                }
            }


            case USER_SUSPEND -> {

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
            }


            case USER_UNSUSPEND -> {

                if (user.getStatus()
                        != UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "This account isn't suspended, so there's nothing to unsuspend."
                    );
                }
            }


            case USER_LOCK -> {

                if (user.getStatus()
                        == UserStatus.LOCKED) {

                    throw new IllegalStateException(
                            "This account is already locked - nothing to do here."
                    );
                }


                if (user.getStatus()
                        == UserStatus.INACTIVE) {

                    throw new IllegalStateException(
                            "Inactive accounts can't be locked - please activate it first."
                    );
                }


                if (user.getStatus()
                        == UserStatus.SUSPENDED) {

                    throw new IllegalStateException(
                            "Suspended accounts can't be locked - please unsuspend it first."
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
                    "This approval action isn't supported: "
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
                    "This update request has no details to apply - please create it again."
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
                    "We couldn't read the update details - please create the request again.",
                    exception
            );
        }


        if (updateRequest == null) {

            throw new IllegalStateException(
                    "The update details in this request are invalid - please create it again."
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
                                        "That username is already taken - please try a different one."
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
                                        "That email is already registered to another account."
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
                    "Account status can't be changed through a profile update - please use the dedicated action instead."
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
                    "There's already a pending request for this action on this user - please wait for it to be resolved first."
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
                    "Both the maker and the target user are required for this request."
            );
        }


        if (maker.getId()
                .equals(targetUser.getId())) {

            throw new AccessDeniedException(
                    "You can't create an approval request for yourself - please ask a colleague to handle it."
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
                    "The person who created this request can't approve it - it needs a second pair of eyes."
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
                    "Please provide a valid user account."
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
     * CANCEL PENDING REQUESTS FOR USER
     * ============================================================
     *
     * When a user is deleted, all their pending
     * approval requests are automatically cancelled
     * so they no longer appear in queues.
     */
    private void cancelPendingRequestsForUser(
            User user
    ) {

        List<UserApprovalRequest> pendingRequests =
                approvalRequestRepository
                        .findByUserAndStatus(
                                user,
                                ApprovalStatus.PENDING
                        );

        for (UserApprovalRequest pending : pendingRequests) {

            pending.setStatus(
                    ApprovalStatus.CANCELLED
            );

            pending.setAuthorizerRemark(
                    "Cancelled — user account was deleted"
            );

            approvalRequestRepository.save(pending);
        }
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
                                "We couldn't find the user: "
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
                    "Please provide the approval request ID."
            );
        }


        return approvalRequestRepository
                .findByIdAndStatus(
                        requestId,
                        ApprovalStatus.PENDING
                )
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "We couldn't find a pending request with that ID - it may have already been processed."
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
     * VALIDATE USER ID
     * ============================================================
     */
    private void validateUserId(
            Long userId
    ) {

        if (userId == null) {

            throw new IllegalArgumentException(
                    "Please provide the user ID."
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
                    "Please provide a reason for this request."
            );
        }


        if (reason.trim().length() > 1000) {

            throw new IllegalArgumentException(
                    "Please keep the reason under 1000 characters."
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
                    "Please keep your remark under 1000 characters."
            );
        }


        return normalized;
    }


    /**
     * ============================================================
     * FIND LEDGER FROM APPROVAL REQUEST
     * ============================================================
     *
     * LEDGER_CREATE requests store the ledger code in the
     * reason field. This helper retrieves the ledger entity.
     */
    private Ledger findLedgerFromRequest(
            UserApprovalRequest request
    ) {

        /*
         * The ledger code is embedded in the reason field
         * during creation. Parse it out.
         */
        String reason = request.getReason();

        if (reason == null || !reason.contains(": ")) {
            throw new IllegalStateException(
                    "This request doesn't contain ledger information — please create it again."
            );
        }

        String ledgerCode = reason.substring(
                reason.indexOf(": ") + 2
        ).trim();

        return ledgerRepository
                .findByLedgerCodeAndDeletedFalse(ledgerCode)
                .orElseThrow(() ->
                        new IllegalStateException(
                                "The ledger with code " + ledgerCode + " no longer exists."
                        )
                );
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