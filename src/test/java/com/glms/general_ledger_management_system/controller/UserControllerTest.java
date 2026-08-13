package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.user.UserResponse;
import com.glms.general_ledger_management_system.Model.ApprovalStatus;
import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Model.UserApprovalAction;
import com.glms.general_ledger_management_system.Model.UserApprovalRequest;
import com.glms.general_ledger_management_system.Security.JwtAuthenticationFilter;
import com.glms.general_ledger_management_system.Security.PasswordChangeFilter;
import com.glms.general_ledger_management_system.Service.UserApprovalRequestService;
import com.glms.general_ledger_management_system.Service.UserService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.ZonedDateTime;
import java.util.HashSet;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = UserController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        JwtAuthenticationFilter.class,
                        PasswordChangeFilter.class
                }
        )
)
@Import(UserControllerTest.TestSecurityConfig.class)
@AutoConfigureMockMvc
class UserControllerTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class TestSecurityConfig {

        @Bean
        SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
            http
                    .csrf(csrf -> csrf.disable())
                    .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    @MockitoBean
    private UserApprovalRequestService approvalRequestService;

    private UserApprovalRequest sampleRequest(UserApprovalAction action) {
        return UserApprovalRequest.builder()
                .id(10L)
                .user(User.builder().id(3L).username("targetUser").build())
                .maker(User.builder().id(1L).username("controlUser").build())
                .actionType(action)
                .status(ApprovalStatus.PENDING)
                .reason("business reason")
                .requestedAt(ZonedDateTime.now())
                .roles(new HashSet<>())
                .permissions(new HashSet<>())
                .build();
    }

    // ------------------------------------------------------------------
    // MAKER - user creation stays pending
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "CONTROL")
    void createUser_asControl_isCreated() throws Exception {
        when(userService.createUser(any()))
                .thenReturn(UserResponse.builder().username("jane").build());

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Jane",
                                  "lastName": "Doe",
                                  "username": "jane",
                                  "email": "jane@glms.com",
                                  "password": "StrongPass1!",
                                  "roles": ["CONTROL"],
                                  "permissions": ["USER_CREATE"],
                                  "reason": "new employee"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("jane"));
    }

    @Test
    @WithMockUser(roles = "CREATOR")
    void createUser_asCreator_isForbidden() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Jane",
                                  "lastName": "Doe",
                                  "username": "jane",
                                  "email": "jane@glms.com",
                                  "password": "StrongPass1!",
                                  "roles": ["CONTROL"],
                                  "permissions": ["USER_CREATE"],
                                  "reason": "new employee"
                                }
                                """))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // MAKER - controlled actions create approval requests (no direct effect)
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "CONTROL")
    void deactivateUser_asControl_createsApprovalRequest() throws Exception {
        when(approvalRequestService.createApprovalRequest(
                eq(3L), eq(UserApprovalAction.USER_DEACTIVATE), any()))
                .thenReturn(sampleRequest(UserApprovalAction.USER_DEACTIVATE));

        mockMvc.perform(patch("/api/users/3/deactivate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"policy breach\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.action").value("USER_DEACTIVATE"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(roles = "CONTROL")
    void lockUser_asControl_createsApprovalRequest() throws Exception {
        when(approvalRequestService.createApprovalRequest(
                eq(3L), eq(UserApprovalAction.USER_LOCK), any()))
                .thenReturn(sampleRequest(UserApprovalAction.USER_LOCK));

        mockMvc.perform(put("/api/users/3/lock")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"security incident\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.action").value("USER_LOCK"));
    }

    @Test
    @WithMockUser(roles = "CONTROL")
    void assignRole_asControl_createsApprovalRequest() throws Exception {
        when(approvalRequestService.createRoleAssignmentRequest(
                eq(3L), any(), any()))
                .thenReturn(sampleRequest(UserApprovalAction.ASSIGN_ROLE));

        mockMvc.perform(patch("/api/users/3/roles")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"roles\":[\"CONTROL\"],\"reason\":\"promotion\"}"))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.action").value("ASSIGN_ROLE"));
    }

    @Test
    @WithMockUser(roles = "AUTHORIZER")
    void deactivateUser_asAuthorizer_isForbidden() throws Exception {
        mockMvc.perform(patch("/api/users/3/deactivate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"policy breach\"}"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // ACTIVATE - ADMIN only; AUTHORIZER must approve through the flow
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "ADMIN")
    void activateUser_asAdmin_isOk() throws Exception {
        mockMvc.perform(patch("/api/users/3/activate"))
                .andExpect(status().isOk());

        verify(userService).activateUser(3L);
    }

    @Test
    @WithMockUser(roles = "AUTHORIZER")
    void activateUser_asAuthorizer_isForbidden() throws Exception {
        mockMvc.perform(patch("/api/users/3/activate"))
                .andExpect(status().isForbidden());

        verify(userService, never()).activateUser(any());
    }

    // ------------------------------------------------------------------
    // DELETE - ADMIN only
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "CONTROL")
    void deleteUser_asControl_isForbidden() throws Exception {
        mockMvc.perform(delete("/api/users/3"))
                .andExpect(status().isForbidden());
    }
}
