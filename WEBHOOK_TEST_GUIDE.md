# Hướng Dẫn Test Webhook Sepay

## ✅ Webhook đã được thiết lập thành công!

Webhook Sepay đã được cấu hình và test thành công. Dưới đây là thông tin chi tiết:

### 🔗 Thông tin Webhook
- **URL**: `https://tiaosohnkcpzxszphpqs.supabase.co/functions/v1/sepay-webhook`
- **Method**: POST
- **Content-Type**: application/json

### 📋 Cấu trúc dữ liệu webhook từ Sepay

```json
{
  "id": "TXN123456789",
  "gateway": "sepay",
  "transactionDate": "2025-01-13 18:30:00",
  "accountNumber": "0848905555",
  "subAccount": null,
  "amountIn": 239000,
  "amountOut": 0,
  "accumulated": 5000000,
  "code": "SUCCESS",
  "content": "Thanh toan don hang 27fa7f2a-4af1-4237-979e-04cff8afff31",
  "referenceCode": "TEST123",
  "description": "Payment for order",
  "transferType": "in",
  "transferAmount": 239000,
  "bankAccount": "0848905555",
  "bankSubAccount": null,
  "bankName": "MB Bank"
}
```

### 🎯 Cách webhook hoạt động

1. **Nhận dữ liệu**: Webhook nhận dữ liệu từ Sepay khi có giao dịch chuyển khoản
2. **Trích xuất Order ID**: Tìm UUID của order trong trường `content`
3. **Tìm kiếm order**: Tìm order trong database với status `pending`
4. **Xác minh số tiền**: So sánh số tiền chuyển khoản với tổng tiền order
5. **Cập nhật order**: Cập nhật status thành `confirmed` và payment_status thành `confirmed`

### 🧪 Test thủ công webhook

Bạn có thể test webhook bằng PowerShell:

```powershell
# Test webhook
$headers = @{
    'Authorization' = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpYW9zb2hua2NwenhzenBocHFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NzY3NjYsImV4cCI6MjA3MzM1Mjc2Nn0.wyWLAHN-oJXFGRhsr_q3pNcgyWuW_GWYpvsXB2obLVc'
    'Content-Type' = 'application/json'
}

$webhookData = @{
    id = 'TXN123456789'
    gateway = 'sepay'
    transactionDate = '2025-01-13 18:30:00'
    accountNumber = '0848905555'
    subAccount = $null
    amountIn = 239000
    amountOut = 0
    accumulated = 5000000
    code = 'SUCCESS'
    content = 'Thanh toan don hang [ORDER_ID_HERE]'  # Thay [ORDER_ID_HERE] bằng ID order thực
    referenceCode = 'TEST123'
    description = 'Payment for order'
    transferType = 'in'
    transferAmount = 239000  # Phải khớp với total_amount của order
    bankAccount = '0848905555'
    bankSubAccount = $null
    bankName = 'MB Bank'
} | ConvertTo-Json

Invoke-WebRequest -Uri 'https://tiaosohnkcpzxszphpqs.supabase.co/functions/v1/sepay-webhook' -Method POST -Headers $headers -Body $webhookData
```

### ✅ Kết quả test thành công

**Test case**: Order ID `27fa7f2a-4af1-4237-979e-04cff8afff31`
- ✅ Webhook response: `{"success":true,"message":"Payment confirmed successfully","orderId":"27fa7f2a-4af1-4237-979e-04cff8afff31","transactionId":"TXN123456789"}`
- ✅ Order status: `pending` → `confirmed`
- ✅ Payment status: `pending` → `confirmed`
- ✅ Payment method: `null` → `bank_transfer`
- ✅ Payment amount: `null` → `239000.00`

### 🔧 Cấu hình Sepay

Trong dashboard Sepay, cấu hình webhook URL:
```
https://tiaosohnkcpzxszphpqs.supabase.co/functions/v1/sepay-webhook
```

### 📝 Lưu ý quan trọng

1. **Format nội dung chuyển khoản**: Khách hàng cần ghi rõ Order ID trong nội dung chuyển khoản
2. **Số tiền**: Phải khớp chính xác với tổng tiền order (cho phép sai lệch 1 VND)
3. **Order status**: Chỉ xử lý các order có status `pending`
4. **Security**: Webhook sử dụng Bearer token để xác thực

### 🚀 Webhook đã sẵn sàng sử dụng!

Hệ thống webhook Sepay đã được thiết lập và test thành công. Khi khách hàng chuyển khoản với nội dung chứa Order ID, hệ thống sẽ tự động xác nhận thanh toán và cập nhật trạng thái order.