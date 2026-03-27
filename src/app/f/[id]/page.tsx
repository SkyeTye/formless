'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Message, SectionResponse } from '@/lib/types';

interface FormData {
  id: string;
  title: string;
  intentPrompt: string;
  estimatedMinutes: number;
  sections: Array<{
    id: string;
    goal: string;
    condition?: { sectionId: string; keyword: string };
  }>;
}

type AppState = 'loading' | 'intro' | 'declined' | 'chat' | 'fistbump' | 'done' | 'error';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  color: string;
}

export default function FormPage() {
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<FormData | null>(null);
  const [appState, setAppState] = useState<AppState>('loading');

  // Chat state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [activeSections, setActiveSections] = useState<FormData['sections']>([]);
  const [transcript, setTranscript] = useState<Message[]>([]);
  const [completedSections, setCompletedSections] = useState<SectionResponse[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fist bump state
  const fistRef = useRef<HTMLDivElement>(null);
  const [fistBumped, setFistBumped] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const sparkleIdRef = useRef(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load form
  useEffect(() => {
    fetch(`/api/forms/${formId}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then((data: FormData) => {
        setForm(data);
        setAppState('intro');
      })
      .catch(() => setAppState('error'));
  }, [formId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, streamingMessage]);

  // Filter sections based on conditions
  const computeActiveSections = useCallback((
    allSections: FormData['sections'],
    completedSecs: SectionResponse[]
  ) => {
    return allSections.filter(section => {
      if (!section.condition) return true;
      const priorCompleted = completedSecs.find(c => c.sectionId === section.condition!.sectionId);
      if (!priorCompleted) {
        // Check by index: find the index of the condition section
        const conditionSectionIndex = allSections.findIndex(s => s.id === section.condition!.sectionId);
        if (conditionSectionIndex < 0) return false;
        const completedByIndex = completedSecs[conditionSectionIndex];
        if (!completedByIndex) return false;
        return completedByIndex.summary.toLowerCase().includes(section.condition!.keyword.toLowerCase());
      }
      return priorCompleted.summary.toLowerCase().includes(section.condition!.keyword.toLowerCase());
    });
  }, []);

  const startChat = useCallback(async (
    formData: FormData,
    sections: FormData['sections'],
    sectionIdx: number,
    currentTranscript: Message[],
    currentCompleted: SectionResponse[]
  ) => {
    setIsTyping(true);
    setStreamingMessage('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formIntent: formData.intentPrompt,
          sectionGoal: sections[sectionIdx].goal,
          transcript: currentTranscript,
          checkComplete: false,
        }),
      });

      if (!res.ok) throw new Error('Chat failed');
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = '';

      setIsTyping(false);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreamingMessage(full);
      }

      setStreamingMessage('');

      if (full.trim() === '[SECTION_COMPLETE]') {
        // Get summary
        const summaryRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formIntent: formData.intentPrompt,
            sectionGoal: sections[sectionIdx].goal,
            transcript: currentTranscript,
            checkComplete: true,
          }),
        });

        const summaryData = await summaryRes.json();
        let parsed: { complete: boolean; summary: string } = { complete: true, summary: '' };
        try {
          parsed = JSON.parse(summaryData.text);
        } catch {
          parsed = { complete: true, summary: summaryData.text };
        }

        const newCompleted = [
          ...currentCompleted,
          {
            sectionId: sections[sectionIdx].id,
            transcript: currentTranscript,
            summary: parsed.summary,
          },
        ];
        setCompletedSections(newCompleted);

        // Move to next section or fist bump
        const nextIdx = sectionIdx + 1;
        const active = computeActiveSections(formData.sections, newCompleted);
        setActiveSections(active);

        if (nextIdx >= active.length) {
          setAppState('fistbump');
        } else {
          setCurrentSectionIndex(nextIdx);
          setTranscript([]);
          await startChat(formData, active, nextIdx, [], newCompleted);
        }
        return;
      }

      const aiMessage: Message = { role: 'assistant', content: full };
      setTranscript(prev => [...prev, aiMessage]);
    } catch {
      setIsTyping(false);
      setStreamingMessage('');
      const errMsg: Message = { role: 'assistant', content: 'Something went wrong. Please try again.' };
      setTranscript(prev => [...prev, errMsg]);
    }
  }, [computeActiveSections]);

  const handleStart = useCallback(async () => {
    if (!form) return;
    setAppState('chat');
    const active = computeActiveSections(form.sections, []);
    setActiveSections(active);
    setCurrentSectionIndex(0);
    setTranscript([]);
    setCompletedSections([]);
    await startChat(form, active, 0, [], []);
  }, [form, computeActiveSections, startChat]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !form || isTyping || streamingMessage) return;
    const userMsg: Message = { role: 'user', content: input.trim() };
    setInput('');

    const newTranscript = [...transcript, userMsg];
    setTranscript(newTranscript);

    await startChat(form, activeSections, currentSectionIndex, newTranscript, completedSections);
  }, [input, form, isTyping, streamingMessage, transcript, activeSections, currentSectionIndex, completedSections, startChat]);

  const handleSubmitResponse = useCallback(async () => {
    if (submitting || !form) return;
    setSubmitting(true);
    try {
      await fetch(`/api/forms/${form.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionResponses: completedSections }),
      });
    } finally {
      setSubmitting(false);
      setAppState('done');
    }
  }, [submitting, form, completedSections]);

  const handleFistBump = useCallback(() => {
    if (fistBumped) return;
    setFistBumped(true);

    // Sparkle effect
    const colors = ['#7c6fef', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#ec4899'];
    const newSparkles: Sparkle[] = Array.from({ length: 12 }, (_, i) => ({
      id: sparkleIdRef.current++,
      x: 40 + Math.random() * 120,
      y: 20 + Math.random() * 80,
      color: colors[i % colors.length],
    }));
    setSparkles(newSparkles);

    setTimeout(() => {
      setSparkles([]);
      handleSubmitResponse();
    }, 2000);
  }, [fistBumped, handleSubmitResponse]);

  // Mouse proximity detection for fist bump
  useEffect(() => {
    if (appState !== 'fistbump' || fistBumped) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!fistRef.current) return;
      const rect = fistRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      if (dist < 60) {
        handleFistBump();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [appState, fistBumped, handleFistBump]);

  const cardStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '20px',
    padding: '32px',
  };

  // --- LOADING ---
  if (appState === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="typing-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </main>
    );
  }

  // --- ERROR ---
  if (appState === 'error') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center">
          <p className="text-xl font-semibold mb-2">Form not found</p>
          <p style={{ color: '#888888' }}>This form might have been removed or the link is incorrect.</p>
        </div>
      </main>
    );
  }

  // --- INTRO ---
  if (appState === 'intro' && form) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="w-full max-w-sm fade-in" style={cardStyle}>
          <p className="text-2xl font-semibold mb-3">
            Hey! Got {form.estimatedMinutes} minute{form.estimatedMinutes !== 1 ? 's' : ''} to answer a few questions?
          </p>
          <p className="text-sm mb-8" style={{ color: '#888888' }}>
            It&apos;s a quick chat — no forms to fill out.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setAppState('declined')}
              className="flex-1 py-3 rounded-xl font-medium text-sm transition-all"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', color: '#888888' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#fff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888'; }}
            >
              Not now
            </button>
            <button
              onClick={handleStart}
              className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: '#7c6fef', color: '#ffffff' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
            >
              Let&apos;s go
            </button>
          </div>
        </div>
      </main>
    );
  }

  // --- DECLINED ---
  if (appState === 'declined') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center fade-in">
          <p className="text-2xl font-semibold mb-3">No worries!</p>
          <p style={{ color: '#888888' }}>Come back when you have a few minutes. 👋</p>
        </div>
      </main>
    );
  }

  // --- DONE ---
  if (appState === 'done') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: '#0f0f0f' }}>
        <div className="text-center fade-in">
          <div className="text-5xl mb-4">✊</div>
          <p className="text-2xl font-semibold mb-2">You&apos;re all done!</p>
          <p style={{ color: '#888888' }}>Thanks for helping out. Your responses have been recorded.</p>
        </div>
      </main>
    );
  }

  // --- FIST BUMP ---
  if (appState === 'fistbump') {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6"
        style={{ backgroundColor: '#0f0f0f' }}
      >
        <div className="text-center fade-in" style={{ position: 'relative' }}>
          {!fistBumped ? (
            <>
              <p className="text-2xl font-semibold mb-2">Thanks for helping out!</p>
              <p className="text-sm mb-12" style={{ color: '#888888' }}>
                Move your mouse to the fist to finish
              </p>
              <div
                ref={fistRef}
                className="text-6xl inline-block select-none"
                style={{
                  cursor: 'default',
                  transition: 'transform 0.2s',
                  userSelect: 'none',
                }}
              >
                🤜
              </div>
              <p className="text-xs mt-4" style={{ color: '#444444' }}>
                hover to bump
              </p>
            </>
          ) : (
            <>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <div
                  className="text-6xl pulse-anim"
                  style={{ userSelect: 'none' }}
                >
                  ✊
                </div>
                {sparkles.map(s => (
                  <div
                    key={s.id}
                    className="absolute pointer-events-none"
                    style={{
                      left: s.x,
                      top: s.y,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: s.color,
                      animation: 'sparkle 0.8s ease forwards',
                    }}
                  />
                ))}
              </div>
              <p className="text-2xl font-semibold mt-4">Nice. ✊</p>
              <p className="text-sm mt-2" style={{ color: '#888888' }}>Saving your responses...</p>
            </>
          )}
        </div>
      </main>
    );
  }

  // --- CHAT ---
  if (appState === 'chat' && form) {
    const section = activeSections[currentSectionIndex];
    const totalSections = activeSections.length;

    return (
      <main
        className="flex flex-col"
        style={{
          height: '100dvh',
          backgroundColor: '#0f0f0f',
        }}
      >
        {/* Header / progress */}
        <div
          className="flex-shrink-0 px-4 pt-4 pb-3"
          style={{ borderBottom: '1px solid #1a1a1a' }}
        >
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#888888' }}>
                {form.title}
              </span>
              <span className="text-xs" style={{ color: '#888888' }}>
                Section {currentSectionIndex + 1} of {totalSections}
              </span>
            </div>
            {/* Progress bar */}
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ backgroundColor: '#2a2a2a' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  backgroundColor: '#7c6fef',
                  width: `${((currentSectionIndex + 1) / totalSections) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="max-w-lg mx-auto flex flex-col gap-3">
            {transcript.map((msg, i) => (
              <div
                key={i}
                className={`flex fade-in ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? {
                          backgroundColor: '#7c6fef',
                          color: '#ffffff',
                          borderBottomRightRadius: '6px',
                        }
                      : {
                          backgroundColor: '#1a1a1a',
                          color: '#ffffff',
                          border: '1px solid #2a2a2a',
                          borderBottomLeftRadius: '6px',
                        }
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Streaming message */}
            {streamingMessage && (
              <div className="flex justify-start fade-in">
                <div
                  className="max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    backgroundColor: '#1a1a1a',
                    color: '#ffffff',
                    border: '1px solid #2a2a2a',
                    borderBottomLeftRadius: '6px',
                  }}
                >
                  {streamingMessage}
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start fade-in">
                <div
                  className="px-4 py-3 rounded-2xl flex gap-1 items-center"
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2a',
                    borderBottomLeftRadius: '6px',
                  }}
                >
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input area */}
        <div
          className="flex-shrink-0 px-4 pb-6 pt-3"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div className="max-w-lg mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type a message..."
              disabled={isTyping || !!streamingMessage}
              className="flex-1 px-4 py-3 rounded-2xl text-sm outline-none transition-all"
              style={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #2a2a2a',
                color: '#ffffff',
                opacity: isTyping || streamingMessage ? 0.5 : 1,
              }}
              onFocus={e => (e.currentTarget.style.borderColor = '#7c6fef')}
              onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping || !!streamingMessage}
              className="px-4 py-3 rounded-2xl font-medium text-sm transition-all"
              style={{
                backgroundColor: input.trim() && !isTyping && !streamingMessage ? '#7c6fef' : '#2a2a2a',
                color: input.trim() && !isTyping && !streamingMessage ? '#ffffff' : '#666666',
                cursor: input.trim() && !isTyping && !streamingMessage ? 'pointer' : 'not-allowed',
              }}
            >
              Send
            </button>
          </div>

        </div>
      </main>
    );
  }

  return null;
}
