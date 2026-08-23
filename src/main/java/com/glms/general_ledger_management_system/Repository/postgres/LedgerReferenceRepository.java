package com.glms.general_ledger_management_system.Repository.postgres;

import com.glms.general_ledger_management_system.Model.postgres.LedgerReference;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;


/**
 * ============================================================
 * LEDGER REFERENCE REPOSITORY (PostgreSQL / Neon DB)
 * ============================================================
 *
 * Read-only repository for the FCUBS_GLTM_GLMASTER table.
 * Used to look up ledger master data by GL_CODE.
 */
@Repository
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
