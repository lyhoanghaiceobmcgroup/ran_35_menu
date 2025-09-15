import { TelegramNotificationService } from './telegramNotificationService';
import { OrderService } from './orderService';

interface BankWebhookData {
  transactionId: string;
  gateway: string; // Tên ngân hàng hoặc gateway
  transactionDate: string;
  accountNumber: string;
  amount: number;
  content: string;
  transferType: 'in' | 'out';
  referenceCode?: string;
  bankName?: string;
  accumulated?: number; // Số dư sau giao dịch
}

interface TransactionSummary {
  date: string;
  totalIncome: number;
  totalExpense: number;
  transactionCount: number;
  transactions: BankWebhookData[];
}

export class BankWebhookService {
  private static dailyTransactions: Map<string, BankWebhookData[]> = new Map();
  private static suspiciousThreshold = 10000000; // 10 triệu VND

  /**
   * Xử lý webhook từ bất kỳ ngân hàng nào
   */
  static async handleBankWebhook(webhookData: BankWebhookData): Promise<{
    success: boolean;
    message: string;
    orderId?: string;
  }> {
    try {
      console.log('🏦 Processing bank webhook:', webhookData);

      // Lưu giao dịch vào bộ nhớ tạm để tính toán cuối ngày
      this.storeDailyTransaction(webhookData);

      // Kiểm tra giao dịch bất thường
      if (this.isSuspiciousTransaction(webhookData)) {
        await TelegramNotificationService.sendSuspiciousTransactionAlert({
          transactionId: webhookData.transactionId,
          accountNumber: webhookData.accountNumber,
          amount: webhookData.amount,
          content: webhookData.content,
          transactionDate: webhookData.transactionDate,
          bankName: webhookData.bankName || webhookData.gateway,
          transferType: webhookData.transferType
        });
      }

      // Chỉ xử lý giao dịch tiền vào
      if (webhookData.transferType !== 'in') {
        // Vẫn gửi thông báo cho giao dịch tiền ra
        await TelegramNotificationService.sendBalanceNotification({
          transactionId: webhookData.transactionId,
          accountNumber: webhookData.accountNumber,
          amount: webhookData.amount,
          content: webhookData.content,
          transactionDate: webhookData.transactionDate,
          bankName: webhookData.bankName || webhookData.gateway,
          transferType: webhookData.transferType
        });
        
        return {
          success: true,
          message: 'Outgoing transaction processed'
        };
      }

      // Trích xuất mã đơn hàng từ nội dung
      const orderId = TelegramNotificationService.extractOrderIdFromContent(webhookData.content);
      
      if (orderId) {
        // Xử lý thanh toán đơn hàng
        const order = await OrderService.getOrderById(orderId);
        if (order && order.status === 'pending') {
          // Kiểm tra số tiền khớp (cho phép sai lệch 1 VND)
          const amountDiff = Math.abs(webhookData.amount - order.total_amount);
          if (amountDiff <= 1) {
            // Cập nhật trạng thái đơn hàng
            const updateResult = await OrderService.updateOrderStatus(orderId, 'confirmed', {
              payment_method: 'BANK_TRANSFER',
              payment_amount: webhookData.amount,
              payment_reference: webhookData.referenceCode || webhookData.transactionId,
              payment_gateway: webhookData.gateway,
              bank_transaction_id: webhookData.transactionId
            });

            if (updateResult.success) {
              // Gửi thông báo biến động số dư với thông tin đơn hàng
              await TelegramNotificationService.sendBalanceNotification({
                transactionId: webhookData.transactionId,
                accountNumber: webhookData.accountNumber,
                amount: webhookData.amount,
                content: webhookData.content,
                transactionDate: webhookData.transactionDate,
                bankName: webhookData.bankName || webhookData.gateway,
                transferType: webhookData.transferType,
                orderId: orderId
              });

              console.log(`✅ Order ${orderId} payment confirmed via bank webhook`);
              return {
                success: true,
                message: `Order ${orderId} payment confirmed`,
                orderId
              };
            } else {
              console.error(`❌ Failed to update order ${orderId}:`, updateResult.message);
            }
          } else {
            console.warn(`⚠️ Amount mismatch for order ${orderId}: Expected ${order.total_amount}, got ${webhookData.amount}`);
            // Gửi cảnh báo về sai lệch số tiền
            await TelegramNotificationService.sendSuspiciousTransactionAlert({
              transactionId: webhookData.transactionId,
              accountNumber: webhookData.accountNumber,
              amount: webhookData.amount,
              content: `${webhookData.content} - AMOUNT MISMATCH: Expected ${order.total_amount}`,
              transactionDate: webhookData.transactionDate,
              bankName: webhookData.bankName || webhookData.gateway,
              transferType: webhookData.transferType
            });
          }
        }
      }

      // Gửi thông báo biến động số dư thông thường
      await TelegramNotificationService.sendBalanceNotification({
        transactionId: webhookData.transactionId,
        accountNumber: webhookData.accountNumber,
        amount: webhookData.amount,
        content: webhookData.content,
        transactionDate: webhookData.transactionDate,
        bankName: webhookData.bankName || webhookData.gateway,
        transferType: webhookData.transferType,
        orderId: orderId || undefined
      });

      return {
        success: true,
        message: 'Transaction processed successfully'
      };
    } catch (error) {
      console.error('❌ Error processing bank webhook:', error);
      return {
        success: false,
        message: 'Internal server error'
      };
    }
  }

