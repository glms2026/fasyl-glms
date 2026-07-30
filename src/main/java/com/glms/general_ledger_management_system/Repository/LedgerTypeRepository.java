package com.glms.general_ledger_management_system.Repository;


import com.glms.general_ledger_management_system.Model.LedgerType;
import org.springframework.data.jpa.repository.JpaRepository;


public interface LedgerTypeRepository
        extends JpaRepository<LedgerType, Long> {


}