package com.propertyhub.payment.service;

import com.propertyhub.payment.entity.RentPayment;
import com.propertyhub.payment.repository.RentPaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RentPaymentService {

    @Autowired
    private RentPaymentRepository rentPaymentRepository;

    public RentPayment addPayment(RentPayment payment) {
        return rentPaymentRepository.save(payment);
    }

    public Optional<RentPayment> findById(Integer paymentID) {
        return rentPaymentRepository.findById(paymentID);
    }

    public List<RentPayment> getPaymentHistoryByUserId(Long userID) {
        return rentPaymentRepository.findByUserIDOrderByCreatedAtDesc(userID);
    }
}