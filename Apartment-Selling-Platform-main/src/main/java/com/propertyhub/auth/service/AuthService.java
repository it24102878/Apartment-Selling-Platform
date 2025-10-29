package com.propertyhub.auth.service;

import com.propertyhub.auth.entity.User;
import com.propertyhub.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    private BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public Optional<User> login(String email, String password) {
        System.out.println("=== AUTH SERVICE LOGIN ===");
        System.out.println("Email: " + email);

        try {
            Optional<User> userOpt = userRepository.findByEmail(email);
            System.out.println("User found: " + userOpt.isPresent());

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                System.out.println("Stored password hash: " + user.getPassword());
                System.out.println("Input password: " + password);

                // Check if password matches
                boolean passwordMatches = passwordEncoder.matches(password, user.getPassword());
                System.out.println("Password matches: " + passwordMatches);

                if (passwordMatches) {
                    System.out.println("LOGIN SUCCESS for: " + email);
                    return Optional.of(user);
                } else {
                    System.out.println("PASSWORD MISMATCH for: " + email);
                }
            } else {
                System.out.println("USER NOT FOUND for email: " + email);
            }
        } catch (Exception e) {
            System.err.println("ERROR in AuthService.login(): " + e.getMessage());
            e.printStackTrace();
        }

        return Optional.empty();
    }

    public User register(String name, String email, String phone, String password) {
        System.out.println("=== AUTH SERVICE REGISTER ===");
        System.out.println("Registering: " + email);

        try {
            boolean emailExists = userRepository.existsByEmail(email);
            System.out.println("Email exists: " + emailExists);

            if (emailExists) {
                throw new RuntimeException("Email already exists");
            }

            User user = new User();
            user.setName(name);
            user.setEmail(email);
            user.setPhone(phone);

            // Encode the password
            String encodedPassword = passwordEncoder.encode(password);
            System.out.println("Original password: " + password);
            System.out.println("Encoded password: " + encodedPassword);

            user.setPassword(encodedPassword);
            user.setCreatedAt(LocalDateTime.now());

            User savedUser = userRepository.save(user);
            System.out.println("REGISTRATION SUCCESS: " + savedUser.getEmail());

            return savedUser;
        } catch (Exception e) {
            System.err.println("ERROR in AuthService.register(): " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    // Temporary method to handle plain text passwords during transition
    public Optional<User> loginWithFallback(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String storedPassword = user.getPassword();

            // Try BCrypt first
            if (passwordEncoder.matches(password, storedPassword)) {
                return Optional.of(user);
            }
            // Fallback: check plain text (for existing users)
            else if (storedPassword.equals(password)) {
                System.out.println("Using plain text fallback for: " + email);
                // Update to encoded password for next time
                user.setPassword(passwordEncoder.encode(password));
                userRepository.save(user);
                return Optional.of(user);
            }
        }
        return Optional.empty();
    }
}