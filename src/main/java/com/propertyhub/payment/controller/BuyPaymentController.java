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
import com.propertyhub.payment.entity.BuyPayment;
import com.propertyhub.payment.service.BuyPaymentService;
import com.propertyhub.apartment.entity.Apartment;
import com.propertyhub.apartment.service.ApartmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.ByteArrayOutputStream;
import java.text.DecimalFormat;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/purchases")
@CrossOrigin(origins = "*")
public class BuyPaymentController {

    @Autowired
    private BuyPaymentService buyPaymentService;

    @Autowired
    private ApartmentService apartmentService;

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addPurchase(@RequestBody Map<String, Object> purchaseData) {
        Map<String, Object> response = new HashMap<>();

        try {
            Long userID = Long.valueOf(purchaseData.get("userID").toString());
            Integer apartmentID = Integer.valueOf(purchaseData.get("apartmentID").toString());
            String paymentType = (String) purchaseData.get("paymentType");
            String cardNumber = (String) purchaseData.get("cardNumber");
            String nameOnCard = (String) purchaseData.get("nameOnCard");
            Double offerAmount = Double.valueOf(purchaseData.get("offerAmount").toString());
            Double askingPrice = Double.valueOf(purchaseData.get("askingPrice").toString());

            // Validation
            if (paymentType == null || (paymentType != "Cash" && (cardNumber == null || nameOnCard == null))) {
                response.put("success", false);
                response.put("message", "Missing required payment fields");
                return ResponseEntity.badRequest().body(response);
            }

            BuyPayment payment = new BuyPayment(userID, apartmentID, paymentType, cardNumber, nameOnCard,
                    offerAmount, askingPrice, "PENDING");
            BuyPayment savedPayment = buyPaymentService.addPayment(payment);

            response.put("success", true);
            response.put("message", "Purchase offer added successfully");
            response.put("purchaseID", savedPayment.getPurchaseID());
            return ResponseEntity.ok(response);
        } catch (NumberFormatException e) {
            response.put("success", false);
            response.put("message", "Invalid number format: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to add purchase offer: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/pdf/{purchaseID}")
    public ResponseEntity<ByteArrayResource> generatePurchasePDF(@PathVariable Integer purchaseID) {
        try {
            Optional<BuyPayment> paymentOpt = buyPaymentService.findById(purchaseID);
            if (!paymentOpt.isPresent()) {
                throw new RuntimeException("Purchase not found");
            }
            BuyPayment payment = paymentOpt.get();

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
            document.add(new Paragraph("PropertyHub Purchase Offer Receipt")
                    .setFontSize(22)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(new DeviceRgb(33, 150, 243))
                    .setMarginBottom(10));
            document.add(new Paragraph("Your trusted partner in premium apartment purchasing")
                    .setFontSize(12)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY)
                    .setMarginBottom(20));

            // Summary Section
            document.add(new Paragraph("Purchase Offer Summary")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(new DeviceRgb(33, 150, 243))
                    .setMarginTop(20)
                    .setMarginBottom(10));
            Table summaryTable = new Table(UnitValue.createPercentArray(new float[]{50, 50})).useAllAvailableWidth();
            summaryTable.setMarginBottom(20);
            summaryTable.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));

            summaryTable.addCell(new Cell().add(new Paragraph("Offer Amount").setBold())
                    .setBackgroundColor(new DeviceRgb(240, 248, 255)));
            summaryTable.addCell(new Cell().add(new Paragraph(new DecimalFormat("$#,##0.00").format(payment.getOfferAmount())))
                    .setFontColor(payment.getStatus().equals("PENDING") ? ColorConstants.ORANGE : new DeviceRgb(46, 204, 113)));
            summaryTable.addCell(new Cell().add(new Paragraph("Offer Status").setBold())
                    .setBackgroundColor(new DeviceRgb(240, 248, 255)));
            summaryTable.addCell(new Cell().add(new Paragraph(payment.getStatus()))
                    .setFontColor(payment.getStatus().equals("PENDING") ? ColorConstants.ORANGE : new DeviceRgb(46, 204, 113)));
            document.add(summaryTable);

            // Purchase Details Section
            document.add(new Paragraph("Purchase Offer Details")
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(new DeviceRgb(33, 150, 243))
                    .setMarginTop(20)
                    .setMarginBottom(10));
            Table purchaseTable = new Table(UnitValue.createPercentArray(new float[]{40, 60})).useAllAvailableWidth();
            purchaseTable.setMarginBottom(20);
            purchaseTable.setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));

            // Add headers
            String[] purchaseHeaders = {"Field", "Details"};
            for (String header : purchaseHeaders) {
                purchaseTable.addHeaderCell(new Cell().add(new Paragraph(header).setBold())
                        .setBackgroundColor(new DeviceRgb(33, 150, 243))
                        .setFontColor(ColorConstants.WHITE));
            }

            // Add purchase details with alternating row colors
            String[][] purchaseData = {
                    {"Purchase ID", String.valueOf(payment.getPurchaseID())},
                    {"User ID", String.valueOf(payment.getUserID())},
                    {"Apartment ID", String.valueOf(payment.getApartmentID())},
                    {"Payment Type", payment.getPaymentType()},
                    {"Card Number", maskCardNumber(payment.getCardNumber())},
                    {"Name on Card", payment.getNameOnCard() != null ? payment.getNameOnCard() : "N/A"},
                    {"Offer Amount", new DecimalFormat("$#,##0.00").format(payment.getOfferAmount())},
                    {"Asking Price", new DecimalFormat("$#,##0.00").format(payment.getAskingPrice())},
                    {"Created At", payment.getCreatedAt().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))}
            };

            for (int i = 0; i < purchaseData.length; i++) {
                purchaseTable.addCell(new Cell().add(new Paragraph(purchaseData[i][0]))
                        .setBackgroundColor(i % 2 == 0 ? ColorConstants.WHITE : new DeviceRgb(245, 245, 245)));
                purchaseTable.addCell(new Cell().add(new Paragraph(purchaseData[i][1]))
                        .setBackgroundColor(i % 2 == 0 ? ColorConstants.WHITE : new DeviceRgb(245, 245, 245)));
            }
            document.add(purchaseTable);

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
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=purchase_offer_" + purchaseID + ".pdf");
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
            throw new RuntimeException("Failed to generate purchase PDF: " + e.getMessage());
        }
    }

    private String maskCardNumber(String cardNumber) {
        if (cardNumber == null || cardNumber.length() < 4) return "****";
        return "****-****-****-" + cardNumber.substring(cardNumber.length() - 4);
    }
}