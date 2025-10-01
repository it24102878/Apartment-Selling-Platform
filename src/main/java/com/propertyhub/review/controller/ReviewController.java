// src/main/java/com/propertyhub/controller/ReviewController.java
package com.propertyhub.review.controller;


import com.propertyhub.review.dto.ReviewRequest;
import com.propertyhub.review.entity.Review;
import com.propertyhub.review.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:3000")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @PostMapping("/user/{userId}")
    public ResponseEntity<?> createReview(@PathVariable Long userId, @RequestBody ReviewRequest reviewRequest) {
        try {
            // Validate rating
            if (reviewRequest.getRating() == null || reviewRequest.getRating() < 1 || reviewRequest.getRating() > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "Rating must be between 1 and 5"));
            }

            if (reviewRequest.getTitle() == null || reviewRequest.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
            }

            Review createdReview = reviewService.createReview(reviewRequest, userId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Review submitted successfully");
            response.put("review", createdReview);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReviews(@PathVariable Long userId) {
        try {
            List<Review> reviews = reviewService.getUserReviews(userId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/approved")
    public ResponseEntity<List<Review>> getApprovedReviews() {
        List<Review> reviews = reviewService.getAllApprovedReviews();
        return ResponseEntity.ok(reviews);
    }

    @GetMapping("/pending")
    public ResponseEntity<List<Review>> getPendingReviews() {
        List<Review> reviews = reviewService.getPendingReviews();
        return ResponseEntity.ok(reviews);
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(@PathVariable Long reviewId, @RequestBody ReviewRequest reviewRequest) {
        try {
            Review updatedReview = reviewService.updateReview(reviewId, reviewRequest);
            return ResponseEntity.ok(updatedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PutMapping("/{reviewId}/approve")
    public ResponseEntity<?> approveReview(@PathVariable Long reviewId) {
        try {
            Review approvedReview = reviewService.approveReview(reviewId);
            return ResponseEntity.ok(approvedReview);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable Long reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok().body(Map.of(
                    "success", true,
                    "message", "Review deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getReviewStats() {
        Double averageRating = reviewService.getAverageRating();
        Map<String, Object> stats = new HashMap<>();
        stats.put("averageRating", averageRating != null ? Math.round(averageRating * 10.0) / 10.0 : 0);

        // Add rating distribution
        for (int i = 1; i <= 5; i++) {
            stats.put("rating" + i + "Count", reviewService.getReviewCountByRating(i));
        }

        stats.put("totalReviews", reviewService.getAllApprovedReviews().size());

        return ResponseEntity.ok(stats);
    }
}