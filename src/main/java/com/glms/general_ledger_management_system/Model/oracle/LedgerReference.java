package com.glms.general_ledger_management_system.Model.oracle;

import jakarta.persistence.*;

import lombok.*;


/**
 * ============================================================
 * LEDGER REFERENCE (ORACLE)
 * ============================================================
 *
 * Read-only entity mapped to the Oracle General_ledger table.
 * This table serves as the source of truth for ledger master data.
 *
 * Used to auto-populate ledger fields when a user enters
 * a GL_CODE during ledger creation.
 */
@Entity
@Table(name = "GENERAL_LEDGER")
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
            name = "GL_CODE",
            nullable = false,
            length = 30
    )
    private String glCode;


    /**
     * Ledger Description from the Oracle reference.
     * Auto-populates the description field in GLMS.
     */
    @Column(
            name = "GL_DESC",
            length = 200
    )
    private String glDesc;


    /**
     * Leaf indicator from the Oracle reference.
     * Auto-populates the leaf field in GLMS.
     */
    @Column(
            name = "LEAF",
            length = 1
    )
    private String leaf;
}
