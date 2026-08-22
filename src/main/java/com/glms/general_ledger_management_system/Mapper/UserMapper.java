package com.glms.general_ledger_management_system.Mapper;

import com.glms.general_ledger_management_system.DTO.user.CreateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UpdateUserRequest;
import com.glms.general_ledger_management_system.DTO.user.UserResponse;

import com.glms.general_ledger_management_system.Model.postgres.Role;
import com.glms.general_ledger_management_system.Model.postgres.User;

import com.glms.general_ledger_management_system.Model.postgres.UserStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.stream.Collectors;


@Component
public class UserMapper {


    /**
     * How long a locked account stays locked (minutes)
     * before it is auto-unlocked without approval.
     */
    @Value("${security.account.lock-duration-minutes:30}")
    private long lockDurationMinutes;


    /**
     * Convert CreateUserRequest to User Entity
     */
    public User toEntity(
            CreateUserRequest request
    ) {

        return User.builder()

                .firstName(request.getFirstName())

                .lastName(request.getLastName())

                .username(request.getUsername())

                .email(request.getEmail())

                .password(request.getPassword())

                .build();

    }



    /**
     * Update Existing User
     */
    public void updateEntity(
            User user,
            UpdateUserRequest request
    ) {

        if (request.getFirstName() != null) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null) {
            user.setLastName(request.getLastName());
        }

        if (request.getUsername() != null) {
            user.setUsername(request.getUsername());
        }

        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }

        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
    }




    /**
     * Convert User Entity to Response DTO
     */
    public UserResponse toResponse(
            User user
    ) {


        return UserResponse.builder()

                .id(user.getId())

                .firstName(user.getFirstName())

                .lastName(user.getLastName())

                .username(user.getUsername())

                .email(user.getEmail())

                .status(
                        user.getStatus() != null
                                ?
                                user.getStatus().name()
                                :
                                null
                )

                .active(
                        user.getStatus() == UserStatus.ACTIVE
                )

                .roles(
                        user.getRoles()
                                .stream()
                                .map(Role::getName)
                                .collect(Collectors.toSet())
                )

                .createdAt(
                        user.getCreatedAt()
                )

                .updatedAt(
                        user.getUpdatedAt()
                )

                .lockedUntil(
                        user.getStatus() == UserStatus.LOCKED
                                ? resolveLockedUntil(user)
                                : null
                )

                .build();

    }


    /**
     * Compute when the current lock expires:
     * lock start + configured duration.
     */
    private ZonedDateTime resolveLockedUntil(
            User user
    ) {

        long durationMinutes =
                user.getLockDurationMinutes() != null
                        ? user.getLockDurationMinutes()
                        : lockDurationMinutes;

        if (user.getLockedAt() != null) {

            return user.getLockedAt()
                    .plusMinutes(durationMinutes);
        }

        if (user.getLockoutTime() != null) {

            return user.getLockoutTime()
                    .atZone(ZoneId.systemDefault())
                    .plusMinutes(durationMinutes);
        }

        return null;
    }

}