package com.glms.general_ledger_management_system.Repository;


import com.glms.general_ledger_management_system.Model.Permission;
import org.springframework.data.jpa.repository.JpaRepository;


import java.util.Optional;


public interface PermissionRepository
        extends JpaRepository<Permission, Long> {


    Optional<Permission> findByName(
            String name
    );


}