package com.glms.general_ledger_management_system.DTO.ledger;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLedgerRequest {

    @NotBlank(message = "Ledger Type is required")
    @Size(
            min = 2,
            max = 150
    )
    private String ledgerType;


//    @Size(
//            max = 500,
//            message = "Description cannot exceed 500 characters"
//    )
//    private String description;


}