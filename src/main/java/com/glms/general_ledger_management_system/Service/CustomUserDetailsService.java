package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.Model.postgres.Permission;
import com.glms.general_ledger_management_system.Model.postgres.Role;
import com.glms.general_ledger_management_system.Model.postgres.User;
import com.glms.general_ledger_management_system.Model.postgres.UserStatus;
import com.glms.general_ledger_management_system.Repository.postgres.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    /**
     * Load authenticated user from the database.
     *
     * Roles are converted into ROLE_* authorities.
     * Permissions are converted into direct authorities.
     */
    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        if (username == null || username.isBlank()) {
            throw new UsernameNotFoundException(
                    "Username cannot be empty"
            );
        }

        User user = userRepository
                .findByUsernameIgnoreCase(username.trim())
                .orElseThrow(() ->
                        new UsernameNotFoundException(
                                "User not found: " + username
                        )
                );


        /*
         * Validate required authentication fields.
         */
        if (user.getUsername() == null
                || user.getUsername().isBlank()) {

            throw new UsernameNotFoundException(
                    "User account has no valid username"
            );
        }

        if (user.getPassword() == null
                || user.getPassword().isBlank()) {

            throw new UsernameNotFoundException(
                    "User account has no valid password"
            );
        }

        /*
         * Build authorities from roles and permissions.
         */
        Set<SimpleGrantedAuthority> authorities =
                new HashSet<>();

        if (user.getRoles() != null) {

            for (Role role : user.getRoles()) {

                if (role == null || role.getName() == null) {
                    continue;
                }

                String roleName = role.getName().trim();

                if (roleName.isEmpty()) {
                    continue;
                }

                /*
                 * Add role authority.
                 *
                 * Example:
                 * ADMIN    -> ROLE_ADMIN
                 * CONTROL  -> ROLE_CONTROL
                 * CREATOR  -> ROLE_CREATOR
                 */
                authorities.add(
                        new SimpleGrantedAuthority(
                                "ROLE_"
                                        + roleName.toUpperCase(
                                        Locale.ROOT
                                )
                        )
                );

                /*
                 * Add permission authorities.
                 *
                 * Example:
                 * USER_CREATE
                 * USER_SUSPEND
                 * USER_LOCK
                 * USER_ACTIVATE
                 * LEDGER_CREATE
                 * AUDIT_VIEW
                 */
                if (role.getPermissions() != null) {

                    for (Permission permission :
                            role.getPermissions()) {

                        if (permission == null
                                || permission.getName() == null) {
                            continue;
                        }

                        String permissionName =
                                permission.getName().trim();

                        if (permissionName.isEmpty()) {
                            continue;
                        }

                        authorities.add(
                                new SimpleGrantedAuthority(
                                        permissionName.toUpperCase(
                                                Locale.ROOT
                                        )
                                )
                        );
                    }
                }
            }
        }

        /*
         * Determine account security state.
         */
        UserStatus status = user.getStatus();

        /*
         * Fail closed if the account has no status.
         */
        if (status == null) {

            throw new DisabledException(
                    "User account status is not configured"
            );
        }

        /*
         * LOCKED:
         * Prevent authentication because the account
         * is locked.
         */
        boolean accountLocked =
                UserStatus.LOCKED.equals(status);

        /*
         * INACTIVE and SUSPENDED:
         * Prevent authentication because the account
         * is disabled.
         */
        boolean accountDisabled =
                UserStatus.INACTIVE.equals(status)
                        || UserStatus.SUSPENDED.equals(status);

        /*
         * PASSWORD_EXPIRED:
         * Prevent authentication because credentials
         * have expired.
         */
        boolean credentialsExpired =
                UserStatus.PASSWORD_EXPIRED.equals(status);

        /*
         * Build Spring Security UserDetails.
         */
        return org.springframework.security.core.userdetails.User
                .builder()
                .username(user.getUsername())
                .password(user.getPassword())
                .authorities(authorities)
                .accountExpired(false)
                .accountLocked(accountLocked)
                .credentialsExpired(credentialsExpired)
                .disabled(accountDisabled)
                .build();
    }
}