package com.glms.general_ledger_management_system.DTO.user;

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
public class ApprovalDecisionRequest {

    /**
     * Authorizer's explanation or decision remark.
     */
    @Size(
            max = 1000,
            message = "Remark cannot exceed 1000 characters"
    )
    private String remark;
}