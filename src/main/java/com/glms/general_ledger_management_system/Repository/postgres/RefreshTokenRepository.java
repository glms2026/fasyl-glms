package com.glms.general_ledger_management_system.Repository.postgres;


import com.glms.general_ledger_management_system.Model.postgres.RefreshToken;


import com.glms.general_ledger_management_system.Model.postgres.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;


import java.util.List;
import java.util.Optional;



public interface RefreshTokenRepository
        extends JpaRepository<RefreshToken, Long> {


    List<RefreshToken> findAllByUser(User user);


    /**
     * Find active refresh token
     */
    Optional<RefreshToken> findByTokenAndRevokedFalse(
            String token
    );



    /**
     * Find all tokens for user
     */
    List<RefreshToken> findAllByUser_Id(
            Long userId
    );



    /**
     * Delete all user refresh tokens
     */
    void deleteByUser_Id(
            Long userId
    );



    /**
     * Check token existence
     */
    boolean existsByToken(
            String token
    );


    Optional<RefreshToken> findByToken(String token);

    /**
     * Delete expired tokens
     */
    @Modifying
    @Query("""
            DELETE FROM RefreshToken r
            WHERE r.expiryDate < CURRENT_TIMESTAMP
            """)
    void deleteExpiredTokens();


}