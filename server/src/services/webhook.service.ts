import { Webhook } from '../models/Webhook';
import { WebhookDeliveryLog } from '../models/WebhookDeliveryLog';
import { logger } from '../config/logger';

export interface WebhookPayloadEnvelope {
  id: string; // The delivery log ID will be added by the worker, but we define the schema here
  event: string;
  occurredAt: string;
  client: {
    id: string;
  };
  data: Record<string, any>;
}

/**
 * Enqueues an event for delivery to all enabled webhooks subscribed to that event.
 * This function is non-blocking and will not fail the caller if enqueueing fails.
 *
 * @param clientId The ID of the client
 * @param event The event name (e.g., 'notification.sent')
 * @param eventId The stable business event ID for idempotency (e.g., the NotificationEventLog eventId)
 * @param payloadData The sanitized data to send
 */
export async function enqueueWebhookEvent(
  clientId: string,
  event: string,
  eventId: string,
  payloadData: Record<string, any>
): Promise<void> {
  try {
    const webhooks = await Webhook.find({ clientId, enabled: true, events: event }).select('_id').lean();

    if (!webhooks.length) {
      return; // No active subscriptions
    }

    const logs = webhooks.map((w) => ({
      webhookId: w._id,
      clientId,
      eventId,
      event,
      status: 'pending',
      attempt: 0,
      payloadData,
    }));

    // Enqueue asynchronously using unordered insertMany to skip duplicates gracefully
    await WebhookDeliveryLog.insertMany(logs, { ordered: false });
  } catch (err: any) {
    // A duplicate key error (11000) simply means this specific event was already enqueued for this webhook.
    // This maintains idempotency.
    if (err.code !== 11000) {
      logger.error('Failed to enqueue webhook delivery', {
        clientId,
        event,
        eventId,
        error: err.message,
      });
    }
  }
}
