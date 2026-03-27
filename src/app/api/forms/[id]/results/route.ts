import { NextRequest, NextResponse } from 'next/server';
import { getForm, getResponses } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const key = req.nextUrl.searchParams.get('key');
  const form = await getForm(id);
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (form.creatorKey !== key) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const responses = await getResponses(id);
  return NextResponse.json({ form, responses });
}
