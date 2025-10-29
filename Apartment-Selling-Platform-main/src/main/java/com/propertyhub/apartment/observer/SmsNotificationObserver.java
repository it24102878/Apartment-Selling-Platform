

package com.propertyhub.apartment.observer;

import com.propertyhub.apartment.entity.Apartment;
import org.springframework.stereotype.Component;

@Component
public class SmsNotificationObserver implements ApartmentObserver {
    @Override
    public void update(Apartment apartment) {
        // In a real system, integrate with an SMS provider.
        System.out.println("[NOTIFY][SMS] New apartment listed: ID=" + apartment.getApartmentID()
                + ", type=" + apartment.getType()
                + ", price=" + apartment.getPrice()
                + ", location=" + apartment.getLocation());
    }
}
