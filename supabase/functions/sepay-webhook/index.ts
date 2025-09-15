import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SepayWebhookData {
  id: string
  gateway: string
  transactionDate: string
  accountNumber: string
  subAccount?: string
  amountIn: number
  amountOut: number
  accumulated: number
  code: string
  content: string
  referenceCode: string
  description: string
  transferType: string
  transferAmount: number
  bankAccount: string
  bankSubAccount?: string
  bankName: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse webhook data from Sepay
    const webhookData: SepayWebhookData = await req.json()
    
    console.log('📥 Received Sepay webhook:', webhookData)

    // Validate webhook data
    if (!webhookData.content || !webhookData.transferAmount) {
      throw new Error('Invalid webhook data: missing required fields')
    }

    // Extract order ID from payment content
    // Format: RAN{orderCode}{timestamp} hoặc chứa order ID
    console.log('🔍 Searching for order ID in content:', webhookData.content)
    
    const ranMatch = webhookData.content.match(/RAN([A-Z0-9]+)/i)
    const uuidMatch = webhookData.content.match(/([a-f0-9-]{36})/i)
    
    console.log('RAN match:', ranMatch)
    console.log('UUID match:', uuidMatch)
    
    const orderIdMatch = ranMatch || uuidMatch
    
    if (!orderIdMatch) {
      console.log('❌ Order ID not found in payment content:', webhookData.content)
      return new Response(
        JSON.stringify({ success: false, message: 'Order ID not found in payment content' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const extractedOrderId = orderIdMatch[1]
    console.log('🔍 Extracted order ID:', extractedOrderId)

    // Find order in database
    const { data: orders, error: searchError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('id', extractedOrderId)
      .eq('status', 'pending')

    if (searchError) {
      console.error('❌ Error searching for order:', searchError)
      throw searchError
    }

    if (!orders || orders.length === 0) {
      console.log('❌ Order not found for ID:', extractedOrderId)
      return new Response(
        JSON.stringify({ success: false, message: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const order = orders[0]
    console.log('✅ Found order:', order.id)

    // Verify payment amount matches order total
    const expectedAmount = order.total_amount
    const receivedAmount = webhookData.transferAmount
    
    if (Math.abs(expectedAmount - receivedAmount) > 1) { // Allow 1 VND difference for rounding
      console.log(`❌ Amount mismatch: expected ${expectedAmount}, received ${receivedAmount}`)
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Payment amount mismatch: expected ${expectedAmount}, received ${receivedAmount}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update order status to confirmed
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status: 'confirmed',
        payment_status: 'confirmed',
        payment_method: 'bank_transfer',
        payment_amount: receivedAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('❌ Error updating order:', updateError)
      throw updateError
    }

    console.log('✅ Order payment confirmed:', order.id)

    // Send notification to Telegram (optional)
    try {
      await sendTelegramNotification(order, webhookData)
    } catch (telegramError) {
      console.error('⚠️ Failed to send Telegram notification:', telegramError)
      // Don't fail the webhook if Telegram fails
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Payment confirmed successfully',
        orderId: order.id,
        transactionId: webhookData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Helper function to send Telegram notification
async function sendTelegramNotification(order: any, webhookData: SepayWebhookData) {
  const telegramBotToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
  const telegramChatId = Deno.env.get('TELEGRAM_CHAT_ID')
  
  if (!telegramBotToken || !telegramChatId) {
    console.log('⚠️ Telegram credentials not configured')
    return
  }

  const amountFormatted = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(webhookData.transferAmount)

  const messageText = `✅ <b>THANH TOÁN THÀNH CÔNG</b>\n\n` +
    `📋 <b>Mã đơn hàng:</b> ${order.id}\n` +
    `🏷️ <b>Bàn số:</b> ${order.table_code}\n` +
    `📞 <b>Số điện thoại:</b> ${order.customer_phone}\n` +
    `💰 <b>Số tiền:</b> ${amountFormatted}\n` +
    `🏦 <b>Ngân hàng:</b> ${webhookData.bankName}\n` +
    `🔗 <b>Mã giao dịch:</b> ${webhookData.id}\n` +
    `📝 <b>Nội dung:</b> ${webhookData.content}\n` +
    `⏰ <b>Thời gian:</b> ${new Date(webhookData.transactionDate).toLocaleString('vi-VN')}\n\n` +
    `🎉 <i>Đơn hàng đã được thanh toán thành công!</i>`

  const telegramPayload = {
    chat_id: telegramChatId,
    text: messageText,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [[
        {
          text: '🍳 Bắt đầu chế biến',
          callback_data: `start_cooking_${order.id}`
        },
        {
          text: '📋 Xem chi tiết',
          callback_data: `view_details_${order.id}`
        }
      ]]
    }
  }

  const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(telegramPayload)
  })

  if (response.ok) {
    console.log('📱 Telegram notification sent successfully')
  } else {
    console.error('❌ Failed to send Telegram notification:', await response.text())
  }
}