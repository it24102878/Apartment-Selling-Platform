package com.propertyhub.admin.repository;

import com.propertyhub.admin.entity.AdminRentPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminRentRepository extends JpaRepository<AdminRentPayment, Integer> {
    List<AdminRentPayment> findByStatus(String status);
    Long countByStatus(String status);
}