package com.glms.general_ledger_management_system.Repository;


import com.glms.general_ledger_management_system.Model.Ledger;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;


public interface LedgerRepository
        extends JpaRepository<Ledger, Long> {


    List<Ledger> findByCreatedById(
            Long userId
    );


}