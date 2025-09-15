import { TelegramWebhookHandler } from './telegramWebhook';

// Đây là một mock API endpoint để xử lý webhook từ Telegram
// Trong thực tế, bạn cần deploy một server thực sự để xử lý webhook

interface WebhookRequest {
  method: string;
  body: any;
}

interface WebhookResponse {
  status: number;
  data: any;
}

export class WebhookAPI {
  // Mock API endpoint để xử lý webhook
  static async handleWebhookRequest(request: WebhookRequest): Promise<WebhookResponse> {
    try {
      if (request.method !== 'POST') {
        return {
          status: 405,
          data: { error: 'Method not allowed' }
        };
      }

      const result = await TelegramWebhookHandler.handleWebhook(request.body);
      
      if (result.success) {
        return {
          status: 200,
          data: { message: result.message }
        };
      } else {
        return {
          status: 400,
          data: { error: result.message }
        };
      }
    } catch (error) {
      console.error('Webhook API error:', error);
      return {
        status: 500,
        data: { error: 'Internal server error' }
      };
    }
  }

  // Hàm để thiết lập webhook URL (chỉ để demo)
  static async setupWebhook(webhookUrl: string): Promise<boolean> {
    try {
      console.log('Setting up webhook URL:', webhookUrl);
      
      // Trong thực tế, bạn cần:
      // 1. Deploy server với endpoint webhook
      // 2. Gọi TelegramWebhookHandler.setWebhook(webhookUrl)
      
      const success = await TelegramWebhookHandler.setWebhook(webhookUrl);
      
      if (success) {
        console.log('Webhook setup successful');
        return true;
      } else {
        console.error('Failed to setup webhook');
        return false;
      }
    } catch (error) {
      console.error('Error setting up webhook:', error);
      return false;
    }
  }

  // Hàm để test webhook locally (chỉ để demo)
  static async testWebhookLocally(orderId: string, action: 'confirm' | 'reject'): Promise<void> {
    try {
      // Tạo mock callback query để test
      const mockUpdate = {
        update_id: Date.now(),
        callback_query: {
          id: 'test_callback_' + Date.now(),
          from: {
            id: 123456789,
            first_name: 'Test Admin',
            username: 'testadmin'
          },
          message: {
            message_id: 1,
            chat: {
              id: -4852894219
            },
            text: 'Test message'
          },
          data: `${action}_${orderId}`
        }
      };

      console.log('Testing webhook with mock data:', mockUpdate);
      
      const result = await TelegramWebhookHandler.handleWebhook(mockUpdate);
      
      if (result.success) {
        console.log('Webhook test successful:', result.message);
      } else {
        console.error('Webhook test failed:', result.message);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
    }
  }
}

// Hướng dẫn setup webhook thực tế
export const WEBHOOK_SETUP_GUIDE = {
  steps: [
    '1. Deploy server với endpoint POST /webhook/telegram',
    '2. Endpoint này sẽ nhận request từ Telegram và gọi TelegramWebhookHandler.handleWebhook()',
    '3. Gọi TelegramWebhookHandler.setWebhook("https://yourdomain.com/webhook/telegram")',
    '4. Telegram sẽ gửi callback queries đến endpoint này khi user ấn nút',
    '5. Server sẽ cập nhật database và thông báo cho website'
  ],
  
  exampleServerCode: `
    // Express.js example
    app.post('/webhook/telegram', async (req, res) => {
      try {
        const result = await TelegramWebhookHandler.handleWebhook(req.body);
        if (result.success) {
          res.status(200).json({ message: result.message });
        } else {
          res.status(400).json({ error: result.message });
        }
      } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  `,
  
  testingLocally: [
    '1. Sử dụng ngrok để expose local server: ngrok http 3000',
    '2. Sử dụng URL ngrok để setup webhook',
    '3. Hoặc sử dụng WebhookAPI.testWebhookLocally() để test logic'
  ]
};