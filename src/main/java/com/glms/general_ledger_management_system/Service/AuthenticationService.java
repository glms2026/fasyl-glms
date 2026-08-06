package com.glms.general_ledger_management_system.Service;


import com.glms.general_ledger_management_system.DTO.auth.*;

import com.glms.general_ledger_management_system.Model.*;

import com.glms.general_ledger_management_system.Repository.AuditLogRepository;
import com.glms.general_ledger_management_system.Repository.JwtTokenRepository;
import com.glms.general_ledger_management_system.Repository.PasswordResetTokenRepository;
import com.glms.general_ledger_management_system.Repository.UserRepository;

import com.glms.general_ledger_management_system.Security.JwtService;


import lombok.RequiredArgsConstructor;


import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDateTime;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Transactional
public class AuthenticationService {



    private final AuthenticationManager authenticationManager;

    private final UserRepository userRepository;

    private final JwtService jwtService;

    private final JwtTokenRepository jwtTokenRepository;

    private final AuditLogRepository auditLogRepository;

    private final PasswordEncoder passwordEncoder;

    private final PasswordResetTokenRepository passwordResetTokenRepository;

    private final RefreshTokenService refreshTokenService;



    /**
     * User Login
     */
    public LoginResponse login(
            LoginRequest request
    ) {


        /*
         * Find User Before Authentication
         */
        User user =
                userRepository
                        .findByUsername(request.getUsername())
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "User not found"
                                        )
                        );



        /*
         * Check User Status
         */
        validateUserStatus(user);



        /*
         * Authenticate Username and Password
         */
        Authentication authentication =
                authenticationManager.authenticate(

                        new UsernamePasswordAuthenticationToken(

                                request.getUsername(),

                                request.getPassword()

                        )
                );



        /*
         * Get Authenticated User Details
         */
        UserDetails userDetails =
                (UserDetails)
                        authentication.getPrincipal();




        /*
         * Generate JWT Token
         */
        String accessToken =
                jwtService.generateToken(
                        userDetails
                );

        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(
                        user
                );


        /*
         * Save JWT Token
         */
        saveUserToken(
                user,
                accessToken
        );




        /*
         * Create Login Audit Log
         */
        createAuditLog(

                user.getUsername(),

                "LOGIN",

                "User logged in successfully"

        );




        return LoginResponse.builder()

                .accessToken(accessToken)

                .refreshToken(
                        refreshToken.getToken()
                )

                .username(
                        user.getUsername()
                )

                .role(
                        user.getRoles()
                                .stream()
                                .findFirst()
                                .map(
                                        role ->
                                                role.getName()
                                )
                                .orElse(null)
                )

                .build();

    }






    /**
     * Validate User Status
     */
    private void validateUserStatus(
            User user
    ) {


        if(user.getStatus()
                == UserStatus.LOCKED) {


            throw new RuntimeException(
                    "Account is locked"
            );

        }



        if(user.getStatus()
                == UserStatus.SUSPENDED) {


            throw new RuntimeException(
                    "Account is suspended"
            );

        }




        if(user.getStatus()
                == UserStatus.INACTIVE) {


            throw new RuntimeException(
                    "Account is inactive"
            );

        }




        if(user.getStatus()
                == UserStatus.PASSWORD_EXPIRED) {


            throw new RuntimeException(
                    "Password expired. Please change your password"
            );

        }

    }






    /**
     * Save JWT Token
     */
    private void saveUserToken(
            User user,
            String token
    ) {


        JwtToken jwtToken =
                JwtToken.builder()

                        .token(token)

                        .revoked(false)

                        .user(user)

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .build();



        jwtTokenRepository.save(
                jwtToken
        );

    }






    /**
     * Create Audit Log
     */
    private void createAuditLog(
            String username,
            String action,
            String description
    ) {


        AuditLog auditLog =
                AuditLog.builder()

                        .username(username)

                        .action(action)

                        .description(description)

                        .createdAt(
                                LocalDateTime.now()
                        )

                        .build();



        auditLogRepository.save(
                auditLog
        );

    }



    /**
     * Change Current User Password
     */
    public void changePassword(
            ChangePasswordRequest request
    ) {


        String username =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();



        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "User not found"
                                        )
                        );



        if(!passwordEncoder.matches(
                request.getOldPassword(),
                user.getPassword()
        )) {


            throw new RuntimeException(
                    "Old password is incorrect"
            );

        }



        if(!request.getNewPassword()
                .equals(
                        request.getConfirmPassword()
                )) {


            throw new RuntimeException(
                    "Password confirmation does not match"
            );

        }



        if(passwordEncoder.matches(
                request.getNewPassword(),
                user.getPassword()
        )) {


            throw new RuntimeException(
                    "New password cannot be the same as old password"
            );

        }



        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );



        userRepository.save(user);



        revokeUserTokens(user);



        createAuditLog(

                user.getUsername(),

                "CHANGE_PASSWORD",

                "User changed password successfully"

        );


    }





    /**
     * Generate Password Reset Token
     */
    public void forgotPassword(
            ForgotPasswordRequest request
    ) {


        User user =
                userRepository
                        .findByEmail(
                                request.getEmail()
                        )
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Email not found"
                                        )
                        );



        String token =
                UUID.randomUUID()
                        .toString();



        PasswordResetToken resetToken =
                PasswordResetToken.builder()

                        .token(token)

                        .user(user)

                        .expiryDate(
                                LocalDateTime.now()
                                        .plusMinutes(30)
                        )

                        .build();



        passwordResetTokenRepository.save(
                resetToken
        );



        createAuditLog(

                user.getUsername(),

                "FORGOT_PASSWORD",

                "Password reset token generated"

        );


        /*
         * Later integrate email service
         *
         * Send reset link containing token
         */

    }




    /**
     * Reset Password
     */
    public void resetPassword(
            ResetPasswordRequest request
    ) {


        PasswordResetToken resetToken =
                passwordResetTokenRepository
                        .findByToken(
                                request.getToken()
                        )
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Invalid reset token"
                                        )
                        );



        if(resetToken.getExpiryDate()
                .isBefore(
                        LocalDateTime.now()
                )) {


            throw new RuntimeException(
                    "Reset token expired"
            );

        }



        if(!request.getNewPassword()
                .equals(
                        request.getConfirmPassword()
                )) {


            throw new RuntimeException(
                    "Passwords do not match"
            );

        }



        User user =
                resetToken.getUser();



        user.setPassword(

                passwordEncoder.encode(
                        request.getNewPassword()
                )

        );



        userRepository.save(user);



        revokeUserTokens(user);



        passwordResetTokenRepository
                .delete(
                resetToken
        );



        createAuditLog(

                user.getUsername(),

                "RESET_PASSWORD",

                "Password reset successfully"

        );


    }





    /**
     * Revoke All Existing Tokens
     */
    private void revokeUserTokens(
            User user
    ) {


        var tokens =
                jwtTokenRepository
                        .findAllByUser(user);



        tokens.forEach
                (
                token ->
                        token.setRevoked(true)
        );



        jwtTokenRepository.saveAll(tokens);

    }



    /**
     * Refresh Access Token
     */
    public LoginResponse refreshToken(
            RefreshTokenRequest request
    ) {

        RefreshToken refreshToken =
                refreshTokenService.verifyToken(

                        refreshTokenService.findByToken(
                                request.getRefreshToken()
                        )

                );


        User user =
                refreshToken.getUser();


        validateUserStatus(user);


        UserDetails userDetails =
                org.springframework.security.core.userdetails.User

                        .withUsername(
                                user.getUsername()
                        )

                        .password(
                                user.getPassword()
                        )

                        .authorities(

                                user.getRoles()
                                        .stream()
                                        .map(Role::getName)
                                        .toArray(String[]::new)

                        )

                        .build();


        String accessToken =
                jwtService.generateToken(
                        userDetails
                );


        saveUserToken(
                user,
                accessToken
        );


        createAuditLog(

                user.getUsername(),

                "REFRESH_TOKEN",

                "Access token refreshed"

        );


        return LoginResponse.builder()

                .accessToken(
                        accessToken
                )

                .refreshToken(
                        refreshToken.getToken()
                )

                .username(
                        user.getUsername()
                )

                .role(
                        user.getRoles()
                                .stream()
                                .findFirst()
                                .map(Role::getName)
                                .orElse(null)
                )

                .build();

    }





    /**
     * Logout User
     */
    public void logout(String token) {


        JwtToken jwtToken =
                jwtTokenRepository
                        .findByToken(token)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "Token not found"
                                        )
                        );


        jwtToken.setRevoked(true);


        jwtTokenRepository.save(jwtToken);



        createAuditLog(

                jwtToken.getUser()
                        .getUsername(),

                "LOGOUT",

                "User logged out successfully"

        );

    }


}