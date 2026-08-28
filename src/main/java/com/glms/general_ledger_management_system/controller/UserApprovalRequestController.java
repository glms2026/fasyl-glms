package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.user.ApprovalDecisionRequest;
import com.glms.general_ledger_management_system.DTO.user.AssignRoleApprovalRequest;
import com.glms.general_ledger_management_system.DTO.user.UserApprovalRequestResponse;
import com.glms.general_ledger_management_system.Model.postgres.UserApprovalAction;
import com.glms.general_ledger_management_system.Model.postgres.UserApprovalRequest;
import com.glms.general_ledger_management_system.Service.UserApprovalRequestService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

import java.util.Set;


/**
 * ============================================================
 * USER APPROVAL REQUEST CONTROLLER
 * ============================================================
 *
 * Maker-Checker workflow for controlled user-management
 * operations.
 *
 * MAKER / CONTROL:
 *     Creates approval requests.
 *
 * CHECKER / AUTHORIZER:
 *     Approves or rejects requests.
 *
 * ADMIN:
 *     Full oversight - may approve, reject or cancel any
 *     request and may perform administrative operations
 *     directly.
 *
 * IMPORTANT:
 *
 * Password reset is NOT part of this workflow.
 *
 * CREATOR is NOT automatically assigned to users.
 */
@RestController
@RequestMapping("/api/user-approval-requests")
@RequiredArgsConstructor
@Tag(
        name = "User Approval Management",
        description = "Maker-Checker user management approval workflow"
)
public class UserApprovalRequestController {


    private final UserApprovalRequestService approvalRequestService;


