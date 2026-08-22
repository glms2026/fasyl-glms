package com.glms.general_ledger_management_system.controller;


import com.glms.general_ledger_management_system.DTO.auth.*;

import com.glms.general_ledger_management_system.DTO.user.UserResponse;

import com.glms.general_ledger_management_system.Model.postgres.User;
import com.glms.general_ledger_management_system.Repository.postgres.UserRepository;

import com.glms.general_ledger_management_system.Service.AuthenticationService;


import jakarta.validation.Valid;


import jakarta.persistence.EntityNotFoundException;

import lombok.RequiredArgsConstructor;


import org.springframework.http.ResponseEntity;

import org.springframework.security.access.AccessDeniedException;
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
                    .body("Please provide a valid Authorization header to log out.");

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
            throw new AccessDeniedException("Your session isn't authenticated - please sign in again.");
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
                                () -> new EntityNotFoundException(
                                        "We couldn't find the account tied to your session - please sign in again."
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