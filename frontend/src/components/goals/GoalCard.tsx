import React from 'react';
import { Target, Trophy, Calendar, CheckCircle2, Link2, Sparkles, Trash2 } from 'lucide-react';
import { AchievedGoal } from '../../types/goal';

interface GoalCardProps {
  goal: AchievedGoal;
  onDelete?: (id: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelete }) => {
  const displayQuarter = (() => {
    if (goal.quarter) return goal.quarter;
    if (!goal.completedAt) return 'Q1 2026';
    const d = new Date(goal.completedAt);
    const q = Math.floor(d.getMonth() / 3) + 1;
    const year = d.getFullYear() || 2026;
    return `Q${q} ${year}`;
  })();

  const formattedDate = goal.completedAt
    ? new Date(goal.completedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : 'Recently';

  return (
    <div className="glass-card-interactive" style={{
      padding: '1.5rem 1.75rem',
      borderRadius: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      position: 'relative',
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            backgroundColor: 'rgba(176, 120, 72, 0.12)',
            border: '1px solid rgba(176, 120, 72, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#B07848',
          }}>
            <Trophy size={16} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
              {goal.title}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#7A6355', fontWeight: 600 }}>{displayQuarter}</span>
              {goal.project && (
                <>
                  <span style={{ color: '#A89080' }}>·</span>
                  <span className="tag-chip tag-chip-project" style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                    {goal.project}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Impact score badge */}
          {goal.impactScore !== undefined && goal.impactScore !== null && (
            <div style={{
              backgroundColor: 'rgba(124, 77, 46, 0.1)',
              border: '1px solid rgba(124, 77, 46, 0.25)',
              color: '#8B5A2B',
              borderRadius: '9999px',
              padding: '0.25rem 0.75rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}>
              <Sparkles size={12} color="#C8874A" />
              <span>Impact {goal.impactScore}%</span>
            </div>
          )}

          {/* Delete Action Button */}
          {onDelete && (
            <button
              onClick={() => onDelete(goal.id)}
              title="Delete achieved goal"
              className="btn-ghost"
              style={{
                padding: '0.4rem',
                borderRadius: '8px',
                color: '#A89080',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#A89080')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p style={{ fontSize: '0.9rem', color: '#4A2E1A', lineHeight: '1.6', margin: 0 }}>
          {goal.description}
        </p>
      )}

      {/* Key Outcomes */}
      {goal.keyOutcomes && goal.keyOutcomes.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(139, 90, 43, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.4rem',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.05em', color: '#A89080' }}>
            KEY DELIVERABLES & OUTCOMES
          </div>
          {goal.keyOutcomes.map((outcome, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#7A6355' }}>
              <CheckCircle2 size={13} color="#7C4D2E" />
              <span>{outcome}</span>
            </div>
          ))}
        </div>
      )}

      {/* Linked Activities */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '0.5rem',
        borderTop: '1px solid rgba(139, 90, 43, 0.1)',
        fontSize: '0.75rem',
        color: '#A89080',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Link2 size={13} color="#94A3B8" />
          <span>{goal.relatedActivityIds?.length || 0} Linked Activity Logs</span>
        </div>
        <div>
          Completed: {formattedDate}
        </div>
      </div>
    </div>
  );
};
