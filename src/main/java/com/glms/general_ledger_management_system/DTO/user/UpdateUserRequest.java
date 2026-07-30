package com.glms.general_ledger_management_system.DTO.user;


import lombok.*;


@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequest {


    private String firstName;


    private String lastName;


    private String email;


    private boolean active;


}