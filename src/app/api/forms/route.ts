import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveForm } from '@/lib/storage';
import { Form } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const form: Form = {
    id: uuidv4(),
    title: body.title,
    intentPrompt: body.intentPrompt,
    sections: body.sections.map((s: { goal: string; condition?: { sectionId: string; keyword: string } }) => ({ ...s, id: uuidv4() })),
    estimatedMinutes: body.estimatedMinutes || Math.max(2, body.sections.length * 2),
    createdAt: new Date().toISOString(),
    creatorKey: uuidv4(),
  };
  await saveForm(form);
  return NextResponse.json(form);
}
