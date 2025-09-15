# 🔗 Hướng dẫn Tích hợp Webhook với Thông báo Telegram

## 📋 Tổng quan

Webhook sẽ tự động nhận thông tin giao dịch từ ngân hàng và gửi thông báo real-time đến Telegram group.

## 🏗️ Kiến trúc hệ thống

```
Ngân hàng → Webhook Endpoint → BankWebhookService → TelegramNotificationService → Telegram Group
```

## 🔧 Cài đặt Webhook

### 1. Cấu hình Endpoint

**URL Webhook**: `https://yourdomain.com/api/webhook/bank`

**Method**: `POST`

**Content-Type**: `application/json`

### 2. Tạo Webhook Handler

Tạo file `src/pages/api/webhook/bank.ts`:

```typescript
import { BankWebhookService } from '../../../utils/bankWebhookService';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate webhook signature (nếu có)
    const signature = req.headers['x-webhook-signature'];
    if (!BankWebhookService.validateSignature(req.body, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Xử lý webhook data
    const webhookData = req.body;
    await BankWebhookService.handleBankTransaction(webhookData);

    res.status(200).json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 3. Cấu hình BankWebhookService

File `src/utils/bankWebhookService.ts` đã được tạo với các tính năng:

```typescript
export class BankWebhookService {
  // Xử lý giao dịch từ webhook
  static async handleBankTransaction(data: BankTransactionData): Promise<void>
  
  // Validate webhook signature
  static validateSignature(payload: any, signature: string): boolean
  
  // Phân loại giao dịch
  static classifyTransaction(data: BankTransactionData): TransactionType
  
  // Tạo báo cáo cuối ngày
  static async generateDailySummary(): Promise<void>
}
```

## 📡 Cấu hình Webhook với Ngân hàng

### 1. Vietcombank

**Bước 1**: Đăng nhập VCB-iB@nking

**Bước 2**: Vào "Cài đặt" → "Thông báo"

**Bước 3**: Thêm Webhook URL:
```
https://yourdomain.com/api/webhook/bank
```

**Bước 4**: Chọn loại thông báo:
- ✅ Giao dịch tiền vào
- ✅ Giao dịch tiền ra
- ✅ Thay đổi số dư

### 2. Techcombank

**Bước 1**: Đăng nhập F@st Mobile Banking

**Bước 2**: "Cài đặt" → "API & Webhook"

**Bước 3**: Tạo Webhook mới:
```json
{
  "url": "https://yourdomain.com/api/webhook/bank",
  "events": ["transaction.created", "balance.updated"],
  "secret": "your-webhook-secret"
}
```

### 3. BIDV

**Bước 1**: Liên hệ BIDV Business để đăng ký

**Bước 2**: Cung cấp thông tin:
- URL endpoint
- IP whitelist
- Certificate (nếu cần)

## 📊 Format dữ liệu Webhook

### Dữ liệu nhận từ ngân hàng

```json
{
  "transactionId": "TXN123456789",
  "amount": 285000,
  "content": "NGUYEN VAN MINH chuyen tien DH001 thanh toan pho bo tai chin",
  "transactionDate": "2025-09-15T10:30:00Z",
  "bankName": "Vietcombank",
  "accountNumber": "9090190899999",
  "type": "money_in",
  "balance": 5285000,
  "signature": "webhook-signature"
}
```

### Dữ liệu gửi đến Telegram

```json
{
  "chat_id": "-4833394087",
  "text": "💰 <b>TIỀN VÀO</b>\n\n🏦 <b>Ngân hàng:</b> Vietcombank\n💵 <b>Số tiền:</b> 285.000 ₫\n📝 <b>Nội dung:</b> NGUYEN VAN MINH chuyen tien DH001 thanh toan pho bo tai chin\n🆔 <b>Mã GD:</b> TXN123456789\n⏰ <b>Thời gian:</b> 15/9/2025 17:30:00\n\n🔍 <b>Đơn hàng:</b> DH001\n\n📊 <i>Thông báo tự động từ hệ thống ngân hàng</i>",
  "parse_mode": "HTML"
}
```

## 🔄 Quy trình tự động

### 1. Nhận Webhook
```typescript
// Webhook endpoint nhận data
POST /api/webhook/bank
{
  "transactionId": "TXN123",
  "amount": 285000,
  "type": "money_in"
}
```

### 2. Xử lý và Phân loại
```typescript
// BankWebhookService xử lý
const transactionType = BankWebhookService.classifyTransaction(data);

switch (transactionType) {
  case 'order_payment':
    await TelegramNotificationService.sendOrderPaymentNotification(data);
    break;
  case 'suspicious':
    await TelegramNotificationService.sendSuspiciousTransactionAlert(data);
    break;
  case 'normal':
    await TelegramNotificationService.sendBalanceUpdateNotification(data);
    break;
}
```

### 3. Gửi Thông báo
```typescript
// TelegramNotificationService gửi message
const message = {
  chat_id: BALANCE_NOTIFICATION_CHAT_ID,
  text: formatMessage(data),
  parse_mode: 'HTML'
};

