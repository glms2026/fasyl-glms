package com.glms.general_ledger_management_system.Config;


import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;

import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;


/**
 * ============================================================
 * GLOBAL EXCEPTION HANDLER
 * ============================================================
 *
 * Every error raised by the application is converted into one
 * consistent, user-friendly JSON response:
 *
 * {
 *     "timestamp": "...",
 *     "status": 400,
 *     "error": "Bad Request",
 *     "message": "Please check the information you provided.",
 *     "path": "/api/..."
 * }
 *
 * HTTP status mapping:
 *
 *     IllegalArgumentException            -> 400 Bad Request
 *     MethodArgumentNotValidException     -> 400 Bad Request
 *     HandlerMethodValidationException    -> 400 Bad Request
 *     ConstraintViolationException        -> 400 Bad Request
 *     HttpMessageNotReadableException     -> 400 Bad Request
 *     MissingServletRequestParameter      -> 400 Bad Request
 *     MethodArgumentTypeMismatch          -> 400 Bad Request
 *     AuthenticationException             -> 401 Unauthorized
 *     AccessDeniedException               -> 403 Forbidden
 *     EntityNotFoundException             -> 404 Not Found
 *     IllegalStateException               -> 409 Conflict
 *     NoResourceFoundException            -> 404 Not Found
 *     Anything else                       -> 500 (never leaks internals)
 */
@RestControllerAdvice
public class GlobalExceptionHandler {


    /**
     * 400 - Invalid input supplied by the caller.
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(
            IllegalArgumentException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                request
        );
    }


    /**
     * 400 - Bean validation failures on @RequestBody DTOs.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {

        String message =
                ex.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(
                                "Please check the information you provided and try again."
                        );

        return build(
                HttpStatus.BAD_REQUEST,
                message,
                request
        );
    }


    /**
     * 400 - Validation failures on @RequestParam / @PathVariable.
     */
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<Map<String, Object>> handleHandlerValidation(
            HandlerMethodValidationException ex,
            HttpServletRequest request
    ) {

        String message =
                ex.getAllErrors()
                        .stream()
                        .map(MessageSourceResolvable::getDefaultMessage)
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(
                                "Please check the information you provided and try again."
                        );

        return build(
                HttpStatus.BAD_REQUEST,
                message,
                request
        );
    }


    /**
     * 400 - Constraint violations raised outside DTO binding.
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request
    ) {

        String message =
                ex.getConstraintViolations()
                        .stream()
                        .map(
                                violation ->
                                        violation.getMessage()
                        )
                        .filter(Objects::nonNull)
                        .findFirst()
                        .orElse(
                                "Please check the information you provided and try again."
                        );

        return build(
                HttpStatus.BAD_REQUEST,
                message,
                request
        );
    }


    /**
     * 400 - The request body could not be read (malformed JSON, etc.).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleUnreadableBody(
            HttpMessageNotReadableException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.BAD_REQUEST,
                "We couldn't read your request - please check the format and try again.",
                request
        );
    }


    /**
     * 400 - A required request parameter was not supplied.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParameter(
            MissingServletRequestParameterException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.BAD_REQUEST,
                "Please provide the required '"
                        + ex.getParameterName()
                        + "' value.",
                request
        );
    }


    /**
     * 400 - A parameter value was supplied with the wrong type.
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(
            MethodArgumentTypeMismatchException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.BAD_REQUEST,
                "The value you provided for '"
                        + ex.getName()
                        + "' isn't valid - please check and try again.",
                request
        );
    }


    /**
     * 401 - Any authentication failure (bad credentials,
     * disabled/locked/expired accounts, unknown users).
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthentication(
            AuthenticationException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.UNAUTHORIZED,
                ex.getMessage(),
                request
        );
    }


    /**
     * 403 - The authenticated user is not allowed to do this.
     *
     * Covers both filter-level URL authorization and method-level
     * @PreAuthorize denials (AuthorizationDeniedException extends
     * AccessDeniedException).
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(
            AccessDeniedException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.FORBIDDEN,
                "You don't have permission to do that. "
                        + "Please contact your administrator if you believe this is a mistake.",
                request
        );
    }


    /**
     * 404 - The requested entity does not exist.
     */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(
            EntityNotFoundException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.NOT_FOUND,
                ex.getMessage(),
                request
        );
    }


    /**
     * 404 - The requested resource was not found.
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNoResource(
            NoResourceFoundException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.NOT_FOUND,
                "We couldn't find what you're looking for.",
                request
        );
    }


    /**
     * 409 - The request conflicts with the current state of
     * the account, role, ledger or approval request.
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleConflict(
            IllegalStateException ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.CONFLICT,
                ex.getMessage(),
                request
        );
    }


    /**
     * 500 - Anything unexpected.
     *
     * The user never sees stack traces or internal details.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(
            Exception ex,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Something went wrong on our side - please try again in a moment.",
                request
        );
    }


    /**
     * Build the consistent error response body.
     */
    private ResponseEntity<Map<String, Object>> build(
            HttpStatus status,
            String message,
            HttpServletRequest request
    ) {

        Map<String, Object> body =
                new LinkedHashMap<>();

        body.put(
                "timestamp",
                LocalDateTime.now().toString()
        );

        body.put(
                "status",
                status.value()
        );

        body.put(
                "error",
                status.getReasonPhrase()
        );

        body.put(
                "message",
                message != null
                        && !message.isBlank()
                        ? message
                        : "Something went wrong - please try again."
        );

        body.put(
                "path",
                request.getRequestURI()
        );

        return ResponseEntity
                .status(status)
                .body(body);
    }


}
