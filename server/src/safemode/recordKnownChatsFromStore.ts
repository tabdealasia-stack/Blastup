import { SafeModeManager } from './SafeModeManager';
import { Chat } from '../models/Chat';
import { Contact } from '../models/Contact';

/**
 * recordKnownChatsFromStore
 *
 * Seeds the Safe Mode store with the number of existing chats and contacts for this
 * phone number, sourced from our local MongoDB Chat and Contact collections.
 *
 * This prevents existing numbers (with real chat histories or saved contacts) from being
 * treated as brand-new accounts when Safe Mode first activates.
 *
 * Also pre-populates the seen-JIDs set by marking all existing chat IDs and contact JIDs
 * as "already seen", so existing contacts are not counted as new chats on first send.
 *
 * Call this immediately before `wrapBaileysSocket` on `connection === 'open'`.
 */
export async function recordKnownChatsFromStore(
  _sock: unknown, // socket param kept for API symmetry — not needed here
  manager: SafeModeManager,
  phoneId: string
): Promise<void> {
  try {
    const store = (manager as any).store;
    if (!store) return;

    // Get all chat JIDs and contact JIDs for this instance
    const [chats, contacts] = await Promise.all([
      Chat.find({ instanceId: phoneId }, { chatId: 1, _id: 0 }).lean(),
      Contact.find({ instanceId: phoneId }, { jid: 1, _id: 0 }).lean()
    ]);

    // Use a Set to deduplicate JIDs from chats and contacts
    const uniqueJids = new Set<string>();
    
    chats.forEach((chat: any) => {
      if (chat.chatId) uniqueJids.add(chat.chatId);
    });
    
    contacts.forEach((contact: any) => {
      if (contact.jid) uniqueJids.add(contact.jid);
    });

    if (uniqueJids.size === 0) return;

    // Set the known chat count so the manager knows baseline
    await store.setKnownChatCount(phoneId, uniqueJids.size);

    // Mark each existing JID as seen so they don't count as "new chats"
    // Batch in groups of 100 to avoid overwhelming Redis with individual calls
    const BATCH_SIZE = 100;
    const jidsArray = Array.from(uniqueJids);
    
    for (let i = 0; i < jidsArray.length; i += BATCH_SIZE) {
      const batch = jidsArray.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((jid: string) => store.markJidSeen(phoneId, jid))
      );
    }
  } catch (err) {
    // Non-fatal — if this fails, Safe Mode will still work, just more conservative
    console.warn(`[SafeMode] recordKnownChatsFromStore failed for ${phoneId}:`, err);
  }
}
