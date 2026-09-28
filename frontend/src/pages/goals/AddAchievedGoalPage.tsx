import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Target, Plus, Check, Sparkles, Link2 } from 'lucide-react';
import { useGoalStore } from '../../store/goalStore';
import { useActivityStore } from '../../store/activityStore';
import { useNotificationStore } from '../../store/notificationStore';

export const AddAchievedGoalPage: React.FC = () => {
  const navigate = useNavigate();
  const { addGoal } = useGoalStore();
  const { activities, fetchActivities } = useActivityStore();
  const { addNotification } = useNotificationStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [completedAt, setCompletedAt] = useState(new Date().toISOString().split('T')[0]);
  const [project, setProject] = useState('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (activities.length === 0) {
      fetchActivities();
    }
  }, [activities.length, fetchActivities]);

  useEffect(() => {
    if (!project && activities.length > 0 && activities[0]?.project) {
      setProject(activities[0].project);
    }
  }, [activities, project]);

  const toggleActivitySelection = (id: string) => {
    if (selectedActivityIds.includes(id)) {
      setSelectedActivityIds(selectedActivityIds.filter((item) => item !== id));
    } else {
      setSelectedActivityIds([...selectedActivityIds, id]);
    }
  };

  const handleAddOutcome = () => {
    if (newOutcome.trim()) {
      setOutcomes([...outcomes, newOutcome.trim()]);
      setNewOutcome('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Ensure only valid MongoDB ObjectIds are passed
      const validActivityIds = selectedActivityIds.filter((id) => /^[0-9a-fA-F]{24}$/.test(id));

      await addGoal({
        title,
        description,
        completedAt,
        project,
        relatedActivityIds: validActivityIds,
        keyOutcomes: outcomes,
      });

      addNotification({
        type: 'success',
        title: 'Goal Recorded ✨',
        message: `Milestone "${title}" recorded and linked to your 2026 performance cycle.`,
      });

      navigate('/achieved-goals');
    } catch (err: any) {
      console.error(err);
      addNotification({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save the achieved goal milestone.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div>
        <Link
          to="/achieved-goals"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#7A6355',
            fontSize: '0.85rem',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={15} />
          <span>Back to Achieved Goals</span>
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{
          fontSize: '2.25rem',
          fontWeight: 800,
          color: '#2C1810',
          letterSpacing: '-0.03em',
        }}>
          Record Achieved Goal
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Goal Title */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
            GOAL / MILESTONE TITLE
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Zero-Downtime Payment Gateway Migration"
            required
            className="input-capsule"
          />
        </div>

        {/* Row: Project & Completed Date */}
        <div className="responsive-two-col">
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
              PRIMARY PROJECT
            </label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              className="input-capsule"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
              COMPLETION DATE
            </label>
            <input
              type="date"
              value={completedAt}
              onChange={(e) => setCompletedAt(e.target.value)}
              className="input-capsule"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
            STRATEGIC IMPACT & EXECUTIVE SUMMARY
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Summarize the core achievement, business context, and technical impact..."
            required
            className="input-capsule"
            style={{ borderRadius: '16px', resize: 'vertical' }}
          />
        </div>

        {/* Key Outcomes */}
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355', marginBottom: '0.45rem' }}>
            KEY OUTCOMES / METRICS REACHED
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
            {outcomes.map((out, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#4A2E1A' }}>
                <Check size={14} color="#7C4D2E" />
                <span>{out}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              placeholder="e.g. 99.999% availability during rollout"
              className="input-capsule"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={handleAddOutcome}
              className="btn-secondary"
            >
              <Plus size={15} />
              <span>Add Outcome</span>
            </button>
          </div>
        </div>

        {/* Link Supporting Daily Activities */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: '#7A6355' }}>
              LINK SUPPORTING DAILY ACTIVITY LOGS
            </label>
            <span style={{ fontSize: '0.75rem', color: '#7C4D2E' }}>
              {selectedActivityIds.length} Selected
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: '#FEFCF8',
            border: '1px solid rgba(139, 90, 43, 0.12)',
            borderRadius: '16px',
            padding: '0.75rem',
          }}>
            {activities.map((act) => {
              const isSelected = selectedActivityIds.includes(act.id);
              return (
                <div
                  key={act.id}
                  onClick={() => toggleActivitySelection(act.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    backgroundColor: isSelected ? 'rgba(110, 86, 207, 0.15)' : 'transparent',
                    border: isSelected ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2C1810' }}>{act.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#7A6355' }}>{act.workDate} · {act.project}</div>
                  </div>
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: isSelected ? '2px solid #7C4D2E' : '2px solid #475569',
                    backgroundColor: isSelected ? '#7C4D2E' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {isSelected && <Check size={12} color="#FFFFFF" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="mobile-action-bar" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(139, 90, 43, 0.1)', flexWrap: 'wrap' }}>
          <button type="button" onClick={() => navigate('/achieved-goals')} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
            <span>{isSubmitting ? 'Saving Goal...' : 'Record Goal'}</span>
            <Check size={16} />
          </button>
        </div>
      </form>
    </div>
  );
};
