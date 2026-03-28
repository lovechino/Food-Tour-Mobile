# 🔐 Hướng Dẫn Cài Đặt Google Sign-In

## Tổng Quan Các File Đã Thêm/Sửa

| File | Trạng thái | Mô tả |
|------|-----------|-------|
| `services/authService.ts` | **MỚI** | Service gọi API `/auth/google`, lưu JWT, đọc token từ storage |
| `contexts/AuthContext.tsx` | **MỚI** | Context quản lý trạng thái auth toàn app |
| `screens/WelcomeScreen.tsx` | **SỬA** | Thêm nút "Đăng nhập bằng Google" + "Dùng không đăng nhập" |
| `App.tsx` | **SỬA** | Bọc `AuthProvider`, cấu hình `GoogleSignin.configure()` |

---

## Bước 1: Cài đặt thư viện Google Sign-In

```bash
cd e:\Full_Source_Food_Tour\FoodTourAI
npm install @react-native-google-signin/google-signin
```

iOS (nếu cần):
```bash
cd ios && pod install && cd ..
```

---

## Bước 2: Tạo OAuth Client ID trên Google Cloud Console

1. Vào [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Tạo **OAuth 2.0 Client ID** loại **Web application** → Lấy `Client ID` (dạng `xxxx.apps.googleusercontent.com`)
3. Tạo **OAuth 2.0 Client ID** loại **Android** → Điền SHA-1 fingerprint
4. (iOS) Tạo thêm Client ID loại **iOS**

---

## Bước 3: Cấu hình trong code

### 3a. App.tsx — Điền Web Client ID

Mở file `App.tsx`, tìm dòng:
```typescript
GoogleSignin.configure({
    webClientId: '', // TODO: Điền Web Client ID từ Google Cloud Console
```

Thay `''` bằng Web Client ID vừa tạo:
```typescript
webClientId: 'your-web-client-id.apps.googleusercontent.com',
```

### 3b. Backend — Điền Google Client ID

Trên Cloudflare Workers, set secret:
```bash
wrangler secret put GOOGLE_CLIENT_ID
# Nhập vào: your-web-client-id.apps.googleusercontent.com
```

---

## Bước 4: Cấu hình Android

Thêm SHA-1 fingerprint vào Google Cloud Console:
```bash
cd android
./gradlew signingReport
```

Lấy SHA-1 từ output và dán vào OAuth Client ID (Android) trên Google Cloud Console.

---

## Luồng Hoạt Động

```
User nhấn "Đăng nhập bằng Google"
    ↓
GoogleSignin.signIn() → Popup chọn tài khoản Google
    ↓
Lấy idToken từ Google
    ↓
Gửi idToken lên POST /auth/google (Cloudflare Backend)
    ↓
Backend verify token → Tạo JWT (7 ngày)
    ↓
App lưu JWT + user info vào AsyncStorage
    ↓
AuthContext cập nhật isLoggedIn = true
    ↓
User chọn Online/Offline mode như bình thường
```

---

## Sử Dụng Auth Trong Các Screen Khác

```typescript
import { useAuth } from '../contexts/AuthContext';

function SomeScreen() {
    const { user, isLoggedIn, isGuest, logout } = useAuth();

    if (isLoggedIn) {
        // Hiển thị avatar, tên user
        console.log(user.name, user.email, user.picture);
    }

    if (isGuest) {
        // Hiển thị gợi ý đăng nhập
    }
}
```

## Gửi Auth Header Khi Gọi API

```typescript
import { getAuthHeader } from '../services/authService';

const headers = await getAuthHeader();
// headers = { 'Authorization': 'Bearer xxx' } nếu đã đăng nhập
// headers = {} nếu chưa đăng nhập

fetch(`${API_BASE_URL}/some-endpoint`, {
    headers: { 'Content-Type': 'application/json', ...headers },
});
```
