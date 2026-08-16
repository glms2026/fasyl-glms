package com.glms.general_ledger_management_system.DTO.audit;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {

    private Long id;

    private String username;

    private String action;

    private String description;

    private LocalDateTime createdAt;
}
