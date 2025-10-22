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

    @Autowired
    private com.propertyhub.auth.repository.UserRepository userRepository;

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

    // Update phone number
    @PutMapping("/{userId}/phone")
    public ResponseEntity<Map<String, Object>> updatePhone(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        Map<String, Object> res = new HashMap<>();
        String phone = body.get("phone");
        if (phone == null || phone.isBlank()) {
            res.put("success", false);
            res.put("message", "Phone is required");
            return ResponseEntity.badRequest().body(res);
        }
        return userRepository.findById(userId)
                .map(user -> {
                    user.setPhone(phone);
                    userRepository.save(user);
                    res.put("success", true);
                    res.put("message", "Phone updated");
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    res.put("success", false);
                    res.put("message", "User not found");
                    return ResponseEntity.status(404).body(res);
                });
    }

    // Change password
    @PutMapping("/{userId}/password")
    public ResponseEntity<Map<String, Object>> changePassword(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        Map<String, Object> res = new HashMap<>();
        String current = body.get("currentPassword");
        String next = body.get("newPassword");
        if (current == null || next == null || next.isBlank()) {
            res.put("success", false);
            res.put("message", "Current and new passwords are required");
            return ResponseEntity.badRequest().body(res);
        }
        return userRepository.findById(userId)
                .map(user -> {
                    if (!user.getPassword().equals(current)) {
                        res.put("success", false);
                        res.put("message", "Current password is incorrect");
                        return ResponseEntity.status(403).body(res);
                    }
                    user.setPassword(next);
                    userRepository.save(user);
                    res.put("success", true);
                    res.put("message", "Password updated");
                    return ResponseEntity.ok(res);
                })
                .orElseGet(() -> {
                    res.put("success", false);
                    res.put("message", "User not found");
                    return ResponseEntity.status(404).body(res);
                });
    }

    // Get user profile
    @GetMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Long userId) {
        Map<String, Object> response = new HashMap<>();

        return userRepository.findById(userId)
                .map(user -> {
                    Map<String, Object> profileData = new HashMap<>();
                    profileData.put("userID", user.getUserID());
                    profileData.put("name", user.getName());
                    profileData.put("email", user.getEmail());
                    profileData.put("phone", user.getPhone());
                    profileData.put("createdAt", user.getCreatedAt());

                    response.put("success", true);
                    response.put("user", profileData);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    // Update user profile
    @PutMapping("/{userId}/profile")
    public ResponseEntity<Map<String, Object>> updateUserProfile(@PathVariable Long userId, @RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        return userRepository.findById(userId)
                .map(user -> {
                    if (body.containsKey("name") && !body.get("name").isBlank()) {
                        user.setName(body.get("name"));
                    }
                    if (body.containsKey("email") && !body.get("email").isBlank()) {
                        user.setEmail(body.get("email"));
                    }
                    if (body.containsKey("phone")) {
                        user.setPhone(body.get("phone"));
                    }

                    userRepository.save(user);

                    response.put("success", true);
                    response.put("message", "Profile updated successfully");
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "User not found");
                    return ResponseEntity.status(404).body(response);
                });
    }

    // Delete account
    @DeleteMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> deleteAccount(@PathVariable Long userId) {
        Map<String, Object> res = new HashMap<>();
        if (!userRepository.existsById(userId)) {
            res.put("success", false);
            res.put("message", "User not found");
            return ResponseEntity.status(404).body(res);
        }
        try {
            userRepository.deleteById(userId);
            res.put("success", true);
            res.put("message", "Account deleted");
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            res.put("success", false);
            res.put("message", "Failed to delete account: " + e.getMessage());
            return ResponseEntity.badRequest().body(res);
        }
    }
}