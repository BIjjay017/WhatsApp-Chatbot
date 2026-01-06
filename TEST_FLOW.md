// Example test showing the webhook flow for the WhatsApp request
// This demonstrates how the improved app.js integrates with the orchestrator

const testPayload = {
  "object": "whatsapp_business_account",
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "919999999999",
          "id": "test123",
          "text": { "body": "Show menu" }
        }]
      }
    }]
  }]
};

/*
EXECUTION FLOW:
1. POST /webhook receives the above payload
2. app.js checks object === 'whatsapp_business_account' → TRUE
3. Calls whatsappWebhook(req, res)
4. whatsappWebhook normalizes the message:
   {
     platform: 'whatsapp',
     userId: '919999999999',
     messageId: 'test123',
     text: 'Show menu',
     timestamp: Date.now()
   }
5. Calls handleIncomingMessage(normalized) from orchestrator
6. orchestrator/index.js:
   - Gets user context
   - Routes intent via routeIntent({'Show menu', context})
   - routeIntent detects /menu/i regex match
   - Returns reply: "Here is our menu: ☕ Coffee, 🍕 Pizza"
   - Updates context
   - Calls sendReply('whatsapp', '919999999999', reply)
7. services/reply.js logs:
   [Reply → WhatsApp] 919999999999: Here is our menu: ☕ Coffee, 🍕 Pizza

EXPECTED OUTPUT:
[Normalized WhatsApp] { platform: 'whatsapp', userId: '919999999999', messageId: 'test123', text: 'Show menu', timestamp: 1704067200000 }
[Reply → WhatsApp] 919999999999: Here is our menu: ☕ Coffee, 🍕 Pizza
*/
