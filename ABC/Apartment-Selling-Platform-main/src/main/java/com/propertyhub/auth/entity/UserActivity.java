package com.propertyhub.auth.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "UserActivities")
public class UserActivity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long activityID;

    @Column(nullable = false)
    private Long userID;

    @Column(nullable = false, length = 50)
    private String activityType;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String relatedData;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public UserActivity() {}

    public UserActivity(Long userID, String activityType, String description, String relatedData) {
        this.userID = userID;
        this.activityType = activityType;
        this.description = description;
        this.relatedData = relatedData;
    }

    // Getters and Setters
    public Long getActivityID() { return activityID; }
    public void setActivityID(Long activityID) { this.activityID = activityID; }

    public Long getUserID() { return userID; }
    public void setUserID(Long userID) { this.userID = userID; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getRelatedData() { return relatedData; }
    public void setRelatedData(String relatedData) { this.relatedData = relatedData; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
