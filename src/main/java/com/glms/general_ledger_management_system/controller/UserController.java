package com.glms.general_ledger_management_system.controller;

import com.glms.general_ledger_management_system.DTO.user.AssignRoleRequest;
import com.glms.general_ledger_management_system.DTO.user.CreateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UserResponse;
import com.glms.general_ledger_management_system.Service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.security.access.prepost.PreAuthorize;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    /**
     * Create User
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(
            @Valid @RequestBody CreateUserRequest request) {

        UserResponse response = userService.createUser(request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    /**
     * Update User
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserRequest request) {

        UserResponse response =
                userService.updateUser(id, request);

        return ResponseEntity.ok(response);
    }

    /**
     * Get User By ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(
            @PathVariable Long id) {

        UserResponse response =
                userService.getUserById(id);

        return ResponseEntity.ok(response);
    }

    /**
     * Get All Users
     */
    @GetMapping
    public ResponseEntity<Page<UserResponse>> getAllUsers(
            Pageable pageable) {

        Page<UserResponse> users =
                userService.getAllUsers(pageable);

        return ResponseEntity.ok(users);
    }

    /**
     * Soft Delete User
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(
            @PathVariable Long id) {

        userService.deleteUser(id);

        return ResponseEntity.noContent().build();
    }

    /**
     * Activate User
     */
    @PatchMapping("/{id}/activate")
    public ResponseEntity<Void> activateUser(
            @PathVariable Long id) {

        userService.activateUser(id);

        return ResponseEntity.ok().build();
    }

    /**
     * Deactivate User
     */
    @PatchMapping("/{id}/deactivate")
    public ResponseEntity<Void> deactivateUser(
            @PathVariable Long id) {

        userService.deactivateUser(id);

        return ResponseEntity.ok().build();
    }

    /**
     * Assign Role
     */
    @PatchMapping("/{id}/roles")
    public ResponseEntity<Void> assignRole(
            @PathVariable Long id,
            @Valid @RequestBody AssignRoleRequest request) {

        userService.assignRole(id, request);

        return ResponseEntity.ok().build();
    }



    /**
     * Suspend User Account
     */
    @PutMapping("/{id}/suspend")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Suspend user account",
            description = "Suspend a user account. Requires ADMIN privilege."
    )
    public ResponseEntity<String> suspendUser(
            @PathVariable Long id
    ) {


        userService.suspendUser(id);


        return ResponseEntity.ok(
                "User suspended successfully"
        );

    }



    /**
     * Unsuspend User Account
     */
    @PutMapping("/{id}/unsuspend")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Unsuspend user account",
            description = "Activate a suspended user account"
    )
    public ResponseEntity<String> unsuspendUser(
            @PathVariable Long id
    ) {


        userService.unsuspendUser(id);


        return ResponseEntity.ok(
                "User unsuspended successfully"
        );

    }


    /**
     * Lock User Account
     */
    @PutMapping("/{id}/lock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Lock user account",
            description = "Locks a user account. Requires ADMIN role."
    )
    public ResponseEntity<String> lockUser(
            @PathVariable Long id
    ) {


        userService.lockUser(id);


        return ResponseEntity.ok(
                "User locked successfully"
        );

    }


    /**
     * Unlock User Account
     */
    @PutMapping("/{id}/unlock")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Unlock user account",
            description = "Unlocks a locked user account. Requires ADMIN privilege."
    )
    public ResponseEntity<String> unlockUser(
            @PathVariable Long id
    ) {


        userService.unlockUser(id);


        return ResponseEntity.ok(
                "User unlocked successfully"
        );

    }

}