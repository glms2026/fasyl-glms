package com.glms.general_ledger_management_system.DTO.ledger;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
public class CreateLedgerRequest {

    /**
     * Ledger Code — the lookup key entered by the user.
     * Used to fetch reference data from Oracle.
     */
    @NotBlank(message = "Ledger code is required")
    @Size(
            min = 2,
            max = 30,
            message = "Ledger code must be between 2 and 30 characters"
    )
    @Pattern(
            regexp = "^[0-9]+$",
            message = "Ledger code must contain only numbers"
    )
    private String ledgerCode;



    @NotBlank(message = "Ledger type is required")
    @Size(
            min = 2,
            max = 150,
            message = "Ledger type must be between 2 and 150 characters"
    )
    private String ledgerType;





    /**
     * Leaf indicator — auto-populated from Oracle.
     */
    @NotBlank(message = "Leaf indicator is required")
    @Size(
            min = 1,
            max = 1,
            message = "Leaf must be a single character"
    )
    private String leaf;


    /**
     * Optional description.
     */
    @Size(
            max = 500,
            message = "Description cannot exceed 500 characters"
    )
    private String description;

}