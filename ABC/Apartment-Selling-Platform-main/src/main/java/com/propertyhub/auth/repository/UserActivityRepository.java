package com.propertyhub.auth.repository;

import com.propertyhub.auth.entity.UserActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserActivityRepository extends JpaRepository<UserActivity, Long> {
    List<UserActivity> findByUserIDOrderByCreatedAtDesc(Long userID);

    @Query("SELECT ua FROM UserActivity ua WHERE ua.userID = :userID AND ua.activityType = :type ORDER BY ua.createdAt DESC")
    List<UserActivity> findByUserIDAndActivityType(@Param("userID") Long userID, @Param("type") String activityType);

    @Query("SELECT COUNT(ua) FROM UserActivity ua WHERE ua.userID = :userID AND ua.activityType = :type")
    Long countByUserIDAndActivityType(@Param("userID") Long userID, @Param("type") String activityType);
}

