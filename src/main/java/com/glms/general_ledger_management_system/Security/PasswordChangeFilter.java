package com.glms.general_ledger_management_system.Security;

import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Repository.UserRepository;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;


/**
 * ============================================================
 * MANDATORY PASSWORD CHANGE FILTER
 * ============================================================
 *
 * Strictly enforces the first-login password change policy.
 *
 * While an authenticated user has mustChangePassword = true,
 * only the following endpoints are reachable:
 *
 *     POST /api/auth/change-password
 *     POST /api/auth/logout
 *     POST /api/auth/refresh-token
 *
 * Every other endpoint returns 403 Forbidden with the message
 * "Password change required" until the password is changed.
 */
@Component
@RequiredArgsConstructor
public class PasswordChangeFilter
        extends OncePerRequestFilter {

    private static final Set<String> ALLOWED_PATHS =
            Set.of(
                    "/api/auth/change-password",
                    "/api/auth/logout",
                    "/api/auth/refresh-token"
            );

    private final UserRepository userRepository;


    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();


        if (authentication == null
                || !authentication.isAuthenticated()
                || "anonymousUser".equals(
                authentication.getPrincipal()
        )) {

            filterChain.doFilter(request, response);
            return;
        }


        String username =
                authentication.getName();


        if (username == null || username.isBlank()) {

            filterChain.doFilter(request, response);
            return;
        }


        String path =
                resolvePath(request);


        if (ALLOWED_PATHS.contains(path)) {

            filterChain.doFilter(request, response);
            return;
        }


        boolean mustChangePassword =
                userRepository
                        .findByUsername(username)
                        .map(User::isMustChangePassword)
                        .orElse(false);


        if (!mustChangePassword) {

            filterChain.doFilter(request, response);
            return;
        }


        response.setStatus(
                HttpServletResponse.SC_FORBIDDEN
        );

        response.setContentType(
                "application/json"
        );

        response.getWriter().write(
                "{\"status\":403,\"error\":\"Forbidden\","
                        + "\"message\":\"Password change required\"}"
        );
    }


    @Override
    protected boolean shouldNotFilter(
            HttpServletRequest request
    ) {

        String path =
                resolvePath(request);

        return path.equals("/api/auth/login")
                || path.equals("/api/auth/forgot-password")
                || path.equals("/api/auth/reset-password")
                || path.equals("/error")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/swagger-resources")
                || path.startsWith("/webjars");
    }


    /**
     * ============================================================
     * RESOLVE PATH
     * ============================================================
     *
     * In a real servlet container getServletPath() returns the
     * request path, but in some environments (e.g. MockMvc) it
     * returns an empty string with the path in getRequestURI().
     * Fall back to the request URI so the whitelist always matches.
     */
    private String resolvePath(
            HttpServletRequest request
    ) {

        String path =
                request.getServletPath();

        if (path == null
                || path.isEmpty()) {

            path =
                    request.getRequestURI();
        }

        return path;
    }
}
