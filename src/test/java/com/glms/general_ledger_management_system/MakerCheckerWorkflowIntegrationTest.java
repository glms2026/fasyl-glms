//package com.glms.general_ledger_management_system;
//
//import com.fasterxml.jackson.databind.JsonNode;
//import com.fasterxml.jackson.databind.ObjectMapper;
//import com.glms.general_ledger_management_system.Model.ApprovalStatus;
//import com.glms.general_ledger_management_system.Model.User;
//import com.glms.general_ledger_management_system.Model.UserApprovalAction;
//import com.glms.general_ledger_management_system.Model.UserApprovalRequest;
//import com.glms.general_ledger_management_system.Model.UserStatus;
//import com.glms.general_ledger_management_system.Repository.RoleRepository;
//import com.glms.general_ledger_management_system.Repository.UserApprovalRequestRepository;
//import com.glms.general_ledger_management_system.Repository.UserRepository;
//
//import org.junit.jupiter.api.MethodOrderer;
//import org.junit.jupiter.api.Order;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.TestMethodOrder;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
//import org.springframework.http.MediaType;
//import org.springframework.test.context.ActiveProfiles;
//import org.springframework.test.web.servlet.MockMvc;
//import org.springframework.test.web.servlet.MvcResult;
//
//import java.util.Optional;
//
//import static org.assertj.core.api.Assertions.assertThat;
//import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
//import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
//
///**
// * Full-context integration test: boots the real application against an
// * in-memory H2 database and exercises the Maker/Checker workflow end to end
// * over HTTP, including seeded system users and the mandatory password change.
// */
//@SpringBootTest
//@ActiveProfiles("test")
//@AutoConfigureMockMvc
//@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
//class MakerCheckerWorkflowIntegrationTest {
//
//    @Autowired
//    private MockMvc mockMvc;
//
//    @Autowired
//    private ObjectMapper objectMapper;
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private RoleRepository roleRepository;
//
//    @Autowired
//    private UserApprovalRequestRepository approvalRequestRepository;
//
//    // ------------------------------------------------------------------
//    // helpers
//    // ------------------------------------------------------------------
//
//    private String loginToken(String username, String password) throws Exception {
//        MvcResult result = mockMvc.perform(post("/api/auth/login")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"username\":\"" + username
//                                + "\",\"password\":\"" + password + "\"}"))
//                .andExpect(status().isOk())
//                .andReturn();
//
//        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
//        return body.get("accessToken").asText();
//    }
//
//    private User findUser(String username) {
//        return userRepository.findByUsername(username)
//                .orElseThrow(() -> new AssertionError("User not found: " + username));
//    }
//
//    private long createUserAsControl(String username, String token) throws Exception {
//        MvcResult result = mockMvc.perform(post("/api/users")
//                        .header("Authorization", "Bearer " + token)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("""
//                                {
//                                  "firstName": "Jane",
//                                  "lastName": "Doe",
//                                  "username": "%s",
//                                  "email": "%s@glms.com",
//                                  "password": "StrongPass1!",
//                                  "roles": ["CONTROL"],
//                                  "permissions": ["USER_CREATE"],
//                                  "reason": "new employee"
//                                }
//                                """.formatted(username, username)))
//                .andExpect(status().isCreated())
//                .andReturn();
//
//        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
//        return body.get("id").asLong();
//    }
//
//    private long createDeactivateRequest(String token, long userId) throws Exception {
//        MvcResult result = mockMvc.perform(patch("/api/users/" + userId + "/deactivate")
//                        .header("Authorization", "Bearer " + token)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"reason\":\"policy review\"}"))
//                .andExpect(status().isAccepted())
//                .andReturn();
//
//        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
//        return body.get("id").asLong();
//    }
//
//    private long findRequestIdForUser(long userId, UserApprovalAction action) {
//        return approvalRequestRepository.findAll().stream()
//                .filter(r -> r.getUser() != null
//                        && r.getUser().getId().equals(userId)
//                        && r.getActionType() == action)
//                .findFirst()
//                .orElseThrow(() -> new AssertionError("Approval request not found"))
//                .getId();
//    }
//
//    // ------------------------------------------------------------------
//    // 1. System users are seeded
//    // ------------------------------------------------------------------
//
//    @Test
//    @Order(1)
//    void systemUsersAreSeededWithCorrectRoles() throws Exception {
//        assertThat(findUser("admin").getRoles())
//                .extracting(role -> role.getName()).containsExactly("ADMIN");
//        assertThat(findUser("control").getRoles())
//                .extracting(role -> role.getName()).containsExactly("CONTROL");
//        assertThat(findUser("authorizer").getRoles())
//                .extracting(role -> role.getName()).containsExactly("AUTHORIZER");
//        assertThat(findUser("creator").getRoles())
//                .extracting(role -> role.getName()).containsExactly("CREATOR");
//        assertThat(findUser("control").isMustChangePassword()).isFalse();
//
//        // every seeded user can log in
//        for (String username : new String[]{"admin", "control", "authorizer", "creator"}) {
//            loginToken(username, username + "123");
//        }
//    }
//
//    // ------------------------------------------------------------------
//    // 2. Full maker -> checker -> forced password change workflow
//    // ------------------------------------------------------------------
//
//    @Test
//    @Order(2)
//    void newUserRequiresApprovalThenMustChangePassword() throws Exception {
//        String controlToken = loginToken("control", "control123");
//        String authorizerToken = loginToken("authorizer", "authorizer123");
//
//        // CONTROL creates the user -> INACTIVE + pending USER_CREATE request
//        long newUserId = createUserAsControl("jane1", controlToken);
//
//        User pending = findUser("jane1");
//        assertThat(pending.getStatus()).isEqualTo(UserStatus.INACTIVE);
//        assertThat(pending.isMustChangePassword()).isTrue();
//
//        long requestId = findRequestIdForUser(newUserId, UserApprovalAction.USER_CREATE);
//
//        // maker cannot approve his own request
//        mockMvc.perform(put("/api/user-approval-requests/" + requestId + "/approve")
//                        .header("Authorization", "Bearer " + controlToken)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"remark\":\"self approve\"}"))
//                .andExpect(status().isForbidden());
//
//        assertThat(findUser("jane1").getStatus()).isEqualTo(UserStatus.INACTIVE);
//
//        // AUTHORIZER approves -> user becomes ACTIVE
//        mockMvc.perform(put("/api/user-approval-requests/" + requestId + "/approve")
//                        .header("Authorization", "Bearer " + authorizerToken)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"remark\":\"approved\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.status").value("APPROVED"));
//
//        User active = findUser("jane1");
//        assertThat(active.getStatus()).isEqualTo(UserStatus.ACTIVE);
//        assertThat(active.getRoles())
//                .extracting(role -> role.getName()).containsExactly("CONTROL");
//
//        // first login -> password change is mandatory
//        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"username\":\"jane1\",\"password\":\"StrongPass1!\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.passwordChangeRequired").value(true))
//                .andReturn();
//
//        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsString());
//        String janeToken = loginBody.get("accessToken").asText();
//
//        // every other endpoint is blocked until the password is changed
//        mockMvc.perform(get("/api/users/" + newUserId)
//                        .header("Authorization", "Bearer " + janeToken))
//                .andExpect(status().isForbidden());
//
//        // change the password
//        mockMvc.perform(post("/api/auth/change-password")
//                        .header("Authorization", "Bearer " + janeToken)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("""
//                                {
//                                  "oldPassword": "StrongPass1!",
//                                  "newPassword": "NewPassw0rd!",
//                                  "confirmPassword": "NewPassw0rd!"
//                                }
//                                """))
//                .andExpect(status().isOk());
//
//        assertThat(findUser("jane1").isMustChangePassword()).isFalse();
//
//        // re-login with the new password -> fully unlocked
//        MvcResult relogin = mockMvc.perform(post("/api/auth/login")
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"username\":\"jane1\",\"password\":\"NewPassw0rd!\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.passwordChangeRequired").value(false))
//                .andReturn();
//
//        JsonNode reloginBody = objectMapper.readTree(relogin.getResponse().getContentAsString());
//        String janeNewToken = reloginBody.get("accessToken").asText();
//
//        mockMvc.perform(get("/api/users/" + newUserId)
//                        .header("Authorization", "Bearer " + janeNewToken))
//                .andExpect(status().isOk());
//    }
//
//    // ------------------------------------------------------------------
//    // 3. Rejection does not execute
//    // ------------------------------------------------------------------
//
//    @Test
//    @Order(3)
//    void rejectedRequestDoesNotChangeState() throws Exception {
//        String controlToken = loginToken("control", "control123");
//        String authorizerToken = loginToken("authorizer", "authorizer123");
//
//        long creatorUserId = findUser("creator").getId();
//        long requestId = createDeactivateRequest(controlToken, creatorUserId);
//
//        mockMvc.perform(put("/api/user-approval-requests/" + requestId + "/reject")
//                        .header("Authorization", "Bearer " + authorizerToken)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"remark\":\"not justified\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.status").value("REJECTED"));
//
//        assertThat(findUser("creator").getStatus()).isEqualTo(UserStatus.ACTIVE);
//    }
//
//    // ------------------------------------------------------------------
//    // 4. Maker cancels his own pending request
//    // ------------------------------------------------------------------
//
//    @Test
//    @Order(4)
//    void makerCanCancelOwnPendingRequest() throws Exception {
//        String controlToken = loginToken("control", "control123");
//
//        long creatorUserId = findUser("creator").getId();
//        long requestId = createDeactivateRequest(controlToken, creatorUserId);
//
//        mockMvc.perform(delete("/api/user-approval-requests/" + requestId)
//                        .header("Authorization", "Bearer " + controlToken))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.status").value("CANCELLED"));
//
//        assertThat(findUser("creator").getStatus()).isEqualTo(UserStatus.ACTIVE);
//    }
//
//    // ------------------------------------------------------------------
//    // 5. Role permission changes go through approval
//    // ------------------------------------------------------------------
//
//    @Test
//    @Order(5)
//    void rolePermissionAssignmentRequiresApproval() throws Exception {
//        String controlToken = loginToken("control", "control123");
//        String authorizerToken = loginToken("authorizer", "authorizer123");
//
//        long creatorRoleId = roleRepository.findByName("CREATOR")
//                .orElseThrow().getId();
//
//        // CONTROL requests a new permission for the CREATOR role
//        MvcResult requestResult = mockMvc.perform(put("/api/roles/" + creatorRoleId + "/permissions")
//                        .header("Authorization", "Bearer " + controlToken)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("""
//                                {
//                                  "permissions": ["LEDGER_DELETE"],
//                                  "reason": "creators need to delete ledgers"
//                                }
//                                """))
//                .andExpect(status().isAccepted())
//                .andExpect(jsonPath("$.status").value("PENDING"))
//                .andReturn();
//
//        JsonNode requestBody = objectMapper.readTree(
//                requestResult.getResponse().getContentAsString());
//        long requestId = requestBody.get("id").asLong();
//
//        // not applied yet
//        assertThat(roleRepository.findByName("CREATOR").orElseThrow().getPermissions())
//                .extracting(p -> p.getName())
//                .doesNotContain("LEDGER_DELETE");
//
//        // AUTHORIZER approves -> permission is applied to the role
//        mockMvc.perform(put("/api/user-approval-requests/" + requestId + "/approve")
//                        .header("Authorization", "Bearer " + authorizerToken)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"remark\":\"granted\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.status").value("APPROVED"));
//
//        assertThat(roleRepository.findByName("CREATOR").orElseThrow().getPermissions())
//                .extracting(p -> p.getName())
//                .contains("LEDGER_DELETE");
//    }
//
//    // ------------------------------------------------------------------
//    // 6. ADMIN can finalize without an AUTHORIZER
//    // ------------------------------------------------------------------
//
//    @Test
//    @Order(6)
//    void adminCanApproveWithoutAuthorizer() throws Exception {
//        String controlToken = loginToken("control", "control123");
//        String adminToken = loginToken("admin", "admin123");
//
//        long newUserId = createUserAsControl("jane2", controlToken);
//        long requestId = findRequestIdForUser(newUserId, UserApprovalAction.USER_CREATE);
//
//        mockMvc.perform(put("/api/user-approval-requests/" + requestId + "/approve")
//                        .header("Authorization", "Bearer " + adminToken)
//                        .contentType(MediaType.APPLICATION_JSON)
//                        .content("{\"remark\":\"admin approves\"}"))
//                .andExpect(status().isOk())
//                .andExpect(jsonPath("$.status").value("APPROVED"));
//
//        assertThat(findUser("jane2").getStatus()).isEqualTo(UserStatus.ACTIVE);
//    }
//}
