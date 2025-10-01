// src/main/java/com/propertyhub/service/ReviewService.java
package com.propertyhub.review.service;

import com.propertyhub.auth.entity.User;
import com.propertyhub.auth.repository.UserRepository;
import com.propertyhub.review.dto.ReviewRequest;
import com.propertyhub.review.entity.Review;
import com.propertyhub.review.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ReviewService {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    public Review createReview(ReviewRequest reviewRequest, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        Review review = new Review();
        review.setUser(user);
        review.setRating(reviewRequest.getRating());
        review.setTitle(reviewRequest.getTitle());
        review.setComment(reviewRequest.getComment());
        review.setIsApproved(false); // Default to false for moderation

        return reviewRepository.save(review);
    }

    public List<Review> getUserReviews(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        return reviewRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public List<Review> getAllApprovedReviews() {
        return reviewRepository.findByIsApprovedTrueOrderByCreatedAtDesc();
    }

    public List<Review> getPendingReviews() {
        return reviewRepository.findByIsApprovedFalseOrderByCreatedAtDesc();
    }

    public Review updateReview(Long reviewId, ReviewRequest reviewRequest) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        review.setRating(reviewRequest.getRating());
        review.setTitle(reviewRequest.getTitle());
        review.setComment(reviewRequest.getComment());

        return reviewRepository.save(review);
    }

    public Review approveReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));

        review.setIsApproved(true);
        return reviewRepository.save(review);
    }

    public void deleteReview(Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new RuntimeException("Review not found with id: " + reviewId));
        reviewRepository.delete(review);
    }

    public Double getAverageRating() {
        return reviewRepository.findAverageRating();
    }

    public Long getReviewCountByRating(Integer rating) {
        return reviewRepository.countByRating(rating);
    }

    public Optional<Review> getReviewById(Long reviewId) {
        return reviewRepository.findById(reviewId);
    }
}