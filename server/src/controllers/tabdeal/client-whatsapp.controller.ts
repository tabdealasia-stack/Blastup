import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { Client } from '../../models/Client';
import { WhatsAppAccount } from '../../models/WhatsAppAccount';
import { WhatsAppInstance } from '../../models/WhatsAppInstance';
import * as wa from '../../services/whatsapp.service';
import Boom from '@hapi/boom';

// Helper to resolve a client's instanceId deterministically
async function resolveClientInstance(clientId: string): Promise<string> {
  const client = await Client.findById(clientId).select('_id userId');
  if (!client) {
    throw Boom.notFound('Client not found');
  }

  // Find the associated WhatsAppAccount
  const account = await WhatsAppAccount.findOne({ clientId: client._id }).select('instanceId');
  if (!account) {
    throw Boom.notFound('WhatsAppAccount not configured for Client');
  }

  const instanceId = account.instanceId;
  
  // Verify WhatsAppInstance exists
  const instance = await WhatsAppInstance.findOne({ instanceId });
  if (!instance) {
    throw Boom.notFound('WhatsAppInstance not configured for Client');
  }

  return instanceId;
}

export async function provision(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id: clientId } = req.params;
    
    // Validate Client exists
    const client = await Client.findById(clientId).select('_id userId');
    if (!client) {
      throw Boom.notFound('Client not found');
    }

    // Reuse existing records - check WhatsAppAccount
    let account = await WhatsAppAccount.findOne({ clientId: client._id });
    if (!account) {
      account = await WhatsAppAccount.create({
        clientId: client._id,
        instanceId: client.userId.toString(),
        status: 'disconnected'
      });
    }

    const instanceId = account.instanceId;

    // Use existing service to provision (it upserts WhatsAppInstance)
    await wa.provisionWhatsAppInstance(instanceId);
    
    res.json({ success: true, message: 'Provisioned successfully' });
  } catch (err) {
    next(err);
  }
}

export async function getStatus(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id: clientId } = req.params;
    const instanceId = await resolveClientInstance(clientId);
    
    const instance = await wa.getInstanceStatus(instanceId);
    res.json({ success: true, data: instance });
  } catch (err) {
    next(err);
  }
}

export async function getQR(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id: clientId } = req.params;
    const instanceId = await resolveClientInstance(clientId);
    
    // Step 5: Prevent browser caching of QR response completely
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const qr = await wa.getQRCode(instanceId);
    if (!qr) {
      // Step 11: Do not auto-reconnect on GET /qr. The frontend explicitly calls /reconnect.
      res.status(404).json({ success: false, error: 'QR not available.' });
      return;
    }
    res.json({ success: true, data: { qr } });
  } catch (err) {
    next(err);
  }
}

export async function reconnect(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id: clientId } = req.params;
    const instanceId = await resolveClientInstance(clientId);
    
    await wa.restartWhatsApp(instanceId);
    res.json({ success: true, message: 'Reconnect initiated' });
  } catch (err) {
    next(err);
  }
}
