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
   DATABASE INITIALIZATION ENDPOINT
   Call this once after deployment to create tables
====================== */
app.get('/init-db', async (req, res) => {
  const schema = `
    CREATE TABLE IF NOT EXISTS foods (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL,
        image_url TEXT,
        available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_wa_id VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'created',
        payment_method VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        food_id INTEGER REFERENCES foods(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_foods_category ON foods(category);
    CREATE INDEX IF NOT EXISTS idx_foods_available ON foods(available);
    CREATE INDEX IF NOT EXISTS idx_orders_user_wa_id ON orders(user_wa_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
  `;

  const seedData = `
    INSERT INTO foods (name, description, price, category, image_url, available) VALUES
    ('Steamed Veg Momo', 'Fresh vegetables & herbs wrapped in soft dough, steamed to perfection', 180.00, 'momos', 'https://example.com/images/steamed-veg-momo.jpg', true),
    ('Steamed Chicken Momo', 'Juicy chicken filling in soft steamed dumplings', 220.00, 'momos', 'https://example.com/images/steamed-chicken-momo.jpg', true),
    ('Fried Veg Momo', 'Crispy fried vegetable momos with crunchy exterior', 200.00, 'momos', 'https://example.com/images/fried-veg-momo.jpg', true),
    ('Fried Chicken Momo', 'Golden fried chicken momos, crispy and delicious', 240.00, 'momos', 'https://example.com/images/fried-chicken-momo.jpg', true),
    ('Tandoori Momo', 'Momos grilled in tandoor with special spices', 260.00, 'momos', 'https://example.com/images/tandoori-momo.jpg', true),
    ('Jhol Momo', 'Steamed momos served in spicy soup gravy', 250.00, 'momos', 'https://example.com/images/jhol-momo.jpg', true),
    ('Veg Thukpa', 'Traditional Tibetan noodle soup with vegetables', 200.00, 'noodles', 'https://example.com/images/veg-thukpa.jpg', true),
    ('Chicken Thukpa', 'Hearty noodle soup with tender chicken pieces', 250.00, 'noodles', 'https://example.com/images/chicken-thukpa.jpg', true),
    ('Veg Chowmein', 'Stir-fried noodles with fresh vegetables', 180.00, 'noodles', 'https://example.com/images/veg-chowmein.jpg', true),
    ('Chicken Chowmein', 'Stir-fried noodles with chicken and vegetables', 220.00, 'noodles', 'https://example.com/images/chicken-chowmein.jpg', true),
    ('Veg Chopsuey', 'Crispy noodles with vegetable gravy', 220.00, 'noodles', 'https://example.com/images/veg-chopsuey.jpg', true),
    ('Veg Fried Rice', 'Wok-tossed rice with mixed vegetables', 180.00, 'rice', 'https://example.com/images/veg-fried-rice.jpg', true),
    ('Chicken Fried Rice', 'Delicious fried rice with chicken pieces', 220.00, 'rice', 'https://example.com/images/chicken-fried-rice.jpg', true),
    ('Egg Fried Rice', 'Classic egg fried rice with vegetables', 190.00, 'rice', 'https://example.com/images/egg-fried-rice.jpg', true),
    ('Chicken Biryani', 'Aromatic basmati rice with spiced chicken', 300.00, 'rice', 'https://example.com/images/chicken-biryani.jpg', true),
    ('Masala Tea', 'Traditional spiced tea', 40.00, 'beverages', 'https://example.com/images/masala-tea.jpg', true),
    ('Coffee', 'Hot brewed coffee', 60.00, 'beverages', 'https://example.com/images/coffee.jpg', true),
    ('Fresh Lime Soda', 'Refreshing lime soda (sweet/salty)', 80.00, 'beverages', 'https://example.com/images/lime-soda.jpg', true),
    ('Mango Lassi', 'Creamy mango yogurt drink', 100.00, 'beverages', 'https://example.com/images/mango-lassi.jpg', true),
    ('Cold Coffee', 'Iced coffee with cream', 120.00, 'beverages', 'https://example.com/images/cold-coffee.jpg', true)
    ON CONFLICT DO NOTHING;
  `;

  try {
    console.log('🚀 Initializing database...');
    
    // Create tables
    await db.query(schema);
    console.log('✅ Tables created');
    
    // Check if data exists
    const existingData = await db.query('SELECT COUNT(*) FROM foods');
    const count = parseInt(existingData.rows[0].count);
    
    if (count === 0) {
      await db.query(seedData);
      console.log('✅ Seed data inserted');
    }
    
    // Get counts
    const foods = await db.query('SELECT COUNT(*) FROM foods');
    const orders = await db.query('SELECT COUNT(*) FROM orders');
    
    res.json({
      success: true,
      message: 'Database initialized successfully',
      tables: {
        foods: parseInt(foods.rows[0].count),
        orders: parseInt(orders.rows[0].count)
      }
    });
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    res.status(500).json({ success: false, error: error.message });
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