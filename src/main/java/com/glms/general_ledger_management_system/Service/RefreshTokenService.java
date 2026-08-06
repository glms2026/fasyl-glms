package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.Model.RefreshToken;
import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.ZonedDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {


    private final RefreshTokenRepository repository;




    @Value("${app.jwt.refresh-expiration}")
    private Long refreshExpiration;



    public RefreshToken createRefreshToken(
            User user
    ){


        repository.deleteByUser_Id(
                user.getId()
        );


        repository.flush();



        RefreshToken refreshToken =
                RefreshToken.builder()

                        .user(user)

                        .token(
                                UUID.randomUUID()
                                        .toString()
                        )

                        .expiryDate(
                                ZonedDateTime.now()
                                        .plusSeconds(
                                                refreshExpiration / 1000
                                        )
                        )

                        .createdAt(
                                ZonedDateTime.now()
                        )

                        .revoked(false)

                        .build();



        return repository.save(refreshToken);

    }



    /**
     * Find Refresh Token
     */
    public RefreshToken findByToken(String token) {

        return repository
                .findByToken(token)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Refresh token not found"
                        )
                );
    }



    public RefreshToken verifyToken(
            RefreshToken token
    ){


        if(token == null){

            throw new RuntimeException(
                    "Refresh token not found"
            );

        }



        if(token.isRevoked()){

            throw new RuntimeException(
                    "Refresh token revoked"
            );

        }




        if(token.getExpiryDate()
                .isBefore(
                        ZonedDateTime.now()
                )){


            token.setRevoked(true);

            repository.save(token);


            throw new RuntimeException(
                    "Refresh token expired"
            );

        }



        return token;

    }





    public void revokeToken(
            RefreshToken token
    ){

        token.setRevoked(true);

        repository.save(token);

    }





    public void revokeAllUserTokens(
            Long userId
    ){

        repository.deleteByUser_Id(
                userId
        );

    }


}
