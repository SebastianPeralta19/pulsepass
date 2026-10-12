package com.pulsepass.controller;

import com.pulsepass.dto.response.ArtistResponse;
import com.pulsepass.exception.ResourceNotFoundException;
import com.pulsepass.service.ArtistService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ArtistController.class)
class ArtistControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ArtistService artistService;

    private ArtistResponse solarBeat() {
        return new ArtistResponse(1L, "Solar Beat", "Colombia", "Electronic", true);
    }

    private ArtistResponse neonWaves() {
        return new ArtistResponse(2L, "Neon Waves", "Mexico", "Synthpop", true);
    }

    // TEST-CTRL-ART-001
    @Test
    void shouldReturn200WhenArtistExistsById() throws Exception {
        when(artistService.findById(1L)).thenReturn(solarBeat());

        mockMvc.perform(get("/api/artists/1"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.stageName").value("Solar Beat"));

        verify(artistService).findById(1L);
    }

    // TEST-CTRL-ART-002
    @Test
    void shouldReturn404WhenArtistIdDoesNotExist() throws Exception {
        when(artistService.findById(99L))
                .thenThrow(new ResourceNotFoundException("Artist not found: 99"));

        mockMvc.perform(get("/api/artists/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Artist not found: 99"));

        verify(artistService).findById(99L);
    }

    @Test
    void shouldReturn400WhenArtistIdIsNotNumeric() throws Exception {
        mockMvc.perform(get("/api/artists/abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid value for parameter: id"));

        verify(artistService, never()).findById(anyLong());
    }

    // TEST-CTRL-ART-003
    @Test
    void shouldReturn200WhenFindingArtistByStageName() throws Exception {
        when(artistService.findByStageName("Solar Beat")).thenReturn(solarBeat());

        mockMvc.perform(get("/api/artists/by-stage-name").param("stageName", "Solar Beat"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.stageName").value("Solar Beat"))
                .andExpect(jsonPath("$.genre").value("Electronic"));

        verify(artistService).findByStageName("Solar Beat");
    }

    // TEST-CTRL-ART-004
    @Test
    void shouldReturn200WithActiveArtists() throws Exception {
        when(artistService.findActiveArtists()).thenReturn(List.of(solarBeat(), neonWaves()));

        mockMvc.perform(get("/api/artists/active"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[1].stageName").value("Neon Waves"));

        verify(artistService).findActiveArtists();
    }
}