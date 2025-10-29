

package com.propertyhub.apartment.observer;

import com.propertyhub.apartment.entity.Apartment;

/**
 * Observer interface to be notified when a new apartment is listed.
 */
public interface ApartmentObserver {
    void update(Apartment apartment);
}
