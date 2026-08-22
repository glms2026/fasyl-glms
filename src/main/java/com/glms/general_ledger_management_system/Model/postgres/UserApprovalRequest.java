package com.glms.general_ledger_management_system.Model.postgres;

import jakarta.persistence.*;

import lombok.*;

import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(
        name = "USER_APPROVAL_REQUESTS",
        indexes = {
                @Index(
                        name = "IDX_UAR_STATUS",
                        columnList = "STATUS"
                ),
                @Index(
                        name = "IDX_UAR_USER_ID",
                        columnList = "USER_ID"
                ),
                @Index(
                        name = "IDX_UAR_MAKER_ID",
                        columnList = "MAKER_ID"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserApprovalRequest {


    /**
     * ============================================================
     * PRIMARY KEY
     * ============================================================
     */
    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "user_approval_request_seq"
    )
    @SequenceGenerator(
            name = "user_approval_request_seq",
            sequenceName = "USER_APPROVAL_REQUEST_SEQ",
            allocationSize = 1
    )
    private Long id;


    /**
     * ============================================================
     * USER BEING AFFECTED
     * ============================================================
     *
     * The user account on which the controlled action
     * is being requested.
     *
     * NULL for role-level actions (e.g. ASSIGN_PERMISSION /
     * REMOVE_PERMISSION) which target a role, not a user.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "USER_ID"
    )
    private User user;


    /**
     * ============================================================
     * MAKER
     * ============================================================
     *
     * The CONTROL user who created the request.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "MAKER_ID",
            nullable = false
    )
    private User maker;


    /**
     * ============================================================
     * AUTHORIZER
     * ============================================================
     *
     * The user who approved or rejected the request.
     *
     * This remains NULL while the request is pending.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "AUTHORIZER_ID"
    )
    private User authorizer;


    /**
     * ============================================================
     * ACTION
     * ============================================================
     *
     * Example:
     *
     * USER_CREATE
     * USER_UPDATE
     * USER_DEACTIVATE
     * USER_SUSPEND
     * USER_LOCK
     * USER_UNSUSPEND
     * ROLE_ASSIGN_PERMISSION
     * UPDATE_PERMISSION
     */
    @Enumerated(EnumType.STRING)
    @Column(
            name = "ACTION_TYPE",
            nullable = false,
            length = 50
    )
    private UserApprovalAction actionType;


    /**
     * ============================================================
     * REQUEST STATUS
     * ============================================================
     *
     * PENDING
     * APPROVED
     * REJECTED
     * CANCELLED
     */
    @Enumerated(EnumType.STRING)
    @Column(
            name = "STATUS",
            nullable = false,
            length = 20
    )
    @Builder.Default
    private ApprovalStatus status =
            ApprovalStatus.PENDING;


    /**
     * ============================================================
     * REQUEST DETAILS
     * ============================================================
     *
     * Human-readable explanation of the action.
     */
    @Column(
            name = "REASON",
            length = 1000
    )
    private String reason;


    /**
     * ============================================================
     * MAKER TIMESTAMP
     * ============================================================
     */
    @Column(
            name = "REQUESTED_AT",
            nullable = false
    )
    @Builder.Default
    private ZonedDateTime requestedAt =
            ZonedDateTime.now();


    /**
     * ============================================================
     * AUTHORIZATION TIMESTAMP
     * ============================================================
     */
    @Column(
            name = "AUTHORIZED_AT"
    )
    private ZonedDateTime authorizedAt;


    /**
     * ============================================================
     * REJECTION/CANCELLATION REMARK
     * ============================================================
     */
    @Column(
            name = "AUTHORIZER_REMARK",
            length = 1000
    )
    private String authorizerRemark;

    @ElementCollection
    @CollectionTable(
            name = "USER_APPROVAL_REQUEST_ROLES",
            joinColumns = @JoinColumn(
                    name = "REQUEST_ID"
            )
    )
    @Column(
            name = "ROLE_NAME",
            nullable = false,
            length = 100
    )
    @Builder.Default
    private Set<String> roles = new HashSet<>();

    @ElementCollection
    @CollectionTable(
            name = "USER_APPROVAL_PERMISSIONS",
            joinColumns = @JoinColumn(
                    name = "approval_request_id"
            )
    )
    @Column(
            name = "permission_name",
            nullable = false
    )
    @Builder.Default
    private Set<String> permissions = new HashSet<>();


    /**
     * ============================================================
     * STAGED UPDATE PAYLOAD
     * ============================================================
     *
     * JSON snapshot of the changes proposed by the Maker for
     * USER_UPDATE requests.
     *
     * The payload is applied to the target user ONLY after
     * an Authorizer/Admin approves the request.
     */
    @Lob
    @Column(
            name = "PAYLOAD_JSON"
    )
    private String payloadJson;


}