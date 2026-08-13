package com.glms.general_ledger_management_system.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glms.general_ledger_management_system.DTO.user.CreateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.Mapper.UserMapper;
import com.glms.general_ledger_management_system.Model.*;
import com.glms.general_ledger_management_system.Repository.*;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private UserMapper userMapper;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private JwtTokenRepository jwtTokenRepository;

    @Mock
    private UserApprovalRequestRepository approvalRequestRepository;

    private UserService service;

    private User maker;

    @BeforeEach
    void setUp() {
        service = new UserService(
                userRepository,
                roleRepository,
                permissionRepository,
                auditLogRepository,
                passwordEncoder,
                userMapper,
                refreshTokenService,
                jwtTokenRepository,
                approvalRequestRepository,
                new ObjectMapper()
        );

        maker = User.builder().id(1L).username("controlUser")
                .roles(roleSet("CONTROL")).build();

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        maker.getUsername(), null,
                        java.util.List.of(
                                new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_CONTROL")
                        )
                )
        );

        lenient().when(userRepository.findByUsername("controlUser"))
                .thenReturn(Optional.of(maker));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private Set<Role> roleSet(String name) {
        return new HashSet<>(Set.of(Role.builder().id(1L).name(name).permissions(new HashSet<>()).build()));
    }

    // ------------------------------------------------------------------

    @Test
    void createUser_createsInactiveUserWithApprovalRequestAndMandatoryPasswordChange() {
        Role controlRole = Role.builder().id(1L).name("CONTROL")
                .permissions(new HashSet<>(Set.of(
                        Permission.builder().id(1L).name("USER_CREATE").build()
                )))
                .build();

        Permission userCreate = Permission.builder().id(1L).name("USER_CREATE").build();

        CreateUserRequest request = CreateUserRequest.builder()
                .firstName("Jane")
                .lastName("Doe")
                .username("jane")
                .email("jane@glms.com")
                .password("StrongPass1!")
                .roles(new HashSet<>(Set.of("CONTROL")))
                .permissions(new HashSet<>(Set.of("USER_CREATE")))
                .reason("new employee")
                .build();

        User user = User.builder()
                .firstName("Jane")
                .lastName("Doe")
                .username("jane")
                .email("jane@glms.com")
                .password("StrongPass1!")
                .build();

        when(userRepository.findByUsername("jane")).thenReturn(Optional.empty());
        when(userRepository.findByEmail("jane@glms.com")).thenReturn(Optional.empty());
        when(roleRepository.findByNameIgnoreCase("CONTROL")).thenReturn(Optional.of(controlRole));
        when(permissionRepository.findByNameIgnoreCase("USER_CREATE")).thenReturn(Optional.of(userCreate));
        when(userMapper.toEntity(request)).thenReturn(user);
        when(passwordEncoder.encode(any())).thenReturn("encoded-hash");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = service.createUser(request);

        assertThat(user.getStatus()).isEqualTo(UserStatus.INACTIVE);
        assertThat(user.isMustChangePassword()).isTrue();

        ArgumentCaptor<UserApprovalRequest> captor =
                ArgumentCaptor.forClass(UserApprovalRequest.class);
        org.mockito.Mockito.verify(approvalRequestRepository).save(captor.capture());

        UserApprovalRequest approvalRequest = captor.getValue();
        assertThat(approvalRequest.getActionType()).isEqualTo(UserApprovalAction.USER_CREATE);
        assertThat(approvalRequest.getStatus()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(approvalRequest.getRoles()).containsExactly("CONTROL");
        assertThat(approvalRequest.getPermissions()).containsExactly("USER_CREATE");
        assertThat(approvalRequest.getMaker().getId()).isEqualTo(maker.getId());
        assertThat(approvalRequest.getUser().getUsername()).isEqualTo("jane");
    }

    @Test
    void updateUser_stagesUserUpdateApprovalRequest() {
        User target = User.builder().id(3L).username("targetUser")
                .email("target@glms.com")
                .firstName("Old")
                .lastName("Name")
                .status(UserStatus.ACTIVE)
                .roles(roleSet("CREATOR"))
                .build();

        UpdateUserRequest request = UpdateUserRequest.builder()
                .firstName("New")
                .lastName("Name")
                .username("targetUser")
                .email("target@glms.com")
                .build();

        when(userRepository.findById(3L)).thenReturn(Optional.of(target));
        when(approvalRequestRepository.existsByUserAndActionTypeAndStatus(
                any(), any(), any())).thenReturn(false);
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserApprovalRequest approvalRequest = service.updateUser(3L, request);

        assertThat(approvalRequest.getActionType()).isEqualTo(UserApprovalAction.USER_UPDATE);
        assertThat(approvalRequest.getStatus()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(approvalRequest.getUser().getId()).isEqualTo(3L);
        assertThat(approvalRequest.getPayloadJson()).contains("\"firstName\":\"New\"");
        // nothing applied yet
        assertThat(target.getFirstName()).isEqualTo("Old");
    }
}
