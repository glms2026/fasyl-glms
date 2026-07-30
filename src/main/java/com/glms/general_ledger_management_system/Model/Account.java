package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name="ACCOUNTS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Account {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE
    )
    private Long id;



    private String accountNumber;



    private String accountName;



    private String accountType;



    @ManyToOne
    @JoinColumn(
            name="ledger_id"
    )
    private Ledger ledger;


}