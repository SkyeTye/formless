import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { intentPrompt } = await req.json();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `You help design survey sections. Given a form's intent, suggest 3 focused section goals.

Form intent: ${intentPrompt}

Return ONLY a JSON array of 3 strings. Each string is a section goal (one sentence, starting with a verb like "Find out..." or "Understand..." or "Learn..."). No other text.

Example format: ["Find out...", "Understand...", "Learn..."]`,
    }],
  });

  try {
    const text = (response.content[0] as Anthropic.TextBlock).text.trim();
    const suggestions = JSON.parse(text);
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
