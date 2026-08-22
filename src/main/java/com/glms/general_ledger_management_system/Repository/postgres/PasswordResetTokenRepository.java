package com.glms.general_ledger_management_system.Repository.postgres;


import com.glms.general_ledger_management_system.Model.postgres.PasswordResetToken;
import com.glms.general_ledger_management_system.Model.postgres.User;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;


public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {


    Optional<PasswordResetToken> findByToken(
            String token
    );

    void deleteByUser(
            User user
    );

}