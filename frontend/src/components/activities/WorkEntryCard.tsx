import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Folder, Tag, CheckCircle } from 'lucide-react';
import { Activity } from '../../types/activity';

interface WorkEntryCardProps {
  activity: Activity;
  isExpanded?: boolean;
  onSelect?: () => void;
}

export const WorkEntryCard: React.FC<WorkEntryCardProps> = ({
  activity,
  isExpanded = false,
  onSelect,
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      navigate(`/records/${activity.id}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`glass-card-interactive ${isExpanded ? 'ai-glow-card' : ''}`}
      style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '18px',
        cursor: 'pointer',
        position: 'relative',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        border: isExpanded ? '1px solid rgba(168, 85, 247, 0.4)' : '1px solid rgba(255, 255, 255, 0.07)',
      }}
    >
      {/* Top Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.6rem' }}>
        <h3 style={{
          fontSize: '1.05rem',
          fontWeight: 700,
          color: '#2C1810',
          letterSpacing: '-0.01em',
          margin: 0,
        }}>
          {activity.title}
        </h3>

        {/* AI sparkle indicator if active or enriched */}
        {activity.enrichmentStatus === 'done' && (
          <div style={{
            color: '#7C4D2E',
            display: 'flex',
            alignItems: 'center',
          }}>
            <Sparkles size={16} />
          </div>
        )}
      </div>

      {/* Tags Row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
        {/* Category Tag */}
        <span className="tag-chip tag-chip-category" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
          {activity.category}
        </span>

        {/* Project Tag */}
        <span className="tag-chip tag-chip-project" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>
          {activity.project}
        </span>

        {/* Work Type Tag if available */}
        {activity.workType && (
          <span className="tag-chip" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: 'rgba(255, 255, 255, 0.05)' }}>
            {activity.workType}
          </span>
        )}
      </div>

      {/* Description Snippet */}
      <p style={{
        fontSize: '0.875rem',
        color: '#7A6355',
        lineHeight: '1.5',
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: isExpanded ? 5 : 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {activity.aiRefinedText || activity.text}
      </p>
    </div>
  );
};
