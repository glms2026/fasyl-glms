package com.glms.general_ledger_management_system.DTO.role;

import lombok.*;

import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {

    private Long id;

    private String name;

    @Builder.Default
    private Set<String> permissions = Set.of();
}
