package com.pulsepass.controller;

import com.pulsepass.dto.response.VenueResponse;
import com.pulsepass.service.VenueService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/venues")
public class VenueController {

    private final VenueService venueService;

    public VenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<VenueResponse>> findActiveVenues() {
        return ResponseEntity.ok(venueService.findActiveVenues());
    }

    @GetMapping("/{code}")
    public ResponseEntity<VenueResponse> findByCode(@PathVariable("code") String code) {
        return ResponseEntity.ok(venueService.findByCode(code));
    }
}