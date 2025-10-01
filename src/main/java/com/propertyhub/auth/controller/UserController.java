package com.propertyhub.auth.controller;

import com.propertyhub.auth.entity.UserActivity;
import com.propertyhub.auth.entity.SavedProperty;
import com.propertyhub.auth.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
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
            Map<String, Object> propData = (Map<String, Object>) propertyData.get("propertyData");

            String price = propData.get("price").toString();
            String address = propData.get("address").toString();
            String features = propData.get("features").toString();

            SavedProperty savedProperty = userService.saveProperty(userID, price, address, features, propertyData.toString());

            response.put("success", true);
            response.put("message", "Property saved successfully");
            response.put("savedPropertyID", savedProperty.getSavedPropertyID());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to save property: " + e.getMessage());
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
            userService.removeSavedProperty(propertyID);
            response.put("success", true);
            response.put("message", "Property removed successfully");
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to remove property: " + e.getMessage());
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