package com.glms.general_ledger_management_system.Config;

import com.glms.general_ledger_management_system.Model.postgres.Permission;
import com.glms.general_ledger_management_system.Model.postgres.Role;
import com.glms.general_ledger_management_system.Model.postgres.User;
import com.glms.general_ledger_management_system.Model.postgres.UserStatus;
import com.glms.general_ledger_management_system.Repository.postgres.PermissionRepository;
import com.glms.general_ledger_management_system.Repository.postgres.RoleRepository;
import com.glms.general_ledger_management_system.Repository.postgres.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DatabaseInitializer implements CommandLineRunner {

    private static final String CONTROL = "CONTROL";
    private static final String AUTHORIZER = "AUTHORIZER";
    private static final String CREATOR = "CREATOR";
    private static final String ADMIN = "ADMIN";

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;

    @Value("${control.username}")
    private String controlUsername;

    @Value("${control.password}")
    private String controlPassword;

    @Value("${authorizer.username}")
    private String authorizerUsername;

    @Value("${authorizer.password}")
    private String authorizerPassword;

    @Value("${creator.username}")
    private String creatorUsername;

    @Value("${creator.password}")
    private String creatorPassword;

    @Override
    @Transactional
    public void run(String... args) {

        /*
         * ============================================================
         * 1. CREATE PERMISSIONS
         * ============================================================
         */
        createPermissions();

        /*
         * ============================================================
         * 2. CREATE ROLES AND ASSIGN PERMISSIONS
         * ============================================================
         */
        createRoles();

        /*
         * ============================================================
         * 3. CREATE SYSTEM USERS
         * ============================================================
         *
         * ADMIN, CONTROL, AUTHORIZER and CREATOR system users are
         * created automatically if they do not already exist.
         *
         * Each system user is ACTIVE and carries its respective role.
         */
        createAdminUser();

        createSystemUser(
                controlUsername,
                controlPassword,
                CONTROL,
                "Control",
                "Officer"
        );

        createSystemUser(
                authorizerUsername,
                authorizerPassword,
                AUTHORIZER,
                "Authorizer",
                "Officer"
        );

        createSystemUser(
                creatorUsername,
                creatorPassword,
                CREATOR,
                "Creator",
                "Officer"
        );
    }

    /**
     * ============================================================
     * CREATE GLMS PERMISSIONS
     * ============================================================
     */
    private void createPermissions() {

        /*
         * ------------------------------------------------------------
         * USER MANAGEMENT
         * ------------------------------------------------------------
         */

        createPermission(
                "USER_CREATE",
                "Create a new user"
        );

        createPermission(
                "USER_READ",
                "View user accounts"
        );

        createPermission(
                "USER_UPDATE",
                "Update an existing user"
        );


        createPermission(
                "USER_DEACTIVATE",
                "Deactivate a user account"
        );

        createPermission(
                "USER_SUSPEND",
                "Suspend a user account"
        );

        createPermission(
                "USER_LOCK",
                "Lock a user account"
        );

        createPermission(
                "USER_UNSUSPEND",
                "Remove suspension from a user account"
        );

        createPermission(
                "USER_ACTIVATE",
                "Activate a user account"
        );

        /*
         * ------------------------------------------------------------
         * ROLE / PERMISSION MANAGEMENT
         * ------------------------------------------------------------
         */

        createPermission(
                "ROLE_ASSIGN_PERMISSION",
                "Assign permissions to roles"
        );

        createPermission(
                "UPDATE_PERMISSION",
                "Update role permissions"
        );

        createPermission(
                "ASSIGN_ROLE",
                "Assign role permissions"
        );


        createPermission(
                "ASSIGN_PERMISSION",
                "Assign permissions to role"
        );

        createPermission(
                "REMOVE_PERMISSION",
                "Remove permissions from role"
        );



        /*
         * ------------------------------------------------------------
         * LEDGER MANAGEMENT
         * ------------------------------------------------------------
         */

        createPermission(
                "LEDGER_CREATE",
                "Create a ledger"
        );

        createPermission(
                "LEDGER_READ",
                "Read ledger information"
        );

        createPermission(
                "LEDGER_UPDATE",
                "Update a ledger"
        );

        createPermission(
                "LEDGER_DELETE",
                "Delete a ledger"
        );

        createPermission(
                "LEDGER_VIEW_ALL",
                "View all ledgers"
        );

        /*
         * ------------------------------------------------------------
         * AUDIT
         * ------------------------------------------------------------
         */

        createPermission(
                "AUDIT_VIEW",
                "View audit logs"
        );

        createPermission(
                "AUDIT_EXPORT",
                "Export audit logs"
        );
    }

    /**
     * ============================================================
     * CREATE PERMISSION
     * ============================================================
     *
     * Creates a permission only if it does not already exist.
     */
    private Permission createPermission(
            String name,
            String description
    ) {

        return permissionRepository
                .findByNameIgnoreCase(name)
                .orElseGet(() ->
                        permissionRepository.save(
                                Permission.builder()
                                        .name(name)
                                        .description(description)
                                        .build()
                        )
                );
    }

    /**
     * ============================================================
     * CREATE ROLES
     * ============================================================
     *
     * Important:
     *
     * CREATOR is NOT automatically assigned to users.
     *
     * Roles are only definitions here. User role assignment
     * happens through the appropriate User Management workflow.
     */
    private void createRoles() {

        /*
         * ============================================================
         * CONTROL
         * ============================================================
         *
         * CONTROL is responsible for Maker operations.
         *
         * PASSWORD_RESET is intentionally NOT included in the
         * Maker-Checker approval workflow.
         */
        Role controlRole =
                getOrCreateRole(CONTROL);

        controlRole.setPermissions(
                getPermissions(
                        "USER_CREATE",
                        "USER_READ",
                        "USER_UPDATE",
                        "USER_DEACTIVATE",
                        "USER_SUSPEND",
                        "USER_LOCK",
                        "USER_UNSUSPEND",
                        "ROLE_ASSIGN_PERMISSION",
                        "UPDATE_PERMISSION",
                        "ASSIGN_ROLE",
                        "ASSIGN_PERMISSION",
                        "REMOVE_PERMISSION"

                )
        );

        roleRepository.save(controlRole);


        /*
         * ============================================================
         * AUTHORIZER
         * ============================================================
         *
         * AUTHORIZER performs Checker authorization.
         *
         * USER_ACTIVATE is retained here according to the current
         * permission model.
         */
        Role authorizerRole =
                getOrCreateRole(AUTHORIZER);

        authorizerRole.setPermissions(
                getPermissions(
                        "USER_ACTIVATE"
                )
        );

        roleRepository.save(authorizerRole);


        /*
         * ============================================================
         * CREATOR
         * ============================================================
         *
         * CREATOR is NOT assigned automatically.
         */
        Role creatorRole =
                getOrCreateRole(CREATOR);

        creatorRole.setPermissions(
                getPermissions(
                        "LEDGER_CREATE",
                        "LEDGER_READ",
                        "LEDGER_UPDATE"
                )
        );

        roleRepository.save(creatorRole);


        /*
         * ============================================================
         * ADMIN
         * ============================================================
         *
         * ADMIN receives all available permissions.
         */
        Role adminRole =
                getOrCreateRole(ADMIN);

        adminRole.setPermissions(
                new HashSet<>(
                        permissionRepository.findAll()
                )
        );

        roleRepository.save(adminRole);
    }

    /**
     * ============================================================
     * FIND OR CREATE ROLE
     * ============================================================
     */
    private Role getOrCreateRole(
            String roleName
    ) {

        return roleRepository
                .findByName(roleName)
                .orElseGet(() ->
                        roleRepository.save(
                                Role.builder()
                                        .name(roleName)
                                        .permissions(
                                                new HashSet<>()
                                        )
                                        .build()
                        )
                );
    }

    /**
     * ============================================================
     * GET PERMISSIONS BY NAME
     * ============================================================
     */
    private Set<Permission> getPermissions(
            String... permissionNames
    ) {

        Set<Permission> permissions =
                new HashSet<>();


        for (String permissionName : permissionNames) {

            Permission permission =
                    permissionRepository
                            .findByNameIgnoreCase(
                                    permissionName
                            )
                            .orElseThrow(() ->
                                    new IllegalStateException(
                                            "Permission not found: "
                                                    + permissionName
                                    )
                            );

            permissions.add(permission);
        }


        return permissions;
    }

    /**
     * ============================================================
     * CREATE INITIAL SYSTEM ADMINISTRATOR
     * ============================================================
     *
     * Only the system administrator is created automatically.
     *
     * No CONTROL user.
     * No AUTHORIZER user.
     * No CREATOR user.
     *
     * Those users must be created through User Management.
     */
    private void createAdminUser() {

        if (adminUsername == null
                || adminUsername.isBlank()) {

            throw new IllegalStateException(
                    "admin.username must be configured"
            );
        }


        if (adminPassword == null
                || adminPassword.isBlank()) {

            throw new IllegalStateException(
                    "admin.password must be configured"
            );
        }


        if (userRepository
                .findByUsername(adminUsername)
                .isPresent()) {

            return;
        }


        /*
         * Find ADMIN role.
         */
        Role adminRole =
                roleRepository
                        .findByName(ADMIN)
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        "ADMIN role not found"
                                )
                        );


        /*
         * Create system administrator.
         */
        User admin =
                User.builder()
                        .firstName("System")
                        .lastName("Administrator")
                        .username(adminUsername)
                        .email("admin@glms.com")
                        .password(
                                passwordEncoder.encode(
                                        adminPassword
                                )
                        )
                        .status(
                                UserStatus.ACTIVE
                        )
                        .createdAt(
                                LocalDateTime.now()
                        )
                        .failedLoginAttempts(0)
                        .roles(
                                new HashSet<>(
                                        Set.of(adminRole)
                                )
                        )
                        .build();


        userRepository.save(admin);
    }


    /**
     * ============================================================
     * CREATE SYSTEM USER
     * ============================================================
     *
     * Creates a default system user (CONTROL, AUTHORIZER or
     * CREATOR) with its respective role.
     *
     * System users do NOT require a mandatory password change;
     * only users created through the Maker workflow do.
     */
    private void createSystemUser(
            String username,
            String password,
            String roleName,
            String firstName,
            String lastName
    ) {

        if (username == null || username.isBlank()) {

            throw new IllegalStateException(
                    "System user username must be configured"
            );
        }

        if (password == null || password.isBlank()) {

            throw new IllegalStateException(
                    "System user password must be configured for "
                            + username
            );
        }

        if (userRepository
                .findByUsername(username)
                .isPresent()) {

            return;
        }

        Role role =
                roleRepository
                        .findByName(roleName)
                        .orElseThrow(() ->
                                new IllegalStateException(
                                        roleName + " role not found"
                                )
                        );

        User user =
                User.builder()
                        .firstName(firstName)
                        .lastName(lastName)
                        .username(username)
                        .email(username + "@glms.com")
                        .password(
                                passwordEncoder.encode(
                                        password
                                )
                        )
                        .status(
                                UserStatus.ACTIVE
                        )
                        .createdAt(
                                LocalDateTime.now()
                        )
                        .failedLoginAttempts(0)
                        .roles(
                                new HashSet<>(
                                        Set.of(role)
                                )
                        )
                        .build();

        userRepository.save(user);
    }
}