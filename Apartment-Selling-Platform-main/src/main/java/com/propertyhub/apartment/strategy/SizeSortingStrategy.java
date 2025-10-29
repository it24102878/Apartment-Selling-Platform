

package com.propertyhub.apartment.strategy;

import com.propertyhub.apartment.entity.Apartment;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Concrete strategy to sort apartments by bedrooms (as a proxy for size) ascending.
 */
public class SizeSortingStrategy implements ApartmentSortingStrategy {
    @Override
    public List<Apartment> sort(List<Apartment> apartments) {
        return apartments.stream()
                .sorted(Comparator.comparing(Apartment::getBedrooms, Comparator.nullsLast(Integer::compareTo)))
                .collect(Collectors.toList());
    }
}
