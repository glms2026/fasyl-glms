package com.glms.general_ledger_management_system.DTO.user;

import com.glms.general_ledger_management_system.Model.ApprovalStatus;
import com.glms.general_ledger_management_system.Model.UserApprovalAction;

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
public class UserApprovalRequestResponse {

    private Long id;

    /**
     * User affected by the request.
     */
    private Long userId;

    private String username;

    /**
     * Control/Maker information.
     */
    private Long makerId;

    private String makerUsername;

    /**
     * Authorizer/Checker information.
     */
    private Long authorizerId;

    private String authorizerUsername;

    /**
     * Requested operation.
     */
    private UserApprovalAction action;

    /**
     * PENDING / APPROVED / REJECTED / CANCELLED.
     */
    private ApprovalStatus status;

    /**
     * Roles requested for assignment.
     *
     * Empty for actions that do not involve roles.
     */
    private Set<String> roleNames;

    /**
     * Permissions involved in the request.
     *
     * Populated for ASSIGN_PERMISSION / REMOVE_PERMISSION and
     * for user creation requests.
     */
    private Set<String> permissions;

    /**
     * Maker's reason for creating the request.
     */
    private String reason;

    /**
     * Authorizer's decision remark.
     */
    private String remark;

    /**
     * When the maker created the request.
     */
    private ZonedDateTime requestedAt;

    /**
     * When the authorizer approved/rejected the request.
     */
    private ZonedDateTime authorizedAt;

    private LocalDateTime createdAt;

    private LocalDateTime approvedAt;

    private LocalDateTime rejectedAt;
}