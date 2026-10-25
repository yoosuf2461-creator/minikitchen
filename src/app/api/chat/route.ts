import { NextResponse } from 'next/server';
import { processChat, ChatMessageInput } from '@/lib/gemini';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: ChatMessageInput[] = body.messages || [];
    const clientApiKey: string | undefined = body.apiKey;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const result = await processChat(messages, clientApiKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat message',
        reply: 'Pardon me, I encountered a temporary connection hiccup. Please feel free to try again or use our online reservation form above!',
      },
      { status: 500 }
    );
  }
}
