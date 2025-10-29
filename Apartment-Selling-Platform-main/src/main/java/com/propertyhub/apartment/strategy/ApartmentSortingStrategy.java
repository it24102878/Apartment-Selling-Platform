

package com.propertyhub.apartment.strategy;

import com.propertyhub.apartment.entity.Apartment;

import java.util.List;

/**
 * Strategy interface for sorting apartments.
 */
public interface ApartmentSortingStrategy {
    List<Apartment> sort(List<Apartment> apartments);
}
