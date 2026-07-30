package com.glms.general_ledger_management_system.Config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;

import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;

import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "Bearer Authentication";

    @Bean
    public OpenAPI customOpenAPI() {

        return new OpenAPI()

                .info(
                        new Info()
                                .title("General Ledger Management System (GLMS) API")
                                .version("1.0.0")
                                .description("""
                                        Enterprise General Ledger Management System.

                                        Features:
                                        - JWT Authentication
                                        - User Management
                                        - Role Based Access Control
                                        - Ledger Management
                                        - Audit Logging
                                        """)
                                .contact(
                                        new Contact()
                                                .name("GLMS Development Team")
                                                .email("support@glms.com")
                                )
                )

                .addSecurityItem(
                        new SecurityRequirement()
                                .addList(SECURITY_SCHEME_NAME)
                )

                .components(
                        new Components()
                                .addSecuritySchemes(
                                        SECURITY_SCHEME_NAME,
                                        new SecurityScheme()
                                                .name(SECURITY_SCHEME_NAME)
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );
    }
}