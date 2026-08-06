package com.glms.general_ledger_management_system.DTO.role;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
@AllArgsConstructor
public class AssignPermissionResponse {

    private Long roleId;

    private String roleName;

    private Set<String> permissions;

    private String message;
}