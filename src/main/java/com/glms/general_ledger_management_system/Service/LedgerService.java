package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.DTO.ledger.CreateLedgerRequest;
import com.glms.general_ledger_management_system.DTO.ledger.LedgerResponse;
import com.glms.general_ledger_management_system.DTO.ledger.UpdateLedgerRequest;
import com.glms.general_ledger_management_system.Model.AuditLog;
import com.glms.general_ledger_management_system.Model.Ledger;
import com.glms.general_ledger_management_system.Model.LedgerStatus;
import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Mapper.LedgerMapper;
import com.glms.general_ledger_management_system.Repository.AuditLogRepository;
import com.glms.general_ledger_management_system.Repository.LedgerRepository;
import com.glms.general_ledger_management_system.Repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
@Transactional
public class LedgerService {


    private final LedgerRepository ledgerRepository;

    private final UserRepository userRepository;

    private final AuditLogRepository auditLogRepository;

    private final LedgerMapper ledgerMapper;


    /**
     * Create a new ledger.
     *
     * The authenticated user automatically becomes
     * the owner of the ledger.
     */
    public LedgerResponse createLedger(
            CreateLedgerRequest request
    ) {

        /*
         * Prevent duplicate ledger codes.
         */
        if (ledgerRepository.existsByLedgerCodeAndDeletedFalse(
                request.getLedgerCode()
        )) {

            throw new IllegalArgumentException(
                    "A ledger with this code already exists - please try a different code."
            );
        }


        /*
         * Get authenticated user.
         */
        User currentUser =
                getAuthenticatedUser();


        /*
         * Convert request to entity.
         */
        Ledger ledger =
                ledgerMapper.toEntity(request);


        /*
         * Assign ownership.
         */
        ledger.setCreatedBy(currentUser);


        /*
         * Save ledger.
         */
        ledger =
                ledgerRepository.save(ledger);


        /*
         * Audit log.
         */
        createAuditLog(
                currentUser.getUsername(),
                "CREATE_LEDGER",
                "Created ledger: "
                        + ledger.getLedgerCode()
        );


        return ledgerMapper.toResponse(ledger);
    }


    /**
     * Update an existing ledger.
     *
     * Normal users can only update their own ledger.
     * Administrators can update any ledger.
     */
    public LedgerResponse updateLedger(
            Long ledgerId,
            UpdateLedgerRequest request
    ) {

        Ledger ledger =
                findActiveLedger(ledgerId);


        User currentUser =
                getAuthenticatedUser();


        /*
         * Verify ownership or elevated access.
         */
        verifyOwnership(
                ledger,
                currentUser
        );


        /*
         * Update allowed fields.
         */
        ledgerMapper.updateEntity(
                ledger,
                request
        );


        /*
         * Record who performed the update.
         */
        ledger.setUpdatedBy(currentUser);


        /*
         * Save changes.
         */
        ledger =
                ledgerRepository.save(ledger);


        /*
         * Audit log.
         */
        createAuditLog(
                currentUser.getUsername(),
                "UPDATE_LEDGER",
                "Updated ledger: "
                        + ledger.getLedgerCode()
        );


        return ledgerMapper.toResponse(ledger);
    }


    /**
     * Get a single ledger.
     *
     * Normal users can only access their own ledger.
     * Administrators can access any ledger.
     */
    @Transactional(readOnly = true)
    public LedgerResponse getLedger(
            Long ledgerId
    ) {

        Ledger ledger =
                findActiveLedger(ledgerId);


        User currentUser =
                getAuthenticatedUser();


        /*
         * Verify ownership or elevated access.
         */
        verifyOwnership(
                ledger,
                currentUser
        );


        return ledgerMapper.toResponse(ledger);
    }


    /**
     * Get all ledgers belonging to the
     * currently authenticated user.
     */
    @Transactional(readOnly = true)
    public Page<LedgerResponse> getMyLedgers(
            Pageable pageable
    ) {

        User currentUser =
                getAuthenticatedUser();


        return ledgerRepository
                .findByCreatedByIdAndDeletedFalse(
                        currentUser.getId(),
                        pageable
                )
                .map(ledgerMapper::toResponse);
    }


