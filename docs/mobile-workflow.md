# FoodTour AI — Mobile App Workflow (Final Optimized)

Tài liệu này mô tả chi tiết luồng vận hành kỹ thuật (Technical Workflow) của ứng dụng FoodTourAI, tập trung vào sự ổn định của State Machine, cơ chế Sync dữ liệu và các chốt chặn bảo mật.

---

## 1. Root Architecture & Lifecycle

Mọi logic ứng dụng được quản lý thông qua hệ thống Provider phân lớp tại `App.tsx`:

```tsx
<SafeAreaProvider>
  <AuthProvider>           // Quản lý Token, Guest Permissions, Upsell Tracking
    <AppPhaseProvider>     // State Machine chủ đạo (AppPhaseReducer)
      <ThemeProvider>      // Dark/Light mode, Adaptive Styles
        <ChatProvider>     // Local Chat History
          <RootNavigator /> // Navigation dựa trên AppPhase
          <GlobalToast />   // Thông báo toàn cục
        </ChatProvider>
      </ThemeProvider>
    </AppPhaseProvider>
  </AuthProvider>
</SafeAreaProvider>
```

### Khởi tạo App (Init Flow):
1. **Device Detection:** Gọi `detectLowEndDevice()` để xác định năng lực xử lý GPU (RAM < 4GB).
2. **Auth Restore:** `AuthProvider` kiểm tra Keychain/AsyncStorage để khôi phục session.
3. **Phase Sync:** `AppPhaseProvider` xác định trạng thái khởi đầu (`online_ready` hoặc `unauthenticated`).

---

## 2. State Machine: AppPhase Logic

Thay vì dùng nhiều biến state rời rạc, app sử dụng **Discriminated Union** để quản lý trạng thái:

| Phase | Ý nghĩa | Màn hình hiển thị |
|---|---|---|
| `initializing` | Đang đọc dữ liệu từ bộ nhớ bền vững | SplashScreen / ActivityIndicator |
| `unauthenticated` | User chưa login hoặc session hết hạn | WelcomeScreen |
| `online_ready` | Đang dùng API server (Mặc định) | MainTabs (Online Mode) |
| `offline_downloading` | Đang tải gói dữ liệu thành phố | MainTabs + Download Overlay |
| `offline_ready` | Đang dùng SQLite & ONNX nội bộ | MainTabs (Offline Mode) |
| `error` | Lỗi mạng, bộ nhớ đầy hoặc Auth | ErrorView với Recovery Path |

---

## 3. Network & Security Workflow

### 3.1 Centralized API Client (`apiClient.ts`)
Tất cả request đi qua một client tập trung để xử lý:
- **Auth Headers:** Tự động kẹp Bearer token từ `authService`.
- **401 Handling:** Khi token hết hạn, client kẹp tất cả request đang chạy vào một **Queue**, thực hiện Logout và điều hướng về Welcome đúng một lần duy nhất.
- **Base Routing:** Sử dụng `react-native-config` để quản lý URL theo môi trường (Dev/Prod).

### 3.2 SQL Injection & Offline Data
- **Parameterized Queries:** Mọi lệnh tìm kiếm SQLite đều sử dụng `?` placeholder (VD: `WHERE name LIKE ?`).
- **Search Optimization:** Debounce 150ms giúp giảm query churn. Min-length 2 ký tự giúp tránh query vô nghĩa khi người dùng bắt đầu gõ tiếng Việt.

---

## 4. Offline Data Management

### 4.1 Resume-capable Download
Khi người dùng tải gói thành phố (~100MB):
1. App kiểm tra dung lượng trống (Yêu cầu > 120MB).
2. Gọi `downloadWithResume` từ `downloadService`.
3. Nếu gián đoạn (mất mạng/thoát app): Lưu `downloadedBytes` vào AsyncStorage.
4. Khi chạy lại: Sử dụng Header `Range: bytes=X-` để tải tiếp phần còn thiếu.

### 4.2 City Persistence
Thông tin thành phố hiện tại (`@preferred_city`) được đồng bộ giữa:
- **Online Mode:** Dùng để filter dữ liệu Explore từ API.
- **Offline Mode:** Dùng để chọn file SQLite/Vectors tương ứng.
- **Settings:** Nơi duy nhất thay đổi city preference này.

---

## 5. UI/UX Consistency Standards

- **Adaptive Blur:** `GlassmorphismCard` sẽ tự động fallback sang semi-transparent background trên các GPU Mali cũ (Android low-end) để đảm bảo cuộn mượt 60 FPS.
- **Microcopy:** Tuân thủ nguyên tắc "Benefit-first". Thay vì báo lỗi "Cần tải dữ liệu", app hiển thị "Tải gói Offline để dùng mọi lúc mọi nơi".
- **Interaction Manager:** Các tác vụ nặng (như parse JSON lớn hoặc load SQLite) luôn được bọc trong `InteractionManager.runAfterInteractions` để không gây giật lag animation chuyển cảnh.

---

## 6. API Error Mapping

| Mã lỗi | Trạng thái Phase | Xử lý |
|---|---|---|
| **401** | `unauthenticated` | Redirect về Welcome |
| **403** | `online_ready` | Hiện Modal yêu cầu Auth (Upsell) |
| **5xx / Network** | `error` | Hiện nút "Thử lại" (Retry logic) |
| **Disk Full** | `error` | Hướng dẫn mở Cài đặt Bộ nhớ (Deep link) |
