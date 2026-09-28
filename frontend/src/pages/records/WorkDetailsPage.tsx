import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Calendar, 
  Folder, 
  Sparkles, 
  Tag, 
  CheckCircle2, 
  Layers, 
  Loader2 
} from 'lucide-react';
import { useActivityStore } from '../../store/activityStore';
import { useNotificationStore } from '../../store/notificationStore';
import { apiClient } from '../../services/apiClient';
import { Activity } from '../../types/activity';

export const WorkDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getActivityById, deleteActivity, updateActivity } = useActivityStore();
  const { addNotification } = useNotificationStore();

  const storeActivity = id ? getActivityById(id) : undefined;
  const [activity, setActivity] = useState<Activity | null>(storeActivity || null);
  const [isLoading, setIsLoading] = useState<boolean>(!storeActivity);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(storeActivity?.title || '');
  const [editedText, setEditedText] = useState(storeActivity?.text || '');
  const [isImproving, setIsImproving] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const handleImproveWithAI = async () => {
    if (!activity?.id) return;
    setIsImproving(true);
    setSuggestion(null);
    try {
      const res: any = await apiClient.activities.improveWithAI(activity.id);
      const data = res.data || res;
      setSuggestion(data.suggestion || data.data?.suggestion || 'No suggestion returned.');
    } catch (err: any) {
      console.error('Failed to improve entry:', err);
    } finally {
      setIsImproving(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!activity?.id || !suggestion) return;
    setIsAccepting(true);
    try {
      const updated = await updateActivity(activity.id, {
        aiRefinedText: suggestion,
        text: suggestion,
      });
      if (updated) {
        setActivity(updated);
        setEditedText(updated.text);
      } else {
        setActivity((prev) => (prev ? { ...prev, aiRefinedText: suggestion, text: suggestion } : null));
        setEditedText(suggestion);
      }
      setSuggestion(null);
      addNotification({
        type: 'ai',
        title: 'AI Improvement Applied ✨',
        message: 'Activity description updated with refined summary.',
      });
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  useEffect(() => {
    if (storeActivity) {
      setActivity(storeActivity);
      setEditedTitle(storeActivity.title);
      setEditedText(storeActivity.text);
      setIsLoading(false);
      return;
    }

    if (!id) {
      setError('Activity ID is missing');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    apiClient.activities
      .getById(id)
      .then((res: any) => {
        const raw = res.data?.activity || res.activity;
        if (!raw) {
          setError('Activity record not found');
          return;
        }
        const dateObj = new Date(raw.workDate);
        const day = dateObj.getDate().toString().padStart(2, '0');
        const month = dateObj.toLocaleString('en-US', { month: 'short' }).toUpperCase();
        const formattedTitle =
          raw.title ||
          raw.project ||
          (raw.text ? (raw.text.length > 50 ? raw.text.slice(0, 50).trim() + '...' : raw.text) : 'Work Entry');

        const act: Activity = {
          ...raw,
          title: formattedTitle,
          displayDate: `${day} ${month}`,
          dayNum: day,
          monthStr: month,
        };

        setActivity(act);
        setEditedTitle(formattedTitle);
        setEditedText(act.text);
      })
      .catch((err: any) => {
        console.error('Failed to load activity:', err);
        setError('Activity record not found or could not be loaded.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id, storeActivity]);

  const handleDelete = async () => {
    if (!activity) return;
    if (window.confirm('Are you sure you want to delete this record?')) {
      await deleteActivity(activity.id);
      addNotification({
        type: 'info',
        title: 'Activity Deleted',
        message: 'The work record has been removed from your history.',
      });
      navigate('/records');
    }
  };

  const handleSaveEdit = async () => {
    if (!activity) return;
    setIsSavingEdit(true);
    try {
      const updated = await updateActivity(activity.id, {
        title: editedTitle,
        text: editedText,
      });
      if (updated) {
        setActivity(updated);
        setEditedTitle(updated.title || '');
        setEditedText(updated.text);
      }
      setIsEditing(false);
      addNotification({
        type: 'success',
        title: 'Activity Updated & Re-enriched ✨',
        message: 'Your modifications were saved and re-indexed into the AI pipeline.',
      });
    } catch (err: any) {
      console.error('Failed to save edits:', err);
      addNotification({
        type: 'error',
        title: 'Failed to Save Changes',
        message: 'Unable to save your updates. Please try again.',
      });
    } finally {
      setIsSavingEdit(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', gap: '1rem', color: '#7A6355' }}>
        <Loader2 size={32} className="animate-spin" />
        <p style={{ fontSize: '0.95rem' }}>Loading work details...</p>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', maxWidth: '600px', margin: '2rem auto' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.75rem' }}>Record Not Found</h2>
        <p style={{ color: '#7A6355', marginBottom: '1.5rem', fontSize: '0.9rem' }}>{error || "The requested work record could not be found or has been deleted."}</p>
        <Link to="/records" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          <span>Back to Records</span>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Top Breadcrumb link */}
      <div>
        <Link
          to="/records"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#7A6355',
            fontSize: '0.85rem',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4A2E1A')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
        >
          <ArrowLeft size={15} />
          <span>Back to Records</span>
        </Link>
      </div>

      {/* Header and Action Buttons matching Wireframe 5 */}
      <div className="mobile-header-stack" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 800,
          color: '#2C1810',
          letterSpacing: '-0.03em',
        }}>
          Work Details
        </h1>

        <div className="mobile-action-bar" style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleImproveWithAI}
            disabled={isImproving}
            className="btn-secondary"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.85rem',
              borderRadius: '9999px',
              color: '#7C4D2E',
              borderColor: 'rgba(124, 77, 46, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            {isImproving ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} color="#C8874A" />}
            <span>{isImproving ? 'Analyzing...' : 'Improve Entry'}</span>
          </button>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="btn-secondary"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.85rem',
              borderRadius: '9999px',
            }}
          >
            <Edit3 size={15} color="#94A3B8" />
            <span>{isEditing ? 'Cancel' : 'Edit'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="btn-secondary"
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.85rem',
              borderRadius: '9999px',
              color: '#F87171',
              borderColor: 'rgba(239, 68, 68, 0.25)',
            }}
          >
            <Trash2 size={15} color="#F87171" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Content: 2-Column Split */}
      <div className="responsive-details-grid">
        {/* Left Column: Main Record Details */}
        <div className="glass-panel" style={{ padding: '2rem 2.25rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A6355' }}>TITLE</label>
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="input-capsule"
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A6355' }}>DESCRIPTION</label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!editedText.trim()) return;
                    setIsImproving(true);
                    try {
                      const res: any = await apiClient.activities.previewEnrich({ text: editedText.trim() });
                      const d = res.data?.data || res.data || res;
                      if (d.aiRefinedText) {
                        setEditedText(d.aiRefinedText);
                      }
                    } catch (e) {
                      console.error(e);
                    } finally {
                      setIsImproving(false);
                    }
                  }}
                  disabled={isImproving}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#7C4D2E',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  {isImproving ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} color="#C8874A" />}
                  <span>{isImproving ? 'Improving...' : 'Improve Description with AI ✨'}</span>
                </button>
              </div>
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                rows={6}
                className="input-capsule"
                style={{ borderRadius: '16px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button onClick={() => setIsEditing(false)} disabled={isSavingEdit} className="btn-secondary">Cancel</button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  {isSavingEdit && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSavingEdit ? 'Saving & Enriching...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Title & Metadata Pills */}
              <div>
                <h2 style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  color: '#2C1810',
                  letterSpacing: '-0.02em',
                  marginBottom: '1rem',
                }}>
                  {activity.title}
                </h2>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(139, 90, 43, 0.06)',
                    border: '1px solid rgba(139, 90, 43, 0.12)',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.8rem',
                    color: '#4A2E1A',
                  }}>
                    <Calendar size={14} color="#94A3B8" />
                    <span>{activity.displayDate || '18 Aug 2026'}</span>
                  </div>

                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    backgroundColor: 'rgba(30, 58, 138, 0.25)',
                    border: '1px solid rgba(176, 120, 72, 0.25)',
                    borderRadius: '9999px',
                    padding: '0.35rem 0.85rem',
                    fontSize: '0.8rem',
                    color: '#B07848',
                  }}>
                    <Folder size={14} color="#B07848" />
                    <span>{activity.project}</span>
                  </div>
                </div>
              </div>

              {/* AI Suggested Improvement Panel (if requested) */}
              {suggestion && (
                <div style={{
                  backgroundColor: 'rgba(124, 77, 46, 0.08)',
                  border: '1px solid rgba(124, 77, 46, 0.25)',
                  borderRadius: '16px',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#7C4D2E', fontWeight: 700, fontSize: '0.85rem' }}>
                      <Sparkles size={16} color="#C8874A" />
                      <span>AI Suggested Improvement (Not Saved Automatically)</span>
                    </div>
                    <button
                      onClick={() => setSuggestion(null)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A6355', fontSize: '0.8rem', fontWeight: 600 }}
                    >
                      Dismiss
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.92rem', color: '#2C1810', lineHeight: '1.6', fontStyle: 'italic' }}>
                    "{suggestion}"
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                      onClick={() => setSuggestion(null)}
                      className="btn-secondary"
                      style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={handleAcceptSuggestion}
                      disabled={isAccepting}
                      className="btn-primary"
                      style={{ padding: '0.4rem 1.1rem', fontSize: '0.8rem' }}
                    >
                      {isAccepting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                      <span>{isAccepting ? 'Saving...' : 'Accept & Store Refined Text'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Description Section */}
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#A89080',
                  marginBottom: '0.75rem',
                }}>
                  DESCRIPTION
                </div>
                <p style={{
                  fontSize: '0.95rem',
                  lineHeight: '1.7',
                  color: '#4A2E1A',
                  margin: 0,
                }}>
                  {activity.text}
                </p>
              </div>

              {/* Artifacts Attached Container */}
              <div style={{
                border: '1px dashed rgba(139, 90, 43, 0.2)',
                borderRadius: '16px',
                padding: '1.75rem',
                textAlign: 'center',
                color: '#A89080',
                fontSize: '0.85rem',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
              }}>
                No related artifacts attached to this record.
              </div>
            </>
          )}
        </div>

        {/* Right Column: AI Classification & Record Attributes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 1: AI CLASSIFICATION (Glowing Card matching Wireframe 5) */}
          <div className="ai-glow-card" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#8B5A2B', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                <Sparkles size={14} color="#C8874A" />
                <span>AI CLASSIFICATION</span>
              </div>
              <span style={{
                fontSize: '0.7rem',
                color: '#4A2E1A',
                backgroundColor: 'rgba(139, 90, 43, 0.1)',
                border: '1px solid rgba(139, 90, 43, 0.18)',
                borderRadius: '9999px',
                padding: '0.2rem 0.6rem',
                fontWeight: 500,
              }}>
                Auto-Tagged
              </span>
            </div>

            <h3 style={{
              fontSize: '1.35rem',
              fontWeight: 700,
              color: '#2C1810',
              marginBottom: '0.6rem',
            }}>
              {activity.workType ? `${activity.workType} Work` : 'Technical Work'}
            </h3>

            <p style={{
              fontSize: '0.85rem',
              color: '#7A6355',
              lineHeight: '1.5',
              margin: 0,
            }}>
              {activity.aiClassificationSummary || (activity.aiRefinedText ? `Refined: "${activity.aiRefinedText}"` : `Automated classification identified ${activity.skills?.length || 0} skills and domain keywords.`)}
            </p>
          </div>

          {/* Card 2: RECORD ATTRIBUTES */}
          <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: '#A89080' }}>
              RECORD ATTRIBUTES
            </div>

            {/* Category */}
            <div>
              <div style={{ fontSize: '0.8rem', color: '#7A6355', marginBottom: '0.5rem' }}>Category</div>
              <span className="tag-chip tag-chip-category" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                {activity.category || 'General'}
              </span>
            </div>

            {/* Skills Applied */}
            <div>
              <div style={{ fontSize: '0.8rem', color: '#7A6355', marginBottom: '0.5rem' }}>Skills Applied</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(activity.skills || []).map((skill) => (
                  <span key={skill} className="tag-chip" style={{ fontSize: '0.8rem', padding: '0.35rem 0.8rem' }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Keywords */}
            {activity.keywords && activity.keywords.length > 0 && (
              <div>
                <div style={{ fontSize: '0.8rem', color: '#7A6355', marginBottom: '0.5rem' }}>Keywords</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {activity.keywords.map((kw) => (
                    <span key={kw} className="tag-chip" style={{ fontSize: '0.75rem', background: 'rgba(139, 90, 43, 0.06)', color: '#7A6355' }}>
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
