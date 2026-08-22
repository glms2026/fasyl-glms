package com.glms.general_ledger_management_system.Model.postgres;


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
            strategy = GenerationType.SEQUENCE,
            generator = "user_seq" )
    @SequenceGenerator(
            name = "user_seq",
            sequenceName = "USER_SEQ", allocationSize = 1
    )
    private Long id;


    @Column(
            unique = true,
            nullable = false,
            name = "username"
    )
    private String username;



    @Column(
            nullable = false,
            name = "password"
    )
    private String password;



    @Column(
            unique = true,
            nullable = false,
            name = "email"
    )
    private String email;


    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;


    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name = "status")
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;


    @Column(name = "created_at")
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

    /**
     * How long this lock lasts (minutes). Set when a maker
     * locks the user; used by the auto-unlock timer.
     */
    @Column(name = "lock_duration_minutes")
    private Integer lockDurationMinutes;


    /**
     * ============================================================
     * MANDATORY PASSWORD CHANGE
     * ============================================================
     *
     * When true, the user must change their password before
     * accessing any other application endpoint.
     *
     * Set to true for every new user created through the
     * Maker/Checker workflow.
     *
     * Cleared after a successful password change.
     */
    @Column(
            name = "MUST_CHANGE_PASSWORD",
            nullable = false
    )
    @Builder.Default
    private boolean mustChangePassword = false;




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
            ),
            uniqueConstraints = {
                    @UniqueConstraint( name = "UK_USER_ROLE",
                            columnNames = { "USER_ID", "ROLE_ID" } ) }
    )
    private Set<Role> roles =
            new HashSet<>();


    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        if (failedLoginAttempts == null) {
            failedLoginAttempts = 0; }
        if (status == null)
        { status = UserStatus.ACTIVE; } }


    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}