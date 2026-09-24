import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import Boom from '@hapi/boom';
import { sendNotificationEvent } from '../services/notification-event.service';

export async function sendEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.user?.clientId || !req.user?.apiKeyId) {
      throw Boom.unauthorized(
        'Notification events require an authenticated API key'
      );
    }

    const { event, eventId, to, variables } = req.body;

    const result = await sendNotificationEvent({
      clientId: req.user.clientId,
      apiKeyId: req.user.apiKeyId,
      event,
      eventId,
      to,
      variables,
    });

    if (result.status === 'accepted') {
      res.status(202).json(result);
    } else {
      res.json(result);
    }
  } catch (err) {
    next(err);
  }
}
