package com.glms.general_ledger_management_system.Security;


import com.glms.general_ledger_management_system.Repository.postgres.JwtTokenRepository;
import com.glms.general_ledger_management_system.Service.CustomUserDetailsService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


import lombok.RequiredArgsConstructor;


import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

import org.springframework.stereotype.Component;

import org.springframework.util.StringUtils;

import org.springframework.web.filter.OncePerRequestFilter;


import java.io.IOException;



@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter
        extends OncePerRequestFilter {


    private final JwtService jwtService;


    private final CustomUserDetailsService userDetailsService;

    private final JwtTokenRepository jwtTokenRepository;



    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    )
            throws ServletException, IOException {



        String token =
                getTokenFromRequest(request);



        if(token == null){

            filterChain.doFilter(
                    request,
                    response
            );

            return;
        }



        try {

            boolean revoked =
                    jwtTokenRepository
                            .findByToken(token)
                            .map(jwtToken ->
                                    jwtToken.isRevoked()
                            )
                            .orElse(true);



            if(revoked){

                filterChain.doFilter(
                        request,
                        response
                );

                return;

            }

            String username =
                    jwtService.extractUsername(token);



            if(username != null
                    &&
                    SecurityContextHolder
                            .getContext()
                            .getAuthentication()
                            == null){



                UserDetails userDetails =
                        userDetailsService
                                .loadUserByUsername(username);



                if(jwtService.isTokenValid(
                        token,
                        userDetails
                )){


                    UsernamePasswordAuthenticationToken authenticationToken =
                            new UsernamePasswordAuthenticationToken(

                                    userDetails,

                                    null,

                                    userDetails.getAuthorities()

                            );



                    authenticationToken.setDetails(

                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)

                    );



                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(
                                    authenticationToken
                            );


                }

            }


        }
        catch(Exception exception){


            SecurityContextHolder
                    .clearContext();

        }



        filterChain.doFilter(
                request,
                response
        );

    }






    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {

        String path = request.getServletPath();

        return path.equals("/api/auth/login")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/reset-password")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-resources")
                || path.startsWith("/webjars");
    }





    private String getTokenFromRequest(
            HttpServletRequest request
    ) {


        String authHeader =
                request.getHeader(
                        "Authorization"
                );



        if(StringUtils.hasText(authHeader)
                &&
                authHeader.startsWith("Bearer ")) {


            return authHeader.substring(7);

        }


        return null;

    }


}