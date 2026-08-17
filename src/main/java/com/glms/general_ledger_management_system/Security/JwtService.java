package com.glms.general_ledger_management_system.Security;



import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;


import javax.crypto.SecretKey;

import java.nio.charset.StandardCharsets;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;



@Service
@RequiredArgsConstructor
public class JwtService {


    @Value("${app.jwt.secret}")
    private String jwtSecret;


    @Value("${app.jwt.expiration}")
    private long jwtExpiration;



    public String generateToken(
            UserDetails userDetails
    ) {


        Map<String,Object> claims =
                new HashMap<>();


        claims.put(
                "roles",
                userDetails.getAuthorities()
        );


        return createToken(
                claims,
                userDetails.getUsername()
        );

    }



    private String createToken(
            Map<String,Object> claims,
            String username
    ) {


        return Jwts.builder()

                .claims(claims)

                .subject(username)

                /*
                 * Unique token ID.
                 *
                 * JWT numeric dates are second-precision, so two
                 * logins within the same second would otherwise
                 * produce byte-identical tokens (duplicate rows in
                 * the token table, breaking findByToken).
                 */
                .id(
                        java.util.UUID.randomUUID().toString()
                )

                .issuedAt(
                        new Date()
                )

                .expiration(
                        new Date(
                                System.currentTimeMillis()
                                        +
                                        jwtExpiration
                        )
                )

                .signWith(
                        getSigningKey()
                )

                .compact();

    }




    public String extractUsername(
            String token
    ) {


        return extractClaim(
                token,
                Claims::getSubject
        );

    }




    public <T> T extractClaim(
            String token,
            Function<Claims,T> resolver
    ) {


        Claims claims =
                extractAllClaims(token);


        return resolver.apply(claims);

    }




    private Claims extractAllClaims(
            String token
    ) {


        try {


            return Jwts.parser()

                    .verifyWith(
                            getSigningKey()
                    )

                    .build()

                    .parseSignedClaims(token)

                    .getPayload();


        } catch(Exception e) {


            throw new RuntimeException(
                    "Your session token is invalid - please sign in again."
            );

        }

    }




    public boolean isTokenValid(
            String token,
            UserDetails userDetails
    ) {


        String username =
                extractUsername(token);


        return username != null
                &&
                username.equals(
                        userDetails.getUsername()
                )
                &&
                !isTokenExpired(token);

    }





    private boolean isTokenExpired(
            String token
    ) {


        return extractExpiration(token)
                .before(
                        new Date()
                );

    }




    public Date extractExpiration(
            String token
    ) {


        return extractClaim(
                token,
                Claims::getExpiration
        );

    }




    private SecretKey getSigningKey()
    {


        return Keys.hmacShaKeyFor(
                jwtSecret.getBytes(
                        StandardCharsets.UTF_8
                )
        );

    }


}