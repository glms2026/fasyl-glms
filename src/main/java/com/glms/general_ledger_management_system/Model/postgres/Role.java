package com.glms.general_ledger_management_system.Model.postgres;


import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.*;

import lombok.*;


import java.util.HashSet;
import java.util.Set;



@Entity
@Table(name = "ROLES")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {



    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "role_seq"
    )
    @SequenceGenerator(
            name = "role_seq",
            sequenceName = "ROLE_SEQ",
            allocationSize = 1
    )
    private Long id;




    @Column(
            name = "NAME",
            unique = true,
            nullable = false,
            length = 50
    )
    private String name;





    @JsonIgnore
    @ManyToMany(
            mappedBy = "roles"
    )
    @Builder.Default
    private Set<User> users =
            new HashSet<>();






    @ManyToMany(
            fetch = FetchType.EAGER
    )
    @JoinTable(
            name = "ROLE_PERMISSIONS",

            joinColumns =
            @JoinColumn(
                    name = "role_id"
            ),

            inverseJoinColumns =
            @JoinColumn(
                    name = "permission_id"
            ),

    uniqueConstraints = {
                    @UniqueConstraint( name = "UK_ROLE_PERMISSION",
                            columnNames = { "ROLE_ID", "PERMISSION_ID" } ) }
    )
    @Builder.Default
    private Set<Permission> permissions =
            new HashSet<>();


}