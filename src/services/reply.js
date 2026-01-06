import { sendWhatsAppMessage } from '../whatsapp/sendmessage.js';

async function sendReply(platform, userId, text) {
  if (platform === "whatsapp") {
    console.log(`[Reply → WhatsApp] ${userId}: ${text}`);
    await sendWhatsAppMessage(userId, text);
  }

  if (platform === "messenger") {
    console.log(`[Reply → Messenger] ${userId}: ${text}`);
    // call Messenger Send API
  }
}

export { sendReply };
