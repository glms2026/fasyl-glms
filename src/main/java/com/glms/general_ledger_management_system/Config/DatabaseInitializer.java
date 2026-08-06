package com.glms.general_ledger_management_system.Config;


import com.glms.general_ledger_management_system.Model.Role;
import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Model.UserStatus;

import com.glms.general_ledger_management_system.Repository.RoleRepository;
import com.glms.general_ledger_management_system.Repository.UserRepository;


import lombok.RequiredArgsConstructor;


import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;


import java.time.LocalDateTime;
import java.util.Set;



@Component
@RequiredArgsConstructor
public class DatabaseInitializer
        implements CommandLineRunner {



    private static final String ADMIN_ROLE = "ADMIN";

    private static final String USER_ROLE = "USER";



    private final RoleRepository roleRepository;


    private final UserRepository userRepository;


    private final PasswordEncoder passwordEncoder;

    @Value("${admin.username}")
    private String adminUsername;

    @Value("${admin.password}")
    private String adminPassword;


    @Value("${user.username}")
    private String userUsername;

    @Value("${user.password}")
    private String userPassword;




    @Override
    public void run(String... args) {


        createRoles();


        createAdminUser();


        createDefaultUser();


    }






    /**
     * Create Default Roles
     */
    private void createRoles() {



        if(roleRepository.findByName(ADMIN_ROLE)
                .isEmpty()) {



            Role adminRole =
                    Role.builder()

                            .name(ADMIN_ROLE)

                            .build();



            roleRepository.save(
                    adminRole
            );

        }





        if(roleRepository.findByName(USER_ROLE)
                .isEmpty()) {



            Role userRole =
                    Role.builder()

                            .name(USER_ROLE)

                            .build();



            roleRepository.save(
                    userRole
            );

        }


    }







    /**
     * Create Default Administrator
     */
    private void createAdminUser() {



        if(userRepository
                .findByUsername("admin")
                .isPresent()) {


            return;

        }




        Role adminRole =
                roleRepository
                        .findByName(ADMIN_ROLE)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "ADMIN role not found"
                                        )
                        );





        User admin =
                User.builder()

                        .firstName("System")

                        .lastName("Administrator")

                        .username(adminUsername)

                        .email("admin@glms.com")

                        .password(
                                passwordEncoder.encode(
                                        adminPassword
                                )
                        )

                        .status(
                                UserStatus.ACTIVE
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )
                        .failedLoginAttempts(0)

                        .roles(
                                Set.of(adminRole)
                        )

                        .build();




        userRepository.save(
                admin
        );


    }








    /**
     * Create Default Normal User
     */
    private void createDefaultUser() {



        if(userRepository
                .findByUsername("user")
                .isPresent()) {


            return;

        }





        Role userRole =
                roleRepository
                        .findByName(USER_ROLE)
                        .orElseThrow(
                                () ->
                                        new RuntimeException(
                                                "USER role not found"
                                        )
                        );





        User user =
                User.builder()

                        .firstName("Default")

                        .lastName("User")

                        .username(userUsername)

                        .email("user@glms.com")

                        .password(
                                passwordEncoder.encode(
                                        userPassword
                                )
                        )

                        .status(
                                UserStatus.ACTIVE
                        )

                        .createdAt(
                                LocalDateTime.now()
                        )
                        .failedLoginAttempts(0)

                        .roles(
                                Set.of(userRole)
                        )

                        .build();




        userRepository.save(
                user
        );


    }


}