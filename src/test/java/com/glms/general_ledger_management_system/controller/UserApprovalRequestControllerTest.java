package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.Model.ApprovalStatus;
import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Model.UserApprovalAction;
import com.glms.general_ledger_management_system.Model.UserApprovalRequest;
import com.glms.general_ledger_management_system.Security.JwtAuthenticationFilter;
import com.glms.general_ledger_management_system.Security.PasswordChangeFilter;
import com.glms.general_ledger_management_system.Service.UserApprovalRequestService;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = UserApprovalRequestController.class,
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = {
                        JwtAuthenticationFilter.class,
                        PasswordChangeFilter.class
                }
        )
)
@Import(UserApprovalRequestControllerTest.TestSecurityConfig.class)
@AutoConfigureMockMvc
class UserApprovalRequestControllerTest {

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
    private UserApprovalRequestService approvalRequestService;

    private UserApprovalRequest sampleRequest() {
        return UserApprovalRequest.builder()
                .id(10L)
                .user(User.builder().id(3L).username("targetUser").build())
                .maker(User.builder().id(1L).username("controlUser").build())
                .actionType(UserApprovalAction.USER_DEACTIVATE)
                .status(ApprovalStatus.PENDING)
                .reason("business reason")
                .requestedAt(ZonedDateTime.now())
                .roles(new HashSet<>())
                .permissions(new HashSet<>())
                .build();
    }

    // ------------------------------------------------------------------
    // CHECKER QUEUE - AUTHORIZER / ADMIN only
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "AUTHORIZER")
    void getPendingRequests_asAuthorizer_isOk() throws Exception {
        when(approvalRequestService.getPendingRequests(any()))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/user-approval-requests/pending"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "CONTROL")
    void getPendingRequests_asControl_isForbidden() throws Exception {
        mockMvc.perform(get("/api/user-approval-requests/pending"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getPendingRequests_asAdmin_isOk() throws Exception {
        when(approvalRequestService.getPendingRequests(any()))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/user-approval-requests/pending"))
                .andExpect(status().isOk());
    }

    // ------------------------------------------------------------------
    // MAKER QUEUE - CONTROL / ADMIN only
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "CONTROL")
    void getMyRequests_asControl_isOk() throws Exception {
        when(approvalRequestService.getMyRequests(any()))
                .thenReturn(Page.empty());

        mockMvc.perform(get("/api/user-approval-requests/mine"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "AUTHORIZER")
    void getMyRequests_asAuthorizer_isForbidden() throws Exception {
        mockMvc.perform(get("/api/user-approval-requests/mine"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------
    // MAKER - create requests
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "CONTROL")
    void createApprovalRequest_asControl_isCreated() throws Exception {
        when(approvalRequestService.createApprovalRequest(
                eq(3L), eq(UserApprovalAction.USER_DEACTIVATE), any()))
                .thenReturn(sampleRequest());

        mockMvc.perform(post("/api/user-approval-requests")
                        .param("userId", "3")
                        .param("actionType", "USER_DEACTIVATE")
                        .param("reason", "business reason"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @Test
    @WithMockUser(roles = "AUTHORIZER")
    void createApprovalRequest_asAuthorizer_isForbidden() throws Exception {
        mockMvc.perform(post("/api/user-approval-requests")
                        .param("userId", "3")
                        .param("actionType", "USER_DEACTIVATE")
                        .param("reason", "business reason"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CONTROL")
    void createRoleAssignmentRequest_asControl_isCreated() throws Exception {
        when(approvalRequestService.createRoleAssignmentRequest(
                eq(3L), any(), any()))
                .thenReturn(sampleRequest());

        mockMvc.perform(post("/api/user-approval-requests/assign-role")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "userId": 3,
                                  "roles": ["CONTROL"],
                                  "reason": "needs control role"
                                }
                                """))
                .andExpect(status().isCreated());
    }

    // ------------------------------------------------------------------
    // CHECKER - approve / reject
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "AUTHORIZER")
    void approveRequest_asAuthorizer_isOk() throws Exception {
        UserApprovalRequest approved = sampleRequest();
        approved.setStatus(ApprovalStatus.APPROVED);
        when(approvalRequestService.approveRequest(eq(10L), any()))
                .thenReturn(approved);

        mockMvc.perform(put("/api/user-approval-requests/10/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remark\":\"approved\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @WithMockUser(roles = "CONTROL")
    void approveRequest_asControl_isForbidden() throws Exception {
        mockMvc.perform(put("/api/user-approval-requests/10/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remark\":\"approved\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "AUTHORIZER")
    void rejectRequest_asAuthorizer_isOk() throws Exception {
        UserApprovalRequest rejected = sampleRequest();
        rejected.setStatus(ApprovalStatus.REJECTED);
        when(approvalRequestService.rejectRequest(eq(10L), any()))
                .thenReturn(rejected);

        mockMvc.perform(put("/api/user-approval-requests/10/reject")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remark\":\"rejected\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void approveRequest_asAdmin_isOk() throws Exception {
        UserApprovalRequest approved = sampleRequest();
        approved.setStatus(ApprovalStatus.APPROVED);
        when(approvalRequestService.approveRequest(eq(10L), any()))
                .thenReturn(approved);

        mockMvc.perform(put("/api/user-approval-requests/10/approve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"remark\":\"admin ok\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    // ------------------------------------------------------------------
    // MAKER - cancel own request
    // ------------------------------------------------------------------

    @Test
    @WithMockUser(roles = "CONTROL")
    void cancelRequest_asControl_isOk() throws Exception {
        UserApprovalRequest cancelled = sampleRequest();
        cancelled.setStatus(ApprovalStatus.CANCELLED);
        when(approvalRequestService.cancelRequest(10L))
                .thenReturn(cancelled);

        mockMvc.perform(delete("/api/user-approval-requests/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }
}
