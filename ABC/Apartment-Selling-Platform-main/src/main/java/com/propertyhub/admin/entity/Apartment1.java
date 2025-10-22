package com.propertyhub.admin.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Apartments")
public class Apartment1 {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "apartmentID") // Match your actual column name
    private Integer aptId;

    @Column(name = "type", length = 50)
    private String aptType;

    @Column(name = "price", precision = 12, scale = 2)
    private BigDecimal aptPrice;

    @Column(name = "bedrooms")
    private Integer aptBedrooms;

    @Column(name = "location", length = 200)
    private String aptLocation;

    @Column(name = "description", length = 1000)
    private String aptDescription;

    @Column(name = "status", length = 20)
    private String aptStatus = "AVAILABLE";

    @Column(name = "created_at")
    private LocalDateTime aptCreatedAt = LocalDateTime.now();

    // Constructors, getters, and setters remain the same
    public Apartment1() {}

    public Integer getAptId() { return aptId; }
    public void setAptId(Integer aptId) { this.aptId = aptId; }

    public String getAptType() { return aptType; }
    public void setAptType(String aptType) { this.aptType = aptType; }

    public BigDecimal getAptPrice() { return aptPrice; }
    public void setAptPrice(BigDecimal aptPrice) { this.aptPrice = aptPrice; }

    public Integer getAptBedrooms() { return aptBedrooms; }
    public void setAptBedrooms(Integer aptBedrooms) { this.aptBedrooms = aptBedrooms; }

    public String getAptLocation() { return aptLocation; }
    public void setAptLocation(String aptLocation) { this.aptLocation = aptLocation; }

    public String getAptDescription() { return aptDescription; }
    public void setAptDescription(String aptDescription) { this.aptDescription = aptDescription; }

    public String getAptStatus() { return aptStatus; }
    public void setAptStatus(String aptStatus) { this.aptStatus = aptStatus; }

    public LocalDateTime getAptCreatedAt() { return aptCreatedAt; }
    public void setAptCreatedAt(LocalDateTime aptCreatedAt) { this.aptCreatedAt = aptCreatedAt; }
}