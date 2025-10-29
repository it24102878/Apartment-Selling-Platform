package com.propertyhub.payment.strategy;

import com.propertyhub.payment.entity.BuyPayment;
import com.propertyhub.payment.entity.RentPayment;

/**
 * Strategy interface for handling different payment flows in a unified way.
 *
 * This interface provides minimal, non-invasive hooks so we can introduce the
 * Strategy pattern for payments without changing existing services/controllers.
 *
 * Implementations are expected to work with their respective payment entities.
 */
public interface PaymentStrategy {

    /**
     * Identifier for this strategy (e.g., "buy", "rent").
     */
    String getType();

    /**
     * Process a Buy payment. Implementations that don't support Buy can no-op.
     */
    default BuyPayment process(BuyPayment payment) { return payment; }

    /**
     * Process a Rent payment. Implementations that don't support Rent can no-op.
     */
    default RentPayment process(RentPayment payment) { return payment; }
}
