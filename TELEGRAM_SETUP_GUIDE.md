# Hướng Dẫn Cấu Hình Telegram Bot cho Thông Báo Ngân Hàng

## 🤖 Tạo Telegram Bot

### Bước 1: Tạo Bot với BotFather
1. Mở Telegram và tìm `@BotFather`
2. Gửi lệnh `/newbot`
3. Đặt tên cho bot (ví dụ: "RAN Restaurant Bank Notifications")
4. Đặt username cho bot (ví dụ: "ran_bank_notifications_bot")
5. Lưu lại **Bot Token** mà BotFather cung cấp

### Bước 2: Lấy Chat ID
1. Thêm bot vào group hoặc chat cá nhân
2. Gửi tin nhắn `/start` cho bot
3. Truy cập URL: `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates`
4. Tìm `chat.id` trong response JSON
5. Lưu lại **Chat ID**

## ⚙️ Cấu Hình Environment Variables

### Tạo file .env.local
Tạo file `.env.local` trong thư mục gốc của dự án với nội dung:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
BALANCE_NOTIFICATION_CHAT_ID=your_chat_id_here

# Ví dụ:
# TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
# BALANCE_NOTIFICATION_CHAT_ID=-1001234567890
```

### Cập nhật file .env (nếu có)
Thêm các biến môi trường vào file `.env` hiện có:

```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
BALANCE_NOTIFICATION_CHAT_ID=your_chat_id_here
```

## 🧪 Test Tính Năng

### Chạy Test Đơn Giản
```bash
npm run test:telegram:simple
```

### Chạy Test Đầy Đủ (sau khi cấu hình)
```bash
npm run test:telegram
```

## 📱 Các Loại Thông Báo

### 1. Thông Báo Tiền Vào
- Hiển thị khi có giao dịch tiền vào tài khoản
- Bao gồm: số tiền, ngân hàng, nội dung, mã giao dịch
- Tự động trích xuất mã đơn hàng (nếu có)

### 2. Thông Báo Tiền Ra
- Hiển thị khi có giao dịch tiền ra khỏi tài khoản
- Bao gồm: số tiền, ngân hàng, nội dung, mã giao dịch

### 3. Cảnh Báo Giao Dịch Bất Thường
- Tự động phát hiện giao dịch có số tiền lớn
- Bao gồm nút xác nhận/báo cáo

### 4. Báo Cáo Cuối Ngày
- Tổng hợp thu chi trong ngày
- Số lượng giao dịch
- Lãi/lỗ ròng

## 🔧 Tích Hợp với Webhook

### Sepay Webhook
Hệ thống đã được tích hợp với Sepay webhook trong:
- `src/utils/sepayService.ts`
- `src/utils/paymentService.ts`

### Bank Webhook Service
Service tổng quát cho các webhook ngân hàng:
- `src/utils/bankWebhookService.ts`
- `src/utils/telegramNotificationService.ts`

## 📋 Cấu Hình Template

Các template thông báo được cấu hình trong:
- `src/config/telegramNotificationConfig.ts`

Bạn có thể tùy chỉnh:
- Format tin nhắn
- Emoji
- Ngưỡng cảnh báo
- Từ khóa nghi ngờ

## 🚀 Triển Khai Production

### 1. Cấu hình Server
```bash
# Cài đặt dependencies
npm install

# Build project
npm run build

# Chạy production
npm start
```

### 2. Cấu hình Webhook
```bash
# Deploy webhook lên Supabase
npm run deploy:webhook
```

### 3. Kiểm tra Logs
- Kiểm tra console logs để debug
- Monitor Telegram bot activity
- Theo dõi webhook responses

## 🔍 Troubleshooting

### Lỗi 404 - Bot Token không hợp lệ
- Kiểm tra Bot Token trong .env
- Đảm bảo bot đã được tạo với BotFather

### Lỗi 400 - Chat ID không hợp lệ
- Kiểm tra Chat ID trong .env
- Đảm bảo bot đã được thêm vào chat/group

### Không nhận được thông báo
- Kiểm tra bot có quyền gửi tin nhắn
- Kiểm tra webhook đã được cấu hình đúng
- Xem logs để debug

### Test không hoạt động
- Đảm bảo đã cài đặt tsx: `npm install tsx --save-dev`
- Kiểm tra file .env đã được load đúng
- Chạy test với môi trường development

## 📞 Hỗ Trợ

Nếu gặp vấn đề, hãy kiểm tra:
1. File .env đã được cấu hình đúng
2. Bot token và chat ID hợp lệ
3. Webhook đã được deploy
4. Logs trong console để debug

---

**Lưu ý**: Đảm bảo không commit file .env vào git để bảo mật thông tin bot token.