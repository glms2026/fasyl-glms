package com.glms.general_ledger_management_system.DTO.role;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {

    private Long id;

    private String name;

    private String description;
}
