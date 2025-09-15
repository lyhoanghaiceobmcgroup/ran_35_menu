// Cấu hình các format thông báo Telegram

export interface NotificationTemplate {
  title: string;
  icon: string;
  fields: Array<{
    label: string;
    key: string;
    format?: 'currency' | 'datetime' | 'text' | 'phone';
    required?: boolean;
  }>;
  footer?: string;
  buttons?: Array<{
    text: string;
    callbackData: string;
    condition?: (data: any) => boolean;
  }>;
}

export const NOTIFICATION_TEMPLATES = {
  // Thông báo tiền vào
  MONEY_IN: {
    title: 'TIỀN VÀO',
    icon: '💰',
    fields: [
      { label: 'Ngân hàng', key: 'bankName', format: 'text', required: true },
      { label: 'Số tài khoản', key: 'accountNumber', format: 'text', required: true },
      { label: 'Số tiền', key: 'amount', format: 'currency', required: true },
      { label: 'Nội dung', key: 'content', format: 'text', required: true },
      { label: 'Mã giao dịch', key: 'transactionId', format: 'text', required: true },
      { label: 'Thời gian', key: 'transactionDate', format: 'datetime', required: true }
    ],
    footer: '📈 Giao dịch nhận tiền thành công!',
    buttons: [
      {
        text: '🍳 Bắt đầu chế biến',
        callbackData: 'start_cooking_{orderId}',
        condition: (data) => !!data.orderId
      },
      {
        text: '📋 Xem chi tiết đơn hàng',
        callbackData: 'view_details_{orderId}',
        condition: (data) => !!data.orderId
      }
    ]
  } as NotificationTemplate,

  // Thông báo tiền ra
  MONEY_OUT: {
    title: 'TIỀN RA',
    icon: '💸',
    fields: [
      { label: 'Ngân hàng', key: 'bankName', format: 'text', required: true },
      { label: 'Số tài khoản', key: 'accountNumber', format: 'text', required: true },
      { label: 'Số tiền', key: 'amount', format: 'currency', required: true },
      { label: 'Nội dung', key: 'content', format: 'text', required: true },
      { label: 'Mã giao dịch', key: 'transactionId', format: 'text', required: true },
      { label: 'Thời gian', key: 'transactionDate', format: 'datetime', required: true }
    ],
    footer: '📉 Giao dịch chuyển tiền thành công!'
  } as NotificationTemplate,

  // Thông báo thanh toán đơn hàng
  ORDER_PAYMENT: {
    title: 'THANH TOÁN ĐƠN HÀNG',
    icon: '✅',
    fields: [
      { label: 'Mã đơn hàng', key: 'orderId', format: 'text', required: true },
      { label: 'Bàn số', key: 'tableCode', format: 'text', required: true },
      { label: 'Số điện thoại', key: 'customerPhone', format: 'phone', required: true },
      { label: 'Số tiền', key: 'amount', format: 'currency', required: true },
      { label: 'Phương thức', key: 'paymentMethod', format: 'text', required: true },
      { label: 'Thời gian', key: 'timestamp', format: 'datetime', required: true }
    ],
    footer: '🎉 Đơn hàng đã được thanh toán thành công!',
    buttons: [
      {
        text: '🍳 Bắt đầu chế biến',
        callbackData: 'start_cooking_{orderId}'
      },
      {
        text: '📋 Xem chi tiết',
        callbackData: 'view_details_{orderId}'
      }
    ]
  } as NotificationTemplate,

  // Cảnh báo giao dịch bất thường
  SUSPICIOUS_TRANSACTION: {
    title: 'CẢNH BÁO GIAO DỊCH BẤT THƯỜNG',
    icon: '🚨',
    fields: [
      { label: 'Ngân hàng', key: 'bankName', format: 'text', required: true },
      { label: 'Số tiền', key: 'amount', format: 'currency', required: true },
      { label: 'Nội dung', key: 'content', format: 'text', required: true },
      { label: 'Mã giao dịch', key: 'transactionId', format: 'text', required: true },
      { label: 'Thời gian', key: 'transactionDate', format: 'datetime', required: true }
    ],
    footer: '⚠️ Vui lòng kiểm tra và xác nhận giao dịch này!',
    buttons: [
      {
        text: '✅ Xác nhận hợp lệ',
        callbackData: 'confirm_transaction_{transactionId}'
      },
      {
        text: '❌ Báo cáo bất thường',
        callbackData: 'report_suspicious_{transactionId}'
      }
    ]
  } as NotificationTemplate,

  // Báo cáo cuối ngày
  DAILY_SUMMARY: {
    title: 'BÁO CÁO CUỐI NGÀY',
    icon: '📊',
    fields: [
      { label: 'Ngày', key: 'date', format: 'text', required: true },
      { label: 'Tổng thu', key: 'totalIncome', format: 'currency', required: true },
      { label: 'Tổng chi', key: 'totalExpense', format: 'currency', required: true },
      { label: 'Lãi/Lỗ', key: 'netAmount', format: 'currency', required: true },
      { label: 'Số giao dịch', key: 'transactionCount', format: 'text', required: true }
    ],
    footer: '📈 Báo cáo tự động từ hệ thống ngân hàng'
  } as NotificationTemplate,

  // Thông báo số dư thấp
  LOW_BALANCE: {
    title: 'CẢNH BÁO SỐ DƯ THẤP',
    icon: '⚠️',
    fields: [
      { label: 'Ngân hàng', key: 'bankName', format: 'text', required: true },
      { label: 'Số tài khoản', key: 'accountNumber', format: 'text', required: true },
      { label: 'Số dư hiện tại', key: 'currentBalance', format: 'currency', required: true },
      { label: 'Ngưỡng cảnh báo', key: 'threshold', format: 'currency', required: true },
      { label: 'Thời gian kiểm tra', key: 'checkTime', format: 'datetime', required: true }
    ],
    footer: '💡 Vui lòng nạp thêm tiền vào tài khoản!'
  } as NotificationTemplate
};

