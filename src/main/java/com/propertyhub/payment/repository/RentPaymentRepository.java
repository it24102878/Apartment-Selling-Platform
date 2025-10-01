package com.propertyhub.payment.repository;

import com.propertyhub.payment.entity.RentPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RentPaymentRepository extends JpaRepository<RentPayment, Integer> {
}