package com.propertyhub.auth.repository;

import com.propertyhub.auth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email); // Changed from findByEmailAndType
    boolean existsByEmail(String email);
}