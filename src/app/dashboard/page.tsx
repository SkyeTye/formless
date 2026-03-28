'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

interface FormSummary {
  id: string;
  title: string;
  createdAt: string;
  sections: Array<{ id: string; goal: string }>;
  estimatedMinutes: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
      return;
    }
    if (status !== 'authenticated') return;

    fetch('/api/forms/mine')
      .then(r => r.json())
      .then((data: FormSummary[]) => {
        setForms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [status, router]);

  const copyLink = (formId: string) => {
    const url = `${window.location.origin}/f/${formId}`;
    navigator.clipboard.writeText(url);
    setCopied(formId);
    setTimeout(() => setCopied(null), 2000);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#7c6fef',
                animation: 'typing 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#0f0f0f' }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid #1a1a1a' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold" style={{ color: '#7c6fef' }}>Formless</h1>
          <span className="text-sm" style={{ color: '#444444' }}>Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          {session?.user?.image && (
            <img
              src={session.user.image}
              alt="avatar"
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm hidden sm:block" style={{ color: '#888888' }}>
            {session?.user?.name ?? session?.user?.email}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-sm px-3 py-1.5 rounded-lg transition-all"
            style={{ backgroundColor: '#1a1a1a', color: '#888888', border: '1px solid #2a2a2a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
          >
            Sign out
          </button>
          <button
            onClick={() => router.push('/create')}
            className="text-sm px-4 py-1.5 rounded-lg font-semibold transition-all"
            style={{ backgroundColor: '#7c6fef', color: '#ffffff' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
          >
            New form
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold mb-6">Your forms</h2>

        {forms.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl"
            style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            <p className="text-lg font-medium mb-2">No forms yet</p>
            <p className="text-sm mb-6" style={{ color: '#888888' }}>
              Create your first form to start collecting responses.
            </p>
            <button
              onClick={() => router.push('/create')}
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: '#7c6fef', color: '#ffffff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
            >
              Create your first form
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {forms.map(form => (
              <div
                key={form.id}
                className="rounded-2xl p-5"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{form.title}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs" style={{ color: '#666666' }}>
                        {formatDate(form.createdAt)}
                      </span>
                      <span className="text-xs" style={{ color: '#444444' }}>·</span>
                      <span className="text-xs" style={{ color: '#666666' }}>
                        {form.sections.length} section{form.sections.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => copyLink(form.id)}
                      className="text-xs px-3 py-1.5 rounded-lg transition-all"
                      style={{
                        backgroundColor: copied === form.id ? '#7c6fef20' : '#0f0f0f',
                        color: copied === form.id ? '#7c6fef' : '#888888',
                        border: '1px solid #2a2a2a',
                      }}
                      onMouseEnter={e => {
                        if (copied !== form.id) e.currentTarget.style.color = '#ffffff';
                      }}
                      onMouseLeave={e => {
                        if (copied !== form.id) e.currentTarget.style.color = '#888888';
                      }}
                    >
                      {copied === form.id ? 'Copied!' : 'Share link'}
                    </button>
                    <button
                      onClick={() => router.push(`/f/${form.id}/results`)}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                      style={{ backgroundColor: '#7c6fef', color: '#ffffff' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
                    >
                      Results
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
