jest.mock('@whiskeysockets/baileys', () => ({
  jidNormalizedUser: (jid: any) => jid,
  makeWASocket: jest.fn(),
}));

jest.mock('../../models/Message', () => ({
  Message: {
    findOne: jest.fn().mockReturnValue({ select: jest.fn() }),
    create: jest.fn(),
  },
}));
jest.mock('../../models/Chat', () => ({ Chat: { findOneAndUpdate: jest.fn() } }));

jest.mock('../whatsapp.service', () => ({
  getSocket: jest.fn().mockReturnValue({ user: { id: '123456@s.whatsapp.net' } }),
  waEvents: { emit: jest.fn() }
}));

import { persistOutgoingMessage } from '../message.service';
import { Message } from '../../models/Message';

describe('persistOutgoingMessage', () => {
  it('should save rawMessage when dispatching an outbound message', async () => {
    await persistOutgoingMessage('test_instance', {
      msgId: 'sent_123',
      chatId: '123456',
      type: 'text',
      text: 'Hello World',
      rawMessage: { conversation: 'Hello World' }
    });
    
    expect(Message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        msgId: 'sent_123',
        type: 'text',
        rawMessage: { conversation: 'Hello World' },
      })
    );
  });
});
