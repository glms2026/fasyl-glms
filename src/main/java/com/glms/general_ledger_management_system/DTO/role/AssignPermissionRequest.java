package com.glms.general_ledger_management_system.DTO.role;

import jakarta.validation.constraints.NotEmpty;
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
public class AssignPermissionRequest {

    @NotEmpty(message = "At least one permission must be provided")
    private Set<String> permissions;

}