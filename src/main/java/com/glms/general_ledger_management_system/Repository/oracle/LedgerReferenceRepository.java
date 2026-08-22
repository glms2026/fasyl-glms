package com.glms.general_ledger_management_system.Repository.oracle;

import com.glms.general_ledger_management_system.Model.oracle.LedgerReference;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


/**
 * ============================================================
 * LEDGER REFERENCE REPOSITORY (ORACLE)
 * ============================================================
 *
 * Read-only repository for the Oracle General_ledger table.
 * Used to look up ledger master data by GL_CODE.
 *
 * NOTE: @Repository is intentionally omitted — the bean is
 * created manually in OracleDataSourceConfig to ensure it
 * uses the Oracle EntityManagerFactory.
 */
public interface LedgerReferenceRepository
        extends JpaRepository<LedgerReference, String> {


    /**
     * Find ledger reference by GL_CODE.
     *
     * @param glCode the ledger code entered by the user
     * @return the reference record if found
     */
    Optional<LedgerReference> findByGlCode(String glCode);
}
