package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.DTO.auth.*;
import com.glms.general_ledger_management_system.Model.postgres.*;
import com.glms.general_ledger_management_system.Repository.postgres.AuditLogRepository;
import com.glms.general_ledger_management_system.Repository.postgres.JwtTokenRepository;
import com.glms.general_ledger_management_system.Repository.postgres.PasswordResetTokenRepository;
import com.glms.general_ledger_management_system.Repository.postgres.UserRepository;
import com.glms.general_ledger_management_system.Security.JwtService;

import lombok.RequiredArgsConstructor;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
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

    private final UserService userService;


    /**
     * =========================================================
     * USER LOGIN
     * =========================================================
     */
    @Transactional(
            noRollbackFor = BadCredentialsException.class
    )
    public LoginResponse login(LoginRequest request) {

        if (request == null
                || request.getUsername() == null
                || request.getUsername().isBlank()) {

            throw new IllegalArgumentException(
                    "Please enter your username to continue."
            );
        }

        if (request.getPassword() == null
                || request.getPassword().isBlank()) {

            throw new IllegalArgumentException(
                    "Please enter your password to continue."
            );
        }

        String username = request.getUsername().trim();


        /*
         * =====================================================
         * FIND USER
         * =====================================================
         */
        User user =
                userRepository
                        .findByUsernameIgnoreCase(username)
                        .orElseThrow(
                                () ->
                                        new UsernameNotFoundException(
                                                "We couldn't match that username and password. Please double-check your details and try again."
                                        )
                        );


        /*
         * =====================================================
         * VALIDATE USER STATUS
         * =====================================================
         */
        validateUserStatus(user);


        /*
         * =====================================================
         * AUTHENTICATE USERNAME + PASSWORD
         * =====================================================
         */
        Authentication authentication;

        try {

            authentication =
                    authenticationManager.authenticate(
                            new UsernamePasswordAuthenticationToken(
                                    username,
                                    request.getPassword()
                            )
                    );

        } catch (BadCredentialsException ex) {

            increaseFailedAttempts(user);

            throw new BadCredentialsException(
                    "We couldn't match that username and password. Please double-check your details and try again."
            );
        }


        /*
         * =====================================================
         * GET AUTHENTICATED USER DETAILS
         * =====================================================
         */
        UserDetails userDetails =
                (UserDetails) authentication.getPrincipal();


        /*
         * =====================================================
         * RESET FAILED LOGIN ATTEMPTS
         * =====================================================
         */
        if (user.getFailedLoginAttempts() != null
                && user.getFailedLoginAttempts() > 0) {

            user.setFailedLoginAttempts(0);

            userRepository.save(user);
        }


        /*
         * =====================================================
         * GENERATE ACCESS TOKEN
         * =====================================================
         */
        String accessToken =
                jwtService.generateToken(
                        userDetails
                );


        /*
         * =====================================================
         * CREATE REFRESH TOKEN
         * =====================================================
         */
        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(
                        user
                );


        /*
         * =====================================================
         * SAVE ACCESS TOKEN
         * =====================================================
         */
        saveUserToken(
                user,
                accessToken
        );


        /*
         * =====================================================
         * AUDIT LOG
         * =====================================================
         */
        createAuditLog(
                user.getUsername(),
                "LOGIN",
                "User logged in successfully"
        );


        /*
         * =====================================================
         * RETURN LOGIN RESPONSE
         * =====================================================
         */
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .username(user.getUsername())
                .role(getPrimaryRole(user))
                .passwordChangeRequired(
                        user.isMustChangePassword()
                )
                .permissions(
                        getPermissionNames(user)
                )
                .build();
    }


    /**
     * =========================================================
     * GET PERMISSION NAMES
     * =========================================================
     */
    private Set<String> getPermissionNames(
            User user
    ) {

        Set<String> permissionNames =
                new HashSet<>();

        if (user.getRoles() != null) {

            for (Role role : user.getRoles()) {

                if (role == null
                        || role.getPermissions() == null) {

                    continue;
                }

                for (Permission permission :
                        role.getPermissions()) {

                    if (permission == null
                            || permission.getName() == null) {

                        continue;
                    }

                    permissionNames.add(
                            permission.getName()
                                    .trim()
                                    .toUpperCase(
                                            Locale.ROOT
                                    )
                    );
                }
            }
        }

        return permissionNames;
    }


    /**
     * =========================================================
     * VALIDATE USER STATUS
     * =========================================================
     */
    private void validateUserStatus(User user) {

        if (user == null) {

            throw new IllegalArgumentException(
                    "User cannot be null"
            );
        }

        UserStatus status = user.getStatus();


        /*
         * LOCKED
         *
         * Locks are temporary: if the configured duration has
         * expired, the account is auto-unlocked (no approval
         * needed) and the login is allowed to proceed.
         */
        if (UserStatus.LOCKED.equals(status)) {

            if (userService.unlockIfExpired(user)) {

                return;
            }

            throw new IllegalStateException(
                    "Your account is temporarily locked. It will unlock automatically in a few minutes - please try again shortly."
            );
        }


        /*
         * SUSPENDED
         */
        if (UserStatus.SUSPENDED.equals(status)) {

            throw new IllegalStateException(
                    "Your account has been suspended. Please contact your administrator for assistance."
            );
        }


        /*
         * DELETED
         */
        if (UserStatus.DELETED.equals(status)) {

            throw new IllegalStateException(
                    "This account has been deleted. Please contact your administrator if you believe this is a mistake."
            );
        }


        /*
         * REJECTED
         */
        if (UserStatus.REJECTED.equals(status)) {

            throw new IllegalStateException(
                    "Your account was not approved. Please contact your administrator for assistance."
            );
        }


        /*
         * INACTIVE
         */
        if (UserStatus.INACTIVE.equals(status)) {

            throw new IllegalStateException(
                    "You haven't been approved yet - your account is waiting for an Authorizer to activate it."
            );
        }


        /*
         * PASSWORD EXPIRED
         */
        if (UserStatus.PASSWORD_EXPIRED.equals(status)) {

            throw new IllegalStateException(
                    "Your password has expired - let's get you a new one. Please set a fresh password to continue."
            );
        }
    }


    /**
     * =========================================================
     * INCREASE FAILED LOGIN ATTEMPTS
     * =========================================================
     */
    private void increaseFailedAttempts(User user) {

        int attempts =
                user.getFailedLoginAttempts() == null
                        ? 1
                        : user.getFailedLoginAttempts() + 1;


        user.setFailedLoginAttempts(attempts);


        /*
         * Lock account after 5 failed attempts.
         */
        if (attempts >= 5) {

            user.setStatus(
                    UserStatus.LOCKED
            );

            user.setLockoutTime(
                    LocalDateTime.now()
            );

            user.setLockedAt(
                    ZonedDateTime.now()
            );


            /*
             * Revoke existing refresh tokens.
             */
            refreshTokenService.revokeAllUserTokens(
                    user.getId()
            );


            /*
             * Audit account lock.
             */
            createAuditLog(
                    user.getUsername(),
                    "LOCK_USER",
                    "Account locked due to multiple failed login attempts"
            );
        }


        userRepository.save(user);
    }


    /**
     * =========================================================
     * SAVE JWT TOKEN
     * =========================================================
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


        jwtTokenRepository.save(jwtToken);
    }


    /**
     * =========================================================
     * CREATE AUDIT LOG
     * =========================================================
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


        auditLogRepository.save(auditLog);
    }


    /**
     * =========================================================
     * CHANGE CURRENT USER PASSWORD
     * =========================================================
     */
    public void changePassword(
            ChangePasswordRequest request
    ) {

        if (request == null) {

            throw new IllegalArgumentException(
                    "Please provide your password details to continue."
            );
        }


        String username =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getName();


        User user =
                userRepository
                        .findByUsernameIgnoreCase(username)
                        .orElseThrow(
                                () ->
                                        new UsernameNotFoundException(
                                                "We couldn't find your account - please sign in again and try."
                                        )
                        );


        /*
         * Verify old password.
         */
        if (!passwordEncoder.matches(
                request.getOldPassword(),
                user.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "That's not your current password - please double-check and try again."
            );
        }


        /*
         * Confirm new password.
         */
        if (!request.getNewPassword()
                .equals(
                        request.getConfirmPassword()
                )) {

            throw new IllegalArgumentException(
                    "The new password and its confirmation don't match - please re-enter them."
            );
        }


        /*
         * Enforce password complexity.
         */
        validateNewPassword(
                request.getNewPassword()
        );


        /*
         * Prevent reuse of old password.
         */
        if (passwordEncoder.matches(
                request.getNewPassword(),
                user.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "Your new password must be different from your current one - pick something fresh!"
            );
        }


        /*
         * Update password.
         */
        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );


        /*
         * Mandatory password change is satisfied.
         */
        if (user.isMustChangePassword()) {

            user.setMustChangePassword(false);
        }


        userRepository.save(user);


        /*
         * Revoke all existing access tokens.
         */
        revokeUserTokens(user);


        /*
         * Revoke all refresh tokens.
         */
        refreshTokenService.revokeAllUserTokens(
                user.getId()
        );


        /*
         * Audit.
         */
        createAuditLog(
                user.getUsername(),
                "CHANGE_PASSWORD",
                "User changed password successfully"
        );
    }


    /**
     * =========================================================
     * FORGOT PASSWORD
     * =========================================================
     */
    public void forgotPassword(
            ForgotPasswordRequest request
    ) {

        if (request == null
                || request.getEmail() == null
                || request.getEmail().isBlank()) {

            throw new IllegalArgumentException(
                    "Please enter your email address."
            );
        }


        User user =
                userRepository
                        .findByEmail(
                                request.getEmail().trim()
                        )
                        .orElseThrow(
                                () ->
                                        new UsernameNotFoundException(
                                                "If that email is registered, you'll receive a password reset link shortly."
                                        )
                        );


        String token =
                UUID.randomUUID().toString();


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
         * TODO:
         * Send password reset token through email service.
         */
    }


    /**
     * =========================================================
     * RESET PASSWORD
     * =========================================================
     */
    public void resetPassword(
            ResetPasswordRequest request
    ) {

        if (request == null
                || request.getToken() == null
                || request.getToken().isBlank()) {

            throw new IllegalArgumentException(
                    "Please provide your password reset token."
            );
        }


        PasswordResetToken resetToken =
                passwordResetTokenRepository
                        .findByToken(
                                request.getToken()
                        )
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "This reset link is invalid - please request a new one."
                                        )
                        );


        /*
         * Check token expiration.
         */
        if (resetToken.getExpiryDate()
                .isBefore(
                        LocalDateTime.now()
                )) {

            throw new IllegalArgumentException(
                    "This password reset link has expired - please request a new one."
            );
        }


        /*
         * Confirm password.
         */
        if (!request.getNewPassword()
                .equals(
                        request.getConfirmPassword()
                )) {

            throw new IllegalArgumentException(
                    "The new password and its confirmation don't match - please re-enter them."
            );
        }


        User user =
                resetToken.getUser();


        /*
         * Enforce password complexity.
         */
        validateNewPassword(
                request.getNewPassword()
        );


        /*
         * Update password.
         */
        user.setPassword(
                passwordEncoder.encode(
                        request.getNewPassword()
                )
        );


        /*
         * Mandatory password change is satisfied.
         */
        if (user.isMustChangePassword()) {

            user.setMustChangePassword(false);
        }


        /*
         * If the account was PASSWORD_EXPIRED,
         * successful password reset restores it.
         */
        if (UserStatus.PASSWORD_EXPIRED.equals(
                user.getStatus()
        )) {

            user.setStatus(
                    UserStatus.ACTIVE
            );
        }


        userRepository.save(user);


        /*
         * Revoke access tokens.
         */
        revokeUserTokens(user);


        /*
         * Revoke refresh tokens.
         */
        refreshTokenService.revokeAllUserTokens(
                user.getId()
        );


        /*
         * Delete used reset token.
         */
        passwordResetTokenRepository.delete(
                resetToken
        );


        /*
         * Audit.
         */
        createAuditLog(
                user.getUsername(),
                "RESET_PASSWORD",
                "Password reset successfully"
        );
    }


    /**
     * =========================================================
     * VALIDATE NEW PASSWORD COMPLEXITY
     * =========================================================
     */
    private void validateNewPassword(
            String newPassword
    ) {

        if (newPassword == null
                || newPassword.length() < 8
                || newPassword.length() > 100) {

            throw new IllegalArgumentException(
                    "Your new password needs to be between 8 and 100 characters."
            );
        }

        if (!newPassword.matches(".*[A-Z].*")) {

            throw new IllegalArgumentException(
                    "Add at least one uppercase letter (A-Z) to your new password."
            );
        }

        if (!newPassword.matches(".*[a-z].*")) {

            throw new IllegalArgumentException(
                    "Add at least one lowercase letter (a-z) to your new password."
            );
        }

        if (!newPassword.matches(".*\\d.*")) {

            throw new IllegalArgumentException(
                    "Include at least one number (0-9) in your new password."
            );
        }

        if (!newPassword.matches(".*[^A-Za-z0-9].*")) {

            throw new IllegalArgumentException(
                    "Include at least one special character (like @, #, or !) in your new password."
            );
        }
    }


    /**
     * =========================================================
     * REVOKE ALL JWT TOKENS
     * =========================================================
     */
    private void revokeUserTokens(
            User user
    ) {

        var tokens =
                jwtTokenRepository
                        .findAllByUser(user);


        tokens.forEach(
                token ->
                        token.setRevoked(true)
        );


        jwtTokenRepository.saveAll(
                tokens
        );
    }


    /**
     * =========================================================
     * REFRESH ACCESS TOKEN
     * =========================================================
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


        /*
         * Check account status.
         */
        validateUserStatus(user);


        /*
         * Build authorities exactly the same way
         * as CustomUserDetailsService.
         */
        UserDetails userDetails =
                buildUserDetails(user);


        /*
         * Generate new access token.
         */
        String accessToken =
                jwtService.generateToken(
                        userDetails
                );


        /*
         * Save new access token.
         */
        saveUserToken(
                user,
                accessToken
        );


        /*
         * Audit.
         */
        createAuditLog(
                user.getUsername(),
                "REFRESH_TOKEN",
                "Access token refreshed"
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
                        getPrimaryRole(user)
                )
                .passwordChangeRequired(
                        user.isMustChangePassword()
                )
                .permissions(
                        getPermissionNames(user)
                )
                .build();
    }


    /**
     * =========================================================
     * BUILD USER DETAILS FOR TOKEN REFRESH
     * =========================================================
     */
    private UserDetails buildUserDetails(
            User user
    ) {

        Set<SimpleGrantedAuthority> authorities =
                new HashSet<>();


        if (user.getRoles() != null) {

            for (Role role :
                    user.getRoles()) {

                if (role == null
                        || role.getName() == null) {

                    continue;
                }


                String roleName =
                        role.getName()
                                .trim()
                                .toUpperCase(
                                        Locale.ROOT
                                );


                if (roleName.isEmpty()) {
                    continue;
                }


                /*
                 * Role authority.
                 *
                 * ADMIN -> ROLE_ADMIN
                 */
                authorities.add(
                        new SimpleGrantedAuthority(
                                "ROLE_" + roleName
                        )
                );


                /*
                 * Permission authorities.
                 */
                if (role.getPermissions() != null) {

                    for (Permission permission :
                            role.getPermissions()) {

                        if (permission == null
                                || permission.getName() == null) {

                            continue;
                        }


                        String permissionName =
                                permission.getName()
                                        .trim()
                                        .toUpperCase(
                                                Locale.ROOT
                                        );


                        if (permissionName.isEmpty()) {
                            continue;
                        }


                        authorities.add(
                                new SimpleGrantedAuthority(
                                        permissionName
                                )
                        );
                    }
                }
            }
        }


        return org.springframework.security.core.userdetails.User
                .builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(
                        UserStatus.LOCKED.equals(
                                user.getStatus()
                        )
                )
                .credentialsExpired(
                        UserStatus.PASSWORD_EXPIRED.equals(
                                user.getStatus()
                        )
                )
                .disabled(
                        UserStatus.INACTIVE.equals(
                                user.getStatus()
                        )
                                || UserStatus.SUSPENDED.equals(
                                user.getStatus()
                        )
                                || UserStatus.DELETED.equals(
                                user.getStatus()
                        )
                                || UserStatus.REJECTED.equals(
                                user.getStatus()
                        )
                )
                .build();
    }


    /**
     * =========================================================
     * GET PRIMARY ROLE
     * =========================================================
     */
    private String getPrimaryRole(
            User user
    ) {

        if (user.getRoles() == null
                || user.getRoles().isEmpty()) {

            return null;
        }


        return user.getRoles()
                .stream()
                .filter(
                        role ->
                                role != null
                                        && role.getName() != null
                )
                .map(
                        Role::getName
                )
                .findFirst()
                .orElse(null);
    }


    /**
     * =========================================================
     * LOGOUT USER
     * =========================================================
     */
    public void logout(
            String token
    ) {

        if (token == null
                || token.isBlank()) {

            throw new IllegalArgumentException(
                    "Please provide a valid access token to log out."
            );
        }


        JwtToken jwtToken =
                jwtTokenRepository
                        .findByToken(token)
                        .orElseThrow(
                                () ->
                                        new IllegalArgumentException(
                                                "This session is no longer valid - you may already be logged out."
                                        )
                        );


        jwtToken.setRevoked(true);


        jwtTokenRepository.save(
                jwtToken
        );


        /*
         * Revoke refresh tokens.
         */
        refreshTokenService.revokeAllUserTokens(
                jwtToken.getUser().getId()
        );


        /*
         * Audit.
         */
        createAuditLog(
                jwtToken.getUser().getUsername(),
                "LOGOUT",
                "User logged out successfully"
        );
    }
}