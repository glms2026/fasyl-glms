package com.glms.general_ledger_management_system.Security;


import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;


import lombok.RequiredArgsConstructor;


import org.springframework.http.MediaType;

import org.springframework.security.core.AuthenticationException;

import org.springframework.security.web.AuthenticationEntryPoint;

import org.springframework.stereotype.Component;


import java.io.IOException;

import java.time.Instant;

import java.util.HashMap;
import java.util.Map;



@Component
@RequiredArgsConstructor
public class JwtAuthenticationEntryPoint
        implements AuthenticationEntryPoint {


    private final ObjectMapper objectMapper;



    @Override
    public void commence(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException authException
    )
            throws IOException, ServletException {



        response.setContentType(
                MediaType.APPLICATION_JSON_VALUE
        );


        response.setCharacterEncoding(
                "UTF-8"
        );


        response.setStatus(
                HttpServletResponse.SC_UNAUTHORIZED
        );



        Map<String,Object> errorResponse =
                new HashMap<>();


        errorResponse.put(
                "timestamp",
                java.time.LocalDateTime.now().toString()
        );

        errorResponse.put(
                "status",
                HttpServletResponse.SC_UNAUTHORIZED
        );


        errorResponse.put(
                "error",
                "Unauthorized"
        );


        errorResponse.put(
                "message",
                "Authentication failed"
        );


        errorResponse.put(
                "path",
                request.getRequestURI()
        );



        objectMapper.writeValue(
                response.getOutputStream(),
                errorResponse
        );

    }


}