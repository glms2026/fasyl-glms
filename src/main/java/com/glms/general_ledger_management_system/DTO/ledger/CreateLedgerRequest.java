package com.glms.general_ledger_management_system.DTO.ledger;


import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateLedgerRequest {


    @NotBlank
    private String ledgerName;


    private String description;


    private Long ledgerTypeId;


}