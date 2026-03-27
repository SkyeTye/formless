'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SectionDraft {
  goal: string;
  hasCondition: boolean;
  conditionSectionIndex: number;
  conditionKeyword: string;
}

type Step = 'basics' | 'sections' | 'preview';

export default function CreatePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('basics');

  // Step 1: Basics
  const [title, setTitle] = useState('');
  const [intentPrompt, setIntentPrompt] = useState('');

  // Step 2: Sections
  const [sections, setSections] = useState<SectionDraft[]>([
    { goal: '', hasCondition: false, conditionSectionIndex: 0, conditionKeyword: '' },
  ]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Step 3: Published form data
  const [publishedForm, setPublishedForm] = useState<{
    id: string;
    creatorKey: string;
    estimatedMinutes: number;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateBasics = () => {
    const newErrors: Record<string, string> = {};
    if (!title.trim()) newErrors.title = 'Please give your form a title.';
    if (!intentPrompt.trim()) newErrors.intentPrompt = 'Please describe what this form is trying to find out.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSections = () => {
    const newErrors: Record<string, string> = {};
    sections.forEach((s, i) => {
      if (!s.goal.trim()) newErrors[`section_${i}`] = 'Please describe the goal for this section.';
      if (s.hasCondition && !s.conditionKeyword.trim()) {
        newErrors[`section_cond_${i}`] = 'Please enter a keyword for the condition.';
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addSection = () => {
    setSections(prev => [
      ...prev,
      { goal: '', hasCondition: false, conditionSectionIndex: 0, conditionKeyword: '' },
    ]);
  };

  const removeSection = (index: number) => {
    setSections(prev => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, updates: Partial<SectionDraft>) => {
    setSections(prev => prev.map((s, i) => (i === index ? { ...s, ...updates } : s)));
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError('');
    try {
      const payload = {
        title,
        intentPrompt,
        sections: sections.map((s, i) => ({
          goal: s.goal,
          ...(s.hasCondition && s.conditionSectionIndex < i
            ? {
                condition: {
                  sectionId: `__placeholder_${s.conditionSectionIndex}__`,
                  keyword: s.conditionKeyword,
                },
              }
            : {}),
        })),
      };

      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to publish form');
      const form = await res.json();
      setPublishedForm({
        id: form.id,
        creatorKey: form.creatorKey,
        estimatedMinutes: form.estimatedMinutes,
      });
      setStep('preview');
    } catch {
      setPublishError('Something went wrong. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const estimatedMins = Math.max(2, sections.length * 2);

  const inputStyle = {
    backgroundColor: '#0f0f0f',
    border: '1px solid #2a2a2a',
    color: '#ffffff',
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
    resize: 'none' as const,
  };

  const cardStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '24px',
  };

  return (
    <main
      className="min-h-screen py-12 px-6"
      style={{ backgroundColor: '#0f0f0f' }}
    >
      <div className="max-w-xl mx-auto">
        {/* Back nav */}
        <button
          onClick={() => (step === 'basics' ? router.push('/') : setStep(step === 'sections' ? 'basics' : 'sections'))}
          className="flex items-center gap-2 mb-8 text-sm transition-colors"
          style={{ color: '#888888' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
        >
          <span>←</span>
          <span>{step === 'basics' ? 'Home' : step === 'sections' ? 'Back' : 'Back'}</span>
        </button>

        {/* Step indicator */}
        {step !== 'preview' && (
          <div className="flex items-center gap-3 mb-8">
            {(['basics', 'sections'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{
                    backgroundColor: step === s ? '#7c6fef' : '#2a2a2a',
                    color: step === s ? '#ffffff' : '#888888',
                  }}
                >
                  {i + 1}
                </div>
                <span
                  className="text-sm font-medium capitalize"
                  style={{ color: step === s ? '#ffffff' : '#888888' }}
                >
                  {s === 'basics' ? 'Basics' : 'Sections'}
                </span>
                {i < 1 && (
                  <div
                    className="w-8 h-px"
                    style={{ backgroundColor: '#2a2a2a' }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Basics */}
        {step === 'basics' && (
          <div className="fade-in" style={cardStyle}>
            <h1 className="text-2xl font-bold mb-2">Create a form</h1>
            <p className="text-sm mb-6" style={{ color: '#888888' }}>
              Define what you want to learn. Claude will handle the questions.
            </p>

            <div className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: '#cccccc' }}>
                  Form title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => { setTitle(e.target.value); setErrors(prev => ({ ...prev, title: '' })); }}
                  placeholder="e.g. Morning Routine Study"
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#7c6fef')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
                {errors.title && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.title}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block" style={{ color: '#cccccc' }}>
                  Intent
                </label>
                <p className="text-xs mb-2" style={{ color: '#666666' }}>
                  What is this form trying to find out? Be specific — this guides how Claude asks questions.
                </p>
                <textarea
                  value={intentPrompt}
                  onChange={e => { setIntentPrompt(e.target.value); setErrors(prev => ({ ...prev, intentPrompt: '' })); }}
                  placeholder="e.g. We're researching how people's morning routines affect their productivity throughout the day. We want to understand wakeup times, habits, and emotional state."
                  rows={4}
                  style={inputStyle}
                  onFocus={e => (e.currentTarget.style.borderColor = '#7c6fef')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                />
                {errors.intentPrompt && <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors.intentPrompt}</p>}
              </div>

              <button
                onClick={async () => {
                  if (!validateBasics()) return;
                  setLoadingSuggestions(true);
                  setStep('sections');
                  try {
                    const res = await fetch('/api/suggest', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ intentPrompt }),
                    });
                    const data = await res.json();
                    if (data.suggestions?.length) {
                      setSuggestions(data.suggestions);
                    }
                  } catch {
                    // suggestions failed silently, blank sections remain
                  } finally {
                    setLoadingSuggestions(false);
                  }
                }}
                className="w-full py-3.5 rounded-xl font-semibold transition-all mt-2"
                style={{ backgroundColor: '#7c6fef', color: '#ffffff' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Sections */}
        {step === 'sections' && (
          <div className="fade-in">
            <div style={{ ...cardStyle, marginBottom: '16px' }}>
              <h2 className="text-2xl font-bold mb-1">Sections</h2>
              <p className="text-sm" style={{ color: '#888888' }}>
                {loadingSuggestions
                  ? 'Generating suggestions based on your intent...'
                  : 'Each section is a topic Claude will explore conversationally. Add one goal per section.'}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {sections.map((section, index) => (
                <div
                  key={index}
                  className="fade-in"
                  style={{ ...cardStyle, position: 'relative' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-xs font-semibold uppercase tracking-wider"
                      style={{ color: '#7c6fef' }}
                    >
                      Section {index + 1}
                    </span>
                    {sections.length > 1 && (
                      <button
                        onClick={() => removeSection(index)}
                        className="text-xs transition-colors"
                        style={{ color: '#666666' }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#666666')}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1.5 block" style={{ color: '#cccccc' }}>
                        Goal
                      </label>
                      <textarea
                        value={section.goal}
                        onChange={e => {
                          updateSection(index, { goal: e.target.value });
                          setErrors(prev => ({ ...prev, [`section_${index}`]: '' }));
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Tab' && !section.goal && suggestions[index]) {
                            e.preventDefault();
                            updateSection(index, { goal: suggestions[index] });
                            setErrors(prev => ({ ...prev, [`section_${index}`]: '' }));
                          }
                        }}
                        placeholder={suggestions[index] || 'e.g. Find out what time they wake up and how they feel about it'}
                        rows={2}
                        style={inputStyle}
                        onFocus={e => (e.currentTarget.style.borderColor = '#7c6fef')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                      />
                      {errors[`section_${index}`] && (
                        <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors[`section_${index}`]}</p>
                      )}
                      {!section.goal && suggestions[index] && !errors[`section_${index}`] && (
                        <p className="text-xs mt-1" style={{ color: '#444444' }}>Tab to accept suggestion</p>
                      )}
                    </div>

                    {/* Conditional logic */}
                    {index > 0 && (
                      <div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={section.hasCondition}
                            onChange={e => updateSection(index, { hasCondition: e.target.checked })}
                            className="rounded"
                            style={{ accentColor: '#7c6fef' }}
                          />
                          <span className="text-sm" style={{ color: '#888888' }}>
                            Only show if a previous section contains a keyword
                          </span>
                        </label>

                        {section.hasCondition && (
                          <div className="mt-3 flex gap-2">
                            <div className="flex-1">
                              <label className="text-xs mb-1 block" style={{ color: '#666666' }}>
                                If section
                              </label>
                              <select
                                value={section.conditionSectionIndex}
                                onChange={e => updateSection(index, { conditionSectionIndex: Number(e.target.value) })}
                                style={{
                                  ...inputStyle,
                                  padding: '8px 12px',
                                  fontSize: '13px',
                                  cursor: 'pointer',
                                }}
                              >
                                {sections.slice(0, index).map((_, i) => (
                                  <option key={i} value={i} style={{ backgroundColor: '#1a1a1a' }}>
                                    Section {i + 1}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex-1">
                              <label className="text-xs mb-1 block" style={{ color: '#666666' }}>
                                Contains keyword
                              </label>
                              <input
                                type="text"
                                value={section.conditionKeyword}
                                onChange={e => {
                                  updateSection(index, { conditionKeyword: e.target.value });
                                  setErrors(prev => ({ ...prev, [`section_cond_${index}`]: '' }));
                                }}
                                placeholder="e.g. coffee"
                                style={{ ...inputStyle, padding: '8px 12px', fontSize: '13px' }}
                                onFocus={e => (e.currentTarget.style.borderColor = '#7c6fef')}
                                onBlur={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
                              />
                              {errors[`section_cond_${index}`] && (
                                <p className="text-xs mt-1" style={{ color: '#ef4444' }}>{errors[`section_cond_${index}`]}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={addSection}
                className="w-full py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px dashed #2a2a2a',
                  color: '#888888',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#7c6fef';
                  e.currentTarget.style.color = '#7c6fef';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#2a2a2a';
                  e.currentTarget.style.color = '#888888';
                }}
              >
                + Add section
              </button>

              {/* Estimated time */}
              <div
                className="text-center py-3 rounded-xl text-sm"
                style={{ color: '#888888', backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                Estimated time: <strong style={{ color: '#ffffff' }}>{estimatedMins} minutes</strong>
              </div>

              {publishError && (
                <p className="text-sm text-center" style={{ color: '#ef4444' }}>{publishError}</p>
              )}

              <button
                onClick={() => {
                  if (validateSections()) handlePublish();
                }}
                disabled={publishing}
                className="w-full py-3.5 rounded-xl font-semibold transition-all"
                style={{
                  backgroundColor: publishing ? '#444444' : '#7c6fef',
                  color: '#ffffff',
                  cursor: publishing ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => !publishing && (e.currentTarget.style.backgroundColor = '#6b5fd8')}
                onMouseLeave={e => !publishing && (e.currentTarget.style.backgroundColor = '#7c6fef')}
              >
                {publishing ? 'Publishing...' : 'Publish form'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview / Published */}
        {step === 'preview' && publishedForm && (
          <div className="fade-in" style={cardStyle}>
            <div className="text-center mb-8">
              <div className="text-4xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold mb-1">Form published!</h2>
              <p className="text-sm" style={{ color: '#888888' }}>
                Share the link below with your respondents.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Share link */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#7c6fef' }}>
                  Share with respondents
                </label>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: '#0f0f0f', border: '1px solid #2a2a2a' }}
                >
                  <code className="text-sm flex-1 truncate" style={{ color: '#cccccc' }}>
                    {typeof window !== 'undefined' ? window.location.origin : ''}/f/{publishedForm.id}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/f/${publishedForm.id}`)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
                    style={{ backgroundColor: '#2a2a2a', color: '#888888' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Results link */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider mb-2 block" style={{ color: '#7c6fef' }}>
                  Your results page (keep this secret)
                </label>
                <div
                  className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: '#0f0f0f', border: '1px solid #2a2a2a' }}
                >
                  <code className="text-sm flex-1 truncate" style={{ color: '#cccccc' }}>
                    {typeof window !== 'undefined' ? window.location.origin : ''}/f/{publishedForm.id}/results?key={publishedForm.creatorKey}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(`${window.location.origin}/f/${publishedForm.id}/results?key=${publishedForm.creatorKey}`)}
                    className="text-xs px-3 py-1.5 rounded-lg transition-all flex-shrink-0"
                    style={{ backgroundColor: '#2a2a2a', color: '#888888' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Info box */}
              <div
                className="p-4 rounded-xl text-sm"
                style={{ backgroundColor: '#0f0f0f', border: '1px solid #2a2a2a', color: '#888888' }}
              >
                <div className="flex flex-col gap-1">
                  <div>
                    <span style={{ color: '#cccccc' }}>Form ID:</span>{' '}
                    <code style={{ color: '#7c6fef' }}>{publishedForm.id}</code>
                  </div>
                  <div>
                    <span style={{ color: '#cccccc' }}>Creator key:</span>{' '}
                    <code style={{ color: '#7c6fef' }}>{publishedForm.creatorKey}</code>
                  </div>
                  <div>
                    <span style={{ color: '#cccccc' }}>Estimated time:</span>{' '}
                    <span>{publishedForm.estimatedMinutes} minutes</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => router.push(`/f/${publishedForm.id}`)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid #2a2a2a',
                    color: '#888888',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c6fef'; e.currentTarget.style.color = '#7c6fef'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888'; }}
                >
                  Preview form
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{ backgroundColor: '#7c6fef', color: '#ffffff' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#6b5fd8')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#7c6fef')}
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
