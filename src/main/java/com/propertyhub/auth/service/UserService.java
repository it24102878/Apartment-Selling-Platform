package com.propertyhub.auth.service;

import com.propertyhub.auth.entity.SavedProperty;
import com.propertyhub.auth.entity.UserActivity;
import com.propertyhub.auth.repository.SavedPropertyRepository;
import com.propertyhub.auth.repository.UserActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public void removeSavedProperty(Long propertyID) {
        savedPropertyRepository.deleteById(propertyID);
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