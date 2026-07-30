package com.glms.general_ledger_management_system.Repository;


import com.glms.general_ledger_management_system.Model.JwtToken;
import com.glms.general_ledger_management_system.Model.User;
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