import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getFormsByUser } from '@/lib/storage';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const forms = await getFormsByUser(session.user.id);
  // Sort newest first, strip creatorKey
  const sorted = forms
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(({ creatorKey: _key, ...f }) => f);
  return NextResponse.json(sorted);
}
