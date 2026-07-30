package com.glms.general_ledger_management_system.Security;

import com.glms.general_ledger_management_system.Security.JwtAuthenticationEntryPoint;
import com.glms.general_ledger_management_system.Security.JwtAuthenticationFilter;
import com.glms.general_ledger_management_system.Service.CustomUserDetailsService;

import lombok.RequiredArgsConstructor;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;

import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;

import java.util.List;


@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {


    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    private final CustomUserDetailsService userDetailsService;



    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {


        http

                // Disable CSRF because JWT is stateless
                .csrf(csrf -> csrf.disable())


                // CORS Configuration
                .cors(cors -> cors.configurationSource(request -> {

                    CorsConfiguration configuration =
                            new CorsConfiguration();


                    configuration.setAllowedOriginPatterns(
                            List.of("*")
                    );


                    configuration.setAllowedMethods(
                            List.of(
                                    "GET",
                                    "POST",
                                    "PUT",
                                    "DELETE",
                                    "PATCH",
                                    "OPTIONS"
                            )
                    );


                    configuration.setAllowedHeaders(
                            List.of("*")
                    );


                    configuration.setAllowCredentials(true);


                    return configuration;

                }))


                // JWT does not use sessions
                .sessionManagement(session ->
                        session.sessionCreationPolicy(
                                SessionCreationPolicy.STATELESS
                        )
                )


                // Handle unauthorized requests
                .exceptionHandling(exception ->
                        exception.authenticationEntryPoint(
                                authenticationEntryPoint
                        )
                )


                // Authorization Rules
                .authorizeHttpRequests(auth -> auth


                        // Authentication endpoints
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/forgot-password",
                                "/api/auth/reset-password"
                        )
                        .permitAll()


                        // Swagger
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/swagger-resources/**",
                                "/webjars/**"
                        )
                        .permitAll()



                        // Admin APIs
                        .requestMatchers(
                                "/api/admin/**"
                        )
                        .hasRole("ADMIN")


                        .requestMatchers(
                                "/api/users/**"
                        )
                        .hasRole("ADMIN")


                        .requestMatchers(
                                "/api/roles/**"
                        )
                        .hasRole("ADMIN")


                        .requestMatchers(
                                "/api/permissions/**"
                        )
                        .hasRole("ADMIN")



                        // GLMS Business APIs
                        .requestMatchers(
                                "/api/ledgers/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "USER"
                        )


                        .requestMatchers(
                                "/api/accounts/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "USER"
                        )


                        .requestMatchers(
                                "/api/journal-entries/**"
                        )
                        .hasAnyRole(
                                "ADMIN",
                                "USER"
                        )



                        // Allow browser preflight requests
                        .requestMatchers(
                                HttpMethod.OPTIONS,
                                "/**"
                        )
                        .permitAll()



                        // All other endpoints require login
                        .anyRequest()
                        .authenticated()

                )



                // Authentication Provider
                .authenticationProvider(
                        authenticationProvider()
                )


                // JWT Filter
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );


        return http.build();
    }




    @Bean
    public AuthenticationProvider authenticationProvider() {


        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(userDetailsService);


//        provider.
//                setUserDetailsService(
//                userDetailsService
//        );


        provider.setPasswordEncoder(
                passwordEncoder()
        );


        return provider;
    }




    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();

    }




    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration

    ) throws Exception {


        return configuration.getAuthenticationManager();

    }

}