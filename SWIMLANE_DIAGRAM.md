# Main Workflow - Swimlane Diagram

Dưới đây là sơ đồ luồng nghiệp vụ (Workflow) chính của hệ thống Coworking Space Manager, được thiết kế chuẩn theo định dạng **Swimlane Flowchart**. Các hàng (lane) đại diện cho các tác nhân/hệ thống, và quy trình chạy từ trái sang phải.

```mermaid
flowchart LR
    %% Căn chỉnh giao diện: Các đường cong, màu sắc nhẹ nhàng
    %%{init: {"flowchart": {"curve": "basis", "padding": 20}, "theme": "default"}}%%

    %% ==========================================
    %% SWIMLANE 1: CUSTOMER (Khách hàng)
    %% ==========================================
    subgraph Customer [👤 CUSTOMER]
        direction LR
        C1([Bắt đầu: Truy cập web])
        C2(Chọn Bàn & Giờ thuê)
        C3(Thêm Dịch vụ/Món ăn)
        C4(Tiến hành thanh toán)
        C5(Quét mã QR PayOS)
        C6([Đến chi nhánh, đưa mã QR])
    end

    %% ==========================================
    %% SWIMLANE 2: SYSTEM (Hệ thống Backend)
    %% ==========================================
    subgraph System [⚙️ SYSTEM (Backend)]
        direction LR
        S1(Xác thực tài khoản)
        S2(Kiểm tra chỗ trống thời gian thực)
        S3(Lưu Đơn hàng & Booking PENDING)
        S4(Gửi request thanh toán tới PayOS)
        S5(Nhận Webhook & Trạng thái PAID)
        S6(Gửi Email/Thông báo xác nhận)
        S7(Xác thực QR Booking hợp lệ)
        S8(Tự động tính giờ & Hết hạn)
    end

    %% ==========================================
    %% SWIMLANE 3: STAFF / ADMIN (Nhân viên)
    %% ==========================================
    subgraph Staff [🧑‍💼 STAFF / Màn hình POS]
        direction LR
        T1(Quét QR của Khách)
        T2(Xác nhận Check-in bàn)
        T3([Phục vụ món ăn/dịch vụ])
        T4(Thêm Order phát sinh tại POS)
        T5(Đổi trạng thái "Đã hoàn thành")
        T6([Khách trả bàn, dọn dẹp])
    end

    %% ==========================================
    %% LUỒNG CHUYỂN GIAO (FLOW)
    %% ==========================================
    
    %% Quy trình Đặt bàn (Online)
    C1 --> S1
    S1 --> C2
    C2 --> S2
    S2 --> C3
    C3 --> C4
    C4 --> S3
    S3 --> S4
    
    %% Thanh toán
    S4 --> C5
    C5 --> S5
    S5 --> S6
    
    %% Quy trình Check-in
    S6 --> C6
    C6 --> T1
    T1 --> S7
    S7 --> T2
    
    %% Quy trình Sử dụng & Phục vụ
    T2 --> T3
    T3 --> T4
    T4 --> S8
    S8 --> T5
    T5 --> T6

    %% ==========================================
    %% STYLING TÙY CHỈNH
    %% ==========================================
    classDef curr fill:#fefce8,stroke:#ca8a04,stroke-width:2px;
    classDef sys fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,stroke-dasharray: 4 4;
    classDef stf fill:#eff6ff,stroke:#3b82f6,stroke-width:2px;
    
    class C1,C2,C3,C4,C5,C6 curr;
    class S1,S2,S3,S4,S5,S6,S7,S8 sys;
    class T1,T2,T3,T4,T5,T6 stf;
```

### Chú thích biểu đồ:
- **Cột (Flow từ trái sang phải)** đại diện cho các bước theo thời gian thực (Time flow).
- **Hàng (Swimlane theo chiều dọc)**:
  1. `CUSTOMER`: Quy trình thao tác của khách hàng từ lúc chọn bàn đến lúc tới quầy.
  2. `SYSTEM`: Hệ thống thực thi ngầm (Kiểm tra dữ liệu, lưu Database, nhận Webhook).
  3. `STAFF`: Các nghiệp vụ trực tiếp tại quán (Quét mã, Check-in, giao đồ ăn/dịch vụ, tạo Order phát sinh).
