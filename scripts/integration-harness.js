const axios = require('axios');

/**
 * BLASTUP EXTERNAL INTEGRATION HARNESS
 * 
 * Demonstrates how an external website backend (e.g., GBPBoost)
 * pushes events to the Blastup Notification Engine.
 */

const BLASTUP_API_URL = 'http://localhost:3000/api/notifications/event';
const TEST_API_KEY = 'YOUR_API_KEY'; // Replace with a real API key

async function sendEvent() {
  try {
    const response = await axios.post(
      BLASTUP_API_URL,
      {
        event: 'customer.thank_you',
        eventId: `evt_${Date.now()}`,
        to: '+910000000000',
        variables: {
          customer_name: 'John Doe',
          business_name: 'GBPBoost',
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': TEST_API_KEY
        }
      }
    );

    console.log('Event Response:', response.data);
    
    /* Expected Response:
    {
      "success": true,
      "status": "accepted",
      "eventLogId": "651234567890abcdef"
    }
    */
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
  }
}

// sendEvent();
