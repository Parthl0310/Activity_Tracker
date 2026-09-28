import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Award, Brain, BarChart3, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../services/apiClient';

export const InsightsPage: React.FC = () => {
  const { user } = useAuthStore();
  const reviewYear = user?.reviewYear || new Date().getFullYear();

  const [overview, setOverview] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    apiClient.insights
      .getOverview(reviewYear)
      .then((res: any) => {
        setOverview(res.data || null);
      })
      .catch((err) => {
        console.error('Failed to load insights overview:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    setIsAiLoading(true);
    apiClient.insights
      .getAI(reviewYear)
      .then((res: any) => {
        setAiInsights(res.data || null);
      })
      .catch((err) => {
        console.error('Failed to load AI insights:', err);
      })
      .finally(() => {
        setIsAiLoading(false);
      });
  }, [reviewYear]);

  const colors = ['#7C4D2E', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: '2.25rem',
            fontWeight: 800,
            color: '#2C1810',
            letterSpacing: '-0.03em',
          }}
        >
          AI Engineering Insights
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#7A6355',
            marginTop: '0.35rem',
          }}
        >
          Aggregated productivity patterns, skill vectors, and AI career recommendations for {reviewYear}.
        </p>
      </div>

      {/* AI Synthesized Intelligence Card */}
      <div className="ai-glow-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#C8874A" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#2C1810', margin: 0 }}>
              AI Performance Synthesis
            </h2>
          </div>
          {aiInsights?.confidenceScore && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#7C4D2E',
                backgroundColor: 'rgba(124, 77, 46, 0.1)',
                border: '1px solid rgba(124, 77, 46, 0.25)',
                padding: '0.25rem 0.65rem',
                borderRadius: '9999px',
              }}
            >
              Confidence {Math.round(aiInsights.confidenceScore * 100)}%
            </span>
          )}
        </div>

        {isAiLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#7A6355', padding: '1rem 0' }}>
            <Loader2 size={18} className="animate-spin" />
            <span>Synthesizing engineering patterns with Gemini...</span>
          </div>
        ) : aiInsights ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <blockquote
              style={{
                fontSize: '1rem',
                lineHeight: '1.65',
                color: '#4A2E1A',
                margin: 0,
                padding: '1rem 1.25rem',
                backgroundColor: 'rgba(254, 252, 248, 0.7)',
                borderRadius: '12px',
                borderLeft: '3px solid #7C4D2E',
              }}
            >
              "{aiInsights.workPatternSummary}"
            </blockquote>

            <div className="dashboard-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.85rem' }}>
              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(254, 252, 248, 0.5)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7C4D2E', textTransform: 'uppercase' }}>
                  Strongest Work Area
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2C1810', marginTop: '0.25rem' }}>
                  {aiInsights.strongestWorkArea || 'Core Engineering'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(254, 252, 248, 0.5)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7C4D2E', textTransform: 'uppercase' }}>
                  Most Active Project
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2C1810', marginTop: '0.25rem' }}>
                  {aiInsights.mostActiveProject || 'Primary Projects'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(254, 252, 248, 0.5)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7C4D2E', textTransform: 'uppercase' }}>
                  Top Skill Vector
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2C1810', marginTop: '0.25rem' }}>
                  {aiInsights.topDemonstratedSkill || 'Systems Architecture'}
                </div>
              </div>

              <div style={{ padding: '0.85rem', backgroundColor: 'rgba(254, 252, 248, 0.5)', borderRadius: '10px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#7C4D2E', textTransform: 'uppercase' }}>
                  Learning Trajectory
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2C1810', marginTop: '0.25rem' }}>
                  {aiInsights.learningPattern || 'Continuous Growth'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#7A6355', margin: 0 }}>
            Log additional activities to unlock AI-synthesized engineering intelligence.
          </p>
        )}
      </div>

      {/* Monthly Histogram Strip */}
      {overview?.monthlyHistogram && (
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2C1810', marginBottom: '1.25rem' }}>
            Monthly Activity Distribution ({reviewYear})
          </h3>
          <div className="mobile-scroll-x" style={{ width: '100%' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(12, 1fr)',
                gap: '0.5rem',
                alignItems: 'flex-end',
                height: '140px',
                paddingTop: '1rem',
                minWidth: '480px',
              }}
            >
              {overview.monthlyHistogram.map((m: any) => {
                const maxCount = Math.max(...overview.monthlyHistogram.map((item: any) => item.count), 1);
                const heightPct = Math.max(Math.round((m.count / maxCount) * 100), 6);
                return (
                  <div
                    key={m.month}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                      gap: '0.35rem',
                    }}
                  >
                    <span style={{ fontSize: '0.7rem', color: '#7A6355', fontWeight: 600 }}>{m.count}</span>
                    <div
                      title={`${m.monthName}: ${m.count} entries`}
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        backgroundColor: m.count > 0 ? '#7C4D2E' : 'rgba(139, 90, 43, 0.1)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: '0.65rem', color: '#A89080', fontWeight: 700 }}>
                      {m.monthName.slice(0, 3).toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Grid: Skill Distribution & Work Breakdown */}
      <div className="responsive-insights-grid">
        {/* Skills Distribution */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2C1810', marginBottom: '1.25rem' }}>
            Top Skills
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(!overview?.topSkills || overview.topSkills.length === 0) && (
              <div style={{ fontSize: '0.85rem', color: '#7A6355' }}>No skills logged yet.</div>
            )}
            {overview?.topSkills?.slice(0, 6).map((item: any, idx: number) => {
              const total = overview.topSkills.reduce((sum: number, s: any) => sum + s.count, 0) || 1;
              const pct = Math.round((item.count / total) * 100);
              const color = colors[idx % colors.length];
              return (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: '#4A2E1A' }}>{item.name}</span>
                    <span style={{ color: '#7A6355', fontWeight: 600 }}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'rgba(139, 90, 43, 0.07)', borderRadius: '9999px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: color, borderRadius: '9999px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Work Breakdown By Type */}
        <div className="glass-panel" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2C1810', marginBottom: '1.25rem' }}>
            Work Type Breakdown
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {(!overview?.workTypeDistribution || overview.workTypeDistribution.length === 0) && (
              <div style={{ fontSize: '0.85rem', color: '#7A6355' }}>No entries logged yet.</div>
            )}
            {overview?.workTypeDistribution?.map((w: any) => {
              const total = overview.totalActivities || 1;
              const pct = Math.round((w.count / total) * 100);
              return (
                <div key={w.name} className="glass-card-interactive" style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2C1810' }}>{w.name}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#7C4D2E' }}>{pct}%</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#A89080', marginTop: '0.2rem' }}>
                    {w.count} entries logged
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
