package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.common.ApiResponse;
import com.glms.general_ledger_management_system.DTO.role.AssignPermissionRequest;
import com.glms.general_ledger_management_system.DTO.role.PermissionResponse;
import com.glms.general_ledger_management_system.DTO.role.RoleResponse;
import com.glms.general_ledger_management_system.DTO.user.UserApprovalRequestResponse;
import com.glms.general_ledger_management_system.Model.postgres.Permission;
import com.glms.general_ledger_management_system.Model.postgres.Role;
import com.glms.general_ledger_management_system.Model.postgres.UserApprovalRequest;
import com.glms.general_ledger_management_system.Service.RolePermissionService;
import com.glms.general_ledger_management_system.Service.UserApprovalRequestService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RolePermissionController {


    private final RolePermissionService rolePermissionService;

    private final UserApprovalRequestService approvalRequestService;


    /**
     * ============================================================
     * ASSIGN PERMISSIONS TO ROLE
     * ============================================================
     *
     * MAKER operation.
     *
     * Creates an ASSIGN_PERMISSION approval request. The
     * permissions are assigned to the role only after approval.
     */
    @PutMapping("/{roleId}/permissions")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    public ResponseEntity<UserApprovalRequestResponse> assignPermissions(

            @PathVariable
            @Positive(message = "Role ID must be greater than zero")
            Long roleId,

            @Valid
            @RequestBody
            AssignPermissionRequest request
    ) {

        UserApprovalRequest approvalRequest =
                approvalRequestService.createRolePermissionAssignmentRequest(
                        roleId,
                        request.getPermissions(),
                        request.getReason()
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(approvalRequest));
    }


    /**
     * ============================================================
     * REMOVE PERMISSION FROM ROLE
     * ============================================================
     *
     * MAKER operation.
     *
     * Creates a REMOVE_PERMISSION approval request. The
     * permission is removed from the role only after approval.
     */
    @DeleteMapping("/{roleId}/permissions/{permissionName}")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    public ResponseEntity<UserApprovalRequestResponse> removePermission(

            @PathVariable
            @Positive(message = "Role ID must be greater than zero")
            Long roleId,

            @PathVariable
            @NotBlank(message = "Permission name is required")
            String permissionName,

            @RequestParam(
                    name = "reason",
                    required = false,
                    defaultValue = "Permission removal request"
            )
            String reason
    ) {

        UserApprovalRequest approvalRequest =
                approvalRequestService.createRolePermissionRemovalRequest(
                        roleId,
                        permissionName,
                        reason
                );

        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(toResponse(approvalRequest));
    }


    /**
     * ============================================================
     * CLEAR ALL PERMISSIONS FROM ROLE
     * ============================================================
     *
     * ADMIN-only direct operation.
     */
    @DeleteMapping("/{roleId}/permissions")
    @PreAuthorize(
            "hasRole('ADMIN')"
    )
    public ResponseEntity<ApiResponse> clearPermissions(

            @PathVariable
            @Positive(message = "Role ID must be greater than zero")
            Long roleId
    ) {

        rolePermissionService.clearPermissions(roleId);

        ApiResponse response =
                ApiResponse.builder()
                        .success(true)
                        .message("All permissions removed successfully.")
                        .build();

        return ResponseEntity.ok(response);
    }


    /**
     * ============================================================
     * GET ALL ROLES
     * ============================================================
     *
     * Read-only - returns every role with its ID, name and
     * permission names. Visible to CONTROL, AUTHORIZER and ADMIN.
     */
    @GetMapping
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'AUTHORIZER', 'ADMIN')"
    )
    public ResponseEntity<List<RoleResponse>> getAllRoles() {

        List<RoleResponse> response =
                rolePermissionService.getAllRoles()
                        .stream()
                        .map(role ->
                                RoleResponse.builder()
                                        .id(role.getId())
                                        .name(role.getName())
                                        .permissions(
                                                role.getPermissions()
                                                        .stream()
                                                        .map(Permission::getName)
                                                        .collect(Collectors.toSet())
                                        )
                                        .build()
                        )
                        .toList();

        return ResponseEntity.ok(response);
    }


    /**
     * ============================================================
     * GET ROLE PERMISSIONS
     * ============================================================
     *
     * Read-only - visible to CONTROL, AUTHORIZER and ADMIN.
     */
    @GetMapping("/{roleId}/permissions")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'AUTHORIZER', 'ADMIN')"
    )
    public ResponseEntity<List<PermissionResponse>> getPermissions(
            @PathVariable Long roleId
    ) {

        Role role =
                rolePermissionService.getRole(roleId);

        List<PermissionResponse> response =
                role.getPermissions()
                        .stream()
                        .map(permission ->
                                PermissionResponse.builder()
                                        .id(permission.getId())
                                        .name(permission.getName())
                                        .description(permission.getDescription())
                                        .build()
                        )
                        .sorted(Comparator.comparing(PermissionResponse::getId))
                        .toList();

        return ResponseEntity.ok(response);
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
