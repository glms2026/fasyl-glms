package com.glms.general_ledger_management_system.DTO.user;


import com.glms.general_ledger_management_system.Model.UserStatus;

import lombok.*;


import java.util.Set;



@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {


    private Long id;


    private String username;


    private String email;


    private UserStatus status;


    private Set<String> roles;


}