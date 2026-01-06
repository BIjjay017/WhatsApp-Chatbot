import { detectIntentAndRespond } from '../ai/intentEngine.js';

function extractMessageText(message = {}) {
  if (message.text?.body) return message.text.body;
  if (message.interactive?.button_reply)
    return message.interactive.button_reply.title;
  if (message.interactive?.list_reply)
    return message.interactive.list_reply.title;
  if (message.reaction?.emoji)
    return `Reaction: ${message.reaction.emoji}`;
  return null;
}

export default async function whatsappWebhook(req, res) {
  const entry = req.body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!Array.isArray(value?.messages)) {
    return res.sendStatus(200);
  }

  for (const message of value.messages) {
    const text = extractMessageText(message);
    if (!text) continue;

    console.log('Incoming user message:', text);

    // 🔹 Call Groq AI
    const aiResult = await detectIntentAndRespond(text);

    console.log('AI Intent:', aiResult.intent);
    console.log('AI Response:', aiResult.response);

    // For now just log the response; later this can be sent via WhatsApp Cloud API.
  }
  res.sendStatus(200);
}

