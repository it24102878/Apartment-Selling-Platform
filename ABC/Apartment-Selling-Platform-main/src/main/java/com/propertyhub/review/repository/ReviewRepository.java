// src/main/java/com/propertyhub/repository/ReviewRepository.java
package com.propertyhub.review.repository;


import com.propertyhub.auth.entity.User;
import com.propertyhub.review.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // Find all reviews by a specific user
    List<Review> findByUserOrderByCreatedAtDesc(User user);

    // Find all approved reviews
    List<Review> findByIsApprovedTrueOrderByCreatedAtDesc();

    // Find pending reviews (for admin)
    List<Review> findByIsApprovedFalseOrderByCreatedAtDesc();

    // Find reviews by rating
    List<Review> findByRatingAndIsApprovedTrueOrderByCreatedAtDesc(Integer rating);

    // Calculate average rating
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.isApproved = true")
    Double findAverageRating();

    // Count reviews by rating
    @Query("SELECT COUNT(r) FROM Review r WHERE r.rating = :rating AND r.isApproved = true")
    Long countByRating(@Param("rating") Integer rating);
}