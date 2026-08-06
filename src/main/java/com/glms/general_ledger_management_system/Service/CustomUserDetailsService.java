package com.glms.general_ledger_management_system.Service;


//import com.glms.general_ledger_management_system.Model.Role;
import com.glms.general_ledger_management_system.Model.User;
import com.glms.general_ledger_management_system.Model.UserStatus;
import com.glms.general_ledger_management_system.Repository.UserRepository;


import lombok.RequiredArgsConstructor;


import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;


import org.springframework.stereotype.Service;


import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;



@Service
@RequiredArgsConstructor
public class CustomUserDetailsService
        implements UserDetailsService {



    private final UserRepository userRepository;



    @Override
    public UserDetails loadUserByUsername(
            String username
    )
            throws UsernameNotFoundException {



        /*
         * Find User From Database
         */
        User user =
                userRepository
                        .findByUsername(username)
                        .orElseThrow(
                                () ->
                                        new UsernameNotFoundException(
                                                "User not found: "
                                                        + username
                                        )
                        );



        Set<SimpleGrantedAuthority> authorities =
                new HashSet<>();


        user.getRoles()
                .forEach(role -> {


                    /*
                     * Add Role Authority
                     *
                     * Example:
                     * ROLE_ADMIN
                     * ROLE_USER
                     */
                    authorities.add(
                            new SimpleGrantedAuthority(
                                    "ROLE_" + role.getName()
                            )
                    );



                    /*
                     * Add Permission Authority
                     *
                     * Example:
                     * USER_CREATE
                     * ROLE_ASSIGN_PERMISSION
                     * LEDGER_CREATE
                     */
                    role.getPermissions()
                            .forEach(permission ->

                                    authorities.add(
                                            new SimpleGrantedAuthority(
                                                    permission.getName()
                                            )
                                    )

                            );


                });



        /*
         * Check User Account Status
         */
        boolean accountLocked =
                user.getStatus()
                        == UserStatus.LOCKED;



        boolean accountDisabled =
                user.getStatus()
                        == UserStatus.INACTIVE
                        ||
                        user.getStatus()
                                == UserStatus.SUSPENDED;



        /*
         * Return Spring Security User
         */
        return org.springframework.security.core.userdetails.User

                .builder()

                .username(
                        user.getUsername()
                )

                .password(
                        user.getPassword()
                )

                .authorities(
                        authorities
                )

                .accountExpired(false)

                .accountLocked(
                        accountLocked
                )

                .credentialsExpired(
                        user.getStatus()
                                == UserStatus.PASSWORD_EXPIRED
                )

                .disabled(
                        accountDisabled
                )

                .build();

    }


}