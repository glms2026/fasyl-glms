package com.glms.general_ledger_management_system.Model.postgres;

import jakarta.persistence.*;

import lombok.*;


/**
 * ============================================================
 * LEDGER REFERENCE (PostgreSQL / Neon DB)
 * ============================================================
 *
 * Read-only entity mapped to the FCUBS_GLTM_GLMASTER table.
 * This table serves as the source of truth for ledger master data.
 *
 * Used to auto-populate ledger fields when a user enters
 * a GL_CODE during ledger creation.
 */
@Entity
@Table(name = "FCUBS_GLTM_GLMASTER")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerReference {


    /**
     * Unique Ledger Code (e.g., 1000, 1100, 2000).
     * This is the lookup key entered by the user.
     */
    @Id
    @Column(
            name = "gl_code",
            nullable = false,
            length = 50
    )
    private String glCode;


    /**
     * Ledger Description from the reference table.
     * Auto-populates the description field in GLMS.
     */
    @Column(
            name = "gl_desc",
            length = 255
    )
    private String glDesc;


    /**
     * Leaf indicator from the reference table.
     * Auto-populates the leaf field in GLMS.
     */
    @Column(
            name = "leaf",
            length = 1
    )
    private String leaf;
}
