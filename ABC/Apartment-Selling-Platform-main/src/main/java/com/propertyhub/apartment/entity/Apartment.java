package com.propertyhub.apartment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "Apartments")
public class Apartment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "apartmentID")
    private Integer apartmentID;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Integer bedrooms;

    @Column(nullable = false)
    private String location;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Constructors
    public Apartment() {}

    public Apartment(String type, Double price, Integer bedrooms, String location, String description, String status) {
        this.type = type;
        this.price = price;
        this.bedrooms = bedrooms;
        this.location = location;
        this.description = description;
        this.status = status;
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getApartmentID() { return apartmentID; }
    public void setApartmentID(Integer apartmentID) { this.apartmentID = apartmentID; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }

    public Integer getBedrooms() { return bedrooms; }
    public void setBedrooms(Integer bedrooms) { this.bedrooms = bedrooms; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}