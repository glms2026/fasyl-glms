package com.glms.general_ledger_management_system.Repository.postgres;


import com.glms.general_ledger_management_system.Model.postgres.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;


public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {


    Page<AuditLog> findByUsernameIgnoreCase(
            String username,
            Pageable pageable
    );


    Page<AuditLog> findByActionIgnoreCase(
            String action,
            Pageable pageable
    );


    /**
     * Combined search: optional username, action and date range.
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:username IS NULL OR LOWER(a.username) = LOWER(:username))
              AND (:action IS NULL OR LOWER(a.action) = LOWER(:action))
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt <= :to)
            """)
    Page<AuditLog> search(
            @Param("username") String username,
            @Param("action") String action,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable
    );


    /**
     * Same filter as search() but unbounded, newest first,
     * used by the CSV export.
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:username IS NULL OR LOWER(a.username) = LOWER(:username))
              AND (:action IS NULL OR LOWER(a.action) = LOWER(:action))
              AND (:from IS NULL OR a.createdAt >= :from)
              AND (:to IS NULL OR a.createdAt <= :to)
            ORDER BY a.createdAt DESC
            """)
    List<AuditLog> searchAll(
            @Param("username") String username,
            @Param("action") String action,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to
    );


}
