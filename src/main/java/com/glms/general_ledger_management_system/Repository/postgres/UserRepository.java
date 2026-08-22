package com.glms.general_ledger_management_system.Repository.postgres;

import com.glms.general_ledger_management_system.Model.postgres.UserStatus;
import com.glms.general_ledger_management_system.Model.postgres.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.stereotype.Repository;

import java.util.List;
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
     * Find all users with the given status
     * (used by the lock-expiry sweep).
     */
    List<User> findAllByStatus(
            UserStatus status
    );

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByEmailIgnoreCase(String email);


    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);


    Page<User> findByStatusAndIdNot(
            UserStatus status,
            Long userId,
            Pageable pageable
    );



    @Query(""" 
SELECT
 CASE WHEN COUNT(u) > 0 THEN true ELSE false END 
 FROM User u 
 JOIN u.roles r 
 WHERE u.id = :userId AND UPPER(r.name) = UPPER(:roleName) """)
    boolean hasRole(
            Long userId,
            String roleName
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
    SELECT u FROM User u
    WHERE u.username = :username
    AND u.status = :status
    """)
    Optional<User> findActiveUserByUsername(
            @Param("username") String username,
            @Param("status") UserStatus status
    );

}