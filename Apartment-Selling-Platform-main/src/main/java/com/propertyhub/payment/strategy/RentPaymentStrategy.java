package com.propertyhub.payment.strategy;

import com.propertyhub.payment.entity.RentPayment;
import com.propertyhub.payment.repository.RentPaymentRepository;
import org.springframework.stereotype.Component;

/**
 * Concrete strategy for handling Rent payments.
 */
@Component
public class    RentPaymentStrategy implements PaymentStrategy {

    private final RentPaymentRepository rentPaymentRepository;

    public RentPaymentStrategy(RentPaymentRepository rentPaymentRepository) {
        this.rentPaymentRepository = rentPaymentRepository;
    }

    @Override
    public String getType() {
        return "rent";
    }

    @Override
    public RentPayment process(RentPayment payment) {
        if (payment == null) return null;
        return rentPaymentRepository.save(payment);
    }
}
