#!/usr/bin/env node

/**
 * Script để deploy Supabase Edge Function cho webhook Sepay
 * Chạy: node deploy-webhook.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Deploying Supabase Edge Function for Sepay Webhook...');

// Kiểm tra xem Supabase CLI đã được cài đặt chưa
try {
  execSync('supabase --version', { stdio: 'pipe' });
  console.log('✅ Supabase CLI found');
} catch (error) {
  console.error('❌ Supabase CLI not found. Please install it first:');
  console.error('npm install -g supabase');
  process.exit(1);
}

// Kiểm tra xem đã login chưa
try {
  execSync('supabase projects list', { stdio: 'pipe' });
  console.log('✅ Supabase authentication verified');
} catch (error) {
  console.error('❌ Not logged in to Supabase. Please login first:');
  console.error('supabase login');
  process.exit(1);
}

// Kiểm tra xem project đã được link chưa
const supabaseConfigPath = path.join(__dirname, 'supabase', 'config.toml');
if (!fs.existsSync(supabaseConfigPath)) {
  console.error('❌ Supabase project not linked. Please link your project first:');
  console.error('supabase link --project-ref your-project-id');
  process.exit(1);
}

try {
  // Deploy Edge Function
  console.log('📦 Deploying sepay-webhook function...');
  execSync('supabase functions deploy sepay-webhook', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  
  console.log('\n✅ Deployment completed successfully!');
  console.log('\n📋 Next steps:');
  console.log('1. Go to your Supabase Dashboard > Settings > Edge Functions');
  console.log('2. Set environment variables:');
  console.log('   - SUPABASE_URL: Your Supabase project URL');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY: Your service role key');
  console.log('   - TELEGRAM_BOT_TOKEN: Your Telegram bot token (optional)');
  console.log('   - TELEGRAM_CHAT_ID: Your Telegram chat ID (optional)');
  console.log('3. Update your Sepay webhook URL to:');
  console.log('   https://your-project-id.supabase.co/functions/v1/sepay-webhook');
  console.log('4. Update VITE_SEPAY_WEBHOOK_URL in your .env file');
  
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}