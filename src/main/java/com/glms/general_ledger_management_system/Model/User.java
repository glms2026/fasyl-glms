package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;


@Entity
@Table(name = "USERS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE
    )
    private Long id;


    @Column(
            unique = true,
            nullable = false
    )
    private String username;



    @Column(
            nullable = false
    )
    private String password;



    @Column(
            unique = true,
            nullable = false
    )
    private String email;



    private String firstName;


    private String lastName;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserStatus status = UserStatus.ACTIVE;



    private LocalDateTime createdAt;



    @ManyToMany(
            fetch = FetchType.EAGER
    )
    @JoinTable(
            name = "USER_ROLES",

            joinColumns =
            @JoinColumn(
                    name="user_id"
            ),

            inverseJoinColumns =
            @JoinColumn(
                    name="role_id"
            )
    )
    private Set<Role> roles =
            new HashSet<>();


}