await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(message)
});
```

## 🛡️ Bảo mật Webhook

### 1. Signature Validation

```typescript
static validateSignature(payload: any, signature: string): boolean {
  const secret = process.env.WEBHOOK_SECRET;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

### 2. IP Whitelist

```typescript
const allowedIPs = [
  '203.162.71.0/24',  // Vietcombank
  '210.245.0.0/16',   // Techcombank
  '118.69.0.0/16'     // BIDV
];

function isIPAllowed(clientIP: string): boolean {
  return allowedIPs.some(range => ipInRange(clientIP, range));
}
```

### 3. Rate Limiting

```typescript
const rateLimit = {
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 requests
  message: 'Too many webhook requests'
};
```

## 📈 Monitoring và Logging

### 1. Webhook Logs

```typescript
class WebhookLogger {
  static logIncoming(data: any) {
    console.log(`[WEBHOOK] Received: ${JSON.stringify(data)}`);
  }
  
  static logProcessed(transactionId: string, success: boolean) {
    console.log(`[WEBHOOK] Processed ${transactionId}: ${success}`);
  }
  
  static logError(error: Error, data: any) {
    console.error(`[WEBHOOK] Error:`, error, data);
  }
}
```

### 2. Health Check

```typescript
// GET /api/webhook/health
export default function healthCheck(req: any, res: any) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    telegram: {
      bot_connected: true,
      last_message: '2025-09-15T10:30:00Z'
    }
  });
}
```

## 🧪 Test Webhook

### 1. Test Local

```bash
# Chạy server local
npm run dev

# Test webhook endpoint
curl -X POST http://localhost:5173/api/webhook/bank \
  -H "Content-Type: application/json" \
  -d '{
    "transactionId": "TEST123",
    "amount": 285000,
    "content": "Test transaction DH001",
    "transactionDate": "2025-09-15T10:30:00Z",
    "bankName": "Vietcombank",
    "accountNumber": "9090190899999",
    "type": "money_in"
  }'
```

### 2. Test Production

```bash
# Test với ngrok (để test từ ngân hàng)
ngrok http 5173

# URL sẽ là: https://abc123.ngrok.io/api/webhook/bank
```

### 3. Test Scripts

```bash
# Test trực tiếp Telegram
npm run test:telegram:direct

# Test webhook service
npm run test:webhook

# Test end-to-end
npm run test:e2e
```

## 🚀 Deploy Production

### 1. Environment Variables

```env
# Telegram
TELEGRAM_BOT_TOKEN=8019114116:AAGdPUMJI_ECNIRWm7ZtmPNd3MMUXb6ci_E
BALANCE_NOTIFICATION_CHAT_ID=-4833394087

# Webhook Security
WEBHOOK_SECRET=your-super-secret-key
ALLOWED_IPS=203.162.71.0/24,210.245.0.0/16

# Database
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-key
```

### 2. Deploy Commands

```bash
# Build project
npm run build

# Deploy to Vercel
vercel --prod

# Hoặc deploy to Netlify
netlify deploy --prod
```

### 3. SSL Certificate

Webhook endpoint PHẢI có HTTPS:
- ✅ Vercel: Tự động có SSL
- ✅ Netlify: Tự động có SSL
- ✅ Custom domain: Cần cấu hình SSL

## 📱 Kết quả

### Thông báo sẽ xuất hiện trong Telegram:

**💰 Tiền vào:**
```
💰 TIỀN VÀO

🏦 Ngân hàng: Vietcombank
💵 Số tiền: 285.000 ₫
📝 Nội dung: NGUYEN VAN MINH chuyen tien DH001 thanh toan pho bo tai chin
🆔 Mã GD: TXN123456789
⏰ Thời gian: 15/9/2025 17:30:00

🔍 Đơn hàng: DH001

📊 Thông báo tự động từ hệ thống ngân hàng
```

**🚨 Cảnh báo:**
```
🚨 CẢNH BÁO GIAO DỊCH BẤT THƯỜNG

🏦 Ngân hàng: Vietcombank
💰 Số tiền: 10.000.000 ₫
📝 Nội dung: TRAN THI HONG chuyen tien dau tu kinh doanh
🆔 Mã giao dịch: TXN987654321
⏰ Thời gian: 15/9/2025 23:45:00

⚠️ Vui lòng kiểm tra và xác nhận giao dịch này!

[✅ Xác nhận hợp lệ] [❌ Báo cáo bất thường]
```

## 🔧 Troubleshooting

### Lỗi thường gặp:

**1. Webhook không nhận được data**
```
❌ URL không đúng
✅ Kiểm tra: https://yourdomain.com/api/webhook/bank

❌ SSL certificate lỗi
✅ Đảm bảo HTTPS hoạt động

❌ Firewall chặn
✅ Whitelist IP ngân hàng
```

**2. Telegram không nhận thông báo**
```
❌ Bot token sai
✅ Kiểm tra TELEGRAM_BOT_TOKEN

❌ Chat ID sai
✅ Kiểm tra BALANCE_NOTIFICATION_CHAT_ID

❌ Bot chưa vào group
✅ Thêm bot vào group và cấp quyền
```

**3. Signature validation lỗi**
```
❌ Secret key sai
✅ Kiểm tra WEBHOOK_SECRET

❌ Algorithm không đúng
✅ Dùng HMAC-SHA256
```

### Debug Commands:

```bash
# Kiểm tra webhook endpoint
curl -I https://yourdomain.com/api/webhook/bank

# Test Telegram bot
curl "https://api.telegram.org/bot${BOT_TOKEN}/getMe"

# Xem logs real-time
tail -f logs/webhook.log
```

## 📞 Hỗ trợ

- **Telegram Group**: `-4833394087`
- **Bot Token**: `8019114116:AAGdPUMJI_ECNIRWm7ZtmPNd3MMUXb6ci_E`
- **Webhook URL**: `https://yourdomain.com/api/webhook/bank`
- **Documentation**: Xem các file hướng dẫn khác

---

**✅ Hệ thống đã sẵn sàng nhận webhook và gửi thông báo tự động!**

**Cập nhật cuối**: 15/09/2025  
**Version**: 1.0.0