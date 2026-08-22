package com.glms.general_ledger_management_system.DTO.ledger;

import com.glms.general_ledger_management_system.Model.postgres.LedgerStatus;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerResponse {

    private Long id;

    private String ledgerCode;

    private String leaf;

    private String description;

    private String ledgerType;

    private LedgerStatus status;

    private Long createdById;

    private String createdByUsername;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}