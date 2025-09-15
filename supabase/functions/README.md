# Supabase Edge Functions

## Sepay Webhook Function

Edge Function này xử lý webhook từ Sepay khi khách hàng thực hiện thanh toán chuyển khoản.

### Cài đặt

1. **Cài đặt Supabase CLI:**
   ```bash
   npm install -g supabase
   ```

2. **Đăng nhập Supabase:**
   ```bash
   supabase login
   ```

3. **Liên kết với project:**
   ```bash
   supabase link --project-ref your-project-id
   ```

4. **Deploy function:**
   ```bash
   supabase functions deploy sepay-webhook
   ```

### Cấu hình

1. **Thiết lập biến môi trường trong Supabase Dashboard:**
   - Vào Settings > Edge Functions
   - Thêm các biến môi trường:
     - `SUPABASE_URL`: URL của project Supabase
     - `SUPABASE_SERVICE_ROLE_KEY`: Service role key
     - `TELEGRAM_BOT_TOKEN`: Token bot Telegram (tùy chọn)
     - `TELEGRAM_CHAT_ID`: Chat ID Telegram (tùy chọn)

2. **Cập nhật webhook URL trong Sepay:**
   - URL: `https://your-project-id.supabase.co/functions/v1/sepay-webhook`
   - Method: POST

### Chức năng

- Nhận webhook từ Sepay khi có giao dịch chuyển khoản
- Trích xuất mã đơn hàng từ nội dung chuyển khoản
- Kiểm tra và xác thực thông tin đơn hàng
- Cập nhật trạng thái đơn hàng thành 'confirmed'
- Gửi thông báo qua Telegram (nếu được cấu hình)

### Format nội dung chuyển khoản

Nội dung chuyển khoản phải chứa mã đơn hàng theo format:
- `RAN{orderCode}{timestamp}`
- Hoặc chứa UUID của đơn hàng

### Logs

Xem logs của function:
```bash
supabase functions logs sepay-webhook
```

### Test local

```bash
supabase functions serve sepay-webhook
```

Function sẽ chạy tại: `http://localhost:54321/functions/v1/sepay-webhook`