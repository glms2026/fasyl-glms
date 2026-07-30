package com.glms.general_ledger_management_system.DTO.ledger;


import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLedgerRequest {


    private String ledgerName;


    private String description;


}