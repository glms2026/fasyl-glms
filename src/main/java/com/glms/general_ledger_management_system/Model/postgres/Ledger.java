package com.glms.general_ledger_management_system.Model.postgres;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "LEDGERS",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "UK_LEDGER_CODE",
                        columnNames = "LEDGER_CODE"
                )
        },
        indexes = {
                @Index(
                        name = "IDX_LEDGER_CODE",
                        columnList = "LEDGER_CODE"
                ),
                @Index(
                        name = "IDX_LEDGER_STATUS",
                        columnList = "STATUS"
                ),
                @Index(
                        name = "IDX_LEDGER_TYPE",
                        columnList = "LEDGER_TYPE"
                )

        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ledger {

    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "ledger_seq"
    )
    @SequenceGenerator(
            name = "ledger_seq",
            sequenceName = "LEDGER_SEQ",
            allocationSize = 1
    )
    private Long id;

    /**
     * Unique Ledger Code
     * Example:
     * 1000
     * 1100
     * 2000
     */
    @Column(
            name = "LEDGER_CODE",
            nullable = false,
            unique = true,
            length = 30
    )
    private String ledgerCode;


    @Column(
            name = "LEAF",
            nullable = false,
            length = 1
    )
    private String leaf;



    /**
     * Ledger Type (auto-populated from Oracle GL_DESC)
     */
    @Column(
            name = "LEDGER_TYPE",
            nullable = false,
            length = 150
    )
    private String ledgerType;


    /**
     * Ledger Description (auto-populated from Oracle GL_DESC)
     */
    @Column(
            name = "DESCRIPTION",
            length = 500
    )
    private String ledgerDescription;

    /**
     * Ledger Status
     */
    @Enumerated(EnumType.STRING)
    @Column(
            name = "STATUS",
            nullable = false,
            length = 20
    )
    @Builder.Default
    private LedgerStatus status = LedgerStatus.PENDING;



    /**
     * User that created the ledger
     */
//    @ToString.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "CREATED_BY",
            nullable = false,
            foreignKey = @ForeignKey(
                    name = "FK_LEDGER_CREATED_BY"
            )
    )
    private User createdBy;

    /**
     * User that last updated the ledger
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "UPDATED_BY",
            foreignKey = @ForeignKey(
                    name = "FK_LEDGER_UPDATED_BY"
            )
    )
    private User updatedBy;

    /**
     * Soft Delete Flag
     */
    @Column(
            name = "DELETED",
            nullable = false
    )
    @Builder.Default
    private boolean deleted = false;

    /**
     * Date Deleted
     */
    @Column(name = "DELETED_AT")
    private LocalDateTime deletedAt;

    /**
     * Creation Timestamp
     */
    @Column(
            name = "CREATED_AT",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt;

    /**
     * Last Updated Timestamp
     */
    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;


    @PrePersist
    public void prePersist() {

        LocalDateTime now = LocalDateTime.now();

        this.createdAt = now;
        this.updatedAt = now;

        if (this.status == null) {
            this.status = LedgerStatus.PENDING;
        }
    }

    @PreUpdate
    public void preUpdate() {

        this.updatedAt = LocalDateTime.now();

    }

}