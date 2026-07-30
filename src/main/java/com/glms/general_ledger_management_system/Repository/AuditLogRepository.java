package com.glms.general_ledger_management_system.Repository;


import com.glms.general_ledger_management_system.Model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;


public interface AuditLogRepository
        extends JpaRepository<AuditLog, Long> {


}