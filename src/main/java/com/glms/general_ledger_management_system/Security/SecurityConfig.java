package com.glms.general_ledger_management_system.Security;

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
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
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

    private final PasswordChangeFilter passwordChangeFilter;

    private final JwtAuthenticationEntryPoint authenticationEntryPoint;

    private final CustomUserDetailsService userDetailsService;

    /**
     * =========================================================
     * SECURITY FILTER CHAIN
     * =========================================================
     */
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http
    ) throws Exception {

        http

                /*
                 * =================================================
                 * CSRF
                 * =================================================
                 *
                 * JWT authentication is stateless.
                 */
                .csrf(
                        csrf -> csrf.disable()
                )

                /*
                 * =================================================
                 * CORS
                 * =================================================
                 */
                .cors(
                        cors ->
                                cors.configurationSource(
                                        request -> {

                                            CorsConfiguration configuration =
                                                    new CorsConfiguration();

                                            /*
                                             * Development configuration.
                                             *
                                             * In production, replace "*"
                                             * with trusted frontend origins.
                                             */
                                            configuration
                                                    .setAllowedOriginPatterns(
                                                            List.of("*")
                                                    );

                                            configuration
                                                    .setAllowedMethods(
                                                            List.of(
                                                                    "GET",
                                                                    "POST",
                                                                    "PUT",
                                                                    "PATCH",
                                                                    "DELETE",
                                                                    "OPTIONS"
                                                            )
                                                    );

                                            configuration
                                                    .setAllowedHeaders(
                                                            List.of("*")
                                                    );

                                            configuration
                                                    .setAllowCredentials(
                                                            true
                                                    );

                                            return configuration;
                                        }
                                )
                )

                /*
                 * =================================================
                 * SESSION MANAGEMENT
                 * =================================================
                 */
                .sessionManagement(
                        session ->
                                session.sessionCreationPolicy(
                                        SessionCreationPolicy.STATELESS
                                )
                )

                /*
                 * =================================================
                 * EXCEPTION HANDLING
                 * =================================================
                 */
                .exceptionHandling(
                        exception ->
                                exception.authenticationEntryPoint(
                                        authenticationEntryPoint
                                )
                )

                /*
                 * =================================================
                 * AUTHORIZATION
                 * =================================================
                 */
                .authorizeHttpRequests(
                        auth -> auth

                                /*
                                 * =================================
                                 * AUTHENTICATION ENDPOINTS
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/api/auth/login",
                                        "/api/auth/forgot-password",
                                        "/api/auth/reset-password",
                                        "/error"
                                )
                                .permitAll()

                                /*
                                 * =================================
                                 * SWAGGER / OPENAPI
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/swagger-ui/**",
                                        "/swagger-ui.html",
                                        "/v3/api-docs/**",
                                        "/swagger-resources/**",
                                        "/webjars/**"
                                )
                                .permitAll()

                                /*
                                 * =================================
                                 * CORS PREFLIGHT
                                 * =================================
                                 */
                                .requestMatchers(
                                        HttpMethod.OPTIONS,
                                        "/**"
                                )
                                .permitAll()

                                /*
                                 * =================================
                                 * USER MANAGEMENT
                                 * =================================
                                 *
                                 * Fine-grained permissions are
                                 * enforced by @PreAuthorize.
                                 */
                                .requestMatchers(
                                        "/api/users/**"
                                )
                                .authenticated()

                                /*
                                 * =================================
                                 * ROLE MANAGEMENT
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/api/roles/**"
                                )
                                .authenticated()

                                /*
                                 * =================================
                                 * PERMISSION MANAGEMENT
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/api/permissions/**"
                                )
                                .authenticated()

                                /*
                                 * =================================
                                 * GENERAL LEDGER
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/api/ledgers/**"
                                )
                                .authenticated()

                                /*
                                 * =================================
                                 * ACCOUNTS
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/api/accounts/**"
                                )
                                .authenticated()

                                /*
                                 * =================================
                                 * JOURNAL ENTRIES
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/api/journal-entries/**"
                                )
                                .authenticated()

                                .requestMatchers(
                                        "/api/user-approval-requests/**"
                                )
                                .authenticated()

                                /*
                                 * =================================
                                 * ADMIN APIs
                                 * =================================
                                 */
                                .requestMatchers(
                                        "/api/admin/**"
                                )
                                .hasRole("ADMIN")

                                /*
                                 * =================================
                                 * EVERYTHING ELSE
                                 * =================================
                                 */
                                .anyRequest()
                                .authenticated()
                )

                /*
                 * =================================================
                 * AUTHENTICATION PROVIDER
                 * =================================================
                 */
                .authenticationProvider(
                        authenticationProvider()
                )

                /*
                 * =================================================
                 * JWT FILTER
                 * =================================================
                 */
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                )

                /*
                 * =================================================
                 * MANDATORY PASSWORD CHANGE
                 * =================================================
                 *
                 * Runs after JWT authentication so it can inspect
                 * the authenticated user's mustChangePassword flag.
                 */
                .addFilterAfter(
                        passwordChangeFilter,
                        JwtAuthenticationFilter.class
                );

        return http.build();
    }

    /**
     * =========================================================
     * AUTHENTICATION PROVIDER
     * =========================================================
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {

        DaoAuthenticationProvider provider =
                new DaoAuthenticationProvider(
                        userDetailsService
                );

        provider.setPasswordEncoder(
                passwordEncoder()
        );

        return provider;
    }

    /**
     * =========================================================
     * PASSWORD ENCODER
     * =========================================================
     */
    @Bean
    public PasswordEncoder passwordEncoder() {

        return new BCryptPasswordEncoder();
    }

    /**
     * =========================================================
     * AUTHENTICATION MANAGER
     * =========================================================
     */
    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration configuration
    ) throws Exception {

        return configuration.getAuthenticationManager();
    }
}