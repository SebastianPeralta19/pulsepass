package com.pulsepass.security;

import tools.jackson.databind.ObjectMapper;
import com.pulsepass.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Escribe el mismo contrato ErrorResponse desde la cadena de filtros, donde
 * @RestControllerAdvice no actúa porque la excepción ocurre antes del
 * DispatcherServlet. Garantiza que la respuesta se emita una sola vez.
 */
final class SecurityErrorWriter {

    private SecurityErrorWriter() {
    }

    static void write(HttpServletResponse response, ObjectMapper objectMapper,
                      HttpStatus status, String message) throws IOException {
        if (response.isCommitted()) {
            return;
        }
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        ErrorResponse body = new ErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                Map.of());
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
