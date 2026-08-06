package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
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

    @Column(name = "UPDATED_AT")
    private LocalDateTime updatedAt;


    @Column(nullable = false, name = "failed_login_attempts")
    @Builder.Default
    private Integer failedLoginAttempts = 0;

    @Column(name = "lockout_time")
    private LocalDateTime lockoutTime;


    @Column(name = "SUSPENDED_AT")
    private ZonedDateTime suspendedAt;


    @Column(name = "SUSPENDED_BY")
    private String suspendedBy;

    @Column(name = "lock_reason")
    private String lockReason;

    @Column(name = "locked_at")
    private ZonedDateTime lockedAt;

    @Column(name = "locked_by")
    private String lockedBy;




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


    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }


}