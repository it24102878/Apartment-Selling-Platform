package com.propertyhub.payment.strategy;

import com.propertyhub.payment.entity.BuyPayment;
import com.propertyhub.payment.repository.BuyPaymentRepository;
import org.springframework.stereotype.Component;

/**
 * Concrete strategy for handling Buy payments.
 */
@Component
public class BuyPaymentStrategy implements PaymentStrategy {

    private final BuyPaymentRepository buyPaymentRepository;

    public BuyPaymentStrategy(BuyPaymentRepository buyPaymentRepository) {
        this.buyPaymentRepository = buyPaymentRepository;
    }

    @Override
    public String getType() {
        return "buy";
    }

    @Override
    public BuyPayment process(BuyPayment payment) {
        if (payment == null) return null;
        return buyPaymentRepository.save(payment);
    }
}
