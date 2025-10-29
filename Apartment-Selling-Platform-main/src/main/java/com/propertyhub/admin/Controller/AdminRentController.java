package com.propertyhub.admin.Controller; // ✅ lowercase folder name

import com.propertyhub.admin.entity.AdminRentPayment;
import com.propertyhub.admin.service.AdminRentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/admin/payments")
@CrossOrigin(origins = "*")
public class AdminRentController {

    @Autowired
    private AdminRentService adminRentService;

    // ✅ Get all payments
    @GetMapping
    public ResponseEntity<List<AdminRentPayment>> getAllPayments() {
        try {
            List<AdminRentPayment> payments = adminRentService.getAllPayments();
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Get payment by ID
    @GetMapping("/{id}")
    public ResponseEntity<AdminRentPayment> getPaymentById(@PathVariable Integer id) {
        try {
            return adminRentService.getPaymentById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Create new payment
    @PostMapping
    public ResponseEntity<AdminRentPayment> createPayment(@RequestBody AdminRentPayment payment) {
        try {
            AdminRentPayment createdPayment = adminRentService.createPayment(payment);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPayment);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    // ✅ Update payment (partial update supported)
    @PutMapping("/{id}")
    public ResponseEntity<AdminRentPayment> updatePayment(
            @PathVariable Integer id,
            @RequestBody AdminRentPayment paymentDetails) {
        try {
            AdminRentPayment existingPayment = adminRentService.getPaymentById(id)
                    .orElseThrow(() -> new RuntimeException("Payment not found"));

            if (paymentDetails.getTotalAmount() != null) {
                existingPayment.setTotalAmount(paymentDetails.getTotalAmount());
            }
            if (paymentDetails.getStatus() != null) {
                existingPayment.setStatus(paymentDetails.getStatus());
            }

            AdminRentPayment updatedPayment = adminRentService.updatePayment(id, existingPayment);
            return ResponseEntity.ok(updatedPayment);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Delete payment
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePayment(@PathVariable Integer id) {
        try {
            adminRentService.deletePayment(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Get analytics (optionally filter by status)
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalyticsData(
            @RequestParam(required = false) String status) {
        try {
            List<AdminRentPayment> payments;
            if (status != null && !status.isEmpty()) {
                payments = adminRentService.getPaymentsByStatus(status);
            } else {
                payments = adminRentService.getAllPayments();
            }

            System.out.println("Payments fetched: " + payments.size());

            BigDecimal totalRevenue = adminRentService.calculateTotalRevenue(payments);
            Long completedCount = adminRentService.getCompletedPaymentsCount();

            List<Map<String, Object>> simplifiedPayments = new ArrayList<>();
            for (AdminRentPayment p : payments) {
                Map<String, Object> simplePayment = new HashMap<>();
                simplePayment.put("paymentID", p.getPaymentID());
                simplePayment.put("totalAmount", p.getTotalAmount());
                simplifiedPayments.add(simplePayment);
            }

            Map<String, Object> analyticsData = new HashMap<>();
            analyticsData.put("payments", simplifiedPayments);
            analyticsData.put("totalRevenue", totalRevenue);
            analyticsData.put("completedPaymentsCount", completedCount);
            analyticsData.put("totalPayments", payments.size());
            analyticsData.put("filterStatus", status);

            return ResponseEntity.ok(analyticsData);
        } catch (Exception e) {
            System.err.println("Analytics error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Revenue statistics (global)
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getRevenueStats() {
        try {
            BigDecimal totalRevenue = adminRentService.getTotalRevenue();
            Long completedCount = adminRentService.getCompletedPaymentsCount();

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalRevenue", totalRevenue);
            stats.put("completedPayments", completedCount);

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ✅ Get payments by status
    @GetMapping("/status/{status}")
    public ResponseEntity<List<AdminRentPayment>> getPaymentsByStatus(@PathVariable String status) {
        try {
            List<AdminRentPayment> payments = adminRentService.getPaymentsByStatus(status);
            return ResponseEntity.ok(payments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
