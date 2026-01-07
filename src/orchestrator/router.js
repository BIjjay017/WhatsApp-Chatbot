import { detectIntentAndRespond } from '../ai/intentEngine.js';
import {
  sendWhatsAppMessage,
  sendWhatsAppListMessage,
  sendWhatsAppImageMessage,
  sendWhatsAppButtonMessage,
  sendOrderConfirmationMessage
} from '../whatsapp/sendmessage.js';
import * as restaurantTools from '../tools/restaurant.tools.js';

// Tool execution handlers
const toolHandlers = {
  // Step 1: Show food category menu (List Message) - FROM DATABASE
  show_food_menu: async (args, userId, context) => {
    try {
      // Fetch categories from database
      const categories = await restaurantTools.getMenu();
      
      const categoryEmojis = {
        'momos': '🥟',
        'noodles': '🍜',
        'rice': '🍚',
        'beverages': '☕'
      };

      const rows = categories.map(cat => ({
        id: `cat_${cat.category}`,
        title: `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)} ${categoryEmojis[cat.category] || '🍽️'}`,
        description: `Browse our ${cat.category} options`
      }));

      const sections = [
        {
          title: 'Food Categories',
          rows: rows.length > 0 ? rows : [
            { id: 'cat_momos', title: 'Momos 🥟', description: 'Steamed, fried, tandoori varieties' }
          ]
        }
      ];

      await sendWhatsAppListMessage(
        userId,
        '🍽️ Restaurant Menu',
        'Welcome! What would you like to order today? Browse our delicious categories below.',
        'Tap to view options',
        'View Categories',
        sections
      );

      return {
        reply: null,
        updatedContext: { 
          ...context, 
          stage: 'viewing_menu',
          lastAction: 'show_food_menu'
        }
      };
    } catch (error) {
      console.error('Error fetching menu:', error);
      await sendWhatsAppMessage(userId, "Sorry, I couldn't load the menu. Please try again.");
      return { reply: null, updatedContext: context };
    }
  },

  // Step 2: Show items in a category - FROM DATABASE (IMPROVED: No images, just list for faster selection)
  show_category_items: async (args, userId, context) => {
    try {
      const category = args.category || 'momos';
      const foods = await restaurantTools.getMenu(category);

      if (foods.length === 0) {
        await sendWhatsAppMessage(userId, `No items found in ${category}. Try another category!`);
        return await toolHandlers.show_food_menu({}, userId, context);
      }

      // Build selection list with prices - NO images for faster selection
      const rows = foods.map(food => ({
        id: `add_${food.id}`,
        title: food.name.substring(0, 24), // WhatsApp limit
        description: `Rs.${food.price} - ${(food.description || '').substring(0, 50)}`
      }));

      // Split into sections if needed (WhatsApp has 10 row limit per section)
      const sections = [];
      for (let i = 0; i < rows.length; i += 10) {
        sections.push({
          title: i === 0 ? `${category.charAt(0).toUpperCase() + category.slice(1)}` : `More ${category}`,
          rows: rows.slice(i, i + 10)
        });
      }

      // Show current cart summary if items exist
      const cart = context.cart || [];
      let bodyText = `Select items to add to your cart.\nTap an item to add it.`;
      if (cart.length > 0) {
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        bodyText = `🛒 Cart: ${cart.length} item(s) - Rs.${total}\n\nSelect more items to add:`;
      }

      await sendWhatsAppListMessage(
        userId,
        `🍽️ ${category.toUpperCase()} Menu`,
        bodyText,
        'Tap item to add to cart',
        'View Items',
        sections
      );

      return {
        reply: null,
        updatedContext: { 
          ...context, 
          stage: 'viewing_items',
          currentCategory: category,
          lastAction: 'show_category_items',
          cart: context.cart || []
        }
      };
    } catch (error) {
      console.error('Error fetching category items:', error);
      await sendWhatsAppMessage(userId, "Sorry, I couldn't load the items. Please try again.");
      return { reply: null, updatedContext: context };
    }
  },

  // Backward compatibility - show_momo_varieties calls show_category_items
  show_momo_varieties: async (args, userId, context) => {
    return await toolHandlers.show_category_items({ category: 'momos' }, userId, context);
  },

  // Add item to cart - uses database to get item details (IMPROVED: Quick add with quantity options)
  add_to_cart: async (args, userId, context) => {
    try {
      const foodId = args.foodId;
      const quantity = args.quantity || 1;
      const cart = context.cart || [];

      // Get food details from database
      const food = await restaurantTools.getFoodById(foodId);
      
      if (!food) {
        await sendWhatsAppMessage(userId, "Sorry, that item is not available.");
        return { reply: null, updatedContext: context };
      }

      // Check if item already in cart
      const existingItem = cart.find(item => item.foodId === foodId);
      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.push({
          foodId: food.id,
          name: food.name,
          price: parseFloat(food.price),
          quantity
        });
      }

      // Calculate cart total
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

      // Show quick action buttons - makes adding more items much easier!
      const buttons = [
        {
          type: 'reply',
          reply: {
            id: `more_${context.currentCategory || 'momos'}`,
            title: 'Add More ➕'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'view_all_categories',
            title: 'Other Categories 📋'
          }
        },
        {
          type: 'reply',
          reply: {
            id: 'proceed_checkout',
            title: 'Checkout 🛒'
          }
        }
      ];

      await sendWhatsAppButtonMessage(
        userId,
        '✅ Added to Cart!',
        `*${food.name}* x${quantity} - Rs.${food.price * quantity}\n\n🛒 Cart: ${itemCount} item(s) | Total: Rs.${total}\n\nWhat would you like to do?`,
        'Keep adding or checkout!',
        buttons
      );

      return {
        reply: null,
        updatedContext: { 
          ...context, 
          cart,
          stage: 'quick_cart_action',
          lastAddedItem: food.name,
          lastAction: 'add_to_cart'
        }
      };
    } catch (error) {
      console.error('Error adding to cart:', error);
      await sendWhatsAppMessage(userId, "Sorry, couldn't add that item. Please try again.");
      return { reply: null, updatedContext: context };
    }
  },

  // Show cart and checkout options
  show_cart_options: async (args, userId, context) => {
    const cart = context.cart || [];
    
    if (cart.length === 0) {
      await sendWhatsAppMessage(userId, "Your cart is empty! Let me show you our menu.");
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    const cartLines = cart.map(item => 
      `• ${item.name} x${item.quantity} - Rs.${item.price * item.quantity}`
    ).join('\n');
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'add_more_items',
          title: 'Add More Items ➕'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'proceed_checkout',
          title: 'Checkout 🛒'
        }
      }
    ];

    await sendWhatsAppButtonMessage(
      userId,
      '🛒 Your Cart',
      `${cartLines}\n━━━━━━━━━━━━━━━\nSubtotal: Rs.${total}\n\nWould you like to add more items or proceed to checkout?`,
      'You can add more items anytime!',
      buttons
    );

    return {
      reply: null,
      updatedContext: {
        ...context,
        stage: 'cart_options',
        lastAction: 'show_cart_options'
      }
    };
  },

  // Confirm order with payment options
  confirm_order: async (args, userId, context) => {
    const items = args.items || context.cart || [];
    
    if (items.length === 0) {
      await sendWhatsAppMessage(userId, "Your cart is empty! Let me show you our menu.");
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    const orderLines = items.map(item => 
      `• ${item.name} x${item.quantity} - Rs.${item.price * item.quantity}`
    ).join('\n');

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const orderDetails = `${orderLines}\n━━━━━━━━━━━━━━━\nTotal: Rs.${total}`;

    await sendOrderConfirmationMessage(userId, orderDetails);

    return {
      reply: null,
      updatedContext: { 
        ...context, 
        stage: 'confirming_order',
        lastAction: 'confirm_order',
        pendingOrder: { items, total }
      }
    };
  },

  // Show payment method selection buttons
  show_payment_options: async (args, userId, context) => {
    const buttons = [
      {
        type: 'reply',
        reply: {
          id: 'pay_cod',
          title: 'Cash on Delivery'
        }
      },
      {
        type: 'reply',
        reply: {
          id: 'pay_online',
          title: 'Online Payment'
        }
      }
    ];

    await sendWhatsAppButtonMessage(
      userId,
      '💳 Payment Method',
      'Choose your preferred payment method:',
      'Select to continue',
      buttons
    );

    return {
      reply: null,
      updatedContext: {
        ...context,
        stage: 'selecting_payment',
        lastAction: 'show_payment_options'
      }
    };
  },

  // Process order confirmation - saves to DATABASE
  process_order_response: async (args, userId, context) => {
    const { action } = args;

    if (action === 'confirmed') {
      try {
        // Create order in database
        const order = await restaurantTools.createOrder(userId);
        const cart = context.cart || [];

        // Add items to order
        for (const item of cart) {
          await restaurantTools.addItem(order.id, item.foodId, item.quantity);
        }

        // Show payment options
        return await toolHandlers.show_payment_options({}, userId, {
          ...context,
          orderId: order.id,
          stage: 'selecting_payment'
        });
      } catch (error) {
        console.error('Error creating order:', error);
        // Fallback without database
        const orderId = `MH${Date.now().toString().slice(-6)}`;
        await sendWhatsAppMessage(
          userId,
          `✅ Order Confirmed!\n\nThank you for your order! Your delicious food is being prepared and will be delivered in 30-40 minutes.\n\nOrder ID: #${orderId}\n\nEnjoy your meal! 🥟`
        );
        return {
          reply: null,
          updatedContext: { 
            stage: 'order_complete',
            lastAction: 'order_confirmed',
            cart: []
          }
        };
      }
    } else {
      await sendWhatsAppMessage(
        userId,
        `❌ Order Cancelled\n\nNo worries! Your order has been cancelled. Feel free to browse our menu again whenever you're ready.\n\nType "menu" to start a new order! 🍽️`
      );
      return {
        reply: null,
        updatedContext: { 
          stage: 'order_cancelled',
          lastAction: 'order_cancelled',
          cart: []
        }
      };
    }
  },

  // Process payment selection - saves to DATABASE
  process_payment: async (args, userId, context) => {
    const { method } = args;
    const orderId = context.orderId;

    try {
      if (orderId) {
        await restaurantTools.selectPayment(orderId, method);
      }

      const paymentText = method === 'COD' 
        ? 'Cash on Delivery' 
        : 'Online Payment';

      await sendWhatsAppMessage(
        userId,
        `✅ Order Confirmed!\n\n💳 Payment: ${paymentText}\n\nThank you for your order! Your delicious food is being prepared and will be delivered in 30-40 minutes.\n\nOrder ID: #${orderId || 'MH' + Date.now().toString().slice(-6)}\n\nEnjoy your meal! 🥟`
      );

      return {
        reply: null,
        updatedContext: { 
          stage: 'order_complete',
          lastAction: 'order_confirmed',
          paymentMethod: method,
          cart: []
        }
      };
    } catch (error) {
      console.error('Error processing payment:', error);
      await sendWhatsAppMessage(userId, "Order confirmed! We'll contact you for payment details.");
      return {
        reply: null,
        updatedContext: { stage: 'order_complete', cart: [] }
      };
    }
  },

  // Simple text reply
  send_text_reply: async (args, userId, context) => {
    const message = args.message || "Hello! Welcome to our restaurant 🍽️ Type 'menu' to see our delicious options!";
    console.log(`━━━ SENDING TEXT REPLY ━━━`);
    console.log(`💬 Message: ${message}`);
    await sendWhatsAppMessage(userId, message);
    return {
      reply: null,
      updatedContext: context
    };
  }
};

