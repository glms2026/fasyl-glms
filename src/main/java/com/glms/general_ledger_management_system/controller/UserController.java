package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.user.AssignRoleRequest;
import com.glms.general_ledger_management_system.DTO.user.CreateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UserActionRequest;
import com.glms.general_ledger_management_system.DTO.user.UserApprovalRequestResponse;
import com.glms.general_ledger_management_system.DTO.user.UserResponse;
import com.glms.general_ledger_management_system.Model.UserApprovalAction;
import com.glms.general_ledger_management_system.Model.UserApprovalRequest;
import com.glms.general_ledger_management_system.Service.UserApprovalRequestService;
import com.glms.general_ledger_management_system.Service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.Set;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(
        name = "User Management",
        description = "User management and account administration APIs"
)
public class UserController {


    private final UserService userService;

    private final UserApprovalRequestService approvalRequestService;


    /**
     * ============================================================
     * CREATE USER
     * ============================================================
     *
     * MAKER operation.
     *
     * The account is created as INACTIVE together with a
     * USER_CREATE approval request. It becomes ACTIVE only
     * after an AUTHORIZER or ADMIN approves the request.
     */
    @PostMapping
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Create user",
            description = "Creates an INACTIVE user and a USER_CREATE approval request"
    )
    public ResponseEntity<UserResponse> createUser(
            @Valid
            @RequestBody
            CreateUserRequest request
    ) {

        UserResponse response =
                userService.createUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }


    /**
     * ============================================================
     * UPDATE USER
     * ============================================================
     *
     * MAKER operation.
     *
     * The proposed changes are staged inside a USER_UPDATE
     * approval request and are applied only after approval.
     */
    @PutMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Update user",
            description = "Stages a USER_UPDATE approval request; changes apply after approval"
    )
    public ResponseEntity<UserApprovalRequestResponse> updateUser(
            @PathVariable Long id,

            @Valid
            @RequestBody
            UpdateUserRequest request
    ) {

        UserApprovalRequest approvalRequest =
                userService.updateUser(
                        id,
                        request
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(approvalRequest));
    }


    /**
     * ============================================================
     * GET USER BY ID
     * ============================================================
     */
    @GetMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('ADMIN', 'CONTROL', 'AUTHORIZER')"
    )
    @Operation(
            summary = "Get user by ID",
            description = "Retrieves a user by ID"
    )
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id
    ) {

        UserResponse response =
                userService.getUserById(id);

        return ResponseEntity.ok(response);
    }


    /**
     * ============================================================
     * GET ALL USERS
     * ============================================================
     */
    @GetMapping
    @PreAuthorize(
            "hasAnyRole('ADMIN', 'CONTROL', 'AUTHORIZER')"
    )
    @Operation(
            summary = "Get all users",
            description = "Retrieves paginated users"
    )
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            Pageable pageable
    ) {

        Page<UserResponse> users =
                userService.getAllUsers(pageable);

        return ResponseEntity.ok(users);
    }


    /**
     * ============================================================
     * DEACTIVATE USER
     * ============================================================
     *
     * MAKER operation.
     *
     * Creates a USER_DEACTIVATE approval request. The account
     * is deactivated only after approval.
     */
    @PatchMapping("/{id}/deactivate")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Deactivate user",
            description = "Creates a USER_DEACTIVATE approval request"
    )
    public ResponseEntity<UserApprovalRequestResponse> deactivateUser(
            @PathVariable Long id,

            @Valid
            @RequestBody
            UserActionRequest actionRequest
    ) {

        UserApprovalRequest request =
                approvalRequestService.createApprovalRequest(
                        id,
                        UserApprovalAction.USER_DEACTIVATE,
                        actionRequest.getReason()
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(request));
    }


    /**
     * ============================================================
     * ACTIVATE USER
     * ============================================================
     *
     * ADMIN-only direct operation.
     *
     * An AUTHORIZER activates accounts only by approving the
     * relevant pending approval request.
     */
    @PatchMapping("/{id}/activate")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    @Operation(
            summary = "Activate user",
            description = "Activates a user account (ADMIN only)"
    )
    public ResponseEntity<String> activateUser(
            @PathVariable Long id
    ) {

        userService.activateUser(id);

        return ResponseEntity.ok(
                "User activated successfully"
        );
    }


    /**
     * ============================================================
     * ASSIGN ROLE
     * ============================================================
     *
     * MAKER operation.
     *
     * Creates an ASSIGN_ROLE approval request. Roles are
     * assigned only after approval.
     */
    @PatchMapping("/{id}/roles")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Assign roles",
            description = "Creates an ASSIGN_ROLE approval request"
    )
    public ResponseEntity<UserApprovalRequestResponse> assignRole(
            @PathVariable Long id,

            @Valid
            @RequestBody
            AssignRoleRequest request
    ) {

        UserApprovalRequest approvalRequest =
                approvalRequestService.createRoleAssignmentRequest(
                        id,
                        request.getRoles(),
                        request.getReason()
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(approvalRequest));
    }


    /**
     * ============================================================
     * SUSPEND USER
     * ============================================================
     *
     * MAKER operation.
     */
    @PutMapping("/{id}/suspend")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Suspend user",
            description = "Creates a USER_SUSPEND approval request"
    )
    public ResponseEntity<UserApprovalRequestResponse> suspendUser(
            @PathVariable Long id,

            @Valid
            @RequestBody
            UserActionRequest actionRequest
    ) {

        UserApprovalRequest request =
                approvalRequestService.createApprovalRequest(
                        id,
                        UserApprovalAction.USER_SUSPEND,
                        actionRequest.getReason()
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(request));
    }


    /**
     * ============================================================
     * UNSUSPEND USER
     * ============================================================
     *
     * MAKER operation.
     */
    @PutMapping("/{id}/unsuspend")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Unsuspend user",
            description = "Creates a USER_UNSUSPEND approval request"
    )
    public ResponseEntity<UserApprovalRequestResponse> unsuspendUser(
            @PathVariable Long id,

            @Valid
            @RequestBody
            UserActionRequest actionRequest
    ) {

        UserApprovalRequest request =
                approvalRequestService.createApprovalRequest(
                        id,
                        UserApprovalAction.USER_UNSUSPEND,
                        actionRequest.getReason()
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(request));
    }


    /**
     * ============================================================
     * LOCK USER
     * ============================================================
     *
     * MAKER operation.
     */
    @PutMapping("/{id}/lock")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Lock user",
            description = "Creates a USER_LOCK approval request"
    )
    public ResponseEntity<UserApprovalRequestResponse> lockUser(
            @PathVariable Long id,

            @Valid
            @RequestBody
            UserActionRequest actionRequest
    ) {

        UserApprovalRequest request =
                approvalRequestService.createApprovalRequest(
                        id,
                        UserApprovalAction.USER_LOCK,
                        actionRequest.getReason(),
                        actionRequest.getDurationMinutes()
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(request));
    }


    /**
     * ============================================================
     * DELETE USER
     * ============================================================
     *
     * MAKER operation.
     *
     * Creates a USER_DELETE approval request.
     * The account is soft-deleted (status → DELETED)
     * only after an AUTHORIZER or ADMIN approves it.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Delete user",
            description = "Creates a USER_DELETE approval request. The user is soft-deleted after approval."
    )
    public ResponseEntity<UserApprovalRequestResponse> deleteUser(
            @PathVariable Long id,

            @Valid
            @RequestBody
            UserActionRequest actionRequest
    ) {

        UserApprovalRequest request =
                approvalRequestService.createApprovalRequest(
                        id,
                        UserApprovalAction.USER_DELETE,
                        actionRequest.getReason()
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(request));
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     */
    private UserApprovalRequestResponse toResponse(
            UserApprovalRequest request
    ) {

        if (request == null) {

            return null;
        }


        return UserApprovalRequestResponse.builder()

                .id(
                        request.getId()
                )

                .userId(
                        request.getUser() != null
                                ? request.getUser().getId()
                                : null
                )

                .username(
                        request.getUser() != null
                                ? request.getUser().getUsername()
                                : null
                )

                .makerId(
                        request.getMaker() != null
                                ? request.getMaker().getId()
                                : null
                )

                .makerUsername(
                        request.getMaker() != null
                                ? request.getMaker().getUsername()
                                : null
                )

                .authorizerId(
                        request.getAuthorizer() != null
                                ? request.getAuthorizer().getId()
                                : null
                )

                .authorizerUsername(
                        request.getAuthorizer() != null
                                ? request.getAuthorizer().getUsername()
                                : null
                )

                .action(
                        request.getActionType()
                )

                .status(
                        request.getStatus()
                )

                .roleNames(
                        request.getRoles() != null
                                ? Set.copyOf(
                                request.getRoles()
                        )
                                : Set.of()
                )

                .permissions(
                        request.getPermissions() != null
                                ? Set.copyOf(
                                request.getPermissions()
                        )
                                : Set.of()
                )

                .reason(
                        request.getReason()
                )

                .remark(
                        request.getAuthorizerRemark()
                )

                .createdAt(
                        request.getRequestedAt() != null
                                ? request.getRequestedAt()
                                .toLocalDateTime()
                                : null
                )

                .approvedAt(
                        request.getStatus() != null
                                && request.getAuthorizedAt() != null
                                && request.getStatus()
                                .name()
                                .equals("APPROVED")
                                ? request.getAuthorizedAt()
                                .toLocalDateTime()
                                : null
                )

                .rejectedAt(
                        request.getStatus() != null
                                && request.getAuthorizedAt() != null
                                && request.getStatus()
                                .name()
                                .equals("REJECTED")
                                ? request.getAuthorizedAt()
                                .toLocalDateTime()
                                : null
                )

                .build();
    }
}
