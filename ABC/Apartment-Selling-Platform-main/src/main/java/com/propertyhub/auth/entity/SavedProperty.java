package com.propertyhub.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "SavedProperties")
public class SavedProperty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long savedPropertyID;

    @Column(nullable = false)
    private Long userID;

    @Column(nullable = false)
    private String propertyPrice;

    @Column(nullable = false, length = 300)
    private String propertyAddress;

    @Column(length = 500)
    private String propertyFeatures;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String propertyData;

    @Column(name = "saved_at")
    private LocalDateTime savedAt = LocalDateTime.now();

    // Constructors
    public SavedProperty() {}

    // Getters and Setters
    public Long getSavedPropertyID() { return savedPropertyID; }
    public void setSavedPropertyID(Long savedPropertyID) { this.savedPropertyID = savedPropertyID; }

    public Long getUserID() { return userID; }
    public void setUserID(Long userID) { this.userID = userID; }

    public String getPropertyPrice() { return propertyPrice; }
    public void setPropertyPrice(String propertyPrice) { this.propertyPrice = propertyPrice; }

    public String getPropertyAddress() { return propertyAddress; }
    public void setPropertyAddress(String propertyAddress) { this.propertyAddress = propertyAddress; }

    public String getPropertyFeatures() { return propertyFeatures; }
    public void setPropertyFeatures(String propertyFeatures) { this.propertyFeatures = propertyFeatures; }

    public String getPropertyData() { return propertyData; }
    public void setPropertyData(String propertyData) { this.propertyData = propertyData; }

    public LocalDateTime getSavedAt() { return savedAt; }
    public void setSavedAt(LocalDateTime savedAt) { this.savedAt = savedAt; }
}