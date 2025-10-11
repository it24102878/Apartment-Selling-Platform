package com.propertyhub.auth.controller;

import com.propertyhub.auth.entity.UserActivity;
import com.propertyhub.auth.entity.SavedProperty;
import com.propertyhub.auth.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;

    @PostMapping("/activity")
    public ResponseEntity<Map<String, Object>> trackActivity(@RequestBody Map<String, Object> activityData) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long userID = Long.valueOf(activityData.get("userID").toString());
            String activityType = activityData.get("activityType").toString();
            String description = activityData.get("description").toString();
            String relatedData = activityData.get("relatedData") != null ?
                    activityData.get("relatedData").toString() : null;

            UserActivity activity = userService.trackActivity(userID, activityType, description, relatedData);

            response.put("success", true);
            response.put("message", "Activity tracked successfully");
            response.put("activityID", activity.getActivityID());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to track activity: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/activities/{userID}")
    public ResponseEntity<List<UserActivity>> getUserActivities(@PathVariable Long userID) {
        try {
            List<UserActivity> activities = userService.getUserActivities(userID);
            return ResponseEntity.ok(activities);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/saved-properties")
    public ResponseEntity<Map<String, Object>> saveProperty(@RequestBody Map<String, Object> propertyData) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long userID = Long.valueOf(propertyData.get("userID").toString());

            // Handle both the new corrected structure and the old structure for backward compatibility
            Map<String, Object> propData;
            String price, address, features;

            if (propertyData.containsKey("propertyData") && propertyData.get("propertyData") instanceof Map) {
                // New corrected structure
                propData = (Map<String, Object>) propertyData.get("propertyData");
                price = propData.get("price").toString();
                address = propData.get("address").toString();
                features = propData.get("features").toString();
            } else {
                // Fallback to old structure for backward compatibility
                price = propertyData.get("propertyPrice").toString();
                address = propertyData.get("propertyAddress").toString();
                features = propertyData.get("propertyFeatures").toString();
            }

            // Check if property is already saved for this user
            List<SavedProperty> existingProperties = userService.getSavedProperties(userID);
            boolean alreadyExists = existingProperties.stream()
                .anyMatch(sp -> sp.getPropertyAddress().equals(address) &&
                              sp.getPropertyPrice().equals(price));

            if (alreadyExists) {
                response.put("success", true);
                response.put("message", "Property was already saved");
                response.put("alreadyExists", true);
                return ResponseEntity.ok(response);
            }

            SavedProperty savedProperty = userService.saveProperty(userID, price, address, features, propertyData.toString());

            response.put("success", true);
            response.put("message", "Property saved successfully");
            response.put("savedPropertyID", savedProperty.getSavedPropertyID());
            response.put("alreadyExists", false);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to save property: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/saved-properties/{userID}")
    public ResponseEntity<List<SavedProperty>> getSavedProperties(@PathVariable Long userID) {
        try {
            List<SavedProperty> properties = userService.getSavedProperties(userID);
            return ResponseEntity.ok(properties);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/saved-properties/{propertyID}")
    public ResponseEntity<Map<String, Object>> removeSavedProperty(@PathVariable Long propertyID) {
        Map<String, Object> response = new HashMap<>();

        try {
            System.out.println("DELETE request received for propertyID: " + propertyID);

            // Check if property exists before deletion
            if (!userService.savedPropertyExists(propertyID)) {
                response.put("success", false);
                response.put("message", "Property not found with ID: " + propertyID);
                System.out.println("Property not found: " + propertyID);
                return ResponseEntity.status(404).body(response);
            }

            userService.removeSavedProperty(propertyID);

            // Verify deletion was successful
            if (!userService.savedPropertyExists(propertyID)) {
                response.put("success", true);
                response.put("message", "Property removed successfully");
                System.out.println("Property successfully removed: " + propertyID);
            } else {
                response.put("success", false);
                response.put("message", "Property deletion failed - still exists in database");
                System.out.println("Property deletion failed: " + propertyID);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to remove property: " + e.getMessage());
            System.err.println("Error removing property " + propertyID + ": " + e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/{userID}")
    public ResponseEntity<Map<String, Object>> getUserDashboard(@PathVariable Long userID) {
        Map<String, Object> response = new HashMap<>();

        try {
            Map<String, Object> dashboardData = userService.getUserDashboardData(userID);
            response.put("success", true);
            response.put("data", dashboardData);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to load dashboard: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }
}