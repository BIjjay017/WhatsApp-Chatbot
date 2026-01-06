/**
 * TOOL SCHEMA FOR LLM
 * 
 * LLM:
 * ✅ decides WHAT tool to use
 * ✅ provides arguments
 * ❌ does NOT execute tools
 * 
 * The orchestrator executes tools based on LLM decisions
 */

export const toolSchema = [
  {
    type: "function",
    function: {
      name: "getMenu",
      description: "Fetch food categories (if no category provided) or food items within a specific category. Use when user wants to browse the menu or see available options.",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Optional category name to filter food items (e.g., 'momos', 'noodles', 'rice', 'beverages'). If omitted, returns all categories."
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getFoodByName",
      description: "Search for food items by name. Use when user asks about a specific dish.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "The food name to search for (partial match supported)"
          }
        },
        required: ["name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "createOrder",
      description: "Create a new order for the current WhatsApp user. Use when user starts ordering and doesn't have an active order.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "addItem",
      description: "Add a food item to the user's current order. Use when user selects an item to order.",
      parameters: {
        type: "object",
        properties: {
          foodId: {
            type: "number",
            description: "The ID of the food item to add"
          },
          quantity: {
            type: "number",
            description: "Quantity to add (default: 1)"
          }
        },
        required: ["foodId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "removeItem",
      description: "Remove a food item from the user's current order.",
      parameters: {
        type: "object",
        properties: {
          foodId: {
            type: "number",
            description: "The ID of the food item to remove"
          }
        },
        required: ["foodId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getOrderItems",
      description: "Get all items in the user's current order. Use to show cart/order summary.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getOrderTotal",
      description: "Calculate the total amount for the user's current order.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "selectPayment",
      description: "Select payment method and confirm the order. Use when user chooses how to pay.",
      parameters: {
        type: "object",
        properties: {
          method: {
            type: "string",
            enum: ["COD", "ONLINE"],
            description: "Payment method: 'COD' for Cash on Delivery, 'ONLINE' for online payment"
          }
        },
        required: ["method"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancelOrder",
      description: "Cancel the user's current order.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "getOrderHistory",
      description: "Get the user's past order history.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of orders to return (default: 5)"
          }
        },
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "showPaymentOptions",
      description: "Show payment method selection buttons to the user. Use after order is ready to be confirmed.",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "sendTextReply",
      description: "Send a simple text reply for greetings, general questions, or conversational responses.",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "The text message to send to the user"
          }
        },
        required: ["message"]
      }
    }
  }
];

/**
 * LLM System Prompt for Restaurant Bot
 */
export const SYSTEM_PROMPT = `You are a friendly restaurant assistant for a food ordering chatbot.

CRITICAL RULES:
- You must NEVER generate SQL queries
- You must ONLY select tools when required
- If a tool is used, wait for its result and then reply naturally
- Be concise, friendly, and helpful

AVAILABLE ACTIONS:
1. getMenu - Browse menu categories or items
2. getFoodByName - Search for specific dishes
3. createOrder - Start a new order
4. addItem - Add item to cart
5. removeItem - Remove item from cart
6. getOrderItems - View cart contents
7. getOrderTotal - Get order total
8. selectPayment - Choose payment method (COD/ONLINE)
9. cancelOrder - Cancel current order
10. getOrderHistory - View past orders
11. showPaymentOptions - Show payment buttons
12. sendTextReply - Send conversational response

CONVERSATION FLOW:
1. Greet user → sendTextReply
2. Show menu → getMenu (no args for categories, with category for items)
3. User selects items → addItem
4. User wants to checkout → getOrderItems + getOrderTotal
5. Show payment options → showPaymentOptions
6. User selects payment → selectPayment

Always be helpful and guide the user through the ordering process.

If the user asks something outside your capabilities, politely inform them you can only assist with food ordering and related queries.`;
