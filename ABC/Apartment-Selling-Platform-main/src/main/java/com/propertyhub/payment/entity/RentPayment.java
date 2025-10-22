package com.propertyhub.payment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name ="RentPayments")
public class RentPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "paymentID")
    private Integer paymentID;

    @Column(name = "userID", nullable = false)
    private Long userID;

    @Column(name = "apartmentID", nullable = false)
    private Integer apartmentID;

    @Column(name = "paymentType", nullable = false)
    private String paymentType;

    @Column(name = "cardNumber", nullable = false)
    private String cardNumber;

    @Column(name = "nameOnCard", nullable = false)
    private String nameOnCard;

    @Column(name = "months", nullable = false)
    private Integer months;

    @Column(name = "monthlyRent", nullable = false)
    private Double monthlyRent;

    @Column(name = "totalAmount", nullable = false)
    private Double totalAmount;

    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public RentPayment() {}

    public RentPayment(Long userID, Integer apartmentID, String paymentType, String cardNumber, String nameOnCard,
                       Integer months, Double monthlyRent, Double totalAmount, String status) {
        this.userID = userID;
        this.apartmentID = apartmentID;
        this.paymentType = paymentType;
        this.cardNumber = cardNumber;
        this.nameOnCard = nameOnCard;
        this.months = months;
        this.monthlyRent = monthlyRent;
        this.totalAmount = totalAmount;
        this.status = status;
    }

    // Getters and Setters
    public Integer getPaymentID() { return paymentID; }
    public void setPaymentID(Integer paymentID) { this.paymentID = paymentID; }

    public Long getUserID() { return userID; }
    public void setUserID(Long userID) { this.userID = userID; }

    public Integer getApartmentID() { return apartmentID; }
    public void setApartmentID(Integer apartmentID) { this.apartmentID = apartmentID; }

    public String getPaymentType() { return paymentType; }
    public void setPaymentType(String paymentType) { this.paymentType = paymentType; }

    public String getCardNumber() { return cardNumber; }
    public void setCardNumber(String cardNumber) { this.cardNumber = cardNumber; }

    public String getNameOnCard() { return nameOnCard; }
    public void setNameOnCard(String nameOnCard) { this.nameOnCard = nameOnCard; }

    public Integer getMonths() { return months; }
    public void setMonths(Integer months) { this.months = months; }

    public Double getMonthlyRent() { return monthlyRent; }
    public void setMonthlyRent(Double monthlyRent) { this.monthlyRent = monthlyRent; }

    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}