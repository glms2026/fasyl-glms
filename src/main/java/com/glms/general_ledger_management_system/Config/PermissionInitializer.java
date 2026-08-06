package com.glms.general_ledger_management_system.Config;

import com.glms.general_ledger_management_system.Model.Permission;
import com.glms.general_ledger_management_system.Repository.PermissionRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class PermissionInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;

    @Override
    public void run(String... args) {

        List<Permission> permissions = List.of(

                Permission.builder()
                        .name("AUTH_LOGIN")
                        .description("Login to the system")
                        .build(),

                Permission.builder()
                        .name("AUTH_LOGOUT")
                        .description("Logout from the system")
                        .build(),

                Permission.builder()
                        .name("PASSWORD_CHANGE")
                        .description("Change own password")
                        .build(),

                Permission.builder()
                        .name("PASSWORD_RESET")
                        .description("Reset password")
                        .build(),

                Permission.builder()
                        .name("USER_CREATE")
                        .description("Create users")
                        .build(),

                Permission.builder()
                        .name("USER_READ")
                        .description("View users")
                        .build(),

                Permission.builder()
                        .name("USER_UPDATE")
                        .description("Update users")
                        .build(),

                Permission.builder()
                        .name("USER_DELETE")
                        .description("Delete users")
                        .build(),

                Permission.builder()
                        .name("USER_ACTIVATE")
                        .description("Activate users")
                        .build(),

                Permission.builder()
                        .name("USER_DEACTIVATE")
                        .description("Deactivate users")
                        .build(),

                Permission.builder()
                        .name("USER_ASSIGN_ROLE")
                        .description("Assign roles to users")
                        .build(),

                Permission.builder()
                        .name("ROLE_CREATE")
                        .description("Create roles")
                        .build(),

                Permission.builder()
                        .name("ROLE_READ")
                        .description("View roles")
                        .build(),

                Permission.builder()
                        .name("ROLE_UPDATE")
                        .description("Update roles")
                        .build(),

                Permission.builder()
                        .name("ROLE_DELETE")
                        .description("Delete roles")
                        .build(),

                Permission.builder()
                        .name("ROLE_ASSIGN_PERMISSION")
                        .description("Assign permissions to roles")
                        .build(),

                Permission.builder()
                        .name("LEDGER_CREATE")
                        .description("Create ledger")
                        .build(),

                Permission.builder()
                        .name("LEDGER_READ")
                        .description("Read ledger")
                        .build(),

                Permission.builder()
                        .name("LEDGER_UPDATE")
                        .description("Update ledger")
                        .build(),

                Permission.builder()
                        .name("LEDGER_DELETE")
                        .description("Delete ledger")
                        .build(),

                Permission.builder()
                        .name("LEDGER_VIEW_ALL")
                        .description("View all ledgers")
                        .build(),

                Permission.builder()
                        .name("LEDGER_VIEW_OWN")
                        .description("View own ledgers")
                        .build(),

                Permission.builder()
                        .name("JOURNAL_CREATE")
                        .description("Create journal")
                        .build(),

                Permission.builder()
                        .name("JOURNAL_READ")
                        .description("Read journal")
                        .build(),

                Permission.builder()
                        .name("JOURNAL_UPDATE")
                        .description("Update journal")
                        .build(),

                Permission.builder()
                        .name("JOURNAL_POST")
                        .description("Post journal")
                        .build(),

                Permission.builder()
                        .name("JOURNAL_APPROVE")
                        .description("Approve journal")
                        .build(),

                Permission.builder()
                        .name("JOURNAL_REVERSE")
                        .description("Reverse journal")
                        .build(),

                Permission.builder()
                        .name("AUDIT_VIEW")
                        .description("View audit logs")
                        .build(),

                Permission.builder()
                        .name("AUDIT_EXPORT")
                        .description("Export audit logs")
                        .build()

        );

        permissions.forEach(permission -> {

            if (!permissionRepository.existsByName(permission.getName())) {

                permissionRepository.save(permission);

            }

        });

    }

}