    /**
     * Get all active ledgers.
     *
     * Intended for administrators or users
     * with elevated ledger viewing permission.
     *
     * Authorization should also be enforced
     * at the controller level.
     */
    @Transactional(readOnly = true)
    public Page<LedgerResponse> getAllLedgers(
            Pageable pageable
    ) {

        User currentUser =
                getAuthenticatedUser();


        verifyAdminAccess(currentUser);


        return ledgerRepository
                .findByDeletedFalse(pageable)
                .map(ledgerMapper::toResponse);
    }


    /**
     * Soft delete a ledger.
     *
     * Normal users can only delete their own ledger.
     * Administrators can delete any ledger.
     */
    public void deleteLedger(
            Long ledgerId
    ) {

        Ledger ledger =
                findActiveLedger(ledgerId);


        User currentUser =
                getAuthenticatedUser();


        /*
         * Verify ownership or elevated access.
         */
        verifyOwnership(
                ledger,
                currentUser
        );


        /*
         * Soft delete.
         */
        ledger.setDeleted(true);

        ledger.setDeletedAt(
                LocalDateTime.now()
        );

        ledger.setUpdatedBy(
                currentUser
        );


        ledgerRepository.save(ledger);


        /*
         * Audit log.
         */
        createAuditLog(
                currentUser.getUsername(),
                "DELETE_LEDGER",
                "Deleted ledger: "
                        + ledger.getLedgerCode()
        );
    }


    /**
     * Search current user's ledgers.
     */
    @Transactional(readOnly = true)
    public Page<LedgerResponse> searchMyLedgers(
            String keyword,
            Pageable pageable
    ) {

        User currentUser =
                getAuthenticatedUser();


        String searchKeyword =
                normalizeKeyword(keyword);


        return ledgerRepository
                .searchUserLedgers(
                        currentUser.getId(),
                        searchKeyword,
                        pageable
                )
                .map(ledgerMapper::toResponse);
    }


    /**
     * Search all active ledgers.
     *
     * Intended for administrators or users
     * with elevated ledger viewing permission.
     */
    @Transactional(readOnly = true)
    public Page<LedgerResponse> searchAllLedgers(
            String keyword,
            Pageable pageable
    ) {

        User currentUser =
                getAuthenticatedUser();


        verifyAdminAccess(currentUser);


        String searchKeyword =
                normalizeKeyword(keyword);


        return ledgerRepository
                .searchLedgers(
                        searchKeyword,
                        pageable
                )
                .map(ledgerMapper::toResponse);
    }


    /**
     * Activate ledger.
     *
     * Only administrators are allowed to
     * perform ledger status management.
     */
    public void activateLedger(
            Long ledgerId
    ) {

        Ledger ledger =
                findActiveLedger(ledgerId);


        User currentUser =
                getAuthenticatedUser();


        verifyAdminAccess(currentUser);


        if (ledger.getStatus() == LedgerStatus.ACTIVE) {

            throw new IllegalStateException(
                    "This ledger is already active - nothing to do here."
            );
        }


        ledger.setStatus(
                LedgerStatus.ACTIVE
        );

        ledger.setUpdatedBy(
                currentUser
        );


        ledgerRepository.save(ledger);


        createAuditLog(
                currentUser.getUsername(),
                "ACTIVATE_LEDGER",
                "Activated ledger: "
                        + ledger.getLedgerCode()
        );
    }


    /**
     * Deactivate ledger.
     */
    public void deactivateLedger(
            Long ledgerId
    ) {

        Ledger ledger =
                findActiveLedger(ledgerId);


        User currentUser =
                getAuthenticatedUser();


        verifyAdminAccess(currentUser);


        if (ledger.getStatus() == LedgerStatus.INACTIVE) {

            throw new IllegalStateException(
                    "This ledger is already inactive - nothing to do here."
            );
        }


        ledger.setStatus(
                LedgerStatus.INACTIVE
        );

        ledger.setUpdatedBy(
                currentUser
        );


        ledgerRepository.save(ledger);


        createAuditLog(
                currentUser.getUsername(),
                "DEACTIVATE_LEDGER",
                "Deactivated ledger: "
                        + ledger.getLedgerCode()
        );
    }


