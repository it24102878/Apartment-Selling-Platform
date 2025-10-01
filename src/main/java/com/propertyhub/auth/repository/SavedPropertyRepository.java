package com.propertyhub.auth.repository;

import com.propertyhub.auth.entity.SavedProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SavedPropertyRepository extends JpaRepository<SavedProperty, Long> {
    List<SavedProperty> findByUserIDOrderBySavedAtDesc(Long userID);
    boolean existsByUserIDAndPropertyAddress(Long userID, String propertyAddress);
}