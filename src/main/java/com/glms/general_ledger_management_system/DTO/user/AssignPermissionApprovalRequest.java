package com.glms.general_ledger_management_system.DTO.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

/**
 * ============================================================
 * ASSIGN PERMISSION APPROVAL REQUEST
 * ============================================================
 *
 * Represents a Maker's request to assign permissions to a role.
 *
 * Permissions are NOT assigned immediately.
 *
 * Workflow:
 *
 * MAKER
 *   ↓
 * Submit approval request
 *   ↓
 * PENDING
 *   ↓
 * AUTHORIZER
 *   ↓
 * APPROVE
 *   ↓
 * Permissions assigned to Role
 *
 * Or:
 *
 * AUTHORIZER
 *   ↓
 * REJECT
 *   ↓
 * Permissions remain unchanged
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignPermissionApprovalRequest {

    /**
     * Name of the role that will receive the permissions.
     *
     * Example:
     * "CONTROL"
     */
    @NotBlank(message = "Role name is required")
    @Size(
            max = 100,
            message = "Role name cannot exceed 100 characters"
    )
    private String roleName;


    /**
     * Permissions requested for assignment.
     *
     * Example:
     *
     * USER_CREATE
     * USER_UPDATE
     * USER_LOCK
     */
    @NotEmpty(
            message = "At least one permission is required"
    )
    @Size(
            max = 50,
            message = "A maximum of 50 permissions can be assigned at once"
    )
    private Set<
            @NotBlank(
                    message = "Permission name cannot be blank"
            )
            @Size(
                    max = 100,
                    message = "Permission name cannot exceed 100 characters"
            )
                    String
            > permissions;


    /**
     * Business justification for the request.
     *
     * This is important for Maker-Checker auditability.
     *
     * Example:
     *
     * "Control officer requires USER_CREATE permission
     * to perform authorized user administration."
     */
    @NotBlank(message = "Reason is required")
    @Size(
            max = 1000,
            message = "Reason cannot exceed 1000 characters"
    )
    private String reason;
}