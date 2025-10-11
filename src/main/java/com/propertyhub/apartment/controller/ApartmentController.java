package com.propertyhub.apartment.controller;

import com.propertyhub.apartment.entity.Apartment;
import com.propertyhub.apartment.service.ApartmentService;
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

    @GetMapping
    public ResponseEntity<List<Apartment>> getAllApartments() {
        List<Apartment> apartments = apartmentService.getAllApartments();
        return ResponseEntity.ok(apartments);
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

            Apartment apartment = new Apartment(
                    apartmentData.get("type"),
                    Double.parseDouble(apartmentData.get("price")),
                    Integer.parseInt(apartmentData.get("bedrooms")),
                    apartmentData.get("location"),
                    apartmentData.get("description"),
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