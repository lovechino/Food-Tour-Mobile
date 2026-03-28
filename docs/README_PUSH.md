# Push Notification Setup Guide

## Tổng quan kiến trúc

```
[Firebase FCM] ← gửi token → [React Native App]
                                      ↓ POST /push/register
                              [Cloudflare Worker]
                                      ↓ lưu token
                              [Cloudflare D1]
                              
[Admin / Trigger] → POST /push/broadcast → [Cloudflare Worker]
                                                   ↓ FCM v1 API
                                            [Thiết bị người dùng]
```

---

## Bước 1: Tải `google-services.json` từ Firebase Console

Firebase project đã tồn tại: **PLACEHOLDER_FIREBASE_PROJECT_ID**

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Chọn project **PLACEHOLDER_FIREBASE_PROJECT_ID**
3. Vào **Project Settings** (biểu tượng ⚙️ bên cạnh "Project Overview")
4. Tab **"Your apps"** → Chọn app Android (hoặc tạo mới nếu chưa có)
   - Package name: `com.foodtourai`  
5. Nhấn **"Download google-services.json"**
6. Đặt file vào: `FoodTourAI/android/app/google-services.json`

> ⚠️ **QUAN TRỌNG**: File `google-services.json` đã được thêm vào `.gitignore`. KHÔNG commit file này lên GitHub.

---

## Bước 2: Kích hoạt FCM trong Firebase Console

1. Vào **Build → Cloud Messaging** trong Firebase Console
2. Đảm bảo **Firebase Cloud Messaging API (V1)** đang được bật
3. Nếu thấy "Cloud Messaging API (Legacy)" → Bật thêm V1

---

## Bước 3: Thêm Firebase Android App (nếu chưa có)

Nếu project Firebase chưa có Android app:
1. **Project Settings → Add app → Android**
2. Package name: `com.foodtourai`
3. App nickname: `FoodTourAI`
4. SHA-1: (tuỳ chọn, cần cho Google Sign-In)
5. Download `google-services.json`

---

## Bước 4: Verify Cloudflare Secrets

Đã upload 3 secrets vào Cloudflare Worker:

```bash
# Verify các secrets đã có
npx wrangler secret list
# Sẽ thấy: FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY
```

---

## API Endpoints (Backend đã live)

Base URL: `PLACEHOLDER_API_URL`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/push/register` | Đăng ký FCM token |
| DELETE | `/push/register` | Huỷ đăng ký token |
| POST | `/push/send` | Gửi tới user cụ thể |
| POST | `/push/send-direct` | Gửi theo token trực tiếp |
| POST | `/push/broadcast` | Gửi broadcast theo topic |
| GET | `/push/stats` | Xem thống kê tokens |

### Ví dụ gửi broadcast:
```bash
curl -X POST PLACEHOLDER_API_URL/push/broadcast \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "all",
    "title": "Hôm nay ăn gì?",
    "body": "Khám phá 10 quán ăn mới nhất tại Hà Nội!",
    "data": { "screen": "home" }
  }'
```

---

## Kiểm tra hoạt động

Sau khi build app và chạy trên thiết bị/emulator:

```bash
# Xem các tokens đã đăng ký
curl PLACEHOLDER_API_URL/push/stats

# Gửi test notification
curl -X POST PLACEHOLDER_API_URL/push/broadcast \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Hello FoodTour!"}'
```

---

## Files đã thay đổi

### Backend (cloudflare-backend)
- `src/core/fcm.ts` — FCM v1 API service (JWT auth via WebCrypto)
- `src/push.ts` — Hono router: register, send, broadcast, stats
- `src/index.ts` — Mount /push route
- `src/core/search.ts` — Thêm FCM env bindings
- `scripts/create_push_tokens.sql` — Migration bảng push_tokens
- `.gitignore` — Bảo vệ JSON keys

### Frontend (FoodTourAI)
- `services/pushService.ts` — FCM service: request permission, register token, listeners
- `App.tsx` — Tích hợp initPushNotifications (thay OneSignal)
- `android/build.gradle` — Thêm google-services classpath
- `android/app/build.gradle` — Apply google-services plugin

### Secrets đã upload
- `FCM_PROJECT_ID` = `PLACEHOLDER_FIREBASE_PROJECT_ID`
- `FCM_CLIENT_EMAIL` = `test-push@PLACEHOLDER_FIREBASE_PROJECT_ID.iam.gserviceaccount.com`
- `FCM_PRIVATE_KEY` = (private key từ service account)
