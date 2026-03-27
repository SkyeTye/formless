import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const MAX_EXCHANGES = 4; // max user replies per section before forcing completion

export async function POST(req: NextRequest) {
  const { formIntent, sectionGoal, transcript, checkComplete } = await req.json();

  const messages = transcript.map((m: { role: string; content: string }) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const userExchanges = transcript.filter((m: { role: string }) => m.role === 'user').length;

  // Hard cap: force completion without calling the API
  if (!checkComplete && userExchanges >= MAX_EXCHANGES) {
    return new NextResponse('[SECTION_COMPLETE]', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const exchangesLeft = MAX_EXCHANGES - userExchanges;
  const urgency = exchangesLeft <= 1
    ? `This is your LAST question. Make it count — cover anything still missing, then on the next turn return [SECTION_COMPLETE].`
    : `You have about ${exchangesLeft} question${exchangesLeft !== 1 ? 's' : ''} left. Be efficient.`;

  // Build the system prompt
  const systemPrompt = checkComplete
    ? `You are analyzing whether enough information has been gathered for a form section.
Form intent: ${formIntent}
Section goal: ${sectionGoal}
Return JSON: { "complete": true/false, "summary": "brief summary of what was learned" }
Only return JSON, nothing else.`
    : `You are conducting a friendly survey on behalf of a researcher.
Overall form intent: ${formIntent}
Your current section goal: ${sectionGoal}

Rules:
- Ask ONE question at a time, casually and conversationally (like a friendly text message)
- Prefer broad, open questions that naturally surface multiple data points over narrow follow-ups
- Only drill deeper when a response is genuinely too vague to be useful
- Keep questions short — no bullet points, no formal language
- Never reveal that you're an AI or that this is a form
- Don't say things like "Great answer!" Just respond naturally and move on
- Never use em dashes (—) in your responses
- When the section goal has been fully covered, respond with exactly: [SECTION_COMPLETE]
- ${urgency}

Just ask your next question now, nothing else.`;

  if (checkComplete) {
    const transcriptText = transcript
      .map((m: { role: string; content: string }) => `${m.role === 'assistant' ? 'Interviewer' : 'Respondent'}: ${m.content}`)
      .join('\n');
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: `You summarize survey conversations. Given a transcript, return ONLY a JSON object with this shape: { "complete": true, "summary": "..." }. The summary should be 1-3 sentences capturing what was learned about the respondent. No other text.`,
      messages: [{
        role: 'user',
        content: `Form intent: ${formIntent}\nSection goal: ${sectionGoal}\n\nTranscript:\n${transcriptText}\n\nReturn the JSON summary now.`,
      }],
    });
    return NextResponse.json({ text: (response.content[0] as Anthropic.TextBlock).text });
  }

  // Streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const streamResponse = client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        system: systemPrompt,
        messages: messages.length > 0 ? messages : [{ role: 'user', content: 'Start the conversation.' }],
      });

      for await (const chunk of streamResponse) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
