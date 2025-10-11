package com.propertyhub.auth.service;

import com.propertyhub.auth.entity.SavedProperty;
import com.propertyhub.auth.entity.UserActivity;
import com.propertyhub.auth.repository.SavedPropertyRepository;
import com.propertyhub.auth.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class UserService {

    @Autowired
    private UserActivityRepository activityRepository;

    @Autowired
    private SavedPropertyRepository savedPropertyRepository;

    public UserActivity trackActivity(Long userID, String activityType, String description, String relatedData) {
        UserActivity activity = new UserActivity(userID, activityType, description, relatedData);
        return activityRepository.save(activity);
    }

    public List<UserActivity> getUserActivities(Long userID) {
        return activityRepository.findByUserIDOrderByCreatedAtDesc(userID);
    }

    public SavedProperty saveProperty(Long userID, String price, String address, String features, String propertyData) {
        // Check if property is already saved
        if (savedPropertyRepository.existsByUserIDAndPropertyAddress(userID, address)) {
            throw new RuntimeException("Property already saved");
        }

        SavedProperty savedProperty = new SavedProperty();
        savedProperty.setUserID(userID);
        savedProperty.setPropertyPrice(price);
        savedProperty.setPropertyAddress(address);
        savedProperty.setPropertyFeatures(features);
        savedProperty.setPropertyData(propertyData);

        return savedPropertyRepository.save(savedProperty);
    }

    public List<SavedProperty> getSavedProperties(Long userID) {
        return savedPropertyRepository.findByUserIDOrderBySavedAtDesc(userID);
    }

    @Transactional
    public void removeSavedProperty(Long propertyID) {
        System.out.println("UserService: Attempting to remove property with ID: " + propertyID);

        // First try to delete by savedPropertyID (direct database primary key)
        if (savedPropertyRepository.existsById(propertyID)) {
            try {
                savedPropertyRepository.deleteBySavedPropertyID(propertyID);
                System.out.println("UserService: Property deleted successfully using savedPropertyID: " + propertyID);
                return;
            } catch (Exception e) {
                System.err.println("UserService: Error during direct deletion: " + e.getMessage());
                throw new RuntimeException("Failed to delete property by savedPropertyID: " + e.getMessage(), e);
            }
        }

        // If not found by savedPropertyID, it might be an apartmentID, so we need to find the actual savedPropertyID
        System.out.println("UserService: Property not found by savedPropertyID, searching by apartmentID in all users' saved properties");

        try {
            // Get all saved properties and search for matching apartmentID in JSON data
            List<SavedProperty> allSavedProperties = savedPropertyRepository.findAll();
            SavedProperty propertyToDelete = null;

            for (SavedProperty savedProp : allSavedProperties) {
                try {
                    String propertyDataJson = savedProp.getPropertyData();
                    if (propertyDataJson != null && propertyDataJson.contains("\"apartmentID\":" + propertyID)) {
                        propertyToDelete = savedProp;
                        break;
                    }
                } catch (Exception parseError) {
                    System.out.println("UserService: Error parsing property data for savedPropertyID " + savedProp.getSavedPropertyID());
                }
            }

            if (propertyToDelete != null) {
                savedPropertyRepository.deleteBySavedPropertyID(propertyToDelete.getSavedPropertyID());
                System.out.println("UserService: Property deleted successfully using apartmentID mapping. SavedPropertyID was: " + propertyToDelete.getSavedPropertyID());
            } else {
                System.out.println("UserService: Property not found with apartmentID: " + propertyID);
                throw new RuntimeException("Property not found with ID: " + propertyID);
            }

        } catch (Exception e) {
            System.err.println("UserService: Error during apartmentID-based deletion: " + e.getMessage());
            throw new RuntimeException("Failed to delete property: " + e.getMessage(), e);
        }
    }

    public boolean savedPropertyExists(Long propertyID) {
        // Check if exists by savedPropertyID first
        if (savedPropertyRepository.existsById(propertyID)) {
            return true;
        }

        // If not found, check if exists by apartmentID in JSON data
        try {
            List<SavedProperty> allSavedProperties = savedPropertyRepository.findAll();
            for (SavedProperty savedProp : allSavedProperties) {
                try {
                    String propertyDataJson = savedProp.getPropertyData();
                    if (propertyDataJson != null && propertyDataJson.contains("\"apartmentID\":" + propertyID)) {
                        return true;
                    }
                } catch (Exception parseError) {
                    // Continue searching
                }
            }
        } catch (Exception e) {
            System.err.println("Error checking property existence: " + e.getMessage());
        }

        return false;
    }

    public Map<String, Object> getUserDashboardData(Long userID) {
        System.out.println("Getting dashboard data for user: " + userID);

        Map<String, Object> dashboardData = new HashMap<>();

        try {
            // Get recent activities
            List<UserActivity> recentActivities = activityRepository.findByUserIDOrderByCreatedAtDesc(userID);
            System.out.println("Found activities: " + recentActivities.size());

            if (recentActivities.size() > 10) {
                recentActivities = recentActivities.subList(0, 10);
            }

            // Get saved properties count
            List<SavedProperty> savedProperties = savedPropertyRepository.findByUserIDOrderBySavedAtDesc(userID);
            Long savedPropertiesCount = (long) savedProperties.size();
            System.out.println("Found saved properties: " + savedPropertiesCount);

            // Get activity statistics
            Long navigationCount = activityRepository.countByUserIDAndActivityType(userID, "navigation");
            Long propertyCount = activityRepository.countByUserIDAndActivityType(userID, "property");
            Long bookingCount = activityRepository.countByUserIDAndActivityType(userID, "booking");

            System.out.println("Activity stats - Navigation: " + navigationCount + ", Property: " + propertyCount + ", Booking: " + bookingCount);

            dashboardData.put("recentActivities", recentActivities);
            dashboardData.put("savedPropertiesCount", savedPropertiesCount);
            dashboardData.put("statistics", Map.of(
                    "navigation", navigationCount,
                    "property", propertyCount,
                    "booking", bookingCount
            ));

        } catch (Exception e) {
            System.out.println("Error getting dashboard data: " + e.getMessage());
            e.printStackTrace();
        }

        return dashboardData;
    }
}