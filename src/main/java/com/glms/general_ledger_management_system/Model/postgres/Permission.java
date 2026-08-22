package com.glms.general_ledger_management_system.Model.postgres;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import lombok.*;

import java.util.HashSet;
import java.util.Set;


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
            name = "NAME",
            nullable = false,
            unique = true,
            length = 100
    )
    private String name;




    @Column(
            name = "DESCRIPTION",
            length = 500
    )
    private String description;

    /**
     * Relationship with Roles
     */
    @JsonIgnore
    @ManyToMany(
            mappedBy = "permissions"
    )
    @Builder.Default
    private Set<Role> roles =
            new HashSet<>();



}