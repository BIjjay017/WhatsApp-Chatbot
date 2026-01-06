import { getContext, updateContext } from './context.js';
import { routeIntent, parseInteractiveReply } from './router.js';
import { sendReply } from '../services/reply.js';

async function handleIncomingMessage(message) {
  const userId = message.userId;
  const context = await getContext(userId);

  // Check for interactive reply (button click or list selection)
  const interactiveReply = parseInteractiveReply(message);

  const decision = await routeIntent({
    text: message.text,
    context,
    userId,
    interactiveReply
  });

  await updateContext(userId, decision.updatedContext);

  // Only send reply if there's one (interactive messages handle their own replies)
  if (decision.reply) {
    await sendReply(message.platform, userId, decision.reply);
  }
}

export { handleIncomingMessage };
