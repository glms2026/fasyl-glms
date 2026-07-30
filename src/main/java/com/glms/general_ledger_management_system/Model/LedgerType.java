package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;

import lombok.*;



@Entity
@Table(
        name = "LEDGER_TYPES",

        uniqueConstraints = {
                @UniqueConstraint(
                        columnNames = "name"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LedgerType {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "ledger_type_seq"
    )
    @SequenceGenerator(
            name = "ledger_type_seq",
            sequenceName = "LEDGER_TYPE_SEQ",
            allocationSize = 1
    )
    private Long id;



    @Column(
            nullable = false,
            unique = true,
            length = 50
    )
    private String name;



    @Column(
            length = 500
    )
    private String description;


}