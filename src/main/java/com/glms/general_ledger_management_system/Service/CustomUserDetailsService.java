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



        /*
         * Convert Roles To Spring Security Authorities
         *
         * Database:
         * ADMIN
         * USER
         *
         * Spring Security:
         * ROLE_ADMIN
         * ROLE_USER
         */
        var authorities =
                user.getRoles()
                        .stream()
                        .map(
                                role ->
                                        new SimpleGrantedAuthority(
                                                "ROLE_" + role.getName()
                                        )
                        )
                        .collect(
                                Collectors.toSet()
                        );



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