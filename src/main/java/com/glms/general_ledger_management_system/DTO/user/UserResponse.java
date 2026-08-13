package com.glms.general_ledger_management_system.DTO.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Set;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {

    private Long id;

    private String firstName;

    private String lastName;

    private String username;

    private String email;

    private String status;

    private Set<String> roles;

    private boolean active;

    private Integer failedLoginAttempts;

    private LocalDateTime lockoutTime;

    private ZonedDateTime suspendedAt;
    private String suspendedBy;

    private ZonedDateTime lockedAt;

    private String lockedBy;

    private String lockReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

}