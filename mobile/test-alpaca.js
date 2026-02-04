const axios = require('axios');

const ALPACA_API_KEY = process.env.ALPACA_API_KEY;
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET;
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || 'https://paper-api.alpaca.markets';

async function testAlpacaAPI() {
  try {
    console.log('Testing Alpaca Paper Trading API...');
    console.log('Base URL:', ALPACA_BASE_URL);
    
    const response = await axios.get(`${ALPACA_BASE_URL}/v2/account`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_API_SECRET,
      },
    });
    
    console.log('✅ API Connection Successful!');
    console.log('Account Status:', response.data.status);
    console.log('Buying Power:', response.data.buying_power);
    console.log('Portfolio Value:', response.data.portfolio_value);
    return true;
  } catch (error) {
    console.log('❌ API Connection Failed');
    console.log('Error:', error.response?.status, error.response?.statusText);
    console.log('Message:', error.response?.data?.message || error.message);
    return false;
  }
}

testAlpacaAPI();
