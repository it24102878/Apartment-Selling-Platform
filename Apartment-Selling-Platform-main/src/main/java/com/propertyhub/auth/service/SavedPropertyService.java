package com.propertyhub.auth.service;

import com.propertyhub.auth.entity.SavedProperty;
import com.propertyhub.auth.repository.SavedPropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class SavedPropertyService {

    @Autowired
    private SavedPropertyRepository savedPropertyRepository;

    @Transactional
    public SavedProperty saveProperty(SavedProperty savedProperty) {
        try {
            SavedProperty saved = savedPropertyRepository.save(savedProperty);
            // Force flush to ensure database write happens immediately
            savedPropertyRepository.flush();
            System.out.println("SavedPropertyService: Property saved with ID: " + saved.getSavedPropertyID());
            return saved;
        } catch (Exception e) {
            System.err.println("SavedPropertyService: Error saving property: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to save property to database", e);
        }
    }

    public List<SavedProperty> getUserSavedProperties(Long userID) {
        try {
            return savedPropertyRepository.findByUserIDOrderBySavedAtDesc(userID);
        } catch (Exception e) {
            System.err.println("SavedPropertyService: Error fetching user properties: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to fetch saved properties", e);
        }
    }

    @Transactional
    public void deleteSavedProperty(Long savedPropertyID) {
        try {
            savedPropertyRepository.deleteById(savedPropertyID);
            savedPropertyRepository.flush();
            System.out.println("SavedPropertyService: Property deleted with ID: " + savedPropertyID);
        } catch (Exception e) {
            System.err.println("SavedPropertyService: Error deleting property: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Failed to delete saved property", e);
        }
    }

    public boolean existsByUserIDAndPropertyAddress(Long userID, String propertyAddress) {
        try {
            return savedPropertyRepository.existsByUserIDAndPropertyAddress(userID, propertyAddress);
        } catch (Exception e) {
            System.err.println("SavedPropertyService: Error checking property existence: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    public Optional<SavedProperty> findById(Long savedPropertyID) {
        try {
            return savedPropertyRepository.findById(savedPropertyID);
        } catch (Exception e) {
            System.err.println("SavedPropertyService: Error finding property by ID: " + e.getMessage());
            e.printStackTrace();
            return Optional.empty();
        }
    }
}
