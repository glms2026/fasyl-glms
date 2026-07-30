package com.glms.general_ledger_management_system.DTO.auth;


import lombok.*;


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


}