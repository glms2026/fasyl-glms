package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.common.ApiResponse;
import com.glms.general_ledger_management_system.DTO.role.AssignPermissionRequest;
import com.glms.general_ledger_management_system.DTO.role.AssignPermissionResponse;
import com.glms.general_ledger_management_system.DTO.role.PermissionResponse;
import com.glms.general_ledger_management_system.Model.Permission;
import com.glms.general_ledger_management_system.Model.Role;
import com.glms.general_ledger_management_system.Service.RolePermissionService;

import jakarta.validation.Valid;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RolePermissionController {


    private final RolePermissionService rolePermissionService;


//    @PutMapping("/{roleId}/permissions")
////    @PreAuthorize("hasAuthority('ROLE_ASSIGN_PERMISSION')")
//    public ResponseEntity<Void> assignPermissions(
//
//            @PathVariable Long roleId,
//
//            @Valid @RequestBody AssignPermissionRequest request
//
//    ) {
//
//        rolePermissionService.assignPermissions(
//                roleId,
//                request
//        );
//
//        return ResponseEntity.ok().build();
//    }



@PutMapping("/{roleId}/permissions")
public ResponseEntity<AssignPermissionResponse> assignPermissions(

        @PathVariable Long roleId,
        @Valid @RequestBody AssignPermissionRequest request
) {

    Role role = rolePermissionService.assignPermissions(roleId, request);

    AssignPermissionResponse response =
            AssignPermissionResponse.builder()
                    .roleId(role.getId())
                    .roleName(role.getName())
                    .permissions(
                            role.getPermissions()
                                    .stream()
                                    .map(Permission::getName)
                                    .collect(Collectors.toSet())
                    )
                    .message("Permissions assigned successfully")
                    .build();

    return ResponseEntity.ok(response);
}


    @DeleteMapping("/{roleId}/permissions")
//    @PreAuthorize("hasAuthority('ROLE_ASSIGN_PERMISSION')")
//    public ResponseEntity<Void> clearPermissions(
//
//            @PathVariable Long roleId
//
//    ) {
//
//        rolePermissionService.clearPermissions(roleId);
//
//        return ResponseEntity.noContent().build();
//    }

    public ResponseEntity<ApiResponse> clearPermissions(

            @PathVariable
            @Positive(message = "Role ID must be greater than zero")
            Long roleId

    ) {

        rolePermissionService.clearPermissions(roleId);

        ApiResponse response = ApiResponse.builder()
                .success(true)
                .message("All permissions removed successfully.")
                .build();

        return ResponseEntity.ok(response);

    }



    @DeleteMapping("/{roleId}/permissions/{permissionName}")
    public ResponseEntity<ApiResponse> removePermission(
            @PathVariable Long roleId,
            @PathVariable String permissionName
    ) {

        Role role = rolePermissionService.removePermission(
                roleId,
                permissionName
        );

        ApiResponse response = ApiResponse.builder()
                .success(true)
                .message("Permission '" + permissionName +
                        "' removed from role '" + role.getName() + "'.")
                .build();

        return ResponseEntity.ok(response);
    }


//    @GetMapping("/{roleId}/permissions")
////    @PreAuthorize("hasAuthority('ROLE_READ')")
//    public ResponseEntity<Set<Permission>> getPermissions(
//
//            @PathVariable Long roleId
//
//    ) {
//
//        Role role =
//                rolePermissionService.getRole(roleId);
//
//
//        return ResponseEntity.ok(
//                role.getPermissions()
//        );
//    }




@GetMapping("/{roleId}/permissions")
public ResponseEntity<List<PermissionResponse>> getPermissions(
        @PathVariable Long roleId
) {

    Role role = rolePermissionService.getRole(roleId);

    List<PermissionResponse> response = role.getPermissions()
            .stream()
            .map(permission -> PermissionResponse.builder()
                    .id(permission.getId())
                    .name(permission.getName())
                    .description(permission.getDescription())
                    .build())
            .sorted(Comparator.comparing(PermissionResponse::getId))
            .toList();

    return ResponseEntity.ok(response);
}

}