

package com.propertyhub.apartment.observer;

import com.propertyhub.apartment.entity.Apartment;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Subject that maintains a list of observers and notifies them on new apartments.
 */
public class ApartmentSubject {
    private final List<ApartmentObserver> observers = new CopyOnWriteArrayList<>();

    public void registerObserver(ApartmentObserver observer) {
        if (observer != null) observers.add(observer);
    }

    public void unregisterObserver(ApartmentObserver observer) {
        if (observer != null) observers.remove(observer);
    }

    public void notifyNewApartment(Apartment apartment) {
        for (ApartmentObserver obs : observers) {
            try {
                obs.update(apartment);
            } catch (Exception ignored) {
            }
        }
    }
}