// Handle button/list reply callbacks from WhatsApp
function parseInteractiveReply(message) {
  if (message.interactive?.type === 'button_reply') {
    return {
      type: 'button',
      id: message.interactive.button_reply.id,
      title: message.interactive.button_reply.title
    };
  }
  if (message.interactive?.type === 'list_reply') {
    return {
      type: 'list',
      id: message.interactive.list_reply.id,
      title: message.interactive.list_reply.title
    };
  }
  return null;
}

async function routeIntent({ text, context, userId, interactiveReply }) {
  console.log(`━━━ ROUTING MESSAGE ━━━`);
  console.log(`📍 Context stage: ${context.stage || 'initial'}`);

  // Handle interactive replies (button clicks, list selections)
  if (interactiveReply) {
    const { id, title } = interactiveReply;
    console.log(`🔘 Interactive reply: ${id} - ${title}`);

    // Category selection from menu
    if (id.startsWith('cat_')) {
      const category = id.replace('cat_', '');
      return await toolHandlers.show_category_items({ category }, userId, context);
    }

    // Add item to cart (id format: add_<foodId>)
    if (id.startsWith('add_')) {
      const foodId = parseInt(id.replace('add_', ''));
      if (!isNaN(foodId)) {
        return await toolHandlers.add_to_cart({ foodId }, userId, context);
      }
    }

    // User wants to add more items
    if (id === 'add_more_items') {
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    // Quick add more from same category (new flow)
    if (id.startsWith('more_')) {
      const category = id.replace('more_', '');
      return await toolHandlers.show_category_items({ category }, userId, context);
    }

    // View all categories (new flow)
    if (id === 'view_all_categories') {
      return await toolHandlers.show_food_menu({}, userId, context);
    }

    // User wants to checkout
    if (id === 'proceed_checkout') {
      return await toolHandlers.confirm_order({ items: context.cart }, userId, context);
    }

    // Order confirmation/cancellation
    if (id === 'confirm_order') {
      return await toolHandlers.process_order_response({ action: 'confirmed' }, userId, context);
    }
    if (id === 'cancel_order') {
      return await toolHandlers.process_order_response({ action: 'cancelled' }, userId, context);
    }

    // Payment method selection
    if (id === 'pay_cod') {
      return await toolHandlers.process_payment({ method: 'COD' }, userId, context);
    }
    if (id === 'pay_online') {
      return await toolHandlers.process_payment({ method: 'ONLINE' }, userId, context);
    }
  }

  // Use LLM to detect intent and decide which tool to call
  console.log(`🤖 Asking LLM for intent...`);
  const decision = await detectIntentAndRespond(text, context);
  
  console.log(`━━━ LLM DECISION ━━━`);
  console.log(`🎯 Intent: ${decision.intent}`);
  console.log(`🔧 Tool: ${decision.toolCall?.name || 'none'}`);
  console.log(`📝 Args: ${JSON.stringify(decision.toolCall?.arguments || {})}`);

  if (decision.toolCall && toolHandlers[decision.toolCall.name]) {
    return await toolHandlers[decision.toolCall.name](
      decision.toolCall.arguments,
      userId,
      context
    );
  }

  // Fallback
  const fallbackMessage = decision.response || "Hello! Welcome to our restaurant 🍽️ Type 'menu' to see our delicious options!";
  await sendWhatsAppMessage(userId, fallbackMessage);
  return {
    reply: null,
    updatedContext: context
  };
}

export { routeIntent, parseInteractiveReply };