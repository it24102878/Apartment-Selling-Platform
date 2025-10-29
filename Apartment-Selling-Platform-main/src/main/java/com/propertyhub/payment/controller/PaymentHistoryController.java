package com.propertyhub.payment.controller;

import com.propertyhub.payment.entity.BuyPayment;
import com.propertyhub.payment.entity.RentPayment;
import com.propertyhub.payment.service.BuyPaymentService;
import com.propertyhub.payment.service.RentPaymentService;
import com.propertyhub.apartment.entity.Apartment;
import com.propertyhub.apartment.service.ApartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/payment-history")
@CrossOrigin(origins = "*")
public class PaymentHistoryController {

    @Autowired
    private BuyPaymentService buyPaymentService;

    @Autowired
    private RentPaymentService rentPaymentService;

    @Autowired
    private ApartmentService apartmentService;

    @GetMapping("/user/{userID}")
    public ResponseEntity<Map<String, Object>> getPaymentHistory(@PathVariable Long userID) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Get buy payments
            List<BuyPayment> buyPayments = buyPaymentService.getPaymentHistoryByUserId(userID);
            List<Map<String, Object>> buyPaymentHistory = buyPayments.stream().map(payment -> {
                Map<String, Object> paymentData = new HashMap<>();
                paymentData.put("id", payment.getPurchaseID());
                paymentData.put("type", "Purchase");
                paymentData.put("apartmentID", payment.getApartmentID());
                paymentData.put("paymentType", payment.getPaymentType());
                paymentData.put("amount", payment.getOfferAmount());
                paymentData.put("status", payment.getStatus());
                paymentData.put("createdAt", payment.getCreatedAt());
                paymentData.put("cardNumber", maskCardNumber(payment.getCardNumber()));
                paymentData.put("nameOnCard", payment.getNameOnCard());

                // Get apartment details
                try {
                    Optional<Apartment> apartment = apartmentService.getApartmentById(payment.getApartmentID());
                    if (apartment.isPresent()) {
                        paymentData.put("apartmentLocation", apartment.get().getLocation());
                        paymentData.put("apartmentType", apartment.get().getType());
                    }
                } catch (Exception e) {
                    paymentData.put("apartmentLocation", "N/A");
                    paymentData.put("apartmentType", "N/A");
                }

                return paymentData;
            }).toList();

            // Get rent payments
            List<RentPayment> rentPayments = rentPaymentService.getPaymentHistoryByUserId(userID);
            List<Map<String, Object>> rentPaymentHistory = rentPayments.stream().map(payment -> {
                Map<String, Object> paymentData = new HashMap<>();
                paymentData.put("id", payment.getPaymentID());
                paymentData.put("type", "Rent");
                paymentData.put("apartmentID", payment.getApartmentID());
                paymentData.put("paymentType", payment.getPaymentType());
                paymentData.put("amount", payment.getTotalAmount());
                paymentData.put("monthlyRent", payment.getMonthlyRent());
                paymentData.put("months", payment.getMonths());
                paymentData.put("status", payment.getStatus());
                paymentData.put("createdAt", payment.getCreatedAt());
                paymentData.put("cardNumber", maskCardNumber(payment.getCardNumber()));
                paymentData.put("nameOnCard", payment.getNameOnCard());

                // Get apartment details
                try {
                    Optional<Apartment> apartment = apartmentService.getApartmentById(payment.getApartmentID());
                    if (apartment.isPresent()) {
                        paymentData.put("apartmentLocation", apartment.get().getLocation());
                        paymentData.put("apartmentType", apartment.get().getType());
                    }
                } catch (Exception e) {
                    paymentData.put("apartmentLocation", "N/A");
                    paymentData.put("apartmentType", "N/A");
                }

                return paymentData;
            }).toList();

            // Combine and sort by creation date (newest first)
            List<Map<String, Object>> allPayments = new ArrayList<>();
            allPayments.addAll(buyPaymentHistory);
            allPayments.addAll(rentPaymentHistory);

            allPayments.sort((p1, p2) -> {
                java.time.LocalDateTime date1 = (java.time.LocalDateTime) p1.get("createdAt");
                java.time.LocalDateTime date2 = (java.time.LocalDateTime) p2.get("createdAt");
                return date2.compareTo(date1); // Newest first
            });

            response.put("success", true);
            response.put("payments", allPayments);
            response.put("totalPayments", allPayments.size());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to retrieve payment history: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) {
            return "****";
        }
        return "**** **** **** " + cardNumber.substring(cardNumber.length() - 4);
    }
}
