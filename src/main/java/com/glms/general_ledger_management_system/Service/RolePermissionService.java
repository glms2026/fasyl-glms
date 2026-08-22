package com.glms.general_ledger_management_system.Service;

import com.glms.general_ledger_management_system.DTO.role.AssignPermissionRequest;
import com.glms.general_ledger_management_system.Model.postgres.AuditLog;
import com.glms.general_ledger_management_system.Model.postgres.Permission;
import com.glms.general_ledger_management_system.Model.postgres.Role;
import com.glms.general_ledger_management_system.Repository.postgres.AuditLogRepository;
import com.glms.general_ledger_management_system.Repository.postgres.PermissionRepository;
import com.glms.general_ledger_management_system.Repository.postgres.RoleRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
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
                    "Please select at least one permission to continue."
            );
        }

        Role role =
                roleRepository.findById(roleId)
                        .orElseThrow(() ->
                                new EntityNotFoundException(
                                        "We couldn't find that role - please check and try again."
                                ));

        Set<Permission> permissions =
                request.getPermissions()
                        .stream()
                        .map(permissionName ->
                                permissionRepository
                                        .findByName(permissionName)
                                        .orElseThrow(() ->
                                                new EntityNotFoundException(
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
                                new EntityNotFoundException(
                                        "We couldn't find that role - please check and try again."
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
                                "We couldn't find the role: " + roleId
                        ));

        Permission permission = permissionRepository.findByNameIgnoreCase(permissionName)
                .orElseThrow(() ->
                        new EntityNotFoundException(
                                "We couldn't find the permission: " + permissionName
                        ));

        if (!role.getPermissions().contains(permission)) {
            throw new IllegalStateException(
                    String.format(
                            "Permission '%s' isn't currently assigned to the '%s' role.",
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
     * Get All Roles
     */
    @Transactional(readOnly = true)
    public List<Role> getAllRoles() {

        return roleRepository.findAll()
                .stream()
                .sorted(
                        Comparator.comparing(Role::getId)
                )
                .toList();
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
                        new EntityNotFoundException(
                                "We couldn't find that role - please check and try again."
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