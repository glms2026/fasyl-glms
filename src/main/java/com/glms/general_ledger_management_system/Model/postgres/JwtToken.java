package com.glms.general_ledger_management_system.Model.postgres;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name="JWT_TOKENS")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JwtToken {


    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE
    )
    private Long id;



    @Column(
            columnDefinition = "TEXT",
            nullable = false,
            name = "token"
    )
    private String token;



    @Column(name = "revoked")
    private boolean revoked;

    @Column(name = "created_at")
    private LocalDateTime createdAt;


    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;



    @ManyToOne
    @JoinColumn(
            name="user_id"
    )
    private User user;


}