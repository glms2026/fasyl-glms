package com.glms.general_ledger_management_system.Repository.postgres;

import com.glms.general_ledger_management_system.Model.postgres.ApprovalStatus;
import com.glms.general_ledger_management_system.Model.postgres.UserApprovalRequest;
import com.glms.general_ledger_management_system.Model.postgres.UserApprovalAction;
import com.glms.general_ledger_management_system.Model.postgres.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;


public interface UserApprovalRequestRepository
        extends JpaRepository<UserApprovalRequest, Long> {


    /**
     * ============================================================
     * FIND REQUEST BY ID AND STATUS
     * ============================================================
     *
     * Used when an Authorizer is processing a request.
     *
     * Example:
     *
     * findByIdAndStatus(
     *     requestId,
     *     ApprovalStatus.PENDING
     * )
     */
    Optional<UserApprovalRequest> findByIdAndStatus(
            Long id,
            ApprovalStatus status
    );


    /**
     * ============================================================
     * FIND PENDING REQUESTS
     * ============================================================
     *
     * Used by the Authorizer to retrieve all requests
     * waiting for authorization.
     */
    Page<UserApprovalRequest> findByStatus(
            ApprovalStatus status,
            Pageable pageable
    );


    /**
     * ============================================================
     * FIND REQUESTS FOR A USER
     * ============================================================
     *
     * Retrieves all approval requests associated with
     * a particular user.
     */
    Page<UserApprovalRequest> findByUserId(
            Long userId,
            Pageable pageable
    );


    /**
     * ============================================================
     * FIND REQUESTS CREATED BY MAKER
     * ============================================================
     *
     * Allows a CONTROL user to see requests they created.
     */
    Page<UserApprovalRequest> findByMakerId(
            Long makerId,
            Pageable pageable
    );


    /**
     * ============================================================
     * FIND REQUESTS BY ACTION
     * ============================================================
     */
    Page<UserApprovalRequest> findByActionType(
            UserApprovalAction actionType,
            Pageable pageable
    );


    /**
     * ============================================================
     * FIND REQUESTS BY ACTION AND STATUS
     * ============================================================
     *
     * Used to detect duplicate pending permission requests
     * for a role.
     */
    List<UserApprovalRequest> findByActionTypeAndStatus(
            UserApprovalAction actionType,
            ApprovalStatus status
    );


    /**
     * ============================================================
     * FIND PENDING REQUEST FOR USER AND ACTION
     * ============================================================
     *
     * Helps prevent duplicate pending requests such as:
     *
     * CONTROL -> Suspend User 10
     *
     * CONTROL -> Suspend User 10
     *
     * before the first request has been authorized.
     */
    Optional<UserApprovalRequest>
    findFirstByUserAndActionTypeAndStatus(
            User user,
            UserApprovalAction actionType,
            ApprovalStatus status
    );


    /**
     * ============================================================
     * CHECK EXISTING PENDING REQUEST
     * ============================================================
     *
     * Useful when the service only needs a true/false answer.
     */
    boolean existsByUserAndActionTypeAndStatus(
            User user,
            UserApprovalAction actionType,
            ApprovalStatus status
    );


    /**
     * ============================================================
     * FIND PENDING REQUESTS CREATED BY MAKER
     * ============================================================
     */
    Page<UserApprovalRequest>
    findByMakerIdAndStatus(
            Long makerId,
            ApprovalStatus status,
            Pageable pageable
    );


    /**
     * ============================================================
     * FIND REQUESTS AUTHORIZED BY AUTHORIZEr
     * ============================================================
     */
    Page<UserApprovalRequest>
    findByAuthorizerId(
            Long authorizerId,
            Pageable pageable
    );


    /**
     * FIND ALL PENDING REQUESTS FOR A USER
     *
     * Used when deleting a user to cancel
     * all their pending requests.
     */
    List<UserApprovalRequest>
    findByUserAndStatus(
            User user,
            ApprovalStatus status
    );
}