CREATE TABLE Users (
    userID INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(100) UNIQUE NOT NULL,
    phone NVARCHAR(20),
    password NVARCHAR(255) NOT NULL,
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE UserActivities (
    activityID INT IDENTITY(1,1) PRIMARY KEY,
    userID INT NOT NULL,
    activityType NVARCHAR(50) NOT NULL,
    description NVARCHAR(500) NOT NULL,
    relatedData NVARCHAR(MAX) NULL,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);

CREATE TABLE SavedProperties (
    savedPropertyID INT IDENTITY(1,1) PRIMARY KEY,
    userID INT NOT NULL,
    propertyPrice NVARCHAR(50) NOT NULL,
    propertyAddress NVARCHAR(300) NOT NULL,
    propertyFeatures NVARCHAR(500),
    propertyData NVARCHAR(MAX),
    saved_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE,
    CONSTRAINT UC_UserProperty UNIQUE (userID, propertyAddress)
);

CREATE TABLE Apartments (
    apartmentID INT IDENTITY(1,1) PRIMARY KEY,
    type NVARCHAR(50) NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    bedrooms INT NOT NULL,
    location NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'AVAILABLE',
    created_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE RentPayments(
    paymentID INT IDENTITY(1,1) PRIMARY KEY,
    userID INT NOT NULL,
    apartmentID INT NOT NULL,
    paymentType NVARCHAR(50) NOT NULL,
    cardNumber NVARCHAR(50) NOT NULL,
    nameOnCard NVARCHAR(100) NOT NULL,
    months INT NOT NULL,
    monthlyRent DECIMAL(12,2) NOT NULL,
    totalAmount DECIMAL(12,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'PENDING',
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userID) REFERENCES Users(userID),
    FOREIGN KEY (apartmentID) REFERENCES Apartments(apartmentID)
);

CREATE TABLE BuyPayments (
    purchaseID INT IDENTITY(1,1) PRIMARY KEY,
    userID INT NOT NULL,
    apartmentID INT NOT NULL,
    paymentType NVARCHAR(50) NOT NULL,
    cardNumber NVARCHAR(50) NOT NULL,
    nameOnCard NVARCHAR(100) NOT NULL, 
    offerAmount DECIMAL(12,2) NOT NULL,
    askingPrice DECIMAL(12,2) NOT NULL,
    status NVARCHAR(20) DEFAULT 'PENDING',
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userID) REFERENCES Users(userID),
    FOREIGN KEY (apartmentID) REFERENCES Apartments(apartmentID)
);

CREATE TABLE Reviews (
    reviewID INT IDENTITY(1,1) PRIMARY KEY,
    userID INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title NVARCHAR(200) NOT NULL,
    comment NVARCHAR(MAX),
    is_approved BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (userID) REFERENCES Users(userID) ON DELETE CASCADE
);

--------------------------------------------------------------------------------

-- Sample data
INSERT INTO Users (name, email, phone, password) VALUES
('John Smith', 'john@email.com', '555-0001', 'password123'),
('Jane Doe', 'jane@email.com', '555-0002', 'password123');

INSERT INTO Apartments (type, price, bedrooms, location, description) VALUES
('Apartment', 320000.00, 1, 'Midtown', 'Modern apartment with amenities');

INSERT INTO Bookings (userID, apartmentID, start_date, end_date, total_price) VALUES
(1, 1, '2025-09-24', '2025-12-24', 420.0);

INSERT INTO Reviews (userID, rating, title, comment, is_approved) VALUES
(1, 5, 'Excellent Service!', 'PropertyHub helped me find my dream home quickly and efficiently. Highly recommended!', 1),
(2, 4, 'Great Platform', 'The website is easy to use and the property listings are accurate. Good experience overall.', 1),
(1, 3, 'Good but could improve', 'The service was good but the response time could be faster. Otherwise satisfied.', 0);

INSERT INTO Reviews (userID, apartmentID, bookingID, rating, title, comment, is_approved) VALUES
(1, 1, 1, 5, 'Excellent Stay!', 'Beautiful condo with amazing views. Highly recommended!', 1),
(2, 2, 2, 4, 'Great Apartment', 'Modern and clean apartment with good amenities.', 1);