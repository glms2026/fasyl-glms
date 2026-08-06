package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.DTO.role.AssignPermissionRequest;
import com.glms.general_ledger_management_system.Model.AuditLog;
import com.glms.general_ledger_management_system.Model.Permission;
import com.glms.general_ledger_management_system.Model.Role;
import com.glms.general_ledger_management_system.Repository.AuditLogRepository;
import com.glms.general_ledger_management_system.Repository.PermissionRepository;
import com.glms.general_ledger_management_system.Repository.RoleRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class RolePermissionService {

    private final RoleRepository roleRepository;

    private final PermissionRepository permissionRepository;

    private final AuditLogRepository auditLogRepository;

    /**
     * Assign Permissions To Role
     */
    public Role assignPermissions(
            Long roleId,
            AssignPermissionRequest request
    ) {

        if (request.getPermissions() == null ||
                request.getPermissions().isEmpty()) {

            throw new IllegalArgumentException(
                    "At least one permission must be provided"
            );
        }

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Role not found"
                                ));

        Set<Permission> permissions =
                request.getPermissions()
                        .stream()
                        .map(permissionName ->
                                permissionRepository
                                        .findByName(permissionName)
                                        .orElseThrow(() ->
                                                new RuntimeException(
                                                        "Permission not found: "
                                                                + permissionName
                                                )
                                        )
                        )
                        .collect(Collectors.toSet());

        /*
         * Replace Existing Permissions
         */
        role.getPermissions().addAll(permissions);

        Role savedRole = roleRepository.save(role);

        createAuditLog(
                getCurrentUsername(),
                "ASSIGN_PERMISSION",
                "Assigned permissions " +
                        request.getPermissions() +
                        " to role " +
                        role.getName()
        );

        return savedRole;
    }

    /**
     * Remove All Permissions From Role
     */
    public void clearPermissions(
            Long roleId
    ) {

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Role not found"
                                ));

        role.getPermissions().clear();

        roleRepository.save(role);

        createAuditLog(
                getCurrentUsername(),
                "CLEAR_PERMISSION",
                "Removed all permissions from role " +
                        role.getName()
        );
    }


    @Transactional
    public Role removePermission(Long roleId, String permissionName) {

        Role role = roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Role not found with id: " + roleId
                        ));

        Permission permission = permissionRepository.findByNameIgnoreCase(permissionName)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "Permission not found: " + permissionName
                        ));

        if (!role.getPermissions().contains(permission)) {
            throw new IllegalStateException(
                    String.format(
                            "Permission '%s' is not assigned to role '%s'.",
                            permissionName,
                            role.getName()
                    )
            );
        }

        role.getPermissions().remove(permission);

        createAuditLog(
                getCurrentUsername(),
                "REMOVE_PERMISSION",
                String.format(
                        "Permission '%s' removed from role '%s' (Role ID: %d)",
                        permission.getName(),
                        role.getName(),
                        role.getId()
                )
        );

        return role;
    }

    /**
     * Get Role By ID
     */
    @Transactional(readOnly = true)
    public Role getRole(
            Long roleId
    ) {

        return roleRepository.findById(roleId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Role not found"
                        ));
    }

    /**
     * Create Audit Log
     */
    private void createAuditLog(
            String username,
            String action,
            String description
    ) {

        AuditLog auditLog =
                AuditLog.builder()
                        .username(username)
                        .action(action)
                        .description(description)
                        .createdAt(LocalDateTime.now())
                        .build();

        auditLogRepository.save(auditLog);
    }

    /**
     * Get Logged-in Username
     */
    private String getCurrentUsername() {

        Authentication authentication =
                SecurityContextHolder
                        .getContext()
                        .getAuthentication();

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return "SYSTEM";
        }

        return authentication.getName();
    }

}