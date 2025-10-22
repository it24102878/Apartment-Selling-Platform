package com.propertyhub.auth.controller;

import com.propertyhub.auth.entity.SavedProperty;
import com.propertyhub.auth.service.SavedPropertyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/saved-properties")
@CrossOrigin(origins = "*")
public class SavedPropertyController {

    @Autowired
    private SavedPropertyService savedPropertyService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> saveProperty(@RequestBody Map<String, Object> propertyData) {
        Map<String, Object> response = new HashMap<>();

        System.out.println("SavedPropertyController: Received save request: " + propertyData);

        try {
            // Validate required fields
            if (!propertyData.containsKey("userID") || !propertyData.containsKey("propertyPrice")
                || !propertyData.containsKey("propertyAddress")) {
                response.put("success", false);
                response.put("message", "Missing required fields: userID, propertyPrice, or propertyAddress");
                return ResponseEntity.badRequest().body(response);
            }

            Long userID = Long.valueOf(propertyData.get("userID").toString());
            String propertyAddress = propertyData.get("propertyAddress").toString();

            // Check if property already saved by this user
            if (savedPropertyService.existsByUserIDAndPropertyAddress(userID, propertyAddress)) {
                // Get existing property details
                List<SavedProperty> existingProperties = savedPropertyService.getUserSavedProperties(userID);
                Long existingPropertyId = null;
                for (SavedProperty prop : existingProperties) {
                    if (prop.getPropertyAddress().equals(propertyAddress)) {
                        existingPropertyId = prop.getSavedPropertyID();
                        break;
                    }
                }

                response.put("success", true);
                response.put("message", "Property was already saved by this user");
                response.put("savedPropertyID", existingPropertyId);
                response.put("alreadyExists", true);

                System.out.println("SavedPropertyController: Property already exists for user " + userID + " at address: " + propertyAddress);
                return ResponseEntity.ok(response);
            }

            // Create new saved property
            SavedProperty savedProperty = new SavedProperty();
            savedProperty.setUserID(userID);
            savedProperty.setPropertyPrice(propertyData.get("propertyPrice").toString());
            savedProperty.setPropertyAddress(propertyAddress);
            savedProperty.setPropertyFeatures(propertyData.get("propertyFeatures") != null ?
                propertyData.get("propertyFeatures").toString() : null);

            // Properly serialize propertyData as JSON string
            String propertyDataJson = "";
            if (propertyData.get("propertyData") != null) {
                try {
                    // Convert Map to JSON string
                    propertyDataJson = new com.fasterxml.jackson.databind.ObjectMapper()
                        .writeValueAsString(propertyData.get("propertyData"));
                } catch (Exception jsonEx) {
                    System.err.println("Warning: Failed to serialize propertyData as JSON: " + jsonEx.getMessage());
                    propertyDataJson = propertyData.get("propertyData").toString();
                }
            }
            savedProperty.setPropertyData(propertyDataJson);

            // Save to database with verification
            SavedProperty saved = savedPropertyService.saveProperty(savedProperty);

            // Verify the save was successful by checking if ID was generated
            if (saved == null || saved.getSavedPropertyID() == null) {
                throw new RuntimeException("Database save failed - no ID generated");
            }

            response.put("success", true);
            response.put("message", "Property saved successfully to database");
            response.put("savedPropertyID", saved.getSavedPropertyID());
            response.put("alreadyExists", false);

            System.out.println("SavedPropertyController: Property saved successfully with ID: " + saved.getSavedPropertyID());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to save property: " + e.getMessage());
            System.err.println("Exception in saveProperty: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(response);
        }
    }

    @GetMapping("/user/{userID}")
    public ResponseEntity<List<SavedProperty>> getUserSavedProperties(@PathVariable Long userID) {
        try {
            List<SavedProperty> savedProperties = savedPropertyService.getUserSavedProperties(userID);
            return ResponseEntity.ok(savedProperties);
        } catch (Exception e) {
            System.err.println("Exception in getUserSavedProperties: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(null);
        }
    }

    @DeleteMapping("/{savedPropertyID}")
    public ResponseEntity<Map<String, Object>> deleteSavedProperty(@PathVariable Long savedPropertyID) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("SavedPropertyController: Attempting to delete property with ID: " + savedPropertyID);

            // First check if the property exists
            Optional<SavedProperty> existingProperty = savedPropertyService.findById(savedPropertyID);
            if (!existingProperty.isPresent()) {
                response.put("success", false);
                response.put("message", "Property not found with ID: " + savedPropertyID);
                System.out.println("SavedPropertyController: Property not found with ID: " + savedPropertyID);
                return ResponseEntity.status(404).body(response);
            }

            // Delete the property
            savedPropertyService.deleteSavedProperty(savedPropertyID);

            // Verify deletion
            Optional<SavedProperty> deletedProperty = savedPropertyService.findById(savedPropertyID);
            if (deletedProperty.isPresent()) {
                response.put("success", false);
                response.put("message", "Failed to delete property - still exists in database");
                System.err.println("SavedPropertyController: Property still exists after deletion attempt");
                return ResponseEntity.status(500).body(response);
            }

            response.put("success", true);
            response.put("message", "Property removed from saved list successfully");
            response.put("deletedPropertyID", savedPropertyID);
            System.out.println("SavedPropertyController: Successfully deleted property with ID: " + savedPropertyID);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to delete saved property: " + e.getMessage());
            System.err.println("Exception in deleteSavedProperty: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(response);
        }
    }
}