  /**
   * Lưu giao dịch vào bộ nhớ tạm theo ngày
   */
  private static storeDailyTransaction(transaction: BankWebhookData): void {
    const date = new Date(transaction.transactionDate).toISOString().split('T')[0];
    
    if (!this.dailyTransactions.has(date)) {
      this.dailyTransactions.set(date, []);
    }
    
    this.dailyTransactions.get(date)!.push(transaction);
  }

  /**
   * Kiểm tra giao dịch bất thường
   */
  private static isSuspiciousTransaction(transaction: BankWebhookData): boolean {
    // Giao dịch có số tiền lớn
    if (transaction.amount > this.suspiciousThreshold) {
      return true;
    }

    // Giao dịch vào ban đêm (22h - 6h)
    const hour = new Date(transaction.transactionDate).getHours();
    if (hour >= 22 || hour <= 6) {
      return true;
    }

    // Nội dung giao dịch chứa từ khóa nghi ngờ
    const suspiciousKeywords = ['hack', 'fraud', 'scam', 'test', 'fake'];
    const content = transaction.content.toLowerCase();
    if (suspiciousKeywords.some(keyword => content.includes(keyword))) {
      return true;
    }

    return false;
  }

  /**
   * Tính toán và gửi báo cáo cuối ngày
   */
  static async sendDailySummary(date?: string): Promise<void> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const transactions = this.dailyTransactions.get(targetDate) || [];

      if (transactions.length === 0) {
        console.log(`📊 No transactions found for ${targetDate}`);
        return;
      }

      const summary = this.calculateDailySummary(transactions, targetDate);
      await TelegramNotificationService.sendDailySummary(summary);

      // Xóa dữ liệu cũ để tiết kiệm bộ nhớ
      this.dailyTransactions.delete(targetDate);
      
      console.log(`📊 Daily summary sent for ${targetDate}`);
    } catch (error) {
      console.error('❌ Error sending daily summary:', error);
    }
  }

  /**
   * Tính toán tổng hợp giao dịch trong ngày
   */
  private static calculateDailySummary(transactions: BankWebhookData[], date: string): TransactionSummary {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      if (transaction.transferType === 'in') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });

    return {
      date,
      totalIncome,
      totalExpense,
      transactionCount: transactions.length,
      transactions
    };
  }

  /**
   * Thiết lập ngưỡng cảnh báo giao dịch bất thường
   */
  static setSuspiciousThreshold(amount: number): void {
    this.suspiciousThreshold = amount;
    console.log(`🔧 Suspicious transaction threshold set to: ${amount.toLocaleString('vi-VN')} VND`);
  }

  /**
   * Lấy thống kê giao dịch theo ngày
   */
  static getDailyStats(date?: string): TransactionSummary | null {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const transactions = this.dailyTransactions.get(targetDate);
    
    if (!transactions) {
      return null;
    }

    return this.calculateDailySummary(transactions, targetDate);
  }

  /**
   * Xóa dữ liệu giao dịch cũ (chạy định kỳ để tiết kiệm bộ nhớ)
   */
  static cleanupOldTransactions(daysToKeep: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    for (const [date] of this.dailyTransactions) {
      if (date < cutoffDateStr) {
        this.dailyTransactions.delete(date);
        console.log(`🗑️ Cleaned up transactions for ${date}`);
      }
    }
  }
}

// Tự động gửi báo cáo cuối ngày vào 23:59
if (typeof window === 'undefined') { // Chỉ chạy trên server
  const scheduleDaily = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      BankWebhookService.sendDailySummary();
      BankWebhookService.cleanupOldTransactions();
      
      // Lặp lại mỗi 24 giờ
      setInterval(() => {
        BankWebhookService.sendDailySummary();
        BankWebhookService.cleanupOldTransactions();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  };
  
  scheduleDaily();
}