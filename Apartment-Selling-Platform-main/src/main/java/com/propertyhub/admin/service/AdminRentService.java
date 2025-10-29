package com.propertyhub.admin.service;

import com.propertyhub.admin.entity.AdminRentPayment;
import com.propertyhub.admin.repository.AdminRentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class AdminRentService {

    private final AdminRentRepository adminRentRepository;

    @Autowired
    public AdminRentService(AdminRentRepository adminRentRepository) {
        this.adminRentRepository = adminRentRepository;
    }

    // Get all payments
    public List<AdminRentPayment> getAllPayments() {
        return adminRentRepository.findAll();
    }

    // Get payment by ID
    public Optional<AdminRentPayment> getPaymentById(Integer id) {
        return adminRentRepository.findById(id);
    }

    // Create new payment
    public AdminRentPayment createPayment(AdminRentPayment payment) {
        return adminRentRepository.save(payment);
    }

    // Update payment
    public AdminRentPayment updatePayment(Integer id, AdminRentPayment paymentDetails) {
        AdminRentPayment payment = getPaymentById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (paymentDetails.getTotalAmount() != null) {
            payment.setTotalAmount(paymentDetails.getTotalAmount());
        }
        if (paymentDetails.getStatus() != null) {
            payment.setStatus(paymentDetails.getStatus());
        }
        // Add more update fields if needed

        return adminRentRepository.save(payment);
    }

    // Delete payment
    public void deletePayment(Integer id) {
        AdminRentPayment payment = getPaymentById(id)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        adminRentRepository.delete(payment);
    }

    // Get payments by status
    public List<AdminRentPayment> getPaymentsByStatus(String status) {
        return adminRentRepository.findByStatus(status);
    }

    // Get total revenue (sum of totalAmount for all COMPLETED payments)
    public BigDecimal getTotalRevenue() {
        List<AdminRentPayment> completedPayments = getPaymentsByStatus("COMPLETED");
        return calculateTotalRevenue(completedPayments);
    }

    // Get count of completed payments
    public Long getCompletedPaymentsCount() {
        return adminRentRepository.countByStatus("COMPLETED");
    }

    // Calculate total revenue from a specific list (for filtered analytics)
    public BigDecimal calculateTotalRevenue(List<AdminRentPayment> payments) {
        return payments.stream()
                .filter(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()))  // Only completed
                .map(p -> {
                    BigDecimal amount = p.getTotalAmount();
                    return amount != null ? amount : BigDecimal.ZERO;
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);  // ✅ Works perfectly
    }
}
