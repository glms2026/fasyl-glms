package com.glms.general_ledger_management_system.Repository;


import com.glms.general_ledger_management_system.Model.JournalEntry;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;


public interface JournalEntryRepository
        extends JpaRepository<JournalEntry, Long> {


    List<JournalEntry> findByAccountId(
            Long accountId
    );


}