package com.glms.general_ledger_management_system.Model;


import jakarta.persistence.*;

import lombok.*;


import java.time.LocalDateTime;



@Entity
@Table(
        name = "PASSWORD_RESET_TOKENS"
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {



    @Id
    @GeneratedValue(
            strategy = GenerationType.SEQUENCE,
            generator = "password_reset_token_seq"
    )
    @SequenceGenerator(
            name = "password_reset_token_seq",
            sequenceName = "PASSWORD_RESET_TOKEN_SEQ",
            allocationSize = 1
    )
    private Long id;




    @Column(
            nullable = false,
            unique = true,
            length = 255
    )
    private String token;




    @Column(
            nullable = false
    )
    private LocalDateTime expiryDate;




    @Column(
            nullable = false
    )
    private boolean used = false;




    @ManyToOne(
            fetch = FetchType.LAZY
    )
    @JoinColumn(
            name = "user_id",
            nullable = false
    )
    private User user;



}