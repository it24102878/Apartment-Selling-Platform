package com.propertyhub.payment.strategy;

import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Context/registry to resolve PaymentStrategy implementations by a key.
 */
@Component
public class PaymentStrategyContext {

    private final Map<String, PaymentStrategy> strategies = new HashMap<>();

    public PaymentStrategyContext(List<PaymentStrategy> strategyList) {
        if (strategyList != null) {
            for (PaymentStrategy s : strategyList) {
                if (s != null && s.getType() != null) {
                    strategies.put(s.getType().toLowerCase(), s);
                }
            }
        }
    }

    public PaymentStrategy get(String type) {
        if (type == null) return null;
        return strategies.get(type.toLowerCase());
    }
}
