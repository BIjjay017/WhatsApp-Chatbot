import { groq } from './groqClient.js';

// Define available tools/functions for the LLM
const availableTools = [
  {
    type: "function",
    function: {
      name: "show_food_menu",
      description: "Show a list of food categories available in the restaurant menu. Use this when user wants to see the menu, browse food options, or asks what's available.",
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
      name: "show_momo_varieties",
      description: "Show a carousel of momo varieties with images. Use this when user selects momos from the menu, wants to see momo options, or asks specifically about momos.",
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
      name: "confirm_order",
      description: "Show order confirmation with confirm and cancel buttons. Use this when user has selected items and wants to place/confirm their order.",
      parameters: {
        type: "object",
        properties: {
          items: {
            type: "array",
            description: "List of items the user wants to order",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
                price: { type: "number" }
              }
            }
          }
        },
        required: ["items"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "process_order_response",
      description: "Process the user's response to order confirmation (confirmed or cancelled).",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["confirmed", "cancelled"],
            description: "Whether the order was confirmed or cancelled"
          }
        },
        required: ["action"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "send_text_reply",
      description: "Send a simple text reply for greetings, general questions, or when no special UI is needed.",
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
 * Takes user message text and conversation context, returns tool call decision
 */
export async function detectIntentAndRespond(userMessage, conversationContext = {}) {
  const systemPrompt = `
You are an AI assistant for Momo House restaurant chatbot.

CONVERSATION FLOW:
1. When user wants to see menu → call show_food_menu (shows list of food categories)
2. When user selects "Momos" or asks about momos → call show_momo_varieties (shows momo carousel)
3. When user selects items to order or says "order" → call confirm_order with the items
4. When user confirms/cancels order → call process_order_response

CONTEXT AWARENESS:
- Current conversation state: ${JSON.stringify(conversationContext)}
- Use context to understand where user is in the ordering flow

RULES:
- Be concise and friendly
- Use the appropriate tool for each step
- For greetings or general chat, use send_text_reply
- Track what items user has shown interest in
`;

  const userPrompt = `User message: "${userMessage}"`;

  try {
    const completion = await groq().chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      tools: availableTools,
      tool_choice: "auto"
    });

    const message = completion.choices[0].message;

    // Check if LLM wants to call a tool
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      return {
        intent: toolCall.function.name,
        toolCall: {
          name: toolCall.function.name,
          arguments: JSON.parse(toolCall.function.arguments || '{}')
        },
        response: message.content || ""
      };
    }

    // Fallback to text response
    return {
      intent: "send_text_reply",
      toolCall: {
        name: "send_text_reply",
        arguments: { message: message.content || "How can I help you today?" }
      },
      response: message.content || "How can I help you today?"
    };

  } catch (err) {
    console.error('Intent detection error:', err);
    return {
      intent: "send_text_reply",
      toolCall: {
        name: "send_text_reply",
        arguments: { message: "Sorry, I'm having trouble understanding. Could you try again?" }
      },
      response: "Sorry, I'm having trouble understanding. Could you try again?"
    };
  }
}

export { availableTools };
