package com.glms.general_ledger_management_system.Config;

import com.glms.general_ledger_management_system.Model.postgres.Permission;
import com.glms.general_ledger_management_system.Model.postgres.Role;
import com.glms.general_ledger_management_system.Repository.postgres.PermissionRepository;
import com.glms.general_ledger_management_system.Repository.postgres.RoleRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;


@Configuration
@RequiredArgsConstructor
public class PermissionInitializer {


    private final RoleRepository roleRepository;

    private final PermissionRepository permissionRepository;


    /**
     * Initialize system roles and permissions
     * when the application starts.
     */
    @Bean
    CommandLineRunner initializeRolesAndPermissions() {

        return args -> {

            initializePermissions();

            initializeRoles();
        };
    }


    /**
     * ============================================================
     * PERMISSIONS
     * ============================================================
     */
    @Transactional
    protected void initializePermissions() {

        /*
         * --------------------------------------------------------
         * CONTROL PERMISSIONS
         * --------------------------------------------------------
         */
        createPermission(
                "USER_CREATE",
                "Create a new user"
        );

        createPermission(
                "USER_UPDATE",
                "Update an existing user"
        );

        createPermission(
                "PASSWORD_RESET",
                "Reset a user's password"
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
                "ROLE_ASSIGN_PERMISSION",
                "Assign roles and permissions to users"
        );

        createPermission(
                "UPDATE_PERMISSION",
                "Update role or permission configuration"
        );

        createPermission(
                "ASSIGN_ROLE",
                "Assign roles to users"
        );

        createPermission(
                "ASSIGN_PERMISSION",
                "Assign permissions to a role"
        );

        createPermission(
                "REMOVE_PERMISSION",
                "Remove permissions from a role"
        );


        /*
         * --------------------------------------------------------
         * AUTHORIZER PERMISSIONS
         * --------------------------------------------------------
         */
        createPermission(
                "USER_ACTIVATE",
                "Approve and activate a controlled user action"
        );


        /*
         * --------------------------------------------------------
         * CREATOR PERMISSIONS
         * --------------------------------------------------------
         */
        createPermission(
                "LEDGER_CREATE",
                "Create a ledger"
        );

        createPermission(
                "LEDGER_READ",
                "View ledgers"
        );

        createPermission(
                "LEDGER_UPDATE",
                "Update a ledger"
        );


        /*
         * --------------------------------------------------------
         * ADMIN AUDIT PERMISSIONS
         * --------------------------------------------------------
         */
        createPermission(
                "AUDIT_VIEW",
                "View audit logs"
        );

        createPermission(
                "AUDIT_EXPORT",
                "Export audit logs"
        );


        /*
         * --------------------------------------------------------
         * ADDITIONAL ADMIN-LEVEL PERMISSIONS
         *
         * These allow ADMIN to perform all operations even
         * where the normal business role does not have them.
         * --------------------------------------------------------
         */
        createPermission(
                "USER_DELETE",
                "Delete or permanently remove a user account"
        );

    }


    /**
     * ============================================================
     * ROLES
     * ============================================================
     */
    @Transactional
    protected void initializeRoles() {

        /*
         * --------------------------------------------------------
         * CONTROL
         * --------------------------------------------------------
         */
        Role control =
                getOrCreateRole("CONTROL");

        control.setPermissions(
                getPermissions(
                        "USER_CREATE",
                        "USER_UPDATE",
                        "USER_DEACTIVATE",
                        "USER_DELETE",
                        "USER_SUSPEND",
                        "USER_LOCK",
                        "USER_UNSUSPEND",
                        "ROLE_ASSIGN_PERMISSION",
                        "UPDATE_PERMISSION",
                        "ASSIGN_ROLE",
                        "ASSIGN_PERMISSION",
                        "REMOVE_PERMISSION",
                        "LEDGER_CREATE"
                )
        );

        roleRepository.save(control);


        /*
         * --------------------------------------------------------
         * AUTHORIZER
         * --------------------------------------------------------
         */
        Role authorizer =
                getOrCreateRole("AUTHORIZER");

        authorizer.setPermissions(
                getPermissions(
                        "USER_ACTIVATE"
                )
        );

        roleRepository.save(authorizer);


        /*
         * --------------------------------------------------------
         * CREATOR
         * --------------------------------------------------------
         *
         * IMPORTANT:
         * This role is ONLY initialized.
         *
         * It is NOT automatically assigned to users.
         */
        Role creator =
                getOrCreateRole("CREATOR");

        creator.setPermissions(
                getPermissions(
                        "LEDGER_CREATE",
                        "LEDGER_READ",
                        "LEDGER_UPDATE"
                )
        );

        roleRepository.save(creator);


        /*
         * --------------------------------------------------------
         * ADMIN
         * --------------------------------------------------------
         *
         * ADMIN receives every available permission.
         */
        Role admin =
                getOrCreateRole("ADMIN");

        admin.setPermissions(
                new HashSet<>(
                        permissionRepository.findAll()
                )
        );

        roleRepository.save(admin);
    }


    /**
     * ============================================================
     * CREATE PERMISSION IF IT DOES NOT EXIST
     * ============================================================
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
     * GET OR CREATE ROLE
     * ============================================================
     */
    private Role getOrCreateRole(
            String name
    ) {

        return roleRepository
                .findByName(name)
                .orElseGet(() ->
                        roleRepository.save(
                                Role.builder()
                                        .name(name)
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


}