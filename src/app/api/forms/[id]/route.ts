import { NextRequest, NextResponse } from 'next/server';
import { getForm } from '@/lib/storage';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const form = await getForm(id);
  if (!form) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Don't expose creatorKey
  const { creatorKey, ...safe } = form;
  void creatorKey;
  return NextResponse.json(safe);
}
