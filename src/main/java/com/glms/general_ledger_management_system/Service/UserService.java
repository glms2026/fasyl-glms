package com.glms.general_ledger_management_system.Service;


import com.glms.general_ledger_management_system.DTO.user.AssignRoleRequest;
import com.glms.general_ledger_management_system.DTO.user.CreateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UserResponse;

import com.glms.general_ledger_management_system.Model.AuditLog;
import com.glms.general_ledger_management_system.Model.Role;
import com.glms.general_ledger_management_system.Model.User;

import com.glms.general_ledger_management_system.Mapper.UserMapper;

import com.glms.general_ledger_management_system.Model.UserStatus;
import com.glms.general_ledger_management_system.Repository.*;


import lombok.RequiredArgsConstructor;


import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.Set;



@Service
@RequiredArgsConstructor
@Transactional
public class UserService {



    private final UserRepository userRepository;


    private final RoleRepository roleRepository;


    private final AuditLogRepository auditLogRepository;


    private final PasswordEncoder passwordEncoder;


    private final UserMapper userMapper;

    private final RefreshTokenRepository refreshTokenRepository;

    private final RefreshTokenService refreshTokenService;

    private final JwtTokenRepository jwtTokenRepository;





    public UserResponse createUser(CreateUserRequest request) {

        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        User user = userMapper.toEntity(request);

        user.setPassword(passwordEncoder.encode(request.getPassword()));

        Role userRole = roleRepository.findByName("USER")
                .orElseThrow(() ->
                        new RuntimeException("Default USER role not found"));

        user.setRoles(Set.of(userRole));

        // Your entity uses status instead of active
        user.setStatus(UserStatus.ACTIVE);

        User savedUser = userRepository.save(user);

        createAuditLog(
                savedUser.getUsername(),
                "CREATE_USER",
                "Created new user account"
        );

        return userMapper.toResponse(savedUser);
    }



    private void createAuditLog(
            String username,
            String action,
            String description
    ) {

        AuditLog auditLog = AuditLog.builder()
                .username(username)
                .action(action)
                .description(description)
                .createdAt(LocalDateTime.now())
                .build();

        auditLogRepository.save(auditLog);
    }



