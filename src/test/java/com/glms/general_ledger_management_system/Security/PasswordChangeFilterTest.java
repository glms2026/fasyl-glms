package com.glms.general_ledger_management_system.Security;

import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Model.UserStatus;
import com.glms.general_ledger_management_system.Repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PasswordChangeFilterTest {

    private UserRepository userRepository;
    private PasswordChangeFilter filter;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        filter = new PasswordChangeFilter(userRepository);
    }

    private MockHttpServletRequest request(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setServletPath(path);
        return request;
    }

    private void authenticate(String username) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        username, null, List.of()
                )
        );
    }

    private User user(boolean mustChange) {
        return User.builder()
                .username("newUser")
                .status(UserStatus.ACTIVE)
                .mustChangePassword(mustChange)
                .build();
    }

    @Test
    void blocksNonAllowedEndpointWhenPasswordChangeRequired() throws Exception {
        authenticate("newUser");
        when(userRepository.findByUsername("newUser"))
                .thenReturn(Optional.of(user(true)));

        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request("/api/users"), response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains("Password change required");
    }

    @Test
    void allowsPasswordChangeEndpointWhenPasswordChangeRequired() throws Exception {
        authenticate("newUser");
        when(userRepository.findByUsername("newUser"))
                .thenReturn(Optional.of(user(true)));

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request("/api/auth/change-password"), response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void passesThroughWhenPasswordChangeNotRequired() throws Exception {
        authenticate("newUser");
        when(userRepository.findByUsername("newUser"))
                .thenReturn(Optional.of(user(false)));

        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request("/api/users"), response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull();
    }

    @Test
    void passesThroughWhenNotAuthenticated() throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();
        filter.doFilter(request("/api/users"), response, chain);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(chain.getRequest()).isNotNull();
    }
}
