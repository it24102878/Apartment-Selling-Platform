package com.propertyhub.admin.service;

import com.propertyhub.admin.entity.Apartment1;
import com.propertyhub.admin.repository.ApartmentRepository1;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ApartmentService1 {

    @Autowired
    private ApartmentRepository1 apartmentRepository1;

    public List<Apartment1> getAllApartments() {
        return apartmentRepository1.findAll();
    }

    public Apartment1 getApartmentById(Integer id) {
        Optional<Apartment1> apartment = apartmentRepository1.findById(id);
        return apartment.orElseThrow(() -> new RuntimeException("Apartment not found with id: " + id));
    }

    public Apartment1 createApartment(Apartment1 apartment) {
        // Set default values if not provided
        if (apartment.getAptStatus() == null) {
            apartment.setAptStatus("AVAILABLE");
        }
        if (apartment.getAptCreatedAt() == null) {
            apartment.setAptCreatedAt(java.time.LocalDateTime.now());
        }
        return apartmentRepository1.save(apartment);
    }

    public Apartment1 updateApartment(Integer id, Apartment1 apartmentDetails) {
        Apartment1 existingApartment = getApartmentById(id);

        // Update only provided fields
        if (apartmentDetails.getAptType() != null) {
            existingApartment.setAptType(apartmentDetails.getAptType());
        }
        if (apartmentDetails.getAptPrice() != null) {
            existingApartment.setAptPrice(apartmentDetails.getAptPrice());
        }
        if (apartmentDetails.getAptBedrooms() != null) {
            existingApartment.setAptBedrooms(apartmentDetails.getAptBedrooms());
        }
        if (apartmentDetails.getAptLocation() != null) {
            existingApartment.setAptLocation(apartmentDetails.getAptLocation());
        }
        if (apartmentDetails.getAptDescription() != null) {
            existingApartment.setAptDescription(apartmentDetails.getAptDescription());
        }
        if (apartmentDetails.getAptStatus() != null) {
            existingApartment.setAptStatus(apartmentDetails.getAptStatus());
        }

        return apartmentRepository1.save(existingApartment);
    }

    public void deleteApartment(Integer id) {
        Apartment1 apartment = getApartmentById(id);
        apartmentRepository1.delete(apartment);
    }
}