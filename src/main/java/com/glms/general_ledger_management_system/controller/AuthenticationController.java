package com.glms.general_ledger_management_system.controller;


import com.glms.general_ledger_management_system.DTO.auth.*;

import com.glms.general_ledger_management_system.DTO.user.UserResponse;

import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Repository.UserRepository;

import com.glms.general_ledger_management_system.Service.AuthenticationService;


import jakarta.validation.Valid;


import lombok.RequiredArgsConstructor;


import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;


import org.springframework.web.bind.annotation.*;



@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
//@PreAuthorize("hasAnyRole('AUTHORIZER', 'ADMIN', 'CONTROL', 'CREATOR')")
public class AuthenticationController {



    private final AuthenticationService authenticationService;


    private final UserRepository userRepository;





    /**
     * Login
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid
            @RequestBody LoginRequest request
    ) {


        return ResponseEntity.ok(
                authenticationService.login(request)
        );

    }




    @PostMapping("/refresh-token")
    public ResponseEntity<LoginResponse> refreshToken(
            @Valid
            @RequestBody RefreshTokenRequest request
    ) {

        LoginResponse response =
                authenticationService.refreshToken(request);

        return ResponseEntity.ok(response);
    }





    /**
     * Logout
     */
    @PostMapping("/logout")
    public ResponseEntity<String> logout(
            @RequestHeader("Authorization")
            String authorizationHeader
    ) {


        if(authorizationHeader == null ||
                !authorizationHeader.startsWith("Bearer ")) {


            return ResponseEntity
                    .badRequest()
                    .body("Invalid Authorization header");

        }



        String token =
                authorizationHeader.substring(7);



        authenticationService.logout(token);



        SecurityContextHolder.clearContext();



        return ResponseEntity.ok(
                "Logout successful"
        );

    }







    /**
     * Change Password
     */
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @Valid
            @RequestBody ChangePasswordRequest request
    ) {


        authenticationService.changePassword(request);



        return ResponseEntity.ok(
                "Password changed successfully"
        );

    }







    /**
     * Forgot Password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(
            @Valid
            @RequestBody ForgotPasswordRequest request
    ) {


        authenticationService.forgotPassword(request);



        return ResponseEntity.ok(
                "Password reset link generated"
        );

    }







    /**
     * Reset Password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(
            @Valid
            @RequestBody ResetPasswordRequest request
    ) {


        authenticationService.resetPassword(request);



        return ResponseEntity.ok(
                "Password reset successful"
        );

    }







    /**
     * Current User Profile
     */
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> profile() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("User not authenticated");
        }



        String username =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();

        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(
                                () -> new RuntimeException(
                                        "User not found"
                                )
                        );

        UserResponse response =
                UserResponse.builder()

                        .id(user.getId())

                        .username(user.getUsername())

                        .email(user.getEmail())

                        .status(String.valueOf(user.getStatus()))

                        .roles(
                                user.getRoles()
                                        .stream()
                                        .map(role -> role.getName())
                                        .collect(java.util.stream.Collectors.toSet())
                        )

                        .build();

        return ResponseEntity.ok(response);

    }


}