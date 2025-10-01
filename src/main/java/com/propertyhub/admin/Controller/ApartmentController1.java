package com.propertyhub.admin.Controller;

import com.propertyhub.admin.entity.Apartment1;
import com.propertyhub.admin.service.ApartmentService1;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/admin/apartments1")
@CrossOrigin(origins = "*") // Updated for development
public class ApartmentController1 {

    @Autowired
    private ApartmentService1 apartmentService1;

    @GetMapping
    public List<Apartment1> getAllApartments() {
        return apartmentService1.getAllApartments();
    }

    @GetMapping("/{id}")
    public Apartment1 getApartmentById(@PathVariable Integer id) {
        return apartmentService1.getApartmentById(id);
    }

    @PostMapping
    public Apartment1 createApartment(@RequestBody Apartment1 apartment) {
        return apartmentService1.createApartment(apartment);
    }

    @PutMapping("/{id}")
    public Apartment1 updateApartment(@PathVariable Integer id, @RequestBody Apartment1 apartment) {
        return apartmentService1.updateApartment(id, apartment);
    }

    @DeleteMapping("/{id}")
    public void deleteApartment(@PathVariable Integer id) {
        apartmentService1.deleteApartment(id);
    }
    @GetMapping("/test")
    public List<Apartment1> getTestApartments() {
        // Return test data without database
        List<Apartment1> testData = new ArrayList<>();

        Apartment1 apt1 = new Apartment1();
        apt1.setAptId(1);
        apt1.setAptType("Condo");
        apt1.setAptPrice(new BigDecimal("450000.00"));
        apt1.setAptBedrooms(2);
        apt1.setAptLocation("Downtown");
        apt1.setAptStatus("AVAILABLE");
        apt1.setAptCreatedAt(LocalDateTime.now());
        testData.add(apt1);

        return testData;
    }
}