package com.pulsepass.controller;

import com.pulsepass.dto.request.RegisterUserRequest;
import com.pulsepass.dto.response.UserResponse;
import com.pulsepass.exception.DuplicateResourceException;
import com.pulsepass.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(UserController.class)
class UserControllerTest {

    private static final String VALID_USER_JSON = """
            {
              "username": "andrea",
              "email": "andrea@email.com",
              "firstName": "Andrea",
              "lastName": "Gomez",
              "phone": "3001234567",
              "city": "Santa Marta",
              "birthDate": "2001-05-20"
            }
            """;

    private static final String INVALID_EMAIL_USER_JSON = """
            {
              "username": "andrea",
              "email": "no-es-un-email",
              "firstName": "Andrea",
              "lastName": "Gomez",
              "phone": "3001234567",
              "city": "Santa Marta",
              "birthDate": "2001-05-20"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    private UserResponse andrea() {
        return new UserResponse(1L, "andrea", "andrea@email.com", true,
                "Andrea", "Gomez", "3001234567", "Santa Marta", LocalDate.of(2001, 5, 20));
    }

    // TEST-CTRL-USR-001 / AC-CTRL007
    @Test
    void shouldReturn201WhenUserIsRegistered() throws Exception {
        when(userService.register(any(RegisterUserRequest.class))).thenReturn(andrea());

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_USER_JSON))
                .andExpect(status().isCreated())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("andrea"))
                .andExpect(jsonPath("$.email").value("andrea@email.com"))
                .andExpect(jsonPath("$.active").value(true));

        verify(userService).register(any(RegisterUserRequest.class));
    }

    // TEST-CTRL-USR-002
    @Test
    void shouldReturn400AndNotCallServiceWhenEmailIsInvalid() throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(INVALID_EMAIL_USER_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.details.email").value("Email must be valid"));

        verify(userService, never()).register(any());
    }

    // TEST-CTRL-USR-003
    @Test
    void shouldReturn409WhenUsernameIsDuplicated() throws Exception {
        when(userService.register(any(RegisterUserRequest.class)))
                .thenThrow(new DuplicateResourceException("Username already exists."));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_USER_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.error").value("Conflict"))
                .andExpect(jsonPath("$.message").value("Username already exists."));

        verify(userService).register(any(RegisterUserRequest.class));
    }

    // AC-CTRL008
    @Test
    void shouldReturn409WithoutInternalDetailsWhenEmailIsDuplicated() throws Exception {
        when(userService.register(any(RegisterUserRequest.class)))
                .thenThrow(new DuplicateResourceException("Email already exists."));

        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_USER_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Email already exists."))
                .andExpect(jsonPath("$.details").isEmpty())
                .andExpect(jsonPath("$.trace").doesNotExist());
    }

    // TEST-CTRL-USR-004
    @Test
    void shouldReturn200WhenFindingUserByEmail() throws Exception {
        when(userService.findByEmail("andrea@email.com")).thenReturn(andrea());

        mockMvc.perform(get("/api/users/by-email").param("email", "andrea@email.com"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.email").value("andrea@email.com"));

        verify(userService).findByEmail("andrea@email.com");
    }

    // TEST-CTRL-USR-005
    @Test
    void shouldReturn200WhenFindingUserByUsername() throws Exception {
        when(userService.findByUsername("andrea")).thenReturn(andrea());

        mockMvc.perform(get("/api/users/by-username").param("username", "andrea"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value("andrea"));

        verify(userService).findByUsername("andrea");
    }
}