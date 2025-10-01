package com.propertyhub.apartment.service;

import com.propertyhub.apartment.entity.Apartment;
import com.propertyhub.apartment.repository.ApartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ApartmentService {

    @Autowired
    private ApartmentRepository apartmentRepository;

    public List<Apartment> getAllApartments() {
        return apartmentRepository.findAll();
    }

    public Optional<Apartment> getApartmentById(Integer apartmentID) {
        return apartmentRepository.findById(apartmentID);
    }

    public Apartment addApartment(Apartment apartment) {
        apartment.setStatus("AVAILABLE");
        return apartmentRepository.save(apartment);
    }

    public void deleteApartment(Integer apartmentID) {
        apartmentRepository.deleteById(apartmentID);
    }


}