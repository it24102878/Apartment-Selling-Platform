

package com.propertyhub.apartment.strategy;

import com.propertyhub.apartment.entity.Apartment;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Concrete strategy to sort apartments by price ascending.
 */
public class PriceSortingStrategy implements ApartmentSortingStrategy {
    @Override
    public List<Apartment> sort(List<Apartment> apartments) {
        return apartments.stream()
                .sorted(Comparator.comparing(Apartment::getPrice, Comparator.nullsLast(Double::compareTo)))
                .collect(Collectors.toList());
    }
}
