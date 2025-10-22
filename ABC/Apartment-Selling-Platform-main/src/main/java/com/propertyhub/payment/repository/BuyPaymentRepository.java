package com.propertyhub.payment.repository;

import com.propertyhub.payment.entity.BuyPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BuyPaymentRepository extends JpaRepository<BuyPayment, Integer> {
    List<BuyPayment> findByUserIDOrderByCreatedAtDesc(Long userID);
}