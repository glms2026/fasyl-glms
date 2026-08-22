package com.glms.general_ledger_management_system.Repository.postgres;


import com.glms.general_ledger_management_system.Model.postgres.JwtToken;
import com.glms.general_ledger_management_system.Model.postgres.User;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.List;
import java.util.Optional;


public interface JwtTokenRepository
        extends JpaRepository<JwtToken, Long> {


    Optional<JwtToken> findByToken(
            String token
    );


    void deleteByUserId(
            Long userId
    );

    List<JwtToken> findAllByUserAndRevokedFalse(User user);

    List<JwtToken> findAllByUser(
            User user
    );

}