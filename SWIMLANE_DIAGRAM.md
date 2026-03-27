# Coworking Space Manager - Main Workflows

Tài liệu này tổng hợp 3 luồng nghiệp vụ (Workflow) chính nhất của hệ thống, được vẽ dưới dạng **Swimlane Flowchart** giúp mô phỏng chân thực sự tương tác chéo giữa các bên: Khách hàng, Hệ thống, Cổng thanh toán, và Nhân viên.

---

## 1. Luồng Đặt Bàn & Đặt Món Online (Customer Booking)

Mô tả luồng từ lúc khách hàng tìm kiếm chỗ ngồi trên web, chọn giờ thuê, thanh toán qua cổng PayOS và kết thúc với việc hệ thống xác nhận.

```mermaid
flowchart LR
    %%{init: {"flowchart": {"curve": "basis", "padding": 20}, "theme": "default"}}%%

    subgraph Customer ["👤 CUSTOMER"]
        direction LR
        C1(Truy cập danh sách Không gian)
        C2(Chọn Bàn & Giờ thuê)
        C3(Thêm Trà/Cafe/Món ăn)
        C4(Tạo Đơn Hàng)
        C5(Thanh toán QR PayOS)
        C6([Nhận thông báo Thành công & Mã Booking])
    end

    subgraph System ["⚙️ BACKEND SYSTEM"]
        direction LR
        S1(Kiểm tra Overlap lịch đặt)
        S2(Khởi tạo Đơn hàng PENDING)
        S3(Verify Webhook PayOS)
        S4(Đổi trạng thái thành PAID/CONFIRMED)
        S5(Gửi Email xác nhận cho Khách)
    end

    subgraph PayOS ["💳 PAYOS"]
        direction LR
        P1(Khởi tạo Link Thanh Toán)
        P2(Xử lý giao dịch ngân hàng)
        P3(Gửi Webhook về System)
    end

    C1 --> C2 --> C3 --> C4
    C4 --> S1
    S1 --> S2
    S2 --> P1
    P1 --> C5
    C5 --> P2
    P2 --> P3
    P3 --> S3
    S3 --> S4
    S4 --> S5
    S5 --> C6

    classDef curr fill:#fefce8,stroke:#ca8a04,stroke-width:2px;
    classDef sys fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,stroke-dasharray: 4 4;
    classDef pay fill:#dcfce7,stroke:#16a34a,stroke-width:2px;
    
    class C1,C2,C3,C4,C5,C6 curr;
    class S1,S2,S3,S4,S5 sys;
    class P1,P2,P3 pay;
```

---

## 2. Luồng Khách Vãng Lai & Màn Hình POS (Walk-in & In-Store Ordering)

Mô tả luồng khi khách vãng lai đi thẳng tới chi nhánh, nhân viên tiếp tân dùng giao diện POS để thao tác xếp bàn và đặt đồ ăn.

```mermaid
flowchart LR
    %%{init: {"flowchart": {"curve": "basis", "padding": 20}, "theme": "default"}}%%

    subgraph Walkin ["🚶 WALK-IN CUSTOMER"]
        direction LR
        W1([Đến hỏi Lễ tân thuê bàn])
        W2(Yêu cầu Bàn + Chọn Món)
        W3(Quét mã QR PayOS / Đưa Tiền Mặt)
        W4([Nhận chỗ và sử dụng đồ ăn])
    end

    subgraph Staff ["🧑‍💼 STAFF POS"]
        direction LR
        T1(Mở giao diện POS)
        T2(Chọn Bàn còn trống)
        T3(Thêm món ăn vào Hóa đơn)
        T4(Chọn Thanh toán QR hoặc Tiền mặt)
        T5(Đưa QR / Nhận Tiền & Xác nhận Hoàn thành)
        T6(Giao đồ ăn đến Bàn)
    end

    subgraph System ["⚙️ BACKEND SYSTEM"]
        direction LR
        S1(Kiểm tra trùng lịch đặt trước mặt khác)
        S2(Khởi tạo đơn Walk-In)
        S3(Tạo Link PayOS cho Hóa Đơn)
        S4(Đổi trạng thái Đơn = PAID, Bàn = OCCUPIED)
    end

    subgraph PayOS ["💳 PAYOS"]
        direction LR
        P1(Tạo QR Code ảo)
        P2(Xử lý webhook)
    end

    W1 --> W2
    W2 --> T1
    T1 --> T2 --> T3 --> T4
    T4 --> S1
    S1 --> S2

    %% Tẽ nhánh thanh toán
    S2 --> S3
    S3 --> P1
    P1 --> T5
    T5 --> W3
    W3 --> P2
    P2 --> S4
    
    %% Trả kết quả
    S4 --> T6
    T6 --> W4

    classDef cust fill:#ffedd5,stroke:#c2410c,stroke-width:2px;
    classDef staff fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
    classDef sys fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,stroke-dasharray: 4 4;
    classDef pay fill:#dcfce7,stroke:#16a34a,stroke-width:2px;
    
    class W1,W2,W3,W4 cust;
    class T1,T2,T3,T4,T5,T6 staff;
    class S1,S2,S3,S4 sys;
    class P1,P2 pay;
```

---

## 3. Luồng Check-in, Sử dụng & Trả Bàn (Table Session Lifecycle)

Mô tả vòng đời của một bàn từ lúc khách tới Check-in theo lịch đã đặt (hoặc Walk-in), gọi thêm món, quản lý thời gian, cho tới lúc trả bàn.

```mermaid
flowchart LR
    %%{init: {"flowchart": {"curve": "basis", "padding": 20}, "theme": "default"}}%%

    subgraph Customer ["👤 CUSTOMER"]
        direction LR
        C1([Tới Check-in đúng giờ đặt])
        C2(Trải nghiệm Dịch vụ / Ngồi làm việc)
        C3(Gọi Menu/Thức uống phụ sinh)
        C4([Trả bàn khi hết giờ])
    end

    subgraph System ["⚙️ BACKEND SYSTEM"]
        direction LR
        S1(Kiểm tra mã vé hợp lệ)
        S2(Khởi tạo Timer / Thời lượng thuê)
        S3(Gửi thông báo Hết Giờ 15p)
        S4(Kết nối POS với Tài khoản Khách)
        S5(Đổi Bàn thành Trống - AVAILABLE)
    end

    subgraph Staff ["🧑‍💼 STAFF / SEAT MAP"]
        direction LR
        T1(Dùng máy Scan / Nhập mã)
        T2(Xác nhận Check-In trên Seat Map)
        T3(Update Status = OCCUPIED)
        T4(Lên đơn phụ sinh qua màn hình Staff POS)
        T5(Quản lý Order nấu ăn & Giao lên bàn)
        T6(Verify Bàn, Cập nhật trạng thái = TRỐNG)
    end

    C1 --> T1
    T1 --> S1
    S1 --> T2
    T2 --> T3
    T3 --> S2
    S2 --> C2
    C2 --> C3
    
    %% Order phụ trợ
    C3 --> T4
    T4 --> S4
    S4 --> T5
    T5 --> C2
    
    %% Hết giờ 
    S2 -. "Đếm lùi thời gian" .-> S3
    S3 --> C4
    C4 --> T6
    T6 --> S5

    classDef cust fill:#fefce8,stroke:#ca8a04,stroke-width:2px;
    classDef staff fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
    classDef sys fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,stroke-dasharray: 4 4;
    
    class C1,C2,C3,C4 cust;
    class T1,T2,T3,T4,T5,T6 staff;
    class S1,S2,S3,S4,S5 sys;
```
