import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Plus, Trophy, Award, Search, Filter, Sparkles } from 'lucide-react';
import { useGoalStore } from '../../store/goalStore';
import { useNotificationStore } from '../../store/notificationStore';
import { GoalCard } from '../../components/goals/GoalCard';

export const AchievedGoalsListPage: React.FC = () => {
  const { goals, fetchGoals, deleteGoal, isLoading } = useGoalStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const [selectedQuarter, setSelectedQuarter] = useState('all');

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const getGoalQuarter = (g: any) => {
    if (g.quarter) return g.quarter;
    if (!g.completedAt) return 'Q1 2026';
    const d = new Date(g.completedAt);
    const q = Math.floor(d.getMonth() / 3) + 1;
    const year = d.getFullYear() || 2026;
    return `Q${q} ${year}`;
  };

  const filteredGoals = selectedQuarter === 'all'
    ? goals
    : goals.filter((g) => getGoalQuarter(g).includes(selectedQuarter));

  const handleDeleteGoal = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this achieved goal?')) {
      const success = await deleteGoal(id);
      if (success) {
        addNotification({
          type: 'info',
          title: 'Goal Deleted',
          message: 'The achieved goal milestone has been removed.',
        });
      }
    }
  };

  const goalsWithImpact = goals.filter((g) => g.impactScore !== undefined);
  const avgImpact = goalsWithImpact.length > 0 
    ? Math.round(goalsWithImpact.reduce((sum, g) => sum + (g.impactScore || 0), 0) / goalsWithImpact.length)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div className="mobile-header-stack" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <h1 style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            color: '#2C1810',
            letterSpacing: '-0.03em',
          }}>
            Achieved Goals
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#7A6355',
            marginTop: '0.35rem',
          }}>
            Strategic engineering milestones & quarterly goals achieved in 2026.
          </p>
        </div>

        <button
          onClick={() => navigate('/achieved-goals/new')}
          className="btn-primary"
          style={{
            padding: '0.65rem 1.35rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Achieved Goal</span>
        </button>
      </div>

      {/* Overview Stat Strip */}
      <div className="dashboard-metrics-grid" style={{
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1rem',
      }}>
        <div className="glass-panel dashboard-metric-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A6355' }}>TOTAL MILESTONES</div>
          <div className="dashboard-metric-number" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2C1810', marginTop: '0.4rem' }}>{goals.length} Goals</div>
          <div style={{ fontSize: '0.75rem', color: '#5A8A5A', marginTop: '0.2rem' }}>100% on schedule</div>
        </div>

        <div className="glass-panel dashboard-metric-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A6355' }}>AVG IMPACT SCORE</div>
          <div className="dashboard-metric-number" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#C8874A', marginTop: '0.4rem' }}>
            {avgImpact !== null ? `${avgImpact}%` : 'N/A'}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7A6355', marginTop: '0.2rem' }}>High organizational impact</div>
        </div>

        <div className="glass-panel dashboard-metric-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7A6355' }}>LINKED WORK LOGS</div>
          <div className="dashboard-metric-number" style={{ fontSize: '1.8rem', fontWeight: 800, color: '#B07848', marginTop: '0.4rem' }}>
            {goals.reduce((acc, g) => acc + (g.relatedActivityIds?.length || 0), 0)} Logs
          </div>
          <div style={{ fontSize: '0.75rem', color: '#7A6355', marginTop: '0.2rem' }}>Evidence-backed milestones</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mobile-scroll-x" style={{ display: 'flex', gap: '0.75rem', borderBottom: '1px solid rgba(139, 90, 43, 0.1)', paddingBottom: '0.75rem', whiteSpace: 'nowrap' }}>
        {[
          { id: 'all', label: 'All Goals' },
          { id: 'Q3', label: 'Q3 2026' },
          { id: 'Q2', label: 'Q2 2026' },
          { id: 'Q1', label: 'Q1 2026' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedQuarter(tab.id)}
            className={selectedQuarter === tab.id ? 'btn-primary' : 'btn-ghost'}
            style={{
              padding: '0.45rem 1rem',
              fontSize: '0.825rem',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {isLoading && goals.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: '#7A6355' }}>
            Loading achieved milestones...
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <Target size={40} color="#7C4D2E" style={{ margin: '0 auto 1rem auto' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#2C1810', marginBottom: '0.4rem' }}>
              No Milestones Found
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#7A6355', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              {selectedQuarter === 'all'
                ? 'No strategic engineering milestones recorded yet. Add your first goal to ground your annual review.'
                : `No milestones recorded for ${selectedQuarter} yet.`}
            </p>
            <button
              onClick={() => navigate('/achieved-goals/new')}
              className="btn-primary"
              style={{ padding: '0.65rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Plus size={16} />
              <span>Record First Goal</span>
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => (
            <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
          ))
        )}
      </div>
    </div>
  );
};