    /**
     * Update Existing User
     */
    public UserResponse updateUser(
            Long id,
            UpdateUserRequest request
    ) {

        // Find existing user
        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found"));

        // Validate username uniqueness
        if (request.getUsername() != null &&
                !request.getUsername().equals(user.getUsername())) {

            userRepository.findByUsername(request.getUsername())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(user.getId())) {
                            throw new RuntimeException("Username already exists");
                        }
                    });
        }

        // Validate email uniqueness
        if (request.getEmail() != null &&
                !request.getEmail().equals(user.getEmail())) {

            userRepository.findByEmail(request.getEmail())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(user.getId())) {
                            throw new RuntimeException("Email already exists");
                        }
                    });
        }

        // Update user fields
        userMapper.updateEntity(user, request);

        // Update timestamp
        user.setUpdatedAt(LocalDateTime.now());

        // Save changes
        User updatedUser = userRepository.save(user);

        // Audit log
        createAuditLog(
                getCurrentUsername(),
                "UPDATE_USER",
                "Updated user: " + updatedUser.getUsername()
        );

        return userMapper.toResponse(updatedUser);
    }

    private String getCurrentUsername() {

        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }



    /**
     * Get User By ID
     */
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {

        if (id == null) {
            throw new RuntimeException("User ID cannot be null");
        }

        User user = userRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("User not found")
                );

        return userMapper.toResponse(user);
    }

    /**
     * Get All Users
     */
    @Transactional(readOnly = true)
    public Page<UserResponse> getAllUsers(
            Pageable pageable
    ) {

        if (pageable == null) {
            throw new IllegalArgumentException(
                    "Page information cannot be null"
            );
        }

        return userRepository
                .findAll(pageable)
                .map(userMapper::toResponse);
    }







    /**
     * Soft Delete User
     */
    @Transactional
    public void deleteUser(Long id) {

        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));


        /*
         * Prevent deleting ADMIN account
         */
        boolean isAdmin =
                user.getRoles()
                        .stream()
                        .anyMatch(
                                role ->
                                        role.getName()
                                                .equals("ADMIN")
                        );


        if (isAdmin) {

            throw new RuntimeException(
                    "Administrator account cannot be deleted"
            );

        }


        /*
         * Soft Delete User
         */
        user.setStatus(
                UserStatus.INACTIVE
        );


        userRepository.save(user);


        /*
         * Audit Log
         */
        createAuditLog(
                getCurrentUsername(),
                "DELETE_USER",
                "Deleted user: " + user.getUsername()
        );

    }


    /**
     * Activate User Account
     */
    @Transactional
    public void activateUser(
            Long id
    ) {

        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));


        /*
         * Activate User
         */
        user.setStatus(
                UserStatus.ACTIVE
        );


        userRepository.save(user);


        /*
         * Audit Log
         */
        createAuditLog(

                getCurrentUsername(),

                "ACTIVATE_USER",

                "Activated user: " + user.getUsername()

        );

    }


    /**
     * Deactivate User Account
     */
    @Transactional
    public void deactivateUser(
            Long id
    ) {

        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));


        /*
         * Prevent disabling ADMIN account
         */
        boolean isAdmin =
                user.getRoles()
                        .stream()
                        .anyMatch(
                                role ->
                                        role.getName()
                                                .equals("ADMIN")
                        );


        if (isAdmin) {

            throw new RuntimeException(
                    "Administrator account cannot be deactivated"
            );

        }


        /*
         * Deactivate User
         */
        user.setStatus(
                UserStatus.INACTIVE
        );


        userRepository.save(user);


        /*
         * Audit Log
         */
        createAuditLog(

                getCurrentUsername(),

                "DEACTIVATE_USER",

                "Deactivated user: " + user.getUsername()

        );

    }







    /**
     * Assign Roles To User
     */
    @Transactional
    public void assignRole(
            Long id,
            AssignRoleRequest request
    ) {

        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));


        if(request.getRoles() == null ||
                request.getRoles().isEmpty()) {

            throw new RuntimeException(
                    "At least one role is required"
            );
        }


        Set<Role> roles =
                request.getRoles()
                        .stream()
                        .map(roleName ->
                                roleRepository
                                        .findByName(roleName)
                                        .orElseThrow(() ->
                                                new RuntimeException(
                                                        "Role not found: "
                                                                + roleName
                                                )
                                        )
                        )
                        .collect(
                                java.util.stream.Collectors.toSet()
                        );


        /*
         * Add roles without removing existing roles
         */
        user.getRoles()
                .addAll(roles);


        userRepository.save(user);


        createAuditLog(

                getCurrentUsername(),

                "ASSIGN_ROLE",

                "Assigned roles "
                        + request.getRoles()
                        + " to user "
                        + user.getUsername()

        );

    }




    /**
     * Suspend User Account
     */
    @Transactional
    public void suspendUser(Long id) {


        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));



        boolean isAdmin =
                user.getRoles()
                        .stream()
                        .anyMatch(role ->
                                "ADMIN".equalsIgnoreCase(
                                        role.getName()
                                )
                        );


        if(isAdmin){

            throw new RuntimeException(
                    "Administrator account cannot be suspended"
            );

        }



        if(user.getStatus()
                == UserStatus.SUSPENDED){

            throw new RuntimeException(
                    "User is already suspended"
            );

        }



        user.setStatus(
                UserStatus.SUSPENDED
        );


        user.setSuspendedAt(
                ZonedDateTime.now()
        );


        user.setSuspendedBy(
                getCurrentUsername()
        );


        userRepository.save(user);



        // revoke JWT tokens
        revokeUserTokens(user);



        // revoke refresh tokens
        refreshTokenService
                .revokeAllUserTokens(
                        user.getId()
                );



        createAuditLog(

                getCurrentUsername(),

                "SUSPEND_USER",

                "Suspended user: "
                        + user.getUsername()

        );

    }

    private void revokeUserTokens(User user) {
        var tokens =
                jwtTokenRepository
                        .findAllByUser(user);

        tokens.forEach(
                token ->
                        token.setRevoked(true)
        );

        jwtTokenRepository.saveAll(tokens);

    }


    /**
     * Unsuspend User Account
     */
    @Transactional
    public void unsuspendUser(Long id) {


        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));



        if(!UserStatus.SUSPENDED.equals(
                user.getStatus()
        )){

            throw new RuntimeException(
                    "User account is not suspended"
            );

        }



        user.setStatus(
                UserStatus.ACTIVE
        );


        /*
         * Clear suspension details
         */

        user.setSuspendedAt(null);

        user.setSuspendedBy(null);



        userRepository.save(user);



        createAuditLog(

                getCurrentUsername(),

                "UNSUSPEND_USER",

                "Unsuspended user: "
                        + user.getUsername()

        );

    }




    /**
     * Lock User Account
     */
    @Transactional
    public void lockUser(Long id) {


        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));



        /*
         * Prevent locking ADMIN
         */
        boolean isAdmin =
                user.getRoles()
                        .stream()
                        .anyMatch(role ->
                                "ADMIN".equalsIgnoreCase(
                                        role.getName()
                                )
                        );


        if(isAdmin){

            throw new RuntimeException(
                    "Administrator account cannot be locked"
            );

        }



        /*
         * Prevent duplicate locking
         */
        if(user.getStatus()
                == UserStatus.LOCKED){

            throw new RuntimeException(
                    "User account is already locked"
            );

        }



        user.setStatus(
                UserStatus.LOCKED
        );


        user.setLockedAt(
                ZonedDateTime.now()
        );


        user.setLockedBy(
                getCurrentUsername()
        );


        userRepository.save(user);



        /*
         * Revoke active sessions
         */
        revokeUserTokens(user);


        refreshTokenService
                .revokeAllUserTokens(
                        user.getId()
                );



        createAuditLog(

                getCurrentUsername(),

                "LOCK_USER",

                "Locked user: "
                        + user.getUsername()

        );

    }


    /**
     * Unlock User Account
     */
    @Transactional
    public void unlockUser(Long id) {


        User user =
                userRepository.findById(id)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "User not found"
                                ));



        if(user.getStatus() != UserStatus.LOCKED){

            throw new RuntimeException(
                    "User account is not locked"
            );

        }



        user.setStatus(
                UserStatus.ACTIVE
        );


        /*
         * Reset login security counters
         */
        user.setFailedLoginAttempts(0);

        user.setLockoutTime(null);



        /*
         * Clear lock metadata if available
         */
        user.setLockedAt(null);

        user.setLockedBy(null);

        user.setLockReason(null);



        userRepository.save(user);



        createAuditLog(

                getCurrentUsername(),

                "UNLOCK_USER",

                "Unlocked user: "
                        + user.getUsername()

        );

    }





}