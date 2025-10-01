package com.propertyhub.payment.controller;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.borders.SolidBorder;
import com.propertyhub.payment.entity.RentPayment;
import com.propertyhub.payment.service.RentPaymentService;
import com.propertyhub.apartment.entity.Apartment;
import com.propertyhub.apartment.service.ApartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import java.time.format.DateTimeFormatter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class RentPaymentController {

    @Autowired
    private RentPaymentService rentPaymentService;

    @Autowired
    private ApartmentService apartmentService;

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addPayment(@RequestBody Map<String, Object> paymentData) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long userID = Long.valueOf(paymentData.get("userID").toString());
            Integer apartmentID = Integer.valueOf(paymentData.get("apartmentID").toString());
            String paymentType = (String) paymentData.get("paymentType");
            String cardNumber = (String) paymentData.get("cardNumber");
            String nameOnCard = (String) paymentData.get("nameOnCard");
            Integer months = Integer.valueOf(paymentData.get("months").toString());
            Double monthlyRent = Double.valueOf(paymentData.get("monthlyRent").toString());
            Double totalAmount = Double.valueOf(paymentData.get("totalAmount").toString());

            if (paymentType == null || cardNumber == null || nameOnCard == null) {
                response.put("success", false);
                response.put("message", "Missing required payment fields");
                return ResponseEntity.badRequest().body(response);
            }

            RentPayment payment = new RentPayment(userID, apartmentID, paymentType, cardNumber, nameOnCard,
                    months, monthlyRent, totalAmount, "COMPLETED");
            RentPayment savedPayment = rentPaymentService.addPayment(payment);

            response.put("success", true);
            response.put("message", "Payment added successfully");
            response.put("paymentID", savedPayment.getPaymentID());
        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "Invalid number format: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to add payment: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/pdf/{paymentID}")
    public ResponseEntity<ByteArrayResource> generatePaymentPDF(@PathVariable Integer paymentID) {
        try {
            Optional<RentPayment> paymentOpt = rentPaymentService.findById(paymentID);
            if (!paymentOpt.isPresent()) {
                throw new RuntimeException("Payment not found");
            }
            RentPayment payment = paymentOpt.get();

            Optional<Apartment> apartmentOpt = apartmentService.getApartmentById(payment.getApartmentID());
            if (!apartmentOpt.isPresent()) {
                throw new RuntimeException("Apartment not found");
            }
            Apartment apartment = apartmentOpt.get();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Header
            document.add(new Paragraph("PropertyHub Payment Receipt")
                    .setFontSize(22)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(new DeviceRgb(33, 150, 243)) // Blue color
                    .setMarginBottom(10));
            document.add(new Paragraph("Your trusted partner in premium apartment living")
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY)
                    .setMarginBottom(20));

            // Summary Section
            document.add(new Paragraph("Payment Summary")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(new DeviceRgb(33, 150, 243))
                    .setMarginTop(20)
                    .setMarginBottom(10));
            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            summaryTable.setMarginBottom(20);
            summaryTable.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));

            summaryTable.addCell(new Cell().add(new Paragraph("Total Amount").setBold())
                    .setBackgroundColor(new DeviceRgb(240, 248, 255))); // Light blue background
            summaryTable.addCell(new Cell().add(new Paragraph(new DecimalFormat("$#,##0.00").format(payment.getTotalAmount())))
                    .setFontColor(payment.getStatus().equals("RENTED") ? ColorConstants.ORANGE : new DeviceRgb(46, 204, 113))); // Green for confirmed, orange for pending
            summaryTable.addCell(new Cell().add(new Paragraph("Payment Status").setBold())
                    .setBackgroundColor(new DeviceRgb(240, 248, 255)));
            summaryTable.addCell(new Cell().add(new Paragraph(payment.getStatus()))
                    .setFontColor(payment.getStatus().equals("RENTED") ? ColorConstants.ORANGE : new DeviceRgb(46, 204, 113)));
            document.add(summaryTable);

            // Payment Details Section
            document.add(new Paragraph("Payment Details")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(new DeviceRgb(33, 150, 243))
                    .setMarginTop(20)
                    .setMarginBottom(10));
            Table paymentTable = new Table(UnitValue.createPercentArray(new float[]{40, 60})).useAllAvailableWidth();
            paymentTable.setMarginBottom(20);
            paymentTable.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));

            // Add headers
            String[] paymentHeaders = {"Field", "Details"};
            for (String header : paymentHeaders) {
                paymentTable.addHeaderCell(new Cell().add(new Paragraph(header).setBold())
                        .setBackgroundColor(new DeviceRgb(33, 150, 243))
                        .setFontColor(ColorConstants.WHITE));
            }

            // Add payment details with alternating row colors
            String[][] paymentData = {
                    {"Payment ID", String.valueOf(payment.getPaymentID())},
                    {"User ID", String.valueOf(payment.getUserID())},
                    {"Apartment ID", String.valueOf(payment.getApartmentID())},
                    {"Payment Type", payment.getPaymentType()},
                    {"Card Number", maskCardNumber(payment.getCardNumber())},
                    {"Name on Card", payment.getNameOnCard()},
                    {"Months", String.valueOf(payment.getMonths())},
                    {"Monthly Rent", new DecimalFormat("$#,##0.00").format(payment.getMonthlyRent())},
                    {"Total Amount", new DecimalFormat("$#,##0.00").format(payment.getTotalAmount())},
                    {"Created At", payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))}
            };

            for (int i = 0; i < paymentData.length; i++) {
                paymentTable.addCell(new Cell().add(new Paragraph(paymentData[i][0]))
                        .setBackgroundColor(i % 2 == 0 ? ColorConstants.WHITE : new DeviceRgb(245, 245, 245)));
                paymentTable.addCell(new Cell().add(new Paragraph(paymentData[i][1]))
                        .setBackgroundColor(i % 2 == 0 ? ColorConstants.WHITE : new DeviceRgb(245, 245, 245)));
            }
            document.add(paymentTable);

            // Apartment Details Section
            document.add(new Paragraph("Apartment Details")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(new DeviceRgb(33, 150, 243))
                    .setMarginTop(20)
                    .setMarginBottom(10));
            Table apartmentTable = new Table(UnitValue.createPercentArray(new float[]{40, 60})).useAllAvailableWidth();
            apartmentTable.setMarginBottom(20);
            apartmentTable.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));

            // Add headers
            String[] apartmentHeaders = {"Field", "Details"};
            for (String header : apartmentHeaders) {
                apartmentTable.addHeaderCell(new Cell().add(new Paragraph(header).setBold())
                        .setBackgroundColor(new DeviceRgb(33, 150, 243))
                        .setFontColor(ColorConstants.WHITE));
            }

            // Add apartment details with alternating row colors
            String[][] apartmentData = {
                    {"Apartment Type", apartment.getType()},
                    {"Bedrooms", String.valueOf(apartment.getBedrooms())},
                    {"Location", apartment.getLocation()},
                    {"Description", apartment.getDescription() != null ? apartment.getDescription() : "N/A"}
            };

            for (int i = 0; i < apartmentData.length; i++) {
                apartmentTable.addCell(new Cell().add(new Paragraph(apartmentData[i][0]))
                        .setBackgroundColor(i % 2 == 0 ? ColorConstants.WHITE : new DeviceRgb(245, 245, 245)));
                apartmentTable.addCell(new Cell().add(new Paragraph(apartmentData[i][1]))
                        .setBackgroundColor(i % 2 == 0 ? ColorConstants.WHITE : new DeviceRgb(245, 245, 245)));
            }
            document.add(apartmentTable);

            document.close();

            ByteArrayResource resource = new ByteArrayResource(baos.toByteArray());
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=payment_details_" + paymentID + ".pdf");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");
            headers.add(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_PDF_VALUE);

            return ResponseEntity.ok()
                    .headers(headers)
                    .contentLength(baos.size())
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate payment PDF: " + e.getMessage());
        }
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) return "****";
        return "****-****-****-" + cardNumber.substring(cardNumber.length() - 4);
    }
}