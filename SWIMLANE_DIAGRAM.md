# Main Workflow - Coworking Space Manager

This document illustrates the core business workflows of the Coworking Space Manager system using Mermaid Swimlane Diagrams.

## 1. Online Booking & Ordering Flow (Customer)

This flow describes the journey of a Customer booking a workspace remotely, ordering food/drinks, and checking in.

```mermaid
sequenceDiagram
    autonumber
    
    actor Customer
    participant Frontend
    participant Backend (System)
    participant PayOS (Payment)
    actor Staff
    
    %% Setup & Auth
    Customer->>Frontend: Access System & Login
    Frontend->>Backend (System): Authenticate (JWT)
    
    %% Booking Spaces
    Customer->>Frontend: Browse available Tables
    Frontend->>Backend (System): Fetch Table statuses
    Customer->>Frontend: Select Table & Time slots
    
    %% Adding Orders
    Customer->>Frontend: (Optional) Add Food/Services
    Frontend->>Customer: Display Cart & Total
    
    %% Checkout
    Customer->>Frontend: Checkout Order
    Frontend->>Backend (System): Create Booking & Order (Pending)
    
    %% Payment Phase
    alt Pay with QR PayOS
        Backend (System)->>PayOS (Payment): Generate Payment Link
        PayOS (Payment)-->>Frontend: Return QR Payment URL
        Customer->>Frontend: Scan QR & Pay via App
        PayOS (Payment)->>Backend (System): Webhook: Payment Success
        Backend (System)->>Backend (System): Update Status to PAID / CONFIRMED
    else Pay with Cash (Later)
        Customer->>Frontend: Select "Thanh toán tiền mặt"
    end
    
    %% Staff Confirmation & Check-in
    Backend (System)-->>Frontend: Notify "Booking Successful!"
    
    %% Visit
    Customer->>Staff: Arrive at Space, provide QR Code
    Staff->>Frontend: Scan QR / Search Booking
    Frontend->>Backend (System): Verify Booking
    Backend (System)-->>Staff: Verification Result
    Staff->>Frontend: Click "Check-in"
    Frontend->>Backend (System): Update Table to OCCUPIED / CHECKED-IN
```

## 2. In-Store POS & Walk-in Flow (Staff)

This flow represents a Walk-in Customer booking a table or buying food directly at the counter.

```mermaid
sequenceDiagram
    autonumber
    
    actor Walk-In Customer
    actor Staff
    participant POS System (Frontend)
    participant Backend (System)
    
    Walk-In Customer->>Staff: Request a Table / Order Food
    Staff->>POS System (Frontend): Open `POS tại quầy`
    
    %% Choose Space & Duration
    alt Booking a Table
        Staff->>POS System (Frontend): Select Available Table
        Staff->>POS System (Frontend): Adjust rental duration (X hours)
        POS System (Frontend)->>Backend (System): Validate overlap
        Backend (System)-->>POS System (Frontend): OK
    end
    
    %% Order Items
    Staff->>POS System (Frontend): Add Menu Items & Services
    
    %% Create Order
    Staff->>POS System (Frontend): Review Invoice & Create Order
    POS System (Frontend)->>Backend (System): Process Order (WALK-IN)
    
    alt Paid via QR 
        Backend (System)-->>Staff: Provide PayOS QR
        Staff->>Walk-In Customer: Show QR Code
        Walk-In Customer->>Staff: Pay via Banking App
    else Cash Payment
        Walk-In Customer->>Staff: Hand Cash
        Staff->>POS System (Frontend): Click `Thanh toán tiền mặt`
    end
    
    %% Update System
    Backend (System)->>Backend (System): Update Order to PAID
    Backend (System)->>Backend (System): Update Table to OCCUPIED
    
    %% Service Fulfillment
    Staff->>Walk-In Customer: Guide to Table & Serve Items
    
    %% Completion
    Staff->>POS System (Frontend): Wait until items delivered
    Staff->>POS System (Frontend): Mark Order as `COMPLETED`
```

## 3. Post-service & Reporting (Admin)

```mermaid
sequenceDiagram
    autonumber
    
    actor Staff
    participant Backend (System)
    actor Admin
    
    %% End of occupancy
    Staff->>Backend (System): Walk-in duration ends / Customer requests bill
    Staff->>Backend (System): Mark Table as `CLEANING` or `AVAILABLE`
    
    %% Data Aggregation
    Backend (System)->>Backend (System): Calculate revenue margins
    
    %% Admin Analytics
    Admin->>Backend (System): Access Dashboard Analytics
    Backend (System)-->>Admin: Display Daily Revenue, Occupancy Rates
    Admin->>Backend (System): Manage Pricing / Menus / Roles
```
