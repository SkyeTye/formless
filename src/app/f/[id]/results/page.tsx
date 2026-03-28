'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Form, Response, SectionResponse } from '@/lib/types';

interface ResultsData {
  form: Form;
  responses: Response[];
}

export default function ResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { status } = useSession();
  const formId = params.id as string;
  const key = searchParams.get('key');

  const [data, setData] = useState<ResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Wait for session to resolve before deciding what to do
    if (status === 'loading') return;

    if (status === 'unauthenticated' && !key) {
      router.push('/');
      return;
    }

    const url = key
      ? `/api/forms/${formId}/results?key=${encodeURIComponent(key)}`
      : `/api/forms/${formId}/results`;

    fetch(url)
      .then(r => {
        if (r.status === 401) throw new Error('You do not have access to these results.');
        if (r.status === 404) throw new Error('Form not found.');
        if (!r.ok) throw new Error('Failed to load results.');
        return r.json();
      })
      .then((d: ResultsData) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, [formId, key, status, router]);

  const toggleTranscript = (transcriptKey: string) => {
    setExpandedTranscripts(prev => {
      const next = new Set(prev);
      if (next.has(transcriptKey)) next.delete(transcriptKey);
      else next.add(transcriptKey);
      return next;
    });
  };

  const getSectionGoal = (form: Form, sectionId: string) => {
    return form.sections.find(s => s.id === sectionId)?.goal ?? 'Unknown section';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const cardStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
  };

  if (status === 'loading' || loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Access denied</p>
          <p style={{ color: '#888888' }}>{error}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-6 text-sm px-4 py-2 rounded-lg transition-all"
            style={{ backgroundColor: '#1a1a1a', color: '#888888', border: '1px solid #2a2a2a' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
          >
            Go home
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const { form, responses } = data;

  return (
    <main className="min-h-screen py-12 px-6" style={{ backgroundColor: '#0f0f0f' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-10 fade-in">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-xs transition-colors mr-2"
              style={{ color: '#555555' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#7c6fef')}
              onMouseLeave={e => (e.currentTarget.style.color = '#555555')}
            >
              Dashboard
            </button>
            <span style={{ color: '#333333' }}>›</span>
            <span
              className="text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md"
              style={{ backgroundColor: '#7c6fef20', color: '#7c6fef' }}
            >
              Results
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{form.title}</h1>
          <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
            {form.intentPrompt}
          </p>
          <div className="flex items-center gap-4 mt-4">
            <span className="text-sm" style={{ color: '#666666' }}>
              {responses.length} response{responses.length !== 1 ? 's' : ''}
            </span>
            <span className="text-sm" style={{ color: '#666666' }}>
              {form.sections.length} section{form.sections.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* No responses */}
        {responses.length === 0 && (
          <div
            className="text-center py-16"
            style={{ ...cardStyle }}
          >
            <p className="text-lg font-medium mb-2">No responses yet</p>
            <p className="text-sm" style={{ color: '#888888' }}>
              Share your form link to start collecting responses.
            </p>
          </div>
        )}

        {/* Responses */}
        <div className="flex flex-col gap-6">
          {responses.map((response, rIdx) => (
            <div key={response.id} className="fade-in" style={cardStyle}>
              {/* Response header */}
              <div
                className="px-6 py-4"
                style={{ borderBottom: '1px solid #2a2a2a' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">
                    Response #{rIdx + 1}
                  </span>
                  <span className="text-xs" style={{ color: '#666666' }}>
                    {formatDate(response.completedAt)}
                  </span>
                </div>
              </div>

              {/* Section summaries */}
              <div className="p-4 flex flex-col gap-3">
                {response.sectionResponses.map((sr: SectionResponse, sIdx: number) => {
                  const transcriptKey = `${response.id}-${sr.sectionId}`;
                  const isExpanded = expandedTranscripts.has(transcriptKey);
                  const goal = getSectionGoal(form, sr.sectionId);

                  return (
                    <div
                      key={sr.sectionId}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: '#0f0f0f', border: '1px solid #2a2a2a' }}
                    >
                      {/* Section label */}
                      <div className="px-4 py-3 flex items-start gap-3">
                        <div
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5"
                          style={{ backgroundColor: '#7c6fef20', color: '#7c6fef' }}
                        >
                          {sIdx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs mb-1" style={{ color: '#666666' }}>
                            {goal}
                          </p>
                          <p className="text-sm leading-relaxed" style={{ color: '#cccccc' }}>
                            {sr.summary}
                          </p>

                          {/* Expand transcript */}
                          {sr.transcript.length > 0 && (
                            <button
                              onClick={() => toggleTranscript(transcriptKey)}
                              className="text-xs mt-2 transition-colors"
                              style={{ color: '#444444' }}
                              onMouseEnter={e => (e.currentTarget.style.color = '#7c6fef')}
                              onMouseLeave={e => (e.currentTarget.style.color = '#444444')}
                            >
                              {isExpanded ? 'Hide transcript' : 'Show transcript'} ({sr.transcript.length} message{sr.transcript.length !== 1 ? 's' : ''})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Transcript */}
                      {isExpanded && sr.transcript.length > 0 && (
                        <div
                          className="px-4 pb-4 flex flex-col gap-2"
                          style={{ borderTop: '1px solid #1a1a1a' }}
                        >
                          <div className="pt-3 flex flex-col gap-2">
                            {sr.transcript.map((msg, mIdx) => (
                              <div
                                key={mIdx}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                <div
                                  className="max-w-xs px-3 py-2 rounded-xl text-xs leading-relaxed"
                                  style={
                                    msg.role === 'user'
                                      ? {
                                          backgroundColor: '#7c6fef30',
                                          color: '#cccccc',
                                          borderBottomRightRadius: '4px',
                                        }
                                      : {
                                          backgroundColor: '#1a1a1a',
                                          color: '#aaaaaa',
                                          border: '1px solid #2a2a2a',
                                          borderBottomLeftRadius: '4px',
                                        }
                                  }
                                >
                                  {msg.content}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {responses.length > 0 && (
          <div className="mt-8 pt-8 text-center" style={{ borderTop: '1px solid #1a1a1a' }}>
            <p className="text-xs" style={{ color: '#333333' }}>
              Powered by Formless · {responses.length} total response{responses.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
