import express from 'express';
import whatsappWebhook from './webhooks/whatsapp.js';
import messengerWebhook from './webhooks/messenger.js';
import { handleIncomingMessage } from './orchestrator/index.js';
import db from './db.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

/* ======================
   DATABASE HEALTH CHECK
====================== */
async function checkDatabase() {
  try {
    const result = await db.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('⚠️  Server will continue but database features may not work');
    return false;
  }
}

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

/* ======================
   WEBHOOK VERIFICATION
====================== */
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

/* ======================
   WEBHOOK RECEIVER
====================== */
app.post('/webhook', async (req, res) => {
  const object = req.body.object;

  if (object === 'whatsapp_business_account') {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messages = value?.messages;

    if (Array.isArray(messages)) {
      for (const message of messages) {
        const userId = message.from;
        const userName = value?.contacts?.[0]?.profile?.name || 'Unknown';
        const messageType = message.type || 'text';

        console.log(`\n━━━ INCOMING MESSAGE ━━━`);
        console.log(`📱 From: ${userName} (${userId})`);
        console.log(`📝 Type: ${messageType}`);

        // Build message object for orchestrator
        const msgObject = {
          userId,
          platform: 'whatsapp',
          type: messageType
        };

        // Handle different message types
        if (messageType === 'text') {
          msgObject.text = message.text?.body || '';
          console.log(`💬 Message: ${msgObject.text}`);
        } else if (messageType === 'interactive') {
          // Handle button replies and list replies
          msgObject.interactive = message.interactive;
          if (message.interactive?.type === 'button_reply') {
            msgObject.text = message.interactive.button_reply.title;
            console.log(`🔘 Button: ${message.interactive.button_reply.title} (${message.interactive.button_reply.id})`);
          } else if (message.interactive?.type === 'list_reply') {
            msgObject.text = message.interactive.list_reply.title;
            console.log(`📋 List Selection: ${message.interactive.list_reply.title} (${message.interactive.list_reply.id})`);
          }
        }

        // Skip if no processable content
        if (!msgObject.text && !msgObject.interactive) {
          console.log(`⏭️ Skipping unsupported message type`);
          continue;
        }

        try {
          await handleIncomingMessage(msgObject);
          console.log(`✅ Message processed for ${userId}\n`);
        } catch (error) {
          console.error(`❌ Error processing message:`, error);
        }
      }
    }

    return res.sendStatus(200);
  }

  if (object === 'page') {
    return messengerWebhook(req, res);
  }

  res.sendStatus(200);
});

/* ======================
   SERVER START
====================== */
const server = app.listen(port, async () => {
  console.log(`Server running on port ${port}`);
  await checkDatabase();
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await db.end();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Keep the server alive and handle errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});