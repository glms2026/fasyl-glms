package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name="JOURNAL_ENTRIES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JournalEntry {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE
    )
    private Long id;



    private String reference;



    private BigDecimal amount;



    private String transactionType;



    private LocalDateTime transactionDate;



    @ManyToOne
    @JoinColumn(
            name="account_id"
    )
    private Account account;


}