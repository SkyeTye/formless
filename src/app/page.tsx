'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [showResults, setShowResults] = useState(false);
  const [formId, setFormId] = useState('');
  const [creatorKey, setCreatorKey] = useState('');
  const [error, setError] = useState('');

  const handleViewResults = () => {
    if (!formId.trim() || !creatorKey.trim()) {
      setError('Please enter both a form ID and your creator key.');
      return;
    }
    router.push(`/f/${formId.trim()}/results?key=${creatorKey.trim()}`);
  };

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
      {!showResults ? (
        <div className="flex flex-col gap-4 w-full max-w-sm fade-in">
          <button
            onClick={() => router.push('/create')}
            className="w-full py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              backgroundColor: '#7c6fef',
              color: '#ffffff',
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
          >
            Create a form
          </button>
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
            View your results
          </button>
        </div>
      ) : (
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