    /**
     * Suspend ledger.
     */
    public void suspendLedger(
            Long ledgerId
    ) {

        Ledger ledger =
                findActiveLedger(ledgerId);


        User currentUser =
                getAuthenticatedUser();


        verifyAdminAccess(currentUser);


        if (ledger.getStatus() == LedgerStatus.SUSPENDED) {

            throw new IllegalStateException(
                    "This ledger is already suspended - nothing to do here."
            );
        }


        ledger.setStatus(
                LedgerStatus.SUSPENDED
        );

        ledger.setUpdatedBy(
                currentUser
        );


        ledgerRepository.save(ledger);


        createAuditLog(
                currentUser.getUsername(),
                "SUSPEND_LEDGER",
                "Suspended ledger: "
                        + ledger.getLedgerCode()
        );
    }


    /**
     * Find an active, non-deleted ledger.
     */
    private Ledger findActiveLedger(
            Long ledgerId
    ) {

        if (ledgerId == null) {

            throw new IllegalArgumentException(
                    "Please provide the ledger ID."
            );
        }


        return ledgerRepository
                .findByIdAndDeletedFalse(ledgerId)
                .orElseThrow(
                        () ->
                                new EntityNotFoundException(
                                        "We couldn't find that ledger - it may have been deleted."
                                )
                );
    }


    /**
     * Get authenticated application user.
     */
    private User getAuthenticatedUser() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (
                authentication == null
                        ||
                        !authentication.isAuthenticated()
                        ||
                        "anonymousUser".equals(
                                authentication.getPrincipal()
                        )
        ) {

            throw new AccessDeniedException(
                    "Your session isn't authenticated - please sign in again."
            );
        }


        String username =
                authentication.getName();


        return userRepository
                .findByUsername(username)
                .orElseThrow(
                        () ->
                                new IllegalStateException(
                                        "We couldn't find the account tied to your session - please sign in again."
                                )
                );
    }


    /**
     * Verify that the current user owns
     * the requested ledger.
     *
     * Administrators can access any ledger.
     */
    private void verifyOwnership(
            Ledger ledger,
            User currentUser
    ) {

        /*
         * Administrator has elevated access.
         */
        if (isAdmin(currentUser)) {
            return;
        }


        /*
         * Normal user must own the ledger.
         */
        if (
                ledger.getCreatedBy() == null
                        ||
                        !ledger.getCreatedBy()
                                .getId()
                                .equals(
                                        currentUser.getId()
                                )
        ) {

            throw new AccessDeniedException(
                    "You don't have permission to access this ledger - it belongs to another user."
            );
        }
    }


    /**
     * Verify administrator access.
     */
    private void verifyAdminAccess(
            User user
    ) {

        if (!isAdmin(user)) {

            throw new AccessDeniedException(
                    "This action requires administrator privileges."
            );
        }
    }


    /**
     * Check whether the user has ADMIN role.
     */
    private boolean isAdmin(
            User user
    ) {

        return user.getRoles()
                .stream()
                .anyMatch(
                        role ->
                                "ADMIN".equals(
                                        role.getName()
                                )
                );
    }


    /**
     * Normalize search keyword.
     */
    private String normalizeKeyword(
            String keyword
    ) {

        if (keyword == null) {
            return "";
        }


        return keyword.trim();
    }


    /**
     * Create audit log.
     */
    private void createAuditLog(
            String username,
            String action,
            String description
    ) {

        AuditLog auditLog =
                AuditLog.builder()
                        .username(username)
                        .action(action)
                        .description(description)
                        .createdAt(
                                LocalDateTime.now()
                        )
                        .build();


        auditLogRepository.save(
                auditLog
        );
    }

}