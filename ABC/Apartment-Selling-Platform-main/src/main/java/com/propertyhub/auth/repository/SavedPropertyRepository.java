package com.propertyhub.auth.repository;

import com.propertyhub.auth.entity.SavedProperty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;

@Repository
public interface SavedPropertyRepository extends JpaRepository<SavedProperty, Long> {
    List<SavedProperty> findByUserIDOrderBySavedAtDesc(Long userID);
    boolean existsByUserIDAndPropertyAddress(Long userID, String propertyAddress);

    @Modifying
    @Transactional
    @Query("DELETE FROM SavedProperty sp WHERE sp.savedPropertyID = :savedPropertyID")
    void deleteBySavedPropertyID(@Param("savedPropertyID") Long savedPropertyID);

    // Method to find saved property by apartmentID in the JSON data
    @Query("SELECT sp FROM SavedProperty sp WHERE sp.userID = :userID AND sp.propertyData LIKE %:apartmentIDPattern%")
    List<SavedProperty> findByUserIDAndApartmentID(@Param("userID") Long userID, @Param("apartmentIDPattern") String apartmentIDPattern);

    // Alternative method using native SQL for better JSON handling
    @Query(value = "SELECT * FROM SavedProperties WHERE userID = :userID AND JSON_VALUE(propertyData, '$.apartmentID') = :apartmentID", nativeQuery = true)
    Optional<SavedProperty> findByUserIDAndApartmentIDNative(@Param("userID") Long userID, @Param("apartmentID") String apartmentID);
}