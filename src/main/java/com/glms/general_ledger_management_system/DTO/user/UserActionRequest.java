package com.glms.general_ledger_management_system.DTO.user;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class UserActionRequest {

    /**
     * Business justification supplied by the Maker for the
     * controlled user-management action.
     */
    @NotBlank(message = "Reason is required")
    @Size(max = 1000, message = "Reason cannot exceed 1000 characters")
    private String reason;

    /**
     * How long a lock lasts, in minutes. Only used for USER_LOCK
     * requests; optional, falls back to the configured default
     * when not supplied.
     */
    @Min(value = 1, message = "Lock duration must be at least 1 minute")
    @Max(value = 60, message = "Lock duration cannot exceed 60 minutes")
    private Integer durationMinutes;
}
