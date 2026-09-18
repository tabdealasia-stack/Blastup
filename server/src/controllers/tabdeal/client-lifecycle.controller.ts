import { Request, Response, NextFunction } from 'express';
import {
  getClientDependencyReport,
  disconnectClientWhatsApp,
  suspendClient,
  requestClientDeletion
} from '../../services/tabdeal/client-lifecycle.service';

export async function getDependencies(req: Request, res: Response, next: NextFunction) {
  try {
    const report = await getClientDependencyReport(req.params.id);
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

export async function disconnectClient(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await disconnectClientWhatsApp(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function suspend(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await suspendClient(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function requestDeletion(req: Request, res: Response, next: NextFunction) {
  try {
    const superadminUserId = (req as any).user._id.toString();
    const result = await requestClientDeletion(req.params.id, superadminUserId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
