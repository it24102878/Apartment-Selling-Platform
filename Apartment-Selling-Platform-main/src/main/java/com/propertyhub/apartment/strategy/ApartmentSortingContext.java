

package com.propertyhub.apartment.strategy;

import com.propertyhub.apartment.entity.Apartment;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Context class to select and apply a sorting strategy based on a key.
 */
@Component
public class ApartmentSortingContext {

    private final Map<String, ApartmentSortingStrategy> strategies = new HashMap<>();

    public ApartmentSortingContext() {
        // Register default strategies
        strategies.put("price", new PriceSortingStrategy());
        strategies.put("location", new LocationSortingStrategy());
        strategies.put("size", new SizeSortingStrategy());
        // alias
        strategies.put("bedrooms", new SizeSortingStrategy());
    }

    public List<Apartment> sort(List<Apartment> apartments, String sortBy) {
        if (sortBy == null || sortBy.isBlank()) return apartments; // no-op
        String key = sortBy.toLowerCase(Locale.ROOT).trim();
        ApartmentSortingStrategy strategy = strategies.get(key);
        if (strategy == null) return apartments;
        return strategy.sort(apartments);
    }

    public void registerStrategy(String key, ApartmentSortingStrategy strategy) {
        if (key == null || strategy == null) return;
        strategies.put(key.toLowerCase(Locale.ROOT).trim(), strategy);
    }
}
