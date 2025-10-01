package com.propertyhub.admin.repository;

import com.propertyhub.admin.entity.Apartment1;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ApartmentRepository1 extends JpaRepository<Apartment1, Integer> {
}