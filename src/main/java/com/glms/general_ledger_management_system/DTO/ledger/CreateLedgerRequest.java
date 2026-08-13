package com.glms.general_ledger_management_system.DTO.ledger;

import com.glms.general_ledger_management_system.Model.LedgerType;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

    @NotBlank(message = "Ledger code is required")
    @Size(
            min = 2,
            max = 20,
            message = "Ledger code must be between 2 and 20 characters"
    )
    @Pattern(
            regexp = "^[0-9]+$",
            message = "Ledger code must contain only numbers"
    )
    private String ledgerCode;

    @NotBlank(message = "Ledger name is required")
    @Size(
            min = 2,
            max = 150,
            message = "Ledger name must be between 2 and 150 characters"
    )
    private String ledgerName;

    @Size(
            max = 500,
            message = "Description cannot exceed 500 characters"
    )
    private String description;

    @NotNull(message = "Ledger type is required")
    private LedgerType ledgerType;

}