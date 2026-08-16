package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.audit.AuditLogResponse;
import com.glms.general_ledger_management_system.Service.AuditLogService;

import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * ============================================================
 * AUDIT LOG CONTROLLER
 * ============================================================
 *
 * ADMIN-only audit trail views.
 *
 * The base path lives under /api/admin, so the security
 * filter chain already requires ROLE_ADMIN. Class-level
 * @PreAuthorize enforces it a second time, and method-level
 * checks require the AUDIT_VIEW / AUDIT_EXPORT permissions
 * (carried by the ADMIN role).
 *
 * Read-only: audit logs are append-only and are never
 * modified or deleted through these endpoints.
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@PreAuthorize(
        "hasRole('ADMIN')"
)
public class AuditLogController {


    private final AuditLogService auditLogService;


    /**
     * ============================================================
     * GET ALL AUDIT LOGS
     * ============================================================
     */
    @GetMapping
    @PreAuthorize(
            "hasAuthority('AUDIT_VIEW')"
    )
    @Operation(
            summary = "Get all audit logs",
            description = "ADMIN-only: paginated audit trail, newest first"
    )
    public ResponseEntity<Page<AuditLogResponse>> getAll(
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                auditLogService.getAll(pageable)
        );
    }


    /**
     * ============================================================
     * GET AUDIT LOG BY ID
     * ============================================================
     */
    @GetMapping("/{id}")
    @PreAuthorize(
            "hasAuthority('AUDIT_VIEW')"
    )
    @Operation(
            summary = "Get audit log by ID",
            description = "ADMIN-only"
    )
    public ResponseEntity<AuditLogResponse> getById(
            @PathVariable Long id
    ) {

        return ResponseEntity.ok(
                auditLogService.getById(id)
        );
    }


    /**
     * ============================================================
     * GET AUDIT LOGS BY USERNAME
     * ============================================================
     */
    @GetMapping("/user/{username}")
    @PreAuthorize(
            "hasAuthority('AUDIT_VIEW')"
    )
    @Operation(
            summary = "Get audit logs by username",
            description = "ADMIN-only: all audit entries for one user"
    )
    public ResponseEntity<Page<AuditLogResponse>> getByUsername(
            @PathVariable String username,
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                auditLogService.getByUsername(
                        username,
                        pageable
                )
        );
    }


    /**
     * ============================================================
     * GET AUDIT LOGS BY ACTION
     * ============================================================
     */
    @GetMapping("/action/{action}")
    @PreAuthorize(
            "hasAuthority('AUDIT_VIEW')"
    )
    @Operation(
            summary = "Get audit logs by action",
            description = "ADMIN-only: all audit entries for one action type"
    )
    public ResponseEntity<Page<AuditLogResponse>> getByAction(
            @PathVariable String action,
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                auditLogService.getByAction(
                        action,
                        pageable
                )
        );
    }


    /**
     * ============================================================
     * SEARCH AUDIT LOGS
     * ============================================================
     *
     * Optional filters: username, action, from, to (ISO date-time).
     */
    @GetMapping("/search")
    @PreAuthorize(
            "hasAuthority('AUDIT_VIEW')"
    )
    @Operation(
            summary = "Search audit logs",
            description = "ADMIN-only: filter by username, action and date range"
    )
    public ResponseEntity<Page<AuditLogResponse>> search(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to,
            Pageable pageable
    ) {

        return ResponseEntity.ok(
                auditLogService.search(
                        username,
                        action,
                        from,
                        to,
                        pageable
                )
        );
    }


    /**
     * ============================================================
     * EXPORT AUDIT LOGS AS CSV
     * ============================================================
     */
    @GetMapping(
            value = "/export",
            produces = "text/csv"
    )
    @PreAuthorize(
            "hasAuthority('AUDIT_EXPORT')"
    )
    @Operation(
            summary = "Export audit logs as CSV",
            description = "ADMIN-only: downloads a CSV of the filtered audit trail"
    )
    public ResponseEntity<String> export(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String action,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
            LocalDateTime to
    ) {

        String csv =
                auditLogService.exportCsv(
                        username,
                        action,
                        from,
                        to
                );

        return ResponseEntity.ok()
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=audit-logs.csv"
                )
                .contentType(
                        MediaType.parseMediaType("text/csv")
                )
                .body(csv);
    }
}
