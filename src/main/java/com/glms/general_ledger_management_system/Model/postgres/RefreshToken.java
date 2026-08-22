package com.glms.general_ledger_management_system.Model.postgres;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.ZonedDateTime;


@Entity
@Table(name = "REFRESH_TOKENS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "refresh_token_seq"
    )
    @SequenceGenerator(
            name = "refresh_token_seq",
            sequenceName = "REFRESH_TOKEN_SEQ",
            allocationSize = 1
    )
    private Long id;


    @Column(
            name = "TOKEN",
            nullable = false,
            unique = true,
            length = 512
    )
    private String token;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(
            name = "USER_ID",
            nullable = false
    )
    private User user;


    @Column(
            name = "EXPIRY_DATE",
            nullable = false
    )
    private ZonedDateTime expiryDate;


    @CreationTimestamp
    @Column(
            name = "CREATED_AT",
            nullable = false,
            updatable = false
    )
    private ZonedDateTime createdAt;


    @Column(
            name = "REVOKED",
            nullable = false
    )
    private boolean revoked = false;



    @PrePersist
    protected void onCreate(){

        if(createdAt == null){
            createdAt = ZonedDateTime.now();
        }

    }

}