export const NOTIFICATION_SETTINGS = {
  // Cài đặt chung
  DEFAULT_PARSE_MODE: 'HTML' as const,
  MAX_MESSAGE_LENGTH: 4096,
  
  // Cài đặt format
  CURRENCY_FORMAT: {
    style: 'currency' as const,
    currency: 'VND',
    locale: 'vi-VN'
  },
  
  DATETIME_FORMAT: {
    locale: 'vi-VN',
    options: {
      year: 'numeric' as const,
      month: '2-digit' as const,
      day: '2-digit' as const,
      hour: '2-digit' as const,
      minute: '2-digit' as const,
      second: '2-digit' as const
    }
  },
  
  // Cài đặt ngưỡng cảnh báo
  THRESHOLDS: {
    SUSPICIOUS_AMOUNT: 10000000, // 10 triệu VND
    LOW_BALANCE: 1000000, // 1 triệu VND
    HIGH_FREQUENCY_TRANSACTIONS: 10 // 10 giao dịch/giờ
  },
  
  // Cài đặt thời gian
  SUSPICIOUS_HOURS: {
    START: 22, // 22h
    END: 6     // 6h
  },
  
  // Từ khóa nghi ngờ
  SUSPICIOUS_KEYWORDS: [
    'hack', 'fraud', 'scam', 'test', 'fake', 
    'phishing', 'spam', 'virus', 'malware',
    'lừa đảo', 'giả mạo', 'hack', 'test'
  ],
  
  // Emoji cho các trạng thái
  EMOJIS: {
    SUCCESS: '✅',
    WARNING: '⚠️',
    ERROR: '❌',
    INFO: 'ℹ️',
    MONEY_IN: '💰',
    MONEY_OUT: '💸',
    BANK: '🏦',
    CARD: '💳',
    PHONE: '📞',
    TIME: '⏰',
    CHART_UP: '📈',
    CHART_DOWN: '📉',
    REPORT: '📊',
    COOKING: '🍳',
    DETAILS: '📋',
    ALERT: '🚨'
  }
};

// Helper functions để format dữ liệu
export class NotificationFormatter {
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat(
      NOTIFICATION_SETTINGS.CURRENCY_FORMAT.locale,
      NOTIFICATION_SETTINGS.CURRENCY_FORMAT
    ).format(amount);
  }
  
  static formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString(
      NOTIFICATION_SETTINGS.DATETIME_FORMAT.locale,
      NOTIFICATION_SETTINGS.DATETIME_FORMAT.options
    );
  }
  
  static formatPhone(phone: string): string {
    // Format số điện thoại Việt Nam
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
    }
    return phone;
  }
  
  static formatText(text: string): string {
    // Escape HTML characters
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  static truncateMessage(message: string): string {
    if (message.length <= NOTIFICATION_SETTINGS.MAX_MESSAGE_LENGTH) {
      return message;
    }
    
    const truncated = message.substring(0, NOTIFICATION_SETTINGS.MAX_MESSAGE_LENGTH - 3);
    return truncated + '...';
  }
  
  static replaceVariables(template: string, data: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}