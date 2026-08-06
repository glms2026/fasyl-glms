package com.glms.general_ledger_management_system.Repository;


import com.glms.general_ledger_management_system.Model.Role;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;


public interface RoleRepository
        extends JpaRepository<Role, Long> {


    Optional<Role> findByName(
            String name
    );

    /**
     * Check If Role Exists
     */
    boolean existsByName(
            String name
    );



}