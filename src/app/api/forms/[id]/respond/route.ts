import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { saveResponse } from '@/lib/storage';
import { Response } from '@/lib/types';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const response: Response = {
    id: uuidv4(),
    formId: id,
    sectionResponses: body.sectionResponses,
    completedAt: new Date().toISOString(),
  };
  await saveResponse(response);
  return NextResponse.json({ ok: true });
}
