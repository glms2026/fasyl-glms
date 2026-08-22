package com.glms.general_ledger_management_system.Repository.postgres;


import com.glms.general_ledger_management_system.Model.postgres.Permission;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;


public interface PermissionRepository
        extends JpaRepository<Permission, Long> {


    Optional<Permission> findByName(
            String name
    );

    /**
     * Check Permission Exists
     */
    boolean existsByName(
            String name
    );

    Optional<Permission> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);


}