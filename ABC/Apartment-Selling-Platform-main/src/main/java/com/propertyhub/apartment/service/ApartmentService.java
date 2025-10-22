package com.propertyhub.apartment.service;

import com.propertyhub.apartment.entity.Apartment;
import com.propertyhub.apartment.repository.ApartmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ApartmentService {

    private static final String OWNER_PREFIX = "OWNER#";

    @Autowired
    private ApartmentRepository apartmentRepository;

    public static String embedOwnerInDescription(String description, Long userId) {
        String safeDesc = description == null ? "" : description;
        // Avoid double-embedding
        if (safeDesc.startsWith(OWNER_PREFIX)) {
            return safeDesc; // already embedded
        }
        return OWNER_PREFIX + userId + ";" + safeDesc;
    }

    public static Long extractOwnerFromDescription(String description) {
        if (description == null) return null;
        if (description.startsWith(OWNER_PREFIX)) {
            int sep = description.indexOf(';');
            if (sep > OWNER_PREFIX.length()) {
                try {
                    return Long.parseLong(description.substring(OWNER_PREFIX.length(), sep));
                } catch (NumberFormatException ignored) {}
            }
        }
        return null;
    }

    public static String stripOwnerFromDescription(String description) {
        if (description == null) return null;
        if (description.startsWith(OWNER_PREFIX)) {
            int sep = description.indexOf(';');
            if (sep != -1) {
                return description.substring(sep + 1);
            }
        }
        return description;
    }

    public List<Apartment> getAllApartments() {
        // Return with descriptions stripped of owner marker for public display
        List<Apartment> list = apartmentRepository.findAll();
        list.forEach(a -> a.setDescription(stripOwnerFromDescription(a.getDescription())));
        return list;
    }

    public Optional<Apartment> getApartmentById(Integer apartmentID) {
        Optional<Apartment> ap = apartmentRepository.findById(apartmentID);
        ap.ifPresent(a -> a.setDescription(stripOwnerFromDescription(a.getDescription())));
        return ap;
    }

    public Apartment addApartment(Apartment apartment) {
        apartment.setStatus("AVAILABLE");
        return apartmentRepository.save(apartment);
    }

    public boolean deleteApartmentIfOwner(Integer apartmentID, Long userId) {
        Optional<Apartment> optionalApartment = apartmentRepository.findById(apartmentID);
        if (optionalApartment.isEmpty()) return false;
        Apartment ap = optionalApartment.get();
        Long owner = extractOwnerFromDescription(ap.getDescription());
        if (owner != null && owner.equals(userId)) {
            apartmentRepository.deleteById(apartmentID);
            return true;
        }
        return false;
    }

    public boolean updateApartment(Integer apartmentID, Long userId, java.util.Map<String, String> data) {
        Optional<Apartment> optionalApartment = apartmentRepository.findById(apartmentID);
        if (optionalApartment.isEmpty()) return false;
        Apartment ap = optionalApartment.get();
        Long owner = extractOwnerFromDescription(ap.getDescription());
        if (owner == null || !owner.equals(userId)) {
            return false;
        }
        if (data.containsKey("type")) ap.setType(data.get("type"));
        if (data.containsKey("price")) ap.setPrice(Double.parseDouble(data.get("price")));
        if (data.containsKey("bedrooms")) ap.setBedrooms(Integer.parseInt(data.get("bedrooms")));
        if (data.containsKey("location")) ap.setLocation(data.get("location"));
        if (data.containsKey("description")) {
            // Re-embed owner marker when changing description
            String newDesc = data.get("description");
            ap.setDescription(embedOwnerInDescription(newDesc, userId));
        }
        if (data.containsKey("status")) ap.setStatus(data.get("status"));
        apartmentRepository.save(ap);
        return true;
    }

    public List<Apartment> getApartmentsByOwner(Long userId) {
        List<Apartment> all = apartmentRepository.findAll();
        java.util.List<Apartment> filtered = new java.util.ArrayList<>();
        for (Apartment a : all) {
            Long owner = extractOwnerFromDescription(a.getDescription());
            if (owner != null && owner.equals(userId)) {
                // Strip owner tag for UI
                a.setDescription(stripOwnerFromDescription(a.getDescription()));
                filtered.add(a);
            }
        }
        return filtered;
    }

    public boolean updateApartmentDescription(Integer apartmentID, String imageUrl) {
        Optional<Apartment> optionalApartment = apartmentRepository.findById(apartmentID);

        if (optionalApartment.isPresent()) {
            Apartment apartment = optionalApartment.get();
            // Update the description with the image URL (preserve owner marker if present)
            Long owner = extractOwnerFromDescription(apartment.getDescription());
            String desc = imageUrl;
            if (owner != null) {
                desc = embedOwnerInDescription(desc, owner);
            }
            apartment.setDescription(desc);
            apartmentRepository.save(apartment);
            return true;
        }

        return false;
    }
}