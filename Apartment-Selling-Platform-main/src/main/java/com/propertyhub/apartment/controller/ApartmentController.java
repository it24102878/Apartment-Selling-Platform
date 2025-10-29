package com.propertyhub.apartment.controller;

import com.propertyhub.apartment.entity.Apartment;
import com.propertyhub.apartment.service.ApartmentService;
import com.propertyhub.apartment.strategy.ApartmentSortingContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/apartments")
@CrossOrigin(origins = "*")
public class ApartmentController {

    @Autowired
    private ApartmentService apartmentService;

    @Autowired
    private ApartmentSortingContext sortingContext;

    @GetMapping
    public ResponseEntity<List<Apartment>> getAllApartments(@RequestParam(value = "sortBy", required = false) String sortBy) {
        List<Apartment> apartments = apartmentService.getAllApartments();
        List<Apartment> sorted = sortingContext.sort(apartments, sortBy);
        return ResponseEntity.ok(sorted);
    }

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addApartment(@RequestBody Map<String, String> apartmentData) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (apartmentData.get("type") == null || apartmentData.get("price") == null ||
                    apartmentData.get("bedrooms") == null || apartmentData.get("location") == null) {
                response.put("success", false);
                response.put("message", "Missing required fields: type, price, bedrooms, or location");
                return ResponseEntity.badRequest().body(response);
            }

            String description = apartmentData.get("description");
            // Embed owner marker in description if userId provided
            String userIdStr = apartmentData.get("userId");
            if (userIdStr != null && !userIdStr.isBlank()) {
                description = ApartmentService.embedOwnerInDescription(description, Long.parseLong(userIdStr));
            }

            Apartment apartment = new Apartment(
                    apartmentData.get("type"),
                    Double.parseDouble(apartmentData.get("price")),
                    Integer.parseInt(apartmentData.get("bedrooms")),
                    apartmentData.get("location"),
                    description,
                    "AVAILABLE"
            );
            Apartment savedApartment = apartmentService.addApartment(apartment);

            response.put("success", true);
            response.put("message", "Apartment added successfully");
            response.put("apartmentID", savedApartment.getApartmentID());
        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "Invalid number format for price or bedrooms: " + e.getMessage());
            System.err.println("NumberFormatException in addApartment: " + e.getMessage());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to add apartment: " + e.getMessage());
            System.err.println("Exception in addApartment: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Apartment>> getApartmentsByUser(@PathVariable Long userId) {
        List<Apartment> apartments = apartmentService.getApartmentsByOwner(userId);
        return ResponseEntity.ok(apartments);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateApartment(
            @PathVariable Integer id,
            @RequestParam("userId") Long userId,
            @RequestBody Map<String, String> apartmentData) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean updated = apartmentService.updateApartment(id, userId, apartmentData);
            if (updated) {
                response.put("success", true);
                response.put("message", "Apartment updated successfully");
            } else {
                response.put("success", false);
                response.put("message", "Apartment not found or not owned by user");
                return ResponseEntity.status(403).body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteApartment(
            @PathVariable Integer id,
            @RequestParam("userId") Long userId) {
        Map<String, Object> response = new HashMap<>();
        try {
            boolean deleted = apartmentService.deleteApartmentIfOwner(id, userId);
            if (deleted) {
                response.put("success", true);
                response.put("message", "Apartment deleted successfully");
            } else {
                response.put("success", false);
                response.put("message", "Apartment not found or not owned by user");
                return ResponseEntity.status(403).body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/description")
    public ResponseEntity<Map<String, Object>> updateApartmentDescription(
            @PathVariable Integer id,
            @RequestBody Map<String, String> requestData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String imageUrl = requestData.get("imageUrl");
            if (imageUrl == null || imageUrl.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Image URL is required");
                return ResponseEntity.badRequest().body(response);
            }

            boolean updated = apartmentService.updateApartmentDescription(id, imageUrl);

            if (updated) {
                response.put("success", true);
                response.put("message", "Apartment description updated with image URL");
            } else {
                response.put("success", false);
                response.put("message", "Apartment not found");
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update apartment: " + e.getMessage());
            System.err.println("Exception in updateApartmentDescription: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}