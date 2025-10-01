package com.propertyhub.payment.repository;

import com.propertyhub.payment.entity.BuyPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BuyPaymentRepository extends JpaRepository<BuyPayment, Integer> {
}