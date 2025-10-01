package com.propertyhub.payment.service;

import com.propertyhub.payment.entity.BuyPayment;
import com.propertyhub.payment.repository.BuyPaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class BuyPaymentService {

    @Autowired
    private BuyPaymentRepository buyPaymentRepository;

    public BuyPayment addPayment(BuyPayment payment) {
        return buyPaymentRepository.save(payment);
    }

    public Optional<BuyPayment> findById(Integer purchaseID) {
        return buyPaymentRepository.findById(purchaseID);
    }
}