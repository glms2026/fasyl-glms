package com.glms.general_ledger_management_system.Repository;

import com.glms.general_ledger_management_system.Model.UserStatus;
import com.glms.general_ledger_management_system.Model.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.util.Optional;


@Repository
public interface UserRepository
        extends JpaRepository<User, Long> {


    Optional<User> findByUsername(
            String username
    );


    Optional<User> findByEmail(
            String email
    );


    boolean existsByUsername(
            String username
    );


    boolean existsByEmail(
            String email
    );


    /**
     * Find Active Users
     */
    Page<User> findByStatus(
            UserStatus status,
            Pageable pageable
    );



    /**
     * Search Users
     */
    @Query("""
            SELECT u
            FROM User u
            WHERE
            LOWER(u.username)
            LIKE LOWER(CONCAT('%', :keyword, '%'))

            OR

            LOWER(u.email)
            LIKE LOWER(CONCAT('%', :keyword, '%'))

            OR

            LOWER(u.firstName)
            LIKE LOWER(CONCAT('%', :keyword, '%'))

            OR

            LOWER(u.lastName)
            LIKE LOWER(CONCAT('%', :keyword, '%'))
            """)
    Page<User> searchUsers(

            @Param("keyword")
            String keyword,

            Pageable pageable

    );


    /**
     * Authentication Query
     */
    @Query("""
            SELECT u
            FROM User u
            WHERE
            u.username = :username
            AND
            u.status = com.glms.general_ledger_management_system.Model.UserStatus.ACTIVE
            """)
    Optional<User> findActiveUserByUsername(

            @Param("username")
            String username

    );

}