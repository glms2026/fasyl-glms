package com.glms.general_ledger_management_system.DTO.user;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserRequest {


    @NotBlank
    private String username;


    @NotBlank
    private String password;


    @Email
    private String email;


    private String firstName;


    private String lastName;


}