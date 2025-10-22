package com.propertyhub.admin.repository;

import com.propertyhub.admin.entity.User1;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface User1Repository extends JpaRepository<User1, Long> {

    Optional<User1> findByEmail(String email);

    List<User1> findByNameContainingIgnoreCase(String name);

    @Query("SELECT u FROM User1 u ORDER BY u.createdAt DESC")
    List<User1> findAllOrderByCreatedAtDesc();

    boolean existsByEmail(String email);
}