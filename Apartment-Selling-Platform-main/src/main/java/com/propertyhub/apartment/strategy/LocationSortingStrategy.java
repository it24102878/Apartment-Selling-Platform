

package com.propertyhub.apartment.strategy;

import com.propertyhub.apartment.entity.Apartment;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Concrete strategy to sort apartments by location alphabetically.
 */
public class LocationSortingStrategy implements ApartmentSortingStrategy {
    @Override
    public List<Apartment> sort(List<Apartment> apartments) {
        return apartments.stream()
                .sorted(Comparator.comparing(a -> {
                    String loc = a.getLocation();
                    return loc == null ? "" : loc.toLowerCase();
                }))
                .collect(Collectors.toList());
    }
}
