package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.DTO.auth.ChangePasswordRequest;
import com.glms.general_ledger_management_system.DTO.auth.LoginRequest;
import com.glms.general_ledger_management_system.DTO.auth.LoginResponse;
import com.glms.general_ledger_management_system.Model.*;
import com.glms.general_ledger_management_system.Repository.*;
import com.glms.general_ledger_management_system.Security.JwtService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private JwtTokenRepository jwtTokenRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private RefreshTokenService refreshTokenService;

    private AuthenticationService service;

    @BeforeEach
    void setUp() {
        service = new AuthenticationService(
                authenticationManager,
                userRepository,
                jwtService,
                jwtTokenRepository,
                auditLogRepository,
                passwordEncoder,
                passwordResetTokenRepository,
                refreshTokenService
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private User activeUser(boolean mustChange) {
        Permission permission = Permission.builder().id(1L).name("LEDGER_READ").build();
        Role role = Role.builder().id(1L).name("CREATOR")
                .permissions(new HashSet<>(Set.of(permission)))
                .build();
        return User.builder()
                .id(7L)
                .username("creator")
                .password("stored-hash")
                .status(UserStatus.ACTIVE)
                .mustChangePassword(mustChange)
                .roles(new HashSet<>(Set.of(role)))
                .failedLoginAttempts(0)
                .build();
    }

    private UserDetails userDetailsFor(User user) {
        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(List.of(new SimpleGrantedAuthority("ROLE_CREATOR")))
                .build();
    }

    // ------------------------------------------------------------------

    @Test
    void login_blocksInactiveUser() {
        User inactive = activeUser(false);
        inactive.setStatus(UserStatus.INACTIVE);
        when(userRepository.findByUsernameIgnoreCase("creator")).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> service.login(
                new LoginRequest("creator", "whatever")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("inactive");
    }

    @Test
    void login_blocksSuspendedUser() {
        User suspended = activeUser(false);
        suspended.setStatus(UserStatus.SUSPENDED);
        when(userRepository.findByUsernameIgnoreCase("creator")).thenReturn(Optional.of(suspended));

        assertThatThrownBy(() -> service.login(
                new LoginRequest("creator", "whatever")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("suspended");
    }

    @Test
    void login_returnsPasswordChangeRequiredAndPermissions() {
        User user = activeUser(true);
        when(userRepository.findByUsernameIgnoreCase("creator")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(
                        userDetailsFor(user), null, userDetailsFor(user).getAuthorities()));
        when(jwtService.generateToken(any())).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(user))
                .thenReturn(RefreshToken.builder().token("refresh-token").build());

        LoginResponse response = service.login(new LoginRequest("creator", "Passw0rd!"));

        assertThat(response.isPasswordChangeRequired()).isTrue();
        assertThat(response.getPermissions()).contains("LEDGER_READ");
        assertThat(response.getAccessToken()).isEqualTo("access-token");
    }

    @Test
    void login_returnsNoPasswordChangeRequiredForSeedUser() {
        User user = activeUser(false);
        when(userRepository.findByUsernameIgnoreCase("creator")).thenReturn(Optional.of(user));
        when(authenticationManager.authenticate(any()))
                .thenReturn(new UsernamePasswordAuthenticationToken(
                        userDetailsFor(user), null, userDetailsFor(user).getAuthorities()));
        when(jwtService.generateToken(any())).thenReturn("access-token");
        when(refreshTokenService.createRefreshToken(user))
                .thenReturn(RefreshToken.builder().token("refresh-token").build());

        LoginResponse response = service.login(new LoginRequest("creator", "Passw0rd!"));

        assertThat(response.isPasswordChangeRequired()).isFalse();
    }

    @Test
    void changePassword_clearsMustChangePasswordFlag() {
        User user = activeUser(true);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("creator", null, List.of())
        );

        when(userRepository.findByUsernameIgnoreCase("creator")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassw0rd!", "stored-hash")).thenReturn(true);
        when(passwordEncoder.matches("NewPassw0rd!", "stored-hash")).thenReturn(false);
        when(passwordEncoder.encode("NewPassw0rd!")).thenReturn("new-hash");
        when(jwtTokenRepository.findAllByUser(user)).thenReturn(List.of());

        service.changePassword(new ChangePasswordRequest(
                "OldPassw0rd!", "NewPassw0rd!", "NewPassw0rd!"));

        assertThat(user.getPassword()).isEqualTo("new-hash");
        assertThat(user.isMustChangePassword()).isFalse();
    }

    @Test
    void changePassword_rejectsWeakNewPassword() {
        User user = activeUser(true);

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("creator", null, List.of())
        );

        when(userRepository.findByUsernameIgnoreCase("creator")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("OldPassw0rd!", "stored-hash")).thenReturn(true);

        assertThatThrownBy(() -> service.changePassword(
                new ChangePasswordRequest("OldPassw0rd!", "weakpass1", "weakpass1")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("uppercase");
    }
}
