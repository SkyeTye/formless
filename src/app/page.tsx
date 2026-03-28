'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signIn } from 'next-auth/react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showContinue, setShowContinue] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [formId, setFormId] = useState('');
  const [creatorKey, setCreatorKey] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleViewResults = () => {
    if (!formId.trim() || !creatorKey.trim()) {
      setError('Please enter both a form ID and your creator key.');
      return;
    }
    router.push(`/f/${formId.trim()}/results?key=${creatorKey.trim()}`);
  };

  if (status === 'loading' || status === 'authenticated') {
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
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ backgroundColor: '#0f0f0f' }}
    >
      {/* Header */}
      <div className="text-center mb-16 fade-in">
        <h1
          className="text-5xl font-bold tracking-tight mb-3"
          style={{ color: '#7c6fef' }}
        >
          Formless
        </h1>
        <p className="text-lg" style={{ color: '#888888' }}>
          Forms that actually listen.
        </p>
      </div>

      {/* Main actions */}
      {!showContinue && !showResults && (
        <div className="flex flex-col gap-4 w-full max-w-sm fade-in">
          <button
            onClick={() => signIn('google')}
            className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
            style={{
              backgroundColor: '#7c6fef',
              color: '#ffffff',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#fff" fillOpacity="0.9"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#fff" fillOpacity="0.9"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#fff" fillOpacity="0.9"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#fff" fillOpacity="0.9"/>
            </svg>
            Sign in with Google
          </button>
          <button
            onClick={() => setShowContinue(true)}
            className="w-full py-3 px-6 rounded-xl text-sm transition-all duration-200"
            style={{ color: '#555555' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#888888')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
          >
            Continue without signing in
          </button>
        </div>
      )}

      {/* Options for non-signed-in users */}
      {showContinue && !showResults && (
        <div className="flex flex-col gap-4 w-full max-w-sm fade-in">
          <p className="text-sm text-center mb-2" style={{ color: '#666666' }}>
            Filling out a form shared with you?
          </p>
          <button
            onClick={() => setShowResults(true)}
            className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#1a1a1a',
              color: '#ffffff',
              border: '1px solid #2a2a2a',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#7c6fef')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
          >
            View results with creator key
          </button>
          <button
            onClick={() => setShowContinue(false)}
            className="text-sm text-center transition-all"
            style={{ color: '#555555' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#888888')}
            onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
          >
            Back
          </button>
        </div>
      )}

      {/* Results lookup (legacy key-based access) */}
      {showResults && (
        <div
          className="w-full max-w-sm rounded-2xl p-6 fade-in"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
        >
          <h2 className="text-xl font-semibold mb-4">View results</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#888888' }}>
                Form ID
              </label>
              <input
                type="text"
                value={formId}
                onChange={e => { setFormId(e.target.value); setError(''); }}
                placeholder="e.g. 3f8a2b1c-..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#0f0f0f',
                  border: '1px solid #2a2a2a',
                  color: '#ffffff',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#7c6fef')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
              />
            </div>
            <div>
              <label className="text-sm mb-1 block" style={{ color: '#888888' }}>
                Creator key
              </label>
              <input
                type="text"
                value={creatorKey}
                onChange={e => { setCreatorKey(e.target.value); setError(''); }}
                placeholder="Your secret key"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: '#0f0f0f',
                  border: '1px solid #2a2a2a',
                  color: '#ffffff',
                }}
                onFocus={e => (e.currentTarget.style.borderColor = '#7c6fef')}
                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                onKeyDown={e => e.key === 'Enter' && handleViewResults()}
              />
            </div>
            {error && (
              <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowResults(false)}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #2a2a2a',
                  color: '#888888',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
              >
                Back
              </button>
              <button
                onClick={handleViewResults}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all"
                style={{ backgroundColor: '#7c6fef', color: '#ffffff' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
              >
                View results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="mt-16 text-xs" style={{ color: '#444444' }}>
        Powered by Claude
      </p>
    </main>
  );
}
