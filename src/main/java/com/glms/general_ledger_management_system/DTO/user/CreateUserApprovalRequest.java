package com.glms.general_ledger_management_system.DTO.user;

import com.glms.general_ledger_management_system.Model.UserApprovalAction;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserApprovalRequest {

    /**
     * User account being affected.
     */
    @NotNull(message = "User ID is required")
    private Long userId;


    /**
     * Action requested by the Maker.
     */
    @NotNull(message = "Approval action is required")
    private UserApprovalAction actionType;


    /**
     * Reason for the request.
     */
    @Size(
            max = 1000,
            message = "Reason cannot exceed 1000 characters"
    )
    private String reason;


    /**
     * Roles requested by the Maker.
     *
     * Required only when actionType = ASSIGN_ROLE.
     */
    @Builder.Default
    private Set<String> roles = new HashSet<>();
}