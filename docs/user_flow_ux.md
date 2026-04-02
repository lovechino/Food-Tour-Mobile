# FoodTour AI — UX/UI Design & Technical Specification (Optimized)

Tài liệu này mô tả luồng trải nghiệm người dùng (UX) và kiến trúc kỹ thuật đã được tối ưu hóa sau giai đoạn review chuyên sâu. Mọi thay đổi nhằm mục đích giảm ma sát (friction), tăng độ tin cậy của dữ liệu và đảm bảo hiệu năng trên thiết bị di động.

---

## 1. Luồng Trải Nghiệm Người Dùng (User Flow)

### 1.1 Màn hình Chào mừng (Welcome Screen) — Giảm ma sát tối đa
Thay vì buộc người dùng chọn chế độ Online/Offline ngay từ đầu (gây quá tải nhận thức), app giờ đây tập trung vào việc định danh.
- **Lựa chọn:** Đăng nhập Google hoặc "Dùng không đăng nhập" (Guest Mode).
- **Mặc định:** Sau khi vào app, hệ thống luôn khởi chạy ở chế độ **Online** để người dùng có thể khám phá ngay lập tức (Explore First).
- **Loại bỏ:** Xóa bỏ "Intentional Friction" (ma sát cố ý) cũ. Không hiển thị tiến trình tải 100MB tại màn hình chào mừng.

### 1.2 Chế độ Khách (Guest Mode) — Chiến lược Upsell
Người dùng Guest có thể xem danh sách món ăn, tìm kiếm cơ bản nhưng sẽ gặp "Guard" tại các tính năng cần tài khoản:
- **AI Chat / Nearby / Offline Pack:** Khi bấm vào, một Bottom Sheet (LoginPromptModal) sẽ hiện ra giải thích lợi ích cụ thể (Contextual Benefit) thay vì chỉ báo lỗi.
- **Nudge:** Sau 3 phiên sử dụng, app sẽ hiển thị gợi ý đăng nhập nhẹ nhàng để bảo lưu dữ liệu.

### 1.3 Quản lý Chế độ (Mode Management) & Cài đặt (Settings)
Chế độ Offline giờ đây là một tính năng **Opt-in** trong phần Cài đặt (⚙️).
- **Vị trí:** Icon ⚙️ nằm tại Header của màn hình chính.
- **Tính năng:**
    - Thay đổi thành phố mặc định (áp dụng chung cho cả Online/Offline).
    - Tải/Xóa gói dữ liệu Offline (hiển thị tiến trình chi tiết).
    - Chuyển đổi thủ công Online ↔ Offline.

---

## 2. Kiến Trúc Kỹ Thuật & Tối Ưu

### 2.1 State Machine: AppPhaseReducer
Thay thế mô hình 3 boolean độc lập (`mode`, `isLoading`, `isDataReady`) dễ gây trạng thái lỗi (invalid states).
- **Phase tường minh:** `initializing` | `unauthenticated` | `online_ready` | `offline_downloading` | `offline_ready` | `error`.
- **Lợi ích:** Đảm bảo luồng điều hướng (Navigation) luôn đúng đắn, không bao giờ có màn hình trắng hoặc crash do state xung đột.

### 2.2 Tải Dữ liệu Offline: Resume-capable Download
Giải quyết vấn đề tải 100MB thất bại khi mạng yếu.
- **Cơ chế:** Sử dụng HTTP `Range` header để tải tiếp (resume) từ byte cuối cùng đã nhận.
- **Persistence:** Lưu trạng thái tải vào AsyncStorage để có thể tiếp tục ngay cả sau khi restart app.

### 2.3 Hiệu năng UI: Adaptive Rendering
- **Detection:** Tự động phát hiện thiết bị Android cấu hình thấp (RAM < 4GB).
- **Optimization:** Tắt hiệu ứng Blur (Glassmorphism) trên thiết bị yếu để giữ FPS ổn định (> 50 FPS), thay bằng semi-transparent overlay có visual tương đương.

### 2.4 Bảo mật & Dữ liệu
- **SQL Injection Prevention:** Chuyển toàn bộ câu lệnh SQLite sang dạng Parameterized Query (`?`).
- **Search Debounce:** Áp dụng delay 150ms cho ô tìm kiếm, tối ưu cho việc gõ tiếng Việt có dấu, giảm 80% tải lên SQLite/CPU.
- **401 Queueing:** Centralized API client giúp xử lý lỗi token hết hạn đồng thời cho nhiều request, chỉ điều hướng về màn hình Login đúng 1 lần.

---

## 3. Checklist Kiểm soát Chất lượng (QA)

| Tính năng | Tiêu chuẩn Đạt |
|---|---|
| **Welcome** | Vào thẳng Home Online sau < 2s login |
| **Guest** | Không thể gọi API Chat thành công (phải hiện Modal) |
| **Offline** | Ngắt mạng khi đang tải 50% -> Bật lại -> Tiếp tục từ 50% |
| **Search** | Gõ nhanh "phở bò" không gây giật lag khung hình |
| **Android Low-end** | Cuộn danh sách Glassmorphism mượt mà (> 55 FPS) |
| **City Store** | Đổi thành phố ở Settings -> Home phải cập nhật theo |
