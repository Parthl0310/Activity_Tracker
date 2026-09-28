import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  Check,
  X,
  Plus,
  Info,
  ArrowLeft,
  Loader2,
  Wand2,
  Calendar,
  Layers
} from 'lucide-react';
import { useCreateActivity } from '../../hooks/useActivities';
import { ActivityCategory, WorkType } from '../../types/activity';
import { useActivityStore } from '../../store/activityStore';
import { useNotificationStore } from '../../store/notificationStore';
import { apiClient } from '../../services/apiClient';

export const AddWorkPage: React.FC = () => {
  const navigate = useNavigate();
  const { addActivity, activities } = useActivityStore();
  const { addNotification } = useNotificationStore();

  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');

  // Multi-step flow: 'input' -> 'analyzing' -> 'review' (Wireframe 2)
  const [step, setStep] = useState<'input' | 'analyzing' | 'review'>('input');
  const [activityId, setActivityId] = useState<string | null>(null);

  const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString();

  const getInitialDate = () => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      if (dateParam > todayStr) {
        return todayStr;
      }
      return dateParam;
    }
    return todayStr;
  };

  // Raw entry data
  const [rawText, setRawText] = useState('');
  const [workDate, setWorkDate] = useState(getInitialDate());

  // AI-analyzed fields (Wireframe 2 defaults)
  const [category, setCategory] = useState<ActivityCategory | ''>('');
  const [project, setProject] = useState('');
  const [workType, setWorkType] = useState<WorkType | ''>('');
  const [skills, setSkills] = useState<string[]>([]);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [aiRefinedText, setAiRefinedText] = useState('');

  // Custom tag inputs
  const [newSkill, setNewSkill] = useState('');
  const [showSkillInput, setShowSkillInput] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [showKeywordInput, setShowKeywordInput] = useState(false);

  // Sync dateParam if passed via URL (e.g. from calendar click)
  useEffect(() => {
    if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      if (dateParam > todayStr) {
        setError('Future dates are not allowed. Date has been set to today.');
        setWorkDate(todayStr);
      } else {
        setError(null);
        setWorkDate(dateParam);
      }
    }
  }, [dateParam, todayStr]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);

  const categories: ActivityCategory[] = [
    'Bug Fix',
    'Feature',
    'Optimization',
    'Refactor',
    'Learning',
    'Discussion',
    'Production Issue',
    'Documentation',
    'Other',
  ];

  const workTypes: WorkType[] = ['Technical', 'Non-Technical', 'Learning'];

  const existingProjects = Array.from(new Set(activities.map(a => a.project).filter(Boolean)));

  const [error, setError] = useState<string | null>(null);

  const handleStartAnalysis = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!workDate) {
      setError('Date is required.');
      return;
    }
    if (workDate > todayStr) {
      setError('Future dates are not allowed. Please select today or a past date.');
      setWorkDate(todayStr);
      return;
    }
    if (!rawText || !rawText.trim()) {
      setError('Work description is required.');
      return;
    }

    // Direct transition to analyzing screen
    setStep('analyzing');
    setIsSubmitting(true);

    try {
      // Run AI enrichment concurrently with a 2.5 second pause for smooth UX
      const [enrichRes] = await Promise.all([
        apiClient.activities.previewEnrich({
          text: rawText.trim(),
          project: project.trim() || undefined,
        }),
        new Promise((resolve) => setTimeout(resolve, 2500)),
      ]);

      const data = (enrichRes as any)?.data?.data || (enrichRes as any)?.data || enrichRes;
      if (data) {
        setAiRefinedText(data.aiRefinedText || rawText.trim());
        if (data.category) {
          setCategory(data.category as ActivityCategory);
        }
        if (data.workType) {
          setWorkType(data.workType as WorkType);
        }
        if (Array.isArray(data.skills) && data.skills.length > 0) {
          setSkills(data.skills);
        }
        if (Array.isArray(data.keywords) && data.keywords.length > 0) {
          setKeywords(data.keywords);
        }
        if (data.project) {
          setProject(data.project);
        }
      } else {
        setAiRefinedText(rawText.trim());
      }

      addNotification({
        type: 'ai',
        title: 'AI Enrichment Complete ✨',
        message: 'Gemini synthesized your work description with high-impact action verbs.',
      });

      setStep('review');
    } catch (err: any) {
      console.warn('Enrichment preview failed, using raw text fallback:', err);
      setAiRefinedText(rawText.trim());
      setStep('review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!rawText.trim()) return;
    setIsRegeneratingSummary(true);
    try {
      const enrichRes: any = await apiClient.activities.previewEnrich({
        text: rawText.trim(),
        project: project.trim() || undefined,
      });
      const data = enrichRes?.data?.data || enrichRes?.data || enrichRes;
      if (data?.aiRefinedText) {
        setAiRefinedText(data.aiRefinedText);
        addNotification({
          type: 'ai',
          title: 'Summary Regenerated ✨',
          message: 'Generated a fresh AI review summary for your entry.',
        });
      }
    } catch (err: any) {
      console.error('Failed to regenerate summary:', err);
      addNotification({
        type: 'error',
        title: 'Regeneration Failed',
        message: 'Could not regenerate AI summary. Please check your connection.',
      });
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
      setShowSkillInput(false);
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((k) => k !== keywordToRemove));
  };

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
      setShowKeywordInput(false);
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        text: rawText.trim(),
        aiRefinedText: aiRefinedText.trim() || undefined,
        workDate: new Date(workDate).toISOString(),
        skills,
        keywords,
      };
      if (project && project.trim()) payload.project = project.trim();
      if (category) payload.category = category as ActivityCategory;
      if (workType) payload.workType = workType as WorkType;

      const created = await addActivity(payload);
      addNotification({
        type: 'success',
        title: 'Activity Logged Successfully! 🎉',
        message: `Saved "${project.trim() || 'Work Entry'}" to your work records.`,
      });
      const targetId = (created as any)?._id || (created as any)?.id;
      if (targetId) {
        navigate(`/records/${targetId}`);
      } else {
        navigate('/records');
      }
    } catch (err: any) {
      console.error('Failed to confirm and save activity:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Unable to save work entry. Please try again.';
      setError(msg);
      addNotification({
        type: 'error',
        title: 'Failed to Save Activity',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Title Header with AI sparkle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: 'rgba(124, 77, 46, 0.1)',
          border: '1px solid rgba(124, 77, 46, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#C8874A',
        }}>
          <Sparkles size={18} />
        </div>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#2C1810',
          letterSpacing: '-0.02em',
        }}>
          {step === 'input' ? 'Log Your Work' : step === 'analyzing' ? 'Organizing your work...' : 'Entry Analyzed'}
        </h1>
      </div>

      {/* Step 1: Raw Text Input Mode */}
      {step === 'input' && (
        <form onSubmit={handleStartAnalysis} className="glass-panel" style={{ padding: '2.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.4rem' }}>
            What did you accomplish today?
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#7A6355', marginBottom: '1.5rem' }}>
            Write freely in natural language. WorkLog AI will automatically categorize, detect skills, and extract keywords.
          </p>

          {error && (
            <div style={{ backgroundColor: '#FEE2E2', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', border: '1px solid #F87171' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '280px', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355' }}>
                  WORK DATE
                </label>
                {workDate !== todayStr && (
                  <button
                    type="button"
                    onClick={() => {
                      setWorkDate(todayStr);
                      setError(null);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '0.725rem',
                      color: '#7C4D2E',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                      padding: 0,
                    }}
                  >
                    Reset to Today
                  </button>
                )}
              </div>
              <input
                type="date"
                max={todayStr}
                value={workDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val > todayStr) {
                    setError('Future dates are not allowed. Date has been reset to today.');
                    setWorkDate(todayStr);
                  } else {
                    setError(null);
                    setWorkDate(val);
                  }
                }}
                className="input-capsule mobile-input-full"
                style={{ width: '100%', maxWidth: '280px' }}
              />
              {workDate < todayStr && (
                <div style={{ fontSize: '0.75rem', color: '#7C4D2E', marginTop: '0.35rem', fontWeight: 600 }}>
                  📅 Logging past work record
                </div>
              )}
            </div>

            <div className="responsive-two-col">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.4rem' }}>
                  PROJECT (OPTIONAL — AI CAN INFER)
                </label>
                <input
                  type="text"
                  list="project-options"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  placeholder="e.g. Payment Gateway (or leave blank)"
                  className="input-capsule"
                />
                <datalist id="project-options">
                  {existingProjects.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.4rem' }}>
                  CATEGORY (OPTIONAL — AI AUTO-DETECTS)
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="select-capsule"
                >
                  <option value="">Auto-detect with AI ✨</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.4rem' }}>
                WORK TYPE (OPTIONAL — AI AUTO-DETECTS)
              </label>
              <select
                value={workType}
                onChange={(e) => setWorkType(e.target.value as any)}
                className="select-capsule mobile-input-full"
                style={{ width: '100%', maxWidth: '280px' }}
              >
                <option value="">Auto-detect with AI ✨</option>
                {workTypes.map((w) => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.4rem' }}>
                WORK DESCRIPTION
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                rows={6}
                placeholder="Describe your bug fix, feature development, system design, code reviews..."
                className="input-capsule"
                style={{ borderRadius: '16px', resize: 'vertical' }}
              />
            </div>

            <div className="mobile-action-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/records')}
                className="btn-secondary"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary"
                style={{ padding: '0.75rem 1.6rem' }}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                <span>{isSubmitting ? 'Saving to Database...' : 'Log Activity & Analyze'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Step 2: Analyzing Loading State */}
      {step === 'analyzing' && (
        <div className="glass-panel" style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.25rem',
        }}>
          <div className="animate-spin" style={{ color: '#7C4D2E' }}>
            <Loader2 size={38} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2C1810' }}>AI is analyzing your entry...</h3>
            <p style={{ fontSize: '0.85rem', color: '#7A6355', marginTop: '0.25rem' }}>Extracting key skills, project association, and work categorization</p>
          </div>
        </div>
      )}

      {/* Step 3: Entry Analyzed / AI Enrichment Review (Matches Wireframe 2 Exactly) */}
      {step === 'review' && (
        <div className="glass-panel" style={{
          padding: '2.5rem',
          borderRadius: '24px',
          backgroundColor: 'rgba(254, 252, 248, 0.95)',
          boxShadow: '0 25px 50px -12px rgba(124, 77, 46, 0.12)',
        }}>
          {/* Header Row: Entry Analyzed + AI Enriched Pill */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <h2 style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: '#2C1810',
              letterSpacing: '-0.02em',
            }}>
              Entry Analyzed
            </h2>

            <div style={{
              backgroundColor: 'rgba(124, 77, 46, 0.12)',
              border: '1px solid rgba(124, 77, 46, 0.35)',
              color: '#8B5A2B',
              borderRadius: '9999px',
              padding: '0.35rem 0.85rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}>
              <Sparkles size={13} color="#C8874A" />
              <span>AI Enriched</span>
            </div>
          </div>

          <p style={{
            fontSize: '0.875rem',
            color: '#7A6355',
            marginBottom: '2rem',
          }}>
            We've categorized your work based on your description. Review and adjust below.
          </p>

          {/* Form Fields Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Row 1: CATEGORY & PROJECT */}
            <div className="responsive-two-col">
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                  CATEGORY
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="select-capsule"
                >
                  <option value="" disabled>Select Category ▼</option>
                  {categories.map((c) => (
                    <option key={c} value={c} style={{ background: '#FBF6EE', color: '#2C1810' }}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                  PROJECT CATEGORY
                </label>
                <input
                  type="text"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  className="input-capsule"
                />
              </div>
            </div>

            {/* AI SUMMARY ROW */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355' }}>
                  AI SUMMARY
                </label>
                <button
                  type="button"
                  onClick={handleRegenerateSummary}
                  disabled={isRegeneratingSummary}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7C4D2E',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {isRegeneratingSummary ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} color="#C8874A" />}
                  <span>{isRegeneratingSummary ? 'Regenerating...' : 'Regenerate Summary ✨'}</span>
                </button>
              </div>
              <textarea
                value={aiRefinedText}
                onChange={(e) => setAiRefinedText(e.target.value)}
                rows={3}
                placeholder="AI refined summary will appear here..."
                className="input-capsule"
                style={{ borderRadius: '16px', resize: 'vertical' }}
              />
            </div>

            {/* Row 2: WORK TYPE & SKILLS DETECTED */}
            <div className="responsive-two-col" style={{ alignItems: 'flex-start' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                  WORK TYPE
                </label>
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value as any)}
                  className="select-capsule"
                >
                  <option value="" disabled>Select Work Type ▼</option>
                  {workTypes.map((w) => (
                    <option key={w} value={w} style={{ background: '#FBF6EE', color: '#2C1810' }}>{w}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                  SKILLS DETECTED
                </label>
                <div style={{
                  minHeight: '48px',
                  backgroundColor: '#FEFCF8',
                  border: '1px solid rgba(139, 90, 43, 0.15)',
                  borderRadius: '16px',
                  padding: '0.5rem 0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  flexWrap: 'wrap',
                }}>
                  {skills.map((skill) => (
                    <span key={skill} className="tag-chip" style={{ fontSize: '0.8rem', padding: '0.3rem 0.65rem' }}>
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="tag-chip-remove"
                        style={{ background: 'none', border: 'none' }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}

                  {showSkillInput ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <input
                        type="text"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        placeholder="Add skill"
                        autoFocus
                        style={{
                          background: 'rgba(139, 90, 43, 0.1)',
                          border: '1px solid #7C4D2E',
                          borderRadius: '9999px',
                          color: '#2C1810',
                          fontSize: '0.75rem',
                          padding: '0.2rem 0.6rem',
                          outline: 'none',
                          width: '90px',
                        }}
                      />
                      <button onClick={handleAddSkill} style={{ background: 'none', border: 'none', color: '#7C4D2E', cursor: 'pointer' }}>
                        <Check size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSkillInput(true)}
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        border: '1px dashed rgba(255, 255, 255, 0.3)',
                        background: 'transparent',
                        color: '#7A6355',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Plus size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 3: KEYWORDS */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
                KEYWORDS
              </label>
              <div style={{
                backgroundColor: '#FEFCF8',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                borderRadius: '16px',
                padding: '0.65rem 0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap',
              }}>
                {keywords.map((kw) => (
                  <span key={kw} className="tag-chip" style={{ fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}>
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(kw)}
                      className="tag-chip-remove"
                      style={{ background: 'none', border: 'none' }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {showKeywordInput ? (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <input
                      type="text"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="Add tag"
                      autoFocus
                      style={{
                        background: 'rgba(139, 90, 43, 0.1)',
                        border: '1px solid #7C4D2E',
                        borderRadius: '9999px',
                        color: '#2C1810',
                        fontSize: '0.75rem',
                        padding: '0.2rem 0.6rem',
                        outline: 'none',
                        width: '90px',
                      }}
                    />
                    <button onClick={handleAddKeyword} style={{ background: 'none', border: 'none', color: '#7C4D2E', cursor: 'pointer' }}>
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowKeywordInput(true)}
                    className="tag-chip-add"
                  >
                    <Plus size={13} />
                    <span>Add Tag</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom Row: Disclaimer info & Action Buttons matching Wireframe 2 */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginTop: '1rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(139, 90, 43, 0.1)',
            }}>
              {/* Left: Info note */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#7A6355', fontSize: '0.825rem' }}>
                <Info size={15} color="#64748B" />
                <span>You can edit anything AI detected.</span>
              </div>

              {/* Right: Actions */}
              <div className="mobile-action-bar" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="btn-secondary"
                  style={{
                    padding: '0.65rem 1.35rem',
                    fontSize: '0.875rem',
                    borderRadius: '9999px',
                  }}
                >
                  Edit Raw Entry
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    padding: '0.65rem 1.6rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    gap: '0.4rem',
                  }}
                >
                  <span>{isSubmitting ? 'Saving...' : 'Confirm'}</span>
                  <Check size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
