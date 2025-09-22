import {NextResponse} from 'next/server';
import {getChatConversationRetentionHours} from '@/lib/chatbot';
import {hasSanityWriteToken} from '@/lib/sanity.server';

export async function GET() {
  try {
    const retentionHours = await getChatConversationRetentionHours();
    const persistenceEnabled = retentionHours > 0 && hasSanityWriteToken();
    return NextResponse.json({ retentionHours, persistenceEnabled });
  } catch (err) {
    try {
      // eslint-disable-next-line no-console
      console.error('[chat/settings] failed to load retention config', err);
    } catch {}
    return NextResponse.json({ retentionHours: 0, persistenceEnabled: false });
  }
}
