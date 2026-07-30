package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;

import lombok.*;



@Entity
@Table(
        name = "PERMISSIONS",

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
public class Permission {



    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "permission_seq"
    )
    @SequenceGenerator(
            name = "permission_seq",
            sequenceName = "PERMISSION_SEQ",
            allocationSize = 1
    )
    private Long id;




    @Column(
            nullable = false,
            unique = true,
            length = 100
    )
    private String name;




    @Column(
            length = 500
    )
    private String description;


}