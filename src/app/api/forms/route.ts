import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveForm } from '@/lib/storage';
import { Form } from '@/lib/types';
import { auth } from '@/auth';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const body = await req.json();
  const form: Form = {
    id: uuidv4(),
    creatorId: session.user.id,
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
