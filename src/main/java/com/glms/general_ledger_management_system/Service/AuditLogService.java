package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.DTO.audit.AuditLogResponse;
import com.glms.general_ledger_management_system.Model.postgres.AuditLog;
import com.glms.general_ledger_management_system.Repository.postgres.AuditLogRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private static final DateTimeFormatter EXPORT_DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private final AuditLogRepository auditLogRepository;


    /**
     * All audit logs, newest first by default.
     */
    public Page<AuditLogResponse> getAll(
            Pageable pageable
    ) {

        return auditLogRepository
                .findAll(
                        newestFirst(pageable)
                )
                .map(this::toResponse);
    }


    /**
     * Single audit log by ID.
     */
    public AuditLogResponse getById(
            Long id
    ) {

        AuditLog auditLog =
                auditLogRepository.findById(id)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "Audit log not found: " + id
                                )
                        );

        return toResponse(auditLog);
    }


    /**
     * Audit logs for one user.
     */
    public Page<AuditLogResponse> getByUsername(
            String username,
            Pageable pageable
    ) {

        return auditLogRepository
                .findByUsernameIgnoreCase(
                        username.trim(),
                        newestFirst(pageable)
                )
                .map(this::toResponse);
    }


    /**
     * Audit logs by action type.
     */
    public Page<AuditLogResponse> getByAction(
            String action,
            Pageable pageable
    ) {

        return auditLogRepository
                .findByActionIgnoreCase(
                        action.trim(),
                        newestFirst(pageable)
                )
                .map(this::toResponse);
    }


    /**
     * Combined search: optional username, action and date range.
     */
    public Page<AuditLogResponse> search(
            String username,
            String action,
            LocalDateTime from,
            LocalDateTime to,
            Pageable pageable
    ) {

        return auditLogRepository
                .search(
                        normalize(username),
                        normalize(action),
                        from,
                        to,
                        newestFirst(pageable)
                )
                .map(this::toResponse);
    }


    /**
     * CSV export of the filtered audit logs, newest first.
     */
    public String exportCsv(
            String username,
            String action,
            LocalDateTime from,
            LocalDateTime to
    ) {

        List<AuditLog> logs =
                auditLogRepository.searchAll(
                        normalize(username),
                        normalize(action),
                        from,
                        to
                );

        StringBuilder csv = new StringBuilder();

        csv.append(
                "id,username,action,description,createdAt\n"
        );

        for (AuditLog log : logs) {

            csv.append(log.getId())
                    .append(',')
                    .append(csvEscape(log.getUsername()))
                    .append(',')
                    .append(csvEscape(log.getAction()))
                    .append(',')
                    .append(csvEscape(log.getDescription()))
                    .append(',')
                    .append(
                            log.getCreatedAt() != null
                                    ? log.getCreatedAt()
                                    .format(EXPORT_DATE_FORMAT)
                                    : ""
                    )
                    .append('\n');
        }

        return csv.toString();
    }


    /**
     * Default the sort to newest-first when the client
     * did not request a specific sort.
     */
    private Pageable newestFirst(
            Pageable pageable
    ) {

        if (pageable.getSort().isSorted()) {

            return pageable;
        }

        return PageRequest.of(
                pageable.getPageNumber(),
                pageable.getPageSize(),
                Sort.by(
                        Sort.Direction.DESC,
                        "createdAt"
                )
        );
    }


    private String normalize(
            String value
    ) {

        if (value == null
                || value.isBlank()) {

            return null;
        }

        return value.trim();
    }


    private static String csvEscape(
            String value
    ) {

        if (value == null) {

            return "";
        }

        if (value.contains(",")
                || value.contains("\"")
                || value.contains("\n")) {

            return "\""
                    + value.replace("\"", "\"\"")
                    + "\"";
        }

        return value;
    }


    private AuditLogResponse toResponse(
            AuditLog auditLog
    ) {

        return AuditLogResponse.builder()
                .id(auditLog.getId())
                .username(auditLog.getUsername())
                .action(auditLog.getAction())
                .description(auditLog.getDescription())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }
}
