package com.glms.general_ledger_management_system.dto.ledger;


import lombok.*;


import java.time.LocalDateTime;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LedgerResponse {


    private Long id;


    private String ledgerName;


    private String description;


    private String createdBy;


    private LocalDateTime createdAt;


}