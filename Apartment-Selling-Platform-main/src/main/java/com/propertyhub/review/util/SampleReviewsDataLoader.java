package com.propertyhub.review.util;

import com.propertyhub.auth.entity.User;
import com.propertyhub.auth.repository.UserRepository;
import com.propertyhub.review.entity.Review;
import com.propertyhub.review.repository.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * This class is used to populate the database with sample reviews for demonstration purposes.
 * It will run automatically when the application starts.
 */
@Component
public class SampleReviewsDataLoader implements CommandLineRunner {

    @Autowired
    private ReviewRepository reviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public void run(String... args) {
        // Check if reviews already exist to avoid duplicates
        if (reviewRepository.count() > 0) {
            System.out.println("Reviews already exist in the database. Skipping sample data creation.");
            return;
        }

        // Find some users to associate reviews with
        List<User> users = userRepository.findAll();

        if (users.isEmpty()) {
            System.out.println("No users found in the database. Cannot add sample reviews.");
            return;
        }

        // Create sample review data
        createSampleReviews(users);
    }

    private void createSampleReviews(List<User> users) {
        // Today's date for reference
        LocalDateTime now = LocalDateTime.now();

        // Review data structure: user index, rating, title, comment, isApproved, days ago
        Object[][] reviewsData = {
            // Format: {userIndex, rating, title, comment, isApproved, daysAgo}
            {0, 5, "Exceptional Service!", "I found my dream home through PropertyHub in just two weeks! The platform is so intuitive and the agents were incredibly helpful throughout the entire process.", true, 5},
            {0, 4, "Great Experience Overall", "The property listings are detailed and accurate. I appreciated the virtual tours which saved me so much time. Only giving 4 stars because some listings took a while to update their status.", true, 2},
            {1, 5, "Sold My House Fast!", "PropertyHub made selling my house a breeze! I received multiple offers within days of listing, and the transaction process was smooth and transparent.", true, 1},
            {1, 3, "Good Platform, Some Improvements Needed", "While I like the overall functionality, the mobile app could use some improvements. The search filters are great but sometimes the app crashes when uploading multiple photos.", false, 0},
            {0, 5, "Best Real Estate Platform!", "After trying several other platforms, PropertyHub stands out with its user-friendly interface and comprehensive listings. Highly recommend!", true, 10},
            {1, 4, "Very Helpful Features", "The neighborhood information and price comparison tools were invaluable in my home search. Would have given 5 stars if the messaging system was a bit faster.", true, 12},
            {0, 5, "Exceeded My Expectations", "From searching to closing the deal, PropertyHub exceeded my expectations at every step. The virtual tours feature is fantastic!", true, 15},
            {1, 5, "Fantastic Property Listings", "The quality and accuracy of the listings on PropertyHub are outstanding. I found exactly what I was looking for within my budget.", true, 3},
            {0, 4, "Smooth Rental Process", "Renting through PropertyHub was straightforward and hassle-free. The document signing process was particularly efficient.", true, 7}
        };

        for (Object[] reviewData : reviewsData) {
            int userIndex = Math.min((int) reviewData[0], users.size() - 1);
            User user = users.get(userIndex);

            int rating = (int) reviewData[1];
            String title = (String) reviewData[2];
            String comment = (String) reviewData[3];
            boolean isApproved = (boolean) reviewData[4];
            int daysAgo = (int) reviewData[5];

            LocalDateTime createdAt = now.minusDays(daysAgo);

            Review review = new Review();
            review.setUser(user);
            review.setRating(rating);
            review.setTitle(title);
            review.setComment(comment);
            review.setIsApproved(isApproved);
            review.setCreatedAt(createdAt);
            review.setUpdatedAt(createdAt);

            reviewRepository.save(review);
        }

        System.out.println("Sample reviews have been added to the database.");
    }
}
