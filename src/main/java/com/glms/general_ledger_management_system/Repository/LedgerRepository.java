package com.glms.general_ledger_management_system.Repository;

import com.glms.general_ledger_management_system.Model.Ledger;
import com.glms.general_ledger_management_system.Model.LedgerType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LedgerRepository
        extends JpaRepository<Ledger, Long> {

    /**
     * Find active ledger by code.
     *
     * Used for duplicate validation.
     */
    Optional<Ledger> findByLedgerCodeAndDeletedFalse(
            String ledgerCode
    );

    /**
     * Check whether an active ledger code already exists.
     */
    boolean existsByLedgerCodeAndDeletedFalse(
            String ledgerCode
    );

    /**
     * Find all active ledgers.
     * Mainly used by administrators.
     */
    Page<Ledger> findByDeletedFalse(
            Pageable pageable
    );

    /**
     * Find all active ledgers created by a specific user.
     */
    Page<Ledger> findByCreatedByIdAndDeletedFalse(
            Long userId,
            Pageable pageable
    );

    /**
     * Find active ledger by ID.
     */
    Optional<Ledger> findByIdAndDeletedFalse(
            Long id
    );

    /**
     * Find active ledgers by ledger type.
     */
    Page<Ledger> findByLedgerTypeAndDeletedFalse(
            LedgerType ledgerType,
            Pageable pageable
    );

    /**
     * Search all active ledgers.
     *
     * Searches:
     * - Ledger Code
     * - Ledger Name
     */
    @Query("""
            SELECT l
            FROM Ledger l
            WHERE l.deleted = false
            AND (
                LOWER(l.ledgerCode)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR
                LOWER(l.ledgerName)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    Page<Ledger> searchLedgers(
            @Param("keyword") String keyword,
            Pageable pageable
    );

    /**
     * Search active ledgers owned by a specific user.
     * Searches:
     * - Ledger Code
     * - Ledger Name
     */
    @Query("""
            SELECT l
            FROM Ledger l
            WHERE l.createdBy.id = :userId
            AND l.deleted = false
            AND (
                LOWER(l.ledgerCode)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR
                LOWER(l.ledgerName)
                LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    Page<Ledger> searchUserLedgers(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}