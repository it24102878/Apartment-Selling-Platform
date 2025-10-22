-- Add sample reviews to the Reviews table
-- Make sure there are users in the database before running this script

-- Reviews for user with ID 1 (assuming this user exists)
INSERT INTO Reviews (userID, rating, title, comment, is_approved, created_at, updated_at)
VALUES
(1, 5, 'Exceptional Service!', 'I found my dream home through PropertyHub in just two weeks! The platform is so intuitive and the agents were incredibly helpful throughout the entire process.', TRUE, '2025-10-15 14:30:00', '2025-10-15 14:30:00'),
(1, 4, 'Great Experience Overall', 'The property listings are detailed and accurate. I appreciated the virtual tours which saved me so much time. Only giving 4 stars because some listings took a while to update their status.', TRUE, '2025-10-18 09:45:00', '2025-10-18 09:45:00');

-- Reviews for user with ID 2 (assuming this user exists)
INSERT INTO Reviews (userID, rating, title, comment, is_approved, created_at, updated_at)
VALUES
(2, 5, 'Sold My House Fast!', 'PropertyHub made selling my house a breeze! I received multiple offers within days of listing, and the transaction process was smooth and transparent.', TRUE, '2025-10-19 16:20:00', '2025-10-19 16:20:00'),
(2, 3, 'Good Platform, Some Improvements Needed', 'While I like the overall functionality, the mobile app could use some improvements. The search filters are great but sometimes the app crashes when uploading multiple photos.', FALSE, '2025-10-20 10:15:00', '2025-10-20 10:15:00');

-- Reviews for user with ID 3 (assuming this user exists)
INSERT INTO Reviews (userID, rating, title, comment, is_approved, created_at, updated_at)
VALUES
(3, 5, 'Professional and Efficient', 'I was impressed with how quickly the PropertyHub team responded to my inquiries. They were professional, knowledgeable, and made the entire rental process stress-free.', TRUE, '2025-10-17 11:30:00', '2025-10-17 11:30:00'),
(3, 4, 'Excellent Rental Options', 'Found a beautiful apartment in my preferred neighborhood within my budget. The filtering options really helped narrow down exactly what I was looking for.', TRUE, '2025-10-12 13:25:00', '2025-10-12 13:25:00');

-- Additional reviews with different ratings to provide variety
INSERT INTO Reviews (userID, rating, title, comment, is_approved, created_at, updated_at)
VALUES
(1, 5, 'Best Real Estate Platform!', 'After trying several other platforms, PropertyHub stands out with its user-friendly interface and comprehensive listings. Highly recommend!', TRUE, '2025-10-10 09:20:00', '2025-10-10 09:20:00'),
(2, 4, 'Very Helpful Features', 'The neighborhood information and price comparison tools were invaluable in my home search. Would have given 5 stars if the messaging system was a bit faster.', TRUE, '2025-10-08 14:50:00', '2025-10-08 14:50:00'),
(3, 5, 'Exceeded My Expectations', 'From searching to closing the deal, PropertyHub exceeded my expectations at every step. The virtual tours feature is fantastic!', TRUE, '2025-10-05 16:35:00', '2025-10-05 16:35:00');
