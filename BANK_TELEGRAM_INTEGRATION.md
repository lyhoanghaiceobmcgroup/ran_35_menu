# 🏦 Tích hợp Thông báo Ngân hàng qua Telegram

## 📋 Tổng quan

Hệ thống tự động gửi thông báo về các giao dịch ngân hàng đến Telegram group khi có biến động số dư.

## 🔧 Cấu hình đã hoàn thành

### 1. Bot Token và Group ID
- **Bot Token**: `8019114116:AAGdPUMJI_ECNIRWm7ZtmPNd3MMUXb6ci_E`
- **Group ID**: `-4833394087`
- **Trạng thái**: ✅ Đã test thành công

### 2. Environment Variables
```env
# Telegram Bank Notifications
TELEGRAM_BOT_TOKEN=8019114116:AAGdPUMJI_ECNIRWm7ZtmPNd3MMUXb6ci_E
BALANCE_NOTIFICATION_CHAT_ID=-4833394087
```

### 3. Files đã tạo/cập nhật
- ✅ `src/utils/telegramNotificationService.ts` - Service chính
- ✅ `src/utils/bankWebhookService.ts` - Xử lý webhook ngân hàng
- ✅ `src/test/directTelegramTest.ts` - Test trực tiếp
- ✅ `.env` - Cấu hình môi trường
- ✅ `package.json` - Scripts test

## 🚀 Cách sử dụng

### Test thông báo
```bash
# Test trực tiếp Telegram (đã hoạt động)
npm run test:telegram:direct

# Test đơn giản
npm run test:telegram:simple
```

### Tích hợp với webhook ngân hàng
```typescript
import { BankWebhookService } from './utils/bankWebhookService';

// Khi nhận webhook từ ngân hàng
const webhookData = {
  transactionId: 'TXN123456',
  amount: 285000,
  content: 'NGUYEN VAN MINH chuyen tien DH001 thanh toan pho bo',
  transactionDate: new Date().toISOString(),
  bankName: 'Vietcombank',
  accountNumber: '9090190899999',
  type: 'money_in'
};

// Gửi thông báo tự động
await BankWebhookService.handleBankTransaction(webhookData);
```

## 📱 Các loại thông báo

### 1. Thông báo tiền vào (💰)
- Hiển thị thông tin giao dịch
- Tự động nhận diện mã đơn hàng
- Format tiền tệ VND

### 2. Thông báo tiền ra (💸)
- Cảnh báo khi có tiền ra
- Hiển thị địa điểm rút tiền (ATM)
- Theo dõi chi tiêu

### 3. Cảnh báo giao dịch bất thường (🚨)
- Giao dịch số tiền lớn (>5 triệu)
- Giao dịch ngoài giờ làm việc
- Nút xác nhận/báo cáo

### 4. Báo cáo cuối ngày (📊)
- Tổng thu/chi trong ngày
- Số lượng giao dịch
- Lãi/lỗ ròng

### 5. Thông báo đơn hàng (🍽️)
- Tự động nhận diện mã đơn hàng
- Liên kết với hệ thống POS
- Xác nhận thanh toán

## 🔄 Quy trình hoạt động

1. **Webhook ngân hàng** → Nhận thông tin giao dịch
2. **BankWebhookService** → Xử lý và phân loại
3. **TelegramNotificationService** → Format message
4. **Telegram API** → Gửi đến group
5. **Group nhận thông báo** → Theo dõi real-time

## 🛠️ Tùy chỉnh

### Thay đổi template thông báo
Chỉnh sửa trong `src/utils/telegramNotificationService.ts`:

```typescript
// Tùy chỉnh template tiền vào
const messageText = `💰 <b>TIỀN VÀO</b>\n\n` +
  `🏦 <b>Ngân hàng:</b> ${bankName}\n` +
  `💵 <b>Số tiền:</b> ${amountFormatted}\n` +
  // Thêm các trường khác...
```

### Thêm điều kiện cảnh báo
```typescript
// Trong BankWebhookService
if (amount > 10000000) { // 10 triệu
  await TelegramNotificationService.sendSuspiciousTransactionAlert(data);
}
```

### Thay đổi group nhận thông báo
```env
# Cho từng loại thông báo khác nhau
BALANCE_NOTIFICATION_CHAT_ID=-4833394087  # Group chính
ORDER_NOTIFICATION_CHAT_ID=-4852894219    # Group đơn hàng
ALERT_NOTIFICATION_CHAT_ID=-4833394088    # Group cảnh báo
```

## 📈 Monitoring và Analytics

### Theo dõi hiệu suất
- Message delivery rate
- Response time
- Error tracking

### Báo cáo định kỳ
- Hàng ngày: Tổng hợp giao dịch
- Hàng tuần: Xu hướng doanh thu
- Hàng tháng: Phân tích chi tiết

## 🔒 Bảo mật

### Best Practices
- ✅ Bot token được lưu trong environment variables
- ✅ Không hardcode sensitive data
- ✅ Validate webhook signature
- ✅ Rate limiting cho API calls

### Quyền truy cập
- Bot chỉ có quyền gửi message
- Group private, chỉ admin mời
- Log tất cả hoạt động

## 🚨 Troubleshooting

### Lỗi thường gặp

**404 Not Found**
```
❌ Bot chưa được thêm vào group
✅ Thêm bot vào group và cấp quyền admin
```

**403 Forbidden**
```
❌ Bot bị chặn hoặc không có quyền
✅ Kiểm tra quyền bot trong group settings
```

**400 Bad Request**
```
❌ Message format không hợp lệ
✅ Kiểm tra HTML tags và special characters
```

### Debug commands
```bash
# Test kết nối
npm run test:telegram:direct

# Kiểm tra logs
tail -f logs/telegram.log

# Validate webhook
curl -X POST localhost:3000/webhook/bank -d '{...}'
```

## 📞 Hỗ trợ

- **Telegram Group**: Kiểm tra thông báo trong group `-4833394087`
- **Bot Username**: Liên hệ @YourBankBot
- **Documentation**: Xem file `TELEGRAM_SETUP_GUIDE.md`

---

**Trạng thái**: ✅ Hoạt động bình thường  
**Cập nhật cuối**: 15/09/2025  
**Version**: 1.0.0