    /**
     * ============================================================
     * CREATE APPROVAL REQUEST
     * ============================================================
     *
     * CONTROL creates a Maker request.
     *
     * The requested operation is NOT executed immediately.
     *
     * It becomes effective only after an AUTHORIZER or ADMIN
     * approves it.
     */
    @PostMapping
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Create user approval request",
            description =
                    "Creates a Maker request for a controlled "
                            + "user-management operation. The operation "
                            + "is executed only after Authorizer/Admin approval."
    )
    public ResponseEntity<UserApprovalRequestResponse> createApprovalRequest(

            @RequestParam
            @NotNull(message = "User ID is required")
            Long userId,

            @RequestParam
            @NotNull(message = "Approval action is required")
            UserApprovalAction actionType,

            @RequestParam
            @NotBlank(message = "Reason is required")
            String reason,

            @RequestParam(required = false)
            Integer durationMinutes

    ) {

        UserApprovalRequest request =
                approvalRequestService.createApprovalRequest(
                        userId,
                        actionType,
                        reason,
                        durationMinutes
                );


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(request));
    }


    /**
     * ============================================================
     * CREATE ROLE ASSIGNMENT APPROVAL REQUEST
     * ============================================================
     *
     * CONTROL creates a role-assignment request.
     *
     * The roles are stored inside the approval request and are
     * assigned ONLY after approval.
     */
    @PostMapping("/assign-role")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Create role assignment approval request",
            description =
                    "Creates a Maker request to assign specified "
                            + "roles to a user. Roles are assigned only "
                            + "after approval."
    )
    public ResponseEntity<UserApprovalRequestResponse> createRoleAssignmentRequest(

            @Valid
            @RequestBody
            AssignRoleApprovalRequest request

    ) {

        UserApprovalRequest approvalRequest =
                approvalRequestService.createRoleAssignmentRequest(
                        request.getUserId(),
                        request.getRoles(),
                        request.getReason()
                );


        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(toResponse(approvalRequest));
    }


    /**
     * ============================================================
     * APPROVE REQUEST
     * ============================================================
     *
     * AUTHORIZER or ADMIN performs the Checker operation.
     *
     * Either role may finalize the approval; the requested
     * operation is executed only after a successful approval.
     */
    @PutMapping("/{requestId}/approve")
    @PreAuthorize(
            "hasAnyRole('AUTHORIZER', 'ADMIN')"
    )
    @Operation(
            summary = "Approve user approval request",
            description =
                    "Approves a pending Maker request and executes "
                            + "the requested operation. Either an "
                            + "AUTHORIZER or an ADMIN may finalize."
    )
    public ResponseEntity<UserApprovalRequestResponse> approveRequest(

            @PathVariable
            @NotNull(message = "Request ID is required")
            Long requestId,

            @Valid
            @RequestBody(required = false)
            ApprovalDecisionRequest decisionRequest

    ) {

        String remark =
                decisionRequest != null
                        ? decisionRequest.getRemark()
                        : null;


        UserApprovalRequest request =
                approvalRequestService.approveRequest(
                        requestId,
                        remark
                );


        return ResponseEntity.ok(
                toResponse(request)
        );
    }


    /**
     * ============================================================
     * REJECT REQUEST
     * ============================================================
     *
     * AUTHORIZER or ADMIN performs the Checker operation.
     *
     * Rejection does NOT execute the requested operation.
     */
    @PutMapping("/{requestId}/reject")
    @PreAuthorize(
            "hasAnyRole('AUTHORIZER', 'ADMIN')"
    )
    @Operation(
            summary = "Reject user approval request",
            description =
                    "Rejects a pending Maker request without "
                            + "executing the requested operation."
    )
    public ResponseEntity<UserApprovalRequestResponse> rejectRequest(

            @PathVariable
            @NotNull(message = "Request ID is required")
            Long requestId,

            @Valid
            @RequestBody
            ApprovalDecisionRequest decisionRequest

    ) {

        String remark =
                decisionRequest.getRemark();


        if (remark == null || remark.isBlank()) {

            throw new IllegalArgumentException(
                    "Please add a remark explaining why you're rejecting this request."
            );
        }


        UserApprovalRequest request =
                approvalRequestService.rejectRequest(
                        requestId,
                        remark
                );


        return ResponseEntity.ok(
                toResponse(request)
        );
    }


    /**
     * ============================================================
     * CANCEL REQUEST
     * ============================================================
     *
     * MAKER withdraws his own pending request.
     *
     * ADMIN can cancel any pending request.
     */
    @DeleteMapping("/{requestId}")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Cancel approval request",
            description =
                    "Cancels a pending Maker request. The maker can "
                            + "cancel his own request; an ADMIN can "
                            + "cancel any pending request."
    )
    public ResponseEntity<UserApprovalRequestResponse> cancelRequest(

            @PathVariable
            @NotNull(message = "Request ID is required")
            Long requestId

    ) {

        UserApprovalRequest request =
                approvalRequestService.cancelRequest(
                        requestId
                );


        return ResponseEntity.ok(
                toResponse(request)
        );
    }


    /**
     * ============================================================
     * GET PENDING REQUESTS
     * ============================================================
     *
     * CHECKER / AUTHORIZER queue - requests awaiting approval.
     *
     * ADMIN also has full visibility.
     */
    @GetMapping("/pending")
    @PreAuthorize(
            "hasAnyRole('AUTHORIZER', 'ADMIN')"
    )
    @Operation(
            summary = "Get pending approval requests",
            description =
                    "Retrieves all requests waiting for approval. "
                            + "Available to AUTHORIZER and ADMIN."
    )
    public ResponseEntity<Page<UserApprovalRequestResponse>> getPendingRequests(

            @PageableDefault(
                    size = 20,
                    sort = "requestedAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable

    ) {

        Page<UserApprovalRequestResponse> response =
                approvalRequestService.getPendingRequests(pageable)
                        .map(this::toResponse);


        return ResponseEntity.ok(response);
    }


    /**
     * ============================================================
     * GET MY REQUESTS
     * ============================================================
     *
     * MAKER / CONTROL view of the requests he created.
     */
    @GetMapping("/mine")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'ADMIN')"
    )
    @Operation(
            summary = "Get my approval requests",
            description =
                    "Retrieves the approval requests created by the "
                            + "authenticated maker."
    )
    public ResponseEntity<Page<UserApprovalRequestResponse>> getMyRequests(

            @PageableDefault(
                    size = 20,
                    sort = "requestedAt",
                    direction = Sort.Direction.DESC
            )
            Pageable pageable

    ) {

        Page<UserApprovalRequestResponse> response =
                approvalRequestService.getMyRequests(pageable)
                        .map(this::toResponse);


        return ResponseEntity.ok(response);
    }


    /**
     * ============================================================
     * GET PENDING REQUEST
     * ============================================================
     *
     * CONTROL, AUTHORIZER and ADMIN can view a pending request.
     */
    @GetMapping("/{requestId}")
    @PreAuthorize(
            "hasAnyRole('CONTROL', 'AUTHORIZER', 'ADMIN')"
    )
    @Operation(
            summary = "Get pending approval request",
            description =
                    "Retrieves a pending user-management approval request."
    )
    public ResponseEntity<UserApprovalRequestResponse> getPendingRequest(

            @PathVariable
            @NotNull(message = "Request ID is required")
            Long requestId

    ) {

        UserApprovalRequest request =
                approvalRequestService.findPendingRequest(
                        requestId
                );


        return ResponseEntity.ok(
                toResponse(request)
        );
    }


    /**
     * ============================================================
     * ENTITY -> RESPONSE DTO
     * ============================================================
     *
     * Prevents the JPA entity from being exposed directly
     * through the REST API.
     */
    private UserApprovalRequestResponse toResponse(
            UserApprovalRequest request
    ) {

        if (request == null) {

            return null;
        }


        return UserApprovalRequestResponse.builder()

                .id(
                        request.getId()
                )

                /*
                 * Target user
                 */
                .userId(
                        request.getUser() != null
                                ? request.getUser().getId()
                                : null
                )

                .username(
                        request.getUser() != null
                                ? request.getUser().getUsername()
                                : null
                )

                /*
                 * Maker
                 */
                .makerId(
                        request.getMaker() != null
                                ? request.getMaker().getId()
                                : null
                )

                .makerUsername(
                        request.getMaker() != null
                                ? request.getMaker().getUsername()
                                : null
                )

                /*
                 * Authorizer
                 */
                .authorizerId(
                        request.getAuthorizer() != null
                                ? request.getAuthorizer().getId()
                                : null
                )

                .authorizerUsername(
                        request.getAuthorizer() != null
                                ? request.getAuthorizer().getUsername()
                                : null
                )

                /*
                 * Action
                 */
                .action(
                        request.getActionType()
                )

                /*
                 * Status
                 */
                .status(
                        request.getStatus()
                )

                /*
                 * Requested roles
                 */
                .roleNames(
                        request.getRoles() != null
                                ? Set.copyOf(
                                request.getRoles()
                        )
                                : Set.of()
                )

                /*
                 * Requested permissions
                 */
                .permissions(
                        request.getPermissions() != null
                                ? Set.copyOf(
                                request.getPermissions()
                        )
                                : Set.of()
                )

                /*
                 * Request information
                 */
                .reason(
                        request.getReason()
                )

                .remark(
                        request.getAuthorizerRemark()
                )

                /*
                 * Payload (ledger data, staged user updates, etc.)
                 */
                .payloadJson(
                        request.getPayloadJson()
                )

                /*
                 * Timestamps
                 */
                .createdAt(
                        request.getRequestedAt() != null
                                ? request.getRequestedAt()
                                .toLocalDateTime()
                                : null
                )

                .approvedAt(
                        request.getStatus() != null
                                && request.getAuthorizedAt() != null
                                && request.getStatus()
                                .name()
                                .equals("APPROVED")
                                ? request.getAuthorizedAt()
                                .toLocalDateTime()
                                : null
                )

                .rejectedAt(
                        request.getStatus() != null
                                && request.getAuthorizedAt() != null
                                && request.getStatus()
                                .name()
                                .equals("REJECTED")
                                ? request.getAuthorizedAt()
                                .toLocalDateTime()
                                : null
                )

                .build();
    }
}
