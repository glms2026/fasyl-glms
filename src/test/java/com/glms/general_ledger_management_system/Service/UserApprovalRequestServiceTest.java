package com.glms.general_ledger_management_system.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.Model.*;
import com.glms.general_ledger_management_system.Repository.*;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserApprovalRequestServiceTest {

    @Mock
    private UserApprovalRequestRepository approvalRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private JwtTokenRepository jwtTokenRepository;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private PermissionRepository permissionRepository;

    private UserApprovalRequestService service;

    private ObjectMapper objectMapper;

    private User maker;
    private User authorizer;
    private User targetUser;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();

        service = new UserApprovalRequestService(
                approvalRequestRepository,
                userRepository,
                roleRepository,
                auditLogRepository,
                jwtTokenRepository,
                refreshTokenService,
                permissionRepository,
                objectMapper
        );

        maker = User.builder().id(1L).username("controlUser").roles(roleSet("CONTROL")).build();
        authorizer = User.builder().id(2L).username("authorizerUser").roles(roleSet("AUTHORIZER")).build();
        targetUser = User.builder().id(3L).username("targetUser").status(UserStatus.ACTIVE)
                .roles(roleSet("CREATOR")).build();

        authenticate(authorizer);
        lenient().when(userRepository.findByUsername("authorizerUser")).thenReturn(Optional.of(authorizer));
        lenient().when(userRepository.findByUsername("controlUser")).thenReturn(Optional.of(maker));
        lenient().when(userRepository.findById(3L)).thenReturn(Optional.of(targetUser));
        lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(maker));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticate(User user) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        user.getUsername(),
                        null,
                        user.getRoles().stream()
                                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getName()))
                                .toList()
                )
        );
    }

    private Set<Role> roleSet(String name) {
        return new HashSet<>(Set.of(Role.builder().id(1L).name(name).permissions(new HashSet<>()).build()));
    }

    private UserApprovalRequest pendingRequest(UserApprovalAction action) {
        return UserApprovalRequest.builder()
                .id(10L)
                .user(targetUser)
                .maker(maker)
                .authorizer(null)
                .actionType(action)
                .status(ApprovalStatus.PENDING)
                .reason("business reason")
                .requestedAt(java.time.ZonedDateTime.now())
                .roles(new HashSet<>())
                .permissions(new HashSet<>())
                .build();
    }

    // ------------------------------------------------------------------
    // MAKER - general request creation
    // ------------------------------------------------------------------

    @Test
    void createApprovalRequest_createsPendingRequest() {
        authenticate(maker);
        when(approvalRequestRepository.existsByUserAndActionTypeAndStatus(
                any(), any(), any())).thenReturn(false);
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserApprovalRequest saved = service.createApprovalRequest(
                targetUser.getId(), UserApprovalAction.USER_DEACTIVATE, "Reason");

        assertThat(saved.getStatus()).isEqualTo(ApprovalStatus.PENDING);
        assertThat(saved.getActionType()).isEqualTo(UserApprovalAction.USER_DEACTIVATE);
        assertThat(saved.getMaker().getId()).isEqualTo(maker.getId());
        assertThat(saved.getUser().getId()).isEqualTo(targetUser.getId());
    }

    @Test
    void createApprovalRequest_rejectsSelfRequest() {
        authenticate(maker);
        assertThatThrownBy(() ->
                service.createApprovalRequest(
                        maker.getId(), UserApprovalAction.USER_DEACTIVATE, "Reason"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void createApprovalRequest_rejectsAdminTarget() {
        authenticate(maker);
        User admin = User.builder().id(9L).username("admin").status(UserStatus.ACTIVE)
                .roles(roleSet("ADMIN")).build();
        when(userRepository.findById(9L)).thenReturn(Optional.of(admin));

        assertThatThrownBy(() ->
                service.createApprovalRequest(9L, UserApprovalAction.USER_DEACTIVATE, "Reason"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void createRoleAssignmentRequest_storesRolesAndStaysPending() {
        authenticate(maker);
        when(roleRepository.findByNameIgnoreCase("CONTROL")).thenReturn(Optional.of(role("CONTROL")));
        when(approvalRequestRepository.existsByUserAndActionTypeAndStatus(
                any(), any(), any())).thenReturn(false);
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserApprovalRequest saved = service.createRoleAssignmentRequest(
                targetUser.getId(), Set.of("CONTROL"), "needs control role");

        assertThat(saved.getActionType()).isEqualTo(UserApprovalAction.ASSIGN_ROLE);
        assertThat(saved.getRoles()).containsExactly("CONTROL");
        assertThat(saved.getStatus()).isEqualTo(ApprovalStatus.PENDING);
    }

    // ------------------------------------------------------------------
    // MAKER - role permission requests
    // ------------------------------------------------------------------

    @Test
    void createRolePermissionAssignmentRequest_storesTargetRole() {
        authenticate(maker);
        Role role = roleWithPermissions("CREATOR", "LEDGER_READ");
        when(roleRepository.findById(99L)).thenReturn(Optional.of(role));
        when(permissionRepository.findByNameIgnoreCase("LEDGER_READ"))
                .thenReturn(Optional.of(Permission.builder().id(1L).name("LEDGER_READ").build()));
        when(approvalRequestRepository.findByActionTypeAndStatus(any(), any()))
                .thenReturn(List.of());
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserApprovalRequest saved = service.createRolePermissionAssignmentRequest(
                99L, Set.of("LEDGER_READ"), "needed for reading ledgers");

        assertThat(saved.getActionType()).isEqualTo(UserApprovalAction.ASSIGN_PERMISSION);
        assertThat(saved.getRoles()).containsExactly("CREATOR");
        assertThat(saved.getPermissions()).containsExactly("LEDGER_READ");
    }

    @Test
    void createRolePermissionRemovalRequest_storesTargetRole() {
        authenticate(maker);
        Permission ledgerRead = Permission.builder().id(1L).name("LEDGER_READ").build();
        Role role = Role.builder().id(5L).name("CREATOR")
                .permissions(new HashSet<>(Set.of(ledgerRead)))
                .build();
        when(roleRepository.findById(99L)).thenReturn(Optional.of(role));
        when(permissionRepository.findByNameIgnoreCase("LEDGER_READ"))
                .thenReturn(Optional.of(ledgerRead));
        when(approvalRequestRepository.findByActionTypeAndStatus(any(), any()))
                .thenReturn(List.of());
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserApprovalRequest saved = service.createRolePermissionRemovalRequest(
                99L, "LEDGER_READ", "no longer needed");

        assertThat(saved.getActionType()).isEqualTo(UserApprovalAction.REMOVE_PERMISSION);
        assertThat(saved.getRoles()).containsExactly("CREATOR");
        assertThat(saved.getPermissions()).containsExactly("LEDGER_READ");
    }

    // ------------------------------------------------------------------
    // CHECKER - approval executes the action
    // ------------------------------------------------------------------

    @Test
    void approveRequest_deactivatesUserAndRecordsAuthorizer() {
        when(approvalRequestRepository.findByIdAndStatus(10L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(pendingRequest(UserApprovalAction.USER_DEACTIVATE)));
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(jwtTokenRepository.findAllByUser(any())).thenReturn(List.of());

        UserApprovalRequest approved = service.approveRequest(10L, "ok");

        assertThat(approved.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(approved.getAuthorizer().getId()).isEqualTo(authorizer.getId());
        assertThat(approved.getAuthorizerRemark()).isEqualTo("ok");
        assertThat(targetUser.getStatus()).isEqualTo(UserStatus.INACTIVE);
    }

    @Test
    void approveRequest_makerCannotApproveOwnRequest() {
        UserApprovalRequest request = pendingRequest(UserApprovalAction.USER_DEACTIVATE);
        request.setMaker(authorizer); // the current authenticated user is the maker
        when(approvalRequestRepository.findByIdAndStatus(10L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.approveRequest(10L, "ok"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void approveRequest_approvesPermissionAssignmentAndAppliesToRole() {
        // current authorizer approves an ASSIGN_PERMISSION request
        Role role = roleWithPermissions("CREATOR", "LEDGER_READ");
        UserApprovalRequest request = pendingRequest(UserApprovalAction.ASSIGN_PERMISSION);
        request.setRoles(new HashSet<>(Set.of("CREATOR")));
        request.setPermissions(new HashSet<>(Set.of("LEDGER_UPDATE")));

        when(approvalRequestRepository.findByIdAndStatus(10L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(request));
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(roleRepository.findByNameIgnoreCase("CREATOR")).thenReturn(Optional.of(role));
        when(permissionRepository.findByNameIgnoreCase("LEDGER_UPDATE"))
                .thenReturn(Optional.of(Permission.builder().id(2L).name("LEDGER_UPDATE").build()));

        UserApprovalRequest approved = service.approveRequest(10L, "granted");

        assertThat(approved.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(role.getPermissions())
                .extracting(Permission::getName)
                .contains("LEDGER_READ", "LEDGER_UPDATE");
    }

    @Test
    void approveRequest_userCreate_activatesAndAppliesRoles() {
        User inactive = User.builder().id(4L).username("newbie").status(UserStatus.INACTIVE)
                .roles(new HashSet<>()).build();
        Role controlRole = roleWithPermissions("CONTROL", "USER_CREATE");
        Permission userCreate = Permission.builder().id(3L).name("USER_CREATE").build();

        UserApprovalRequest request = UserApprovalRequest.builder()
                .id(20L)
                .user(inactive)
                .maker(maker)
                .actionType(UserApprovalAction.USER_CREATE)
                .status(ApprovalStatus.PENDING)
                .reason("new hire")
                .roles(new HashSet<>(Set.of("CONTROL")))
                .permissions(new HashSet<>(Set.of("USER_CREATE")))
                .build();

        when(approvalRequestRepository.findByIdAndStatus(20L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(request));
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(roleRepository.findByNameIgnoreCase("CONTROL")).thenReturn(Optional.of(controlRole));
        when(permissionRepository.findByNameIgnoreCase("USER_CREATE")).thenReturn(Optional.of(userCreate));

        UserApprovalRequest approved = service.approveRequest(20L, "approved");

        assertThat(approved.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(inactive.getStatus()).isEqualTo(UserStatus.ACTIVE);
        assertThat(inactive.getRoles()).extracting(Role::getName).containsExactly("CONTROL");
    }

    @Test
    void approveRequest_userUpdate_appliesStagedPayload() throws Exception {
        UpdateUserRequest update = UpdateUserRequest.builder()
                .firstName("New")
                .lastName("Name")
                .username("targetUser")
                .email("new@glms.com")
                .build();

        UserApprovalRequest request = pendingRequest(UserApprovalAction.USER_UPDATE);
        request.setPayloadJson(objectMapper.writeValueAsString(update));

        when(approvalRequestRepository.findByIdAndStatus(10L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(request));
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        UserApprovalRequest approved = service.approveRequest(10L, "ok");

        assertThat(approved.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
        assertThat(targetUser.getFirstName()).isEqualTo("New");
        assertThat(targetUser.getLastName()).isEqualTo("Name");
        assertThat(targetUser.getEmail()).isEqualTo("new@glms.com");
    }

    // ------------------------------------------------------------------
    // CHECKER - rejection and cancellation
    // ------------------------------------------------------------------

    @Test
    void rejectRequest_doesNotExecuteAction() {
        when(approvalRequestRepository.findByIdAndStatus(10L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(pendingRequest(UserApprovalAction.USER_DEACTIVATE)));
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserApprovalRequest rejected = service.rejectRequest(10L, "not justified");

        assertThat(rejected.getStatus()).isEqualTo(ApprovalStatus.REJECTED);
        assertThat(targetUser.getStatus()).isEqualTo(UserStatus.ACTIVE); // unchanged
    }

    @Test
    void rejectRequest_requiresRemark() {
        assertThatThrownBy(() -> service.rejectRequest(10L, " "))
                .isInstanceOf(IllegalArgumentException.class);

        verify(approvalRequestRepository, never()).save(any());
    }

    @Test
    void cancelRequest_makerCancelsOwnRequest() {
        authenticate(maker);
        UserApprovalRequest request = pendingRequest(UserApprovalAction.USER_DEACTIVATE);
        when(approvalRequestRepository.findByIdAndStatus(10L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(request));
        when(approvalRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserApprovalRequest cancelled = service.cancelRequest(10L);

        assertThat(cancelled.getStatus()).isEqualTo(ApprovalStatus.CANCELLED);
        verify(approvalRequestRepository).save(request);
    }

    @Test
    void cancelRequest_otherMakerCannotCancel() {
        // authenticated authorizer is not the maker
        UserApprovalRequest request = pendingRequest(UserApprovalAction.USER_DEACTIVATE);
        when(approvalRequestRepository.findByIdAndStatus(10L, ApprovalStatus.PENDING))
                .thenReturn(Optional.of(request));

        assertThatThrownBy(() -> service.cancelRequest(10L))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private Role role(String name) {
        return Role.builder().id(5L).name(name).permissions(new HashSet<>()).build();
    }

    private Role roleWithPermissions(String name, String... permissionNames) {
        Set<Permission> permissions = new HashSet<>();
        for (String permissionName : permissionNames) {
            permissions.add(Permission.builder().id((long) permissionName.hashCode()).name(permissionName).build());
        }
        return Role.builder().id(5L).name(name).permissions(permissions).build();
    }
}
