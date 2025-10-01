// src/main/java/com/propertyhub/dto/ReviewRequest.java
package com.propertyhub.review.dto;

public class ReviewRequest {
    private Integer rating;
    private String title;
    private String comment;

    // Default constructor
    public ReviewRequest() {}

    // Getters and Setters
    public Integer getRating() { return rating; }
    public void setRating(Integer rating) { this.rating = rating; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
}