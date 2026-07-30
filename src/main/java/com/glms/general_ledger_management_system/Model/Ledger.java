package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name="LEDGERS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ledger {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE
    )
    private Long id;



    private String ledgerName;



    private String description;



    private boolean active;



    private LocalDateTime createdAt;



    @ManyToOne
    @JoinColumn(
            name="created_by"
    )
    private User createdBy;



    @ManyToOne
    @JoinColumn(
            name="ledger_type_id"
    )
    private LedgerType ledgerType;


}