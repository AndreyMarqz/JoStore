package com.jostore.dev.exception;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.jostore.dev.dto.responses.ApiErrorDto;
import com.jostore.dev.dto.responses.ApiFieldErrorDto;

import jakarta.validation.ConstraintViolationException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiErrorDto> handleNotFound(ResourceNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "RESOURCE_NOT_FOUND", exception.getMessage(), List.of());
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiErrorDto> handleConflict(ConflictException exception) {
        String code = exception.getMessage().contains("CPF")
                ? "CUSTOMER_CPF_ALREADY_EXISTS"
                : "CUSTOMER_EMAIL_ALREADY_EXISTS";
        return error(HttpStatus.CONFLICT, code, exception.getMessage(), List.of());
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ApiErrorDto> handleBusinessRule(BusinessRuleException exception) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "BUSINESS_RULE_VIOLATION", exception.getMessage(), List.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorDto> handleInvalidBody(MethodArgumentNotValidException exception) {
        List<ApiFieldErrorDto> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldError)
                .toList();
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", "Dados da requisição são inválidos.", fieldErrors);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorDto> handleInvalidParameter(ConstraintViolationException exception) {
        List<ApiFieldErrorDto> fieldErrors = exception.getConstraintViolations().stream()
                .map(violation -> new ApiFieldErrorDto(violation.getPropertyPath().toString(), violation.getMessage()))
                .toList();
        return error(HttpStatus.BAD_REQUEST, "INVALID_PARAMETER", "Parâmetro de consulta inválido.", fieldErrors);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiErrorDto> handleUnreadableBody(HttpMessageNotReadableException exception) {
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "INVALID_REQUEST_BODY",
                "O corpo da requisição possui dados inválidos.", List.of());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ApiErrorDto> handleDataIntegrity(DataIntegrityViolationException exception) {
        return error(HttpStatus.CONFLICT, "DATA_CONFLICT",
                "Não foi possível concluir a operação porque os dados já existem ou são inválidos.", List.of());
    }

    private ApiFieldErrorDto toFieldError(FieldError fieldError) {
        return new ApiFieldErrorDto(fieldError.getField(), fieldError.getDefaultMessage());
    }

    private ResponseEntity<ApiErrorDto> error(
            HttpStatus status,
            String code,
            String message,
            List<ApiFieldErrorDto> fieldErrors) {
        ApiErrorDto body = new ApiErrorDto(OffsetDateTime.now(), status.value(), code, message, fieldErrors);
        return ResponseEntity.status(status).body(body);
    }
}
