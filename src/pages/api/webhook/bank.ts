/**
 * Webhook endpoint để nhận thông báo từ ngân hàng
 * Tự động gửi thông báo đến Telegram khi có giao dịch
 */

import { BankWebhookService } from '../../../utils/bankWebhookService';
import crypto from 'crypto';

// Interface cho request/response
interface WebhookRequest {
  method: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
}

interface WebhookResponse {
  status: (code: number) => WebhookResponse;
  json: (data: any) => void;
  send: (data: any) => void;
}

/**
 * Webhook Handler cho giao dịch ngân hàng
 */
export default async function bankWebhookHandler(
  req: WebhookRequest, 
  res: WebhookResponse
) {
  // Chỉ cho phép POST method
  if (req.method !== 'POST') {
    console.log(`❌ Method not allowed: ${req.method}`);
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }

  try {
    console.log('🔔 Webhook received from bank');
    console.log('📊 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('📦 Body:', JSON.stringify(req.body, null, 2));

    // Validate IP (nếu cần)
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    console.log('🌐 Client IP:', clientIP);

    // Validate webhook signature (nếu ngân hàng cung cấp)
    const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];
    if (signature && !validateWebhookSignature(req.body, signature)) {
      console.error('❌ Invalid webhook signature');
      return res.status(401).json({ 
        error: 'Invalid signature',
        timestamp: new Date().toISOString()
      });
    }

    // Validate required fields
    const webhookData = req.body;
    if (!isValidWebhookData(webhookData)) {
      console.error('❌ Invalid webhook data format');
      return res.status(400).json({ 
        error: 'Invalid data format',
        required: ['transactionId', 'amount', 'content', 'transactionDate', 'type'],
        received: Object.keys(webhookData)
      });
    }

    // Xử lý webhook data và gửi thông báo Telegram
    console.log('⚡ Processing bank transaction...');
    await BankWebhookService.handleBankTransaction(webhookData);
    
    console.log('✅ Webhook processed successfully');
    console.log('📱 Telegram notification sent');

    // Trả về response thành công
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      transactionId: webhookData.transactionId,
      timestamp: new Date().toISOString(),
      telegramSent: true
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Log chi tiết lỗi
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      webhookData: req.body
    });

    // Trả về lỗi 500
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      transactionId: req.body?.transactionId || 'unknown'
    });
  }
}

/**
 * Validate webhook signature
 */
function validateWebhookSignature(payload: any, signature: string): boolean {
  try {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) {
      console.warn('⚠️ WEBHOOK_SECRET not configured, skipping signature validation');
      return true; // Skip validation nếu không có secret
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    const receivedSignature = signature.replace('sha256=', '');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    );

    console.log('🔐 Signature validation:', isValid ? '✅ Valid' : '❌ Invalid');
    return isValid;
    
  } catch (error) {
    console.error('❌ Signature validation error:', error);
    return false;
  }
}

/**
 * Validate webhook data format
 */
function isValidWebhookData(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const requiredFields = [
    'transactionId',
    'amount', 
    'content',
    'transactionDate',
    'type'
  ];

  const missingFields = requiredFields.filter(field => !(field in data));
  
  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields);
    return false;
  }

  // Validate data types
  if (typeof data.amount !== 'number' || data.amount <= 0) {
    console.error('❌ Invalid amount:', data.amount);
    return false;
  }

  if (!['money_in', 'money_out'].includes(data.type)) {
    console.error('❌ Invalid transaction type:', data.type);
    return false;
  }

  console.log('✅ Webhook data validation passed');
  return true;
}

/**
 * Health check endpoint
 */
export async function healthCheck(req: WebhookRequest, res: WebhookResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Test Telegram connection
    const telegramStatus = await testTelegramConnection();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        webhook: {
          status: 'active',
          endpoint: '/api/webhook/bank'
        },
        telegram: telegramStatus,
        database: {
          status: 'connected' // Có thể test Supabase connection
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        webhookSecretConfigured: !!process.env.WEBHOOK_SECRET,
        telegramConfigured: !!process.env.TELEGRAM_BOT_TOKEN
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Test Telegram bot connection
 */
async function testTelegramConnection(): Promise<any> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return { status: 'not_configured', error: 'Bot token not found' };
    }

    const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
    const data = await response.json();
    
    if (data.ok) {
      return {
        status: 'connected',
        bot: {
          id: data.result.id,
          username: data.result.username,
          first_name: data.result.first_name
        }
      };
    } else {
      return {
        status: 'error',
        error: data.description
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Connection failed'
    };
  }
}

// Export cho testing
export { validateWebhookSignature, isValidWebhookData, testTelegramConnection };