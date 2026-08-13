package com.glms.general_ledger_management_system.DTO.auth;


import lombok.*;

import java.util.Set;


@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {


    private String accessToken;


    private String refreshToken;


    private String username;


    private String role;


    /**
     * When true, the client must force the user to change
     * their password before accessing any other endpoint.
     */
    @Builder.Default
    private boolean passwordChangeRequired = false;


    /**
     * Effective permission names granted through the user's roles.
     */
    @Builder.Default
    private Set<String> permissions = Set.of();


}