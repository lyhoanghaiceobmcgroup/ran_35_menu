import { OrderService } from './orderService';

// Sepay API Configuration
// Cần cấu hình trong file .env:
// VITE_SEPAY_API_KEY=your_sepay_api_key
// VITE_SEPAY_WEBHOOK_URL=your_webhook_endpoint

interface SepayWebhookData {
  id: number;                    // ID giao dịch trên SePay
  gateway: string;               // Tên ngân hàng (VCB, TPBank, etc.)
  transactionDate: string;       // Thời gian giao dịch
  accountNumber: string;         // Số tài khoản ngân hàng
  code: string | null;          // Mã code thanh toán (SePay tự nhận diện)
  content: string;              // Nội dung chuyển khoản
  transferType: 'in' | 'out';   // Loại giao dịch: "in" là tiền vào, "out" là tiền ra
  transferAmount: number;        // Số tiền giao dịch
  accumulated: number;           // Số dư tài khoản (lũy kế)
  subAccount: string | null;     // Tài khoản phụ
  referenceCode: string;         // Mã tham chiếu giao dịch
  description: string;           // Toàn bộ nội dung chuyển khoản
}

interface SepayQRConfig {
  accountNumber: string;         // Số tài khoản ngân hàng
  bankCode: string;             // Mã ngân hàng (VCB, TPBank, etc.)
  amount: number;               // Số tiền
  content: string;              // Nội dung chuyển khoản
  accountName?: string;         // Tên chủ tài khoản
}

export class SepayService {
  // Cấu hình ngân hàng từ environment variables
  private static readonly BANK_CONFIG = {
    bankCode: import.meta.env.VITE_SEPAY_BANK_CODE || 'MB',
    bankName: 'MB Bank',
    accountNumber: import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '9090190899999',
    accountName: import.meta.env.VITE_SEPAY_ACCOUNT_NAME || 'Vũ Thùy Giang',
    branch: 'Chi nhánh TP.HCM'
  };

  /**
   * Tạo QR Code URL sử dụng Sepay QR service
   * Tài liệu: https://qr.sepay.vn
   */
  static generateQRCodeURL(config: SepayQRConfig): string {
    const params = new URLSearchParams({
      acc: config.accountNumber,
      bank: config.bankCode,
      amount: config.amount.toString(),
      des: config.content
    });

    if (config.accountName) {
      params.append('template', 'compact');
    }

    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  /**
   * Tạo QR Code cho đơn hàng
   */
  static createOrderQRCode(orderId: string, amount: number): {
    qrUrl: string;
    paymentCode: string;
    bankInfo: typeof SepayService.BANK_CONFIG;
  } {
    // Tạo mã nội dung thanh toán
    const timestamp = Date.now().toString().slice(-6);
    const orderCode = orderId.slice(-4).toUpperCase();
    const paymentCode = `RAN${orderCode}${timestamp}`;

    const qrUrl = this.generateQRCodeURL({
      accountNumber: this.BANK_CONFIG.accountNumber,
      bankCode: this.BANK_CONFIG.bankCode,
      amount: amount,
      content: paymentCode,
      accountName: this.BANK_CONFIG.accountName
    });

    return {
      qrUrl,
      paymentCode,
      bankInfo: this.BANK_CONFIG
    };
  }

  /**
   * Xử lý webhook từ Sepay khi có giao dịch chuyển khoản
   * Endpoint này sẽ được gọi từ server webhook
   */
  static async handleSepayWebhook(webhookData: SepayWebhookData): Promise<{
    success: boolean;
    message: string;
    orderId?: string;
  }> {
    try {
      console.log('🔔 Received Sepay webhook:', webhookData);

      // Chỉ xử lý giao dịch tiền vào
      if (webhookData.transferType !== 'in') {
        return {
          success: true,
          message: 'Ignored outgoing transaction'
        };
      }

      // Trích xuất mã đơn hàng từ nội dung chuyển khoản
      const orderId = this.extractOrderIdFromContent(webhookData.content);
      if (!orderId) {
        return {
          success: false,
          message: 'Could not extract order ID from transaction content'
        };
      }

      // Kiểm tra đơn hàng có tồn tại không
      const order = await OrderService.getOrderById(orderId);
      if (!order) {
        return {
          success: false,
          message: `Order ${orderId} not found`
        };
      }

      // Kiểm tra số tiền có khớp không
      if (webhookData.transferAmount !== order.total_amount) {
        console.warn(`⚠️ Amount mismatch: Expected ${order.total_amount}, got ${webhookData.transferAmount}`);
        // Có thể gửi thông báo cho admin để kiểm tra thủ công
      }

      // Cập nhật trạng thái đơn hàng
      const updateResult = await OrderService.updateOrderStatus(orderId, 'paid', {
        payment_method: 'BANK_TRANSFER',
        payment_amount: webhookData.transferAmount,
        payment_reference: webhookData.referenceCode,
        payment_gateway: webhookData.gateway,
        sepay_transaction_id: webhookData.id.toString()
      });

      if (updateResult.success) {
        console.log(`✅ Order ${orderId} marked as paid via Sepay webhook`);
        
        // Gửi thông báo đến Telegram (optional)
        // await this.notifyPaymentConfirmed(orderId, webhookData);
        
        return {
          success: true,
          message: `Order ${orderId} payment confirmed`,
          orderId
        };
      } else {
        return {
          success: false,
          message: `Failed to update order ${orderId}: ${updateResult.message}`
        };
      }

    } catch (error) {
      console.error('❌ Error processing Sepay webhook:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Trích xuất Order ID từ nội dung chuyển khoản
   * Ví dụ: "RAN1A2B123456" -> tìm đơn hàng có ID chứa "1A2B"
   */
  private static extractOrderIdFromContent(content: string): string | null {
    try {
      // Tìm pattern RAN + 4 ký tự + 6 số
      const match = content.match(/RAN([A-Z0-9]{4})(\d{6})/);
      if (match) {
        const orderCode = match[1];
        // Tìm đơn hàng có ID kết thúc bằng orderCode này
        // Trong thực tế, bạn có thể cần query database để tìm chính xác
        return orderCode; // Simplified - cần implement logic tìm kiếm thực tế
      }
      return null;
    } catch (error) {
      console.error('Error extracting order ID:', error);
      return null;
    }
  }

  /**
   * Kiểm tra trạng thái giao dịch từ Sepay API
   * (Cần API key để sử dụng)
   */
  static async checkTransactionStatus(transactionId: string): Promise<{
    success: boolean;
    status?: 'pending' | 'completed' | 'failed';
    data?: any;
  }> {
    try {
      const apiKey = import.meta.env.VITE_SEPAY_API_KEY;
      if (!apiKey) {
        console.warn('Sepay API key not configured');
        return { success: false };
      }

      // Gọi API Sepay để kiểm tra trạng thái
      // Endpoint này cần được implement theo tài liệu Sepay
      const response = await fetch(`https://my.sepay.vn/userapi/transactions/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          status: 'completed',
          data
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Error checking Sepay transaction status:', error);
      return { success: false };
    }
  }
}

// Cấu hình Sepay từ environment variables
const SEPAY_CONFIG = {
  apiKey: import.meta.env.VITE_SEPAY_API_KEY || 'HWE79ZYSVNXT8VOKWDKDBHN3TWEFMQ2FPHAL5XJJTG16XEUR4ZEBPIJ0CXHAIY1Z',
  accountNumber: import.meta.env.VITE_SEPAY_ACCOUNT_NUMBER || '0123456789',
  bankCode: import.meta.env.VITE_SEPAY_BANK_CODE || 'VCB',
  accountName: import.meta.env.VITE_SEPAY_ACCOUNT_NAME || 'CONG TY TNHH RAN DINE EASY',
  webhookUrl: import.meta.env.VITE_SEPAY_WEBHOOK_URL || 'https://your-project-id.supabase.co/functions/v1/sepay-webhook'
};

// Export constants for use in other files
export { SEPAY_CONFIG };
export const SEPAY_CONSTANTS = {
  QR_SERVICE_URL: 'https://qr.sepay.vn',
  API_BASE_URL: 'https://my.sepay.vn/userapi',
  WEBHOOK_EVENTS: {
    TRANSACTION_IN: 'transaction.in',
    TRANSACTION_OUT: 'transaction.out'
  }
};