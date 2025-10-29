package com.propertyhub.admin.service;


import com.propertyhub.admin.entity.User1;
import com.propertyhub.admin.repository.User1Repository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class User1Service {

    @Autowired
    private User1Repository userRepository;

    public List<User1> getAllUsers() {
        return userRepository.findAllOrderByCreatedAtDesc();
    }

    public Optional<User1> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User1 createUser(User1 user) {
        // Check if email already exists
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new RuntimeException("Email already exists: " + user.getEmail());
        }
        return userRepository.save(user);
    }

    public User1 updateUser(Long id, User1 userDetails) {
        User1 user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));

        // Check if email is being changed and if it already exists
        if (!user.getEmail().equals(userDetails.getEmail()) &&
                userRepository.existsByEmail(userDetails.getEmail())) {
            throw new RuntimeException("Email already exists: " + userDetails.getEmail());
        }

        user.setName(userDetails.getName());
        user.setEmail(userDetails.getEmail());
        user.setPhone(userDetails.getPhone());

        // Only update password if provided
        if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
            user.setPassword(userDetails.getPassword());
        }

        return userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User1 user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        userRepository.delete(user);
    }

    public List<User1> searchUsers(String searchTerm) {
        return userRepository.findByNameContainingIgnoreCase(searchTerm);
    }
}