// Configuration
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:54321/functions/v1/afdian-webhook';
const SECRET = process.env.AFDIAN_WEBHOOK_SECRET || 'houxuyang12345';
const USER_ID = process.argv[2]; // Allow passing user ID as argument

if (!USER_ID) {
  console.error('Usage: node scripts/test-afdian.js <USER_UUID>');
  console.error('Example: node scripts/test-afdian.js 123e4567-e89b-12d3-a456-426614174000');
  process.exit(1);
}

// Mock Afdian Payload
const payload = {
  ec: 200,
  em: 'success',
  data: {
    type: 'order',
    order: {
      out_trade_no: `TEST_${Date.now()}`,
      custom_order_id: `CUSTOM_${Date.now()}`,
      user_id: 'afdian_user_123',
      user_private_id: 'private_id_123',
      plan_id: 'plan_pro_monthly',
      month: 1,
      total_amount: '5.00',
      show_amount: '5.00',
      status: 2,
      remark: USER_ID, // The user ID to upgrade
      redeem_id: '',
      product_type: 0,
      discount: '0.00',
      sku_detail: [],
      address_person: '',
      address_phone: '',
      address_address: ''
    }
  }
};

async function testWebhook() {
  console.log(`Sending webhook request to: ${WEBHOOK_URL}`);
  console.log(`Target User ID: ${USER_ID}`);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(`${WEBHOOK_URL}?token=${SECRET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log('Response Status:', response.status);
    console.log('Response Body:', text);

    if (response.ok) {
      console.log('✅ Webhook test successful! Check Supabase tables (profiles, transactions).');
    } else {
      console.error('❌ Webhook test failed.');
    }
  } catch (error) {
    console.error('❌ Request error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('Hint: Is the Supabase local server running? (npx supabase start)');
    }
  }
}

testWebhook();
