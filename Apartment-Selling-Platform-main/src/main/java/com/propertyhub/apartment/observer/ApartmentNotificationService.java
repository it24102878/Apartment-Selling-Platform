

package com.propertyhub.apartment.observer;

import com.propertyhub.apartment.entity.Apartment;
import org.springframework.stereotype.Service;

@Service
public class ApartmentNotificationService {

    private final ApartmentSubject subject = new ApartmentSubject();

    public ApartmentNotificationService(EmailNotificationObserver emailObserver,
                                        SmsNotificationObserver smsObserver) {
        // Register default observers
        subject.registerObserver(emailObserver);
        subject.registerObserver(smsObserver);
    }

    public void registerObserver(ApartmentObserver observer) {
        subject.registerObserver(observer);
    }

    public void unregisterObserver(ApartmentObserver observer) {
        subject.unregisterObserver(observer);
    }

    public void notifyNewApartment(Apartment apartment) {
        subject.notifyNewApartment(apartment);
    }
}
