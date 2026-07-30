package com.glms.general_ledger_management_system.Model;


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
            unique = true,
            nullable = false
    )
    private String name;





    @JsonIgnore
    @ManyToMany(
            mappedBy = "roles"
    )
    private Set<User> users =
            new HashSet<>();






    @ManyToMany(
            fetch = FetchType.LAZY
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
            )
    )
    private Set<Permission> permissions =
            new HashSet<>();


}