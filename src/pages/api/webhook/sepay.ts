import { NextApiRequest, NextApiResponse } from 'next';
import { PaymentService } from '@/utils/paymentService';

// API endpoint để nhận webhook từ Sepay
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Chỉ chấp nhận POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Method not allowed' 
    });
  }

  try {
    console.log('📥 Received Sepay webhook:', {
      headers: req.headers,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Xử lý webhook data
    const webhookData = req.body;
    
    // Validate webhook data
    if (!webhookData || typeof webhookData !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook data'
      });
    }

    // Xử lý webhook thông qua PaymentService
    const result = await PaymentService.handleSepayWebhook(webhookData);
    
    if (result.success) {
      console.log('✅ Webhook processed successfully:', result.message);
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      console.error('❌ Webhook processing failed:', result.message);
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ Error processing Sepay webhook:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Cấu hình để nhận raw body data từ webhook
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};