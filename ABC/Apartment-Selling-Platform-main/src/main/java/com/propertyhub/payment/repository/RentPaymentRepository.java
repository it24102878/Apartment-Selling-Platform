package com.propertyhub.payment.repository;

import com.propertyhub.payment.entity.RentPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface RentPaymentRepository extends JpaRepository<RentPayment, Integer> {
    List<RentPayment> findByUserIDOrderByCreatedAtDesc(Long userID);
}