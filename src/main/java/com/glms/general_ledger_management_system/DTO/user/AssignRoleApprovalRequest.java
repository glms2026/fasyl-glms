package com.glms.general_ledger_management_system.DTO.user;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignRoleApprovalRequest {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotEmpty(
            message = "At least one role must be provided"
    )
    private Set<String> roles;

    private String reason;
}