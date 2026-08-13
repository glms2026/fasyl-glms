package com.glms.general_ledger_management_system.Model;


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
            nullable = false
    )
    private String token;



    private boolean revoked;

    private LocalDateTime createdAt;


    private LocalDateTime expiryDate;



    @ManyToOne
    @JoinColumn(
            name="user_id"
    )
    private User user;


}