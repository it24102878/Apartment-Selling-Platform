package com.propertyhub.auth.controller;

import com.propertyhub.auth.entity.User;
import com.propertyhub.auth.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> loginData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String email = loginData.get("email");
            String password = loginData.get("password");

            // Validate input
            if (email == null || email.trim().isEmpty() || password == null || password.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Email and password are required");
                return ResponseEntity.badRequest().body(response);
            }

            Optional<User> userOpt = authService.login(email, password);

            if (userOpt.isPresent()) {
                User user = userOpt.get();
                Map<String, Object> userData = new HashMap<>();
                userData.put("userID", user.getUserID());
                userData.put("name", user.getName());
                userData.put("email", user.getEmail());
                userData.put("phone", user.getPhone());

                response.put("success", true);
                response.put("message", "Login successful");
                response.put("user", userData);
                response.put("token", "jwt-token-placeholder"); // Add token for future use
            } else {
                response.put("success", false);
                response.put("message", "Invalid email or password");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Map<String, String> registerData) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate required fields
            if (registerData.get("name") == null || registerData.get("email") == null ||
                    registerData.get("password") == null) {
                response.put("success", false);
                response.put("message", "Name, email, and password are required");
                return ResponseEntity.badRequest().body(response);
            }

            User user = authService.register(
                    registerData.get("name"),
                    registerData.get("email"),
                    registerData.get("phone"),
                    registerData.get("password")
            );

            response.put("success", true);
            response.put("message", "Registration successful");
            response.put("userID", user.getUserID());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    // Add a simple test endpoint to verify the API is working
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "API is working");
        return ResponseEntity.ok(response);
    }
}