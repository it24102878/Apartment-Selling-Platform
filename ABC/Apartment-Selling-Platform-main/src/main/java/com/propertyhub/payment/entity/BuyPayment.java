package com.propertyhub.payment.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "BuyPayments")
public class BuyPayment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "purchaseID")
    private Integer purchaseID;

    @Column(name = "userID", nullable = false)
    private Long userID;

    @Column(name = "apartmentID", nullable = false)
    private Integer apartmentID;

    @Column(name = "paymentType", nullable = false)
    private String paymentType;

    @Column(name = "cardNumber")
    private String cardNumber;

    @Column(name = "nameOnCard")
    private String nameOnCard;

    @Column(name = "offerAmount", nullable = false)
    private Double offerAmount;

    @Column(name = "askingPrice", nullable = false)
    private Double askingPrice;

    @Column(name = "status", nullable = false)
    private String status = "PENDING";

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Constructors
    public BuyPayment() {}

    public BuyPayment(Long userID, Integer apartmentID, String paymentType, String cardNumber, String nameOnCard,
                      Double offerAmount, Double askingPrice, String status) {
        this.userID = userID;
        this.apartmentID = apartmentID;
        this.paymentType = paymentType;
        this.cardNumber = cardNumber;
        this.nameOnCard = nameOnCard;
        this.offerAmount = offerAmount;
        this.askingPrice = askingPrice;
        this.status = status;
    }

    // Getters and Setters
    public Integer getPurchaseID() { return purchaseID; }
    public void setPurchaseID(Integer purchaseID) { this.purchaseID = purchaseID; }

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

    public Double getOfferAmount() { return offerAmount; }
    public void setOfferAmount(Double offerAmount) { this.offerAmount = offerAmount; }

    public Double getAskingPrice() { return askingPrice; }
    public void setAskingPrice(Double askingPrice) { this.askingPrice = askingPrice; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}