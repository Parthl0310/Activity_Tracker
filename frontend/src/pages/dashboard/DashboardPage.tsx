import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trophy,
  Target,
  Briefcase,
  Sparkles,
  ArrowRight,
  Plus,
  ChevronRight,
  Calendar,
  Flame,
  CheckCircle2,
  TrendingUp,
  Folder,
  Layers
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useActivityStore } from '../../store/activityStore';
import { useGoalStore } from '../../store/goalStore';
import { getInitials } from '../../utils/stringUtils';
import { ActivityCalendar } from '../../components/dashboard/ActivityCalendar';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { activities } = useActivityStore();
  const { goals } = useGoalStore();
  const navigate = useNavigate();

  const firstName = user?.name ? user.name.split(' ')[0] : 'Engineer';
  const totalEntries = activities.length;
  const totalAchievements = activities.filter((a) => a.isAchievement).length;
  const totalGoals = goals.length;
  const activeProjects = new Set(activities.map((a) => a.project).filter(Boolean)).size;

  const reviewYear = user?.reviewYear || new Date().getFullYear();

  // Extract recent skills from the most recent activities for the AI card
  const recentSkills = Array.from(
    new Set(
      activities
        .slice(0, 5)
        .flatMap((a) => a.skills || [])
        .filter(Boolean)
    )
  ).slice(0, 4);

  // Top active project
  const topProject = activities[0]?.project || 'Active Projects';

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Bug Fix':
      case 'Production Issue':
        return { bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.3)', text: '#DC2626' };
      case 'Optimization':
        return { bg: 'rgba(5, 150, 105, 0.1)', border: 'rgba(5, 150, 105, 0.3)', text: '#059669' };
      case 'Learning':
      case 'Discussion':
        return { bg: 'rgba(200, 135, 74, 0.14)', border: 'rgba(200, 135, 74, 0.35)', text: '#7C4D2E' };
      case 'Refactor':
        return { bg: 'rgba(124, 58, 237, 0.1)', border: 'rgba(124, 58, 237, 0.3)', text: '#7C3AED' };
      default:
        return { bg: 'rgba(124, 77, 46, 0.1)', border: 'rgba(124, 77, 46, 0.25)', text: '#2C1810' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem' }}>

      {/* Header Greeting Banner */}
      <div className="mobile-header-stack" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.25rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
            <h1 style={{
              fontSize: '2.25rem',
              fontWeight: 800,
              color: '#2C1810',
              letterSpacing: '-0.03em',
              margin: 0,
            }}>
              Good morning, {firstName} 👋
            </h1>
            <span style={{
              backgroundColor: 'rgba(124, 77, 46, 0.1)',
              color: '#7C4D2E',
              border: '1px solid rgba(124, 77, 46, 0.2)',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
            }}>
              Cycle {reviewYear}
            </span>
          </div>
          <p style={{
            fontSize: '0.95rem',
            color: '#7A6355',
            margin: 0,
          }}>
            {user?.jobRole ? `${user.jobRole} • ` : ''}Here is your professional engineering footprint for {reviewYear}.
          </p>
        </div>

        <div className="mobile-action-bar" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => navigate('/records')}
            className="btn-secondary"
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.875rem',
              borderRadius: '9999px',
            }}
          >
            <span>Work Records</span>
          </button>
          <button
            onClick={() => navigate('/add-work')}
            className="btn-primary"
            style={{
              padding: '0.65rem 1.35rem',
              fontSize: '0.875rem',
              fontWeight: 700,
              borderRadius: '9999px',
              boxShadow: '0 4px 14px rgba(124, 77, 46, 0.25)',
            }}
          >
            <Plus size={18} strokeWidth={2.5} />
            <span>Add Today's Work</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Metric Cards with Enhanced Hierarchy */}
      <div className="dashboard-metrics-grid">
        {/* Card 1: ENTRIES */}
        <div
          className="glass-card-interactive dashboard-metric-card"
          style={{
            padding: '1.5rem 1.6rem',
            cursor: 'pointer',
            borderRadius: '16px',
            backgroundColor: 'rgba(254, 252, 248, 0.92)',
            border: '1px solid rgba(139, 90, 43, 0.14)',
          }}
          onClick={() => navigate('/records')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#7A6355', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              TOTAL ENTRIES
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(124, 77, 46, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7C4D2E',
            }}>
              <FileText size={16} />
            </div>
          </div>
          <div className="dashboard-metric-number" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2C1810', margin: '0.5rem 0 0.15rem 0', letterSpacing: '-0.02em' }}>
            {totalEntries}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#A89080', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <TrendingUp size={13} color="#059669" />
            <span>Logged work units this year</span>
          </div>
        </div>

        {/* Card 2: ACHIEVEMENTS */}
        {/* <div 
          className="glass-card-interactive" 
          style={{
            padding: '1.5rem 1.6rem',
            cursor: 'pointer',
            borderRadius: '16px',
            backgroundColor: 'rgba(254, 252, 248, 0.92)',
            border: '1px solid rgba(139, 90, 43, 0.14)',
          }}
          onClick={() => navigate('/achieved-goals')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#7A6355', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              ACHIEVEMENTS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(200, 135, 74, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#C8874A',
            }}>
              <Trophy size={16} />
            </div>
          </div>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2C1810', margin: '0.5rem 0 0.15rem 0', letterSpacing: '-0.02em' }}>
            {totalAchievements}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#A89080' }}>
            Milestones flagged for appraisal
          </div>
        </div> */}

        {/* Card 3: ACHIEVED GOALS */}
        <div
          onClick={() => navigate('/achieved-goals')}
          className="glass-card-interactive dashboard-metric-card"
          style={{
            padding: '1.5rem 1.6rem',
            cursor: 'pointer',
            borderRadius: '16px',
            backgroundColor: 'rgba(254, 252, 248, 0.92)',
            border: '1px solid rgba(139, 90, 43, 0.14)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#7A6355', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              GOALS DELIVERED
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(176, 120, 72, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#B07848',
            }}>
              <Target size={16} />
            </div>
          </div>
          <div className="dashboard-metric-number" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2C1810', margin: '0.5rem 0 0.15rem 0', letterSpacing: '-0.02em' }}>
            {totalGoals}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#A89080' }}>
            Quarterly targets achieved
          </div>
        </div>

        {/* Card 4: ACTIVE PROJECTS */}
        <div
          className="glass-card-interactive dashboard-metric-card"
          style={{
            padding: '1.5rem 1.6rem',
            borderRadius: '16px',
            backgroundColor: 'rgba(254, 252, 248, 0.92)',
            border: '1px solid rgba(139, 90, 43, 0.14)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#7A6355', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em' }}>
              ACTIVE STREAMS
            </span>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(124, 77, 46, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7C4D2E',
            }}>
              <Briefcase size={16} />
            </div>
          </div>
          <div className="dashboard-metric-number" style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2C1810', margin: '0.5rem 0 0.15rem 0', letterSpacing: '-0.02em' }}>
            {activeProjects}
          </div>
          <div style={{ fontSize: '0.775rem', color: '#A89080' }}>
            Distinct engineering projects
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Work & AI Insight (Matched Heights) */}
      <div className="responsive-dashboard-grid">
        {/* Left Column: Recent Work Timeline Card */}
        <div className="glass-panel" style={{
          padding: '1.75rem',
          borderRadius: '18px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#2C1810', margin: 0 }}>
                  Recent Work
                </h2>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  backgroundColor: 'rgba(124, 77, 46, 0.08)',
                  color: '#7C4D2E',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                }}>
                  {activities.length} total
                </span>
              </div>
              <button
                onClick={() => navigate('/records')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#7C4D2E',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                <span>View all</span>
                <ArrowRight size={13} />
              </button>
            </div>

            {/* Timeline Nodes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {activities.length === 0 ? (
                <div style={{ padding: '2.5rem', textAlign: 'center', color: '#A89080', fontSize: '0.9rem' }}>
                  No recent work found. Log your first activity today!
                </div>
              ) : (
                activities.slice(0, 3).map((act) => {
                  const catStyle = getCategoryColor(act.category);
                  return (
                    <div
                      key={act.id}
                      onClick={() => navigate(`/records/${act.id}`)}
                      className="glass-card-interactive"
                      style={{
                        padding: '1.1rem 1.25rem',
                        borderRadius: '14px',
                        border: '1px solid rgba(139, 90, 43, 0.12)',
                        backgroundColor: '#FEFCF8',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.725rem', fontWeight: 700, color: '#7A6355', letterSpacing: '0.03em' }}>
                          {act.displayDate || (act.workDate ? new Date(act.workDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase() : 'TODAY')}
                        </span>
                        {act.aiRefinedText && (
                          <span style={{
                            fontSize: '0.675rem',
                            color: '#7C4D2E',
                            backgroundColor: 'rgba(200, 135, 74, 0.14)',
                            border: '1px solid rgba(200, 135, 74, 0.35)',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 600,
                          }}>
                            <Sparkles size={10} /> AI Enriched
                          </span>
                        )}
                      </div>

                      <h3 style={{
                        fontSize: '0.925rem',
                        fontWeight: 700,
                        color: '#2C1810',
                        margin: '0 0 0.5rem 0',
                        lineHeight: 1.4,
                      }}>
                        {act.title || act.project || (act.text?.length > 60 ? act.text.slice(0, 60) + '...' : act.text)}
                      </h3>

                      <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.55rem',
                          borderRadius: '9999px',
                          backgroundColor: catStyle.bg,
                          border: `1px solid ${catStyle.border}`,
                          color: catStyle.text,
                        }}>
                          {act.category}
                        </span>

                        {act.project && (
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '9999px',
                            backgroundColor: 'rgba(124, 77, 46, 0.08)',
                            border: '1px solid rgba(124, 77, 46, 0.18)',
                            color: '#4A2E1A',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}>
                            <Folder size={11} />
                            <span>{act.project}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(139, 90, 43, 0.08)' }}>
            <button
              onClick={() => navigate('/records')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#7C4D2E',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: 0,
              }}
            >
              <span>View full history ({activities.length} records)</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Right Column: AI Insight & Momentum Card (Matched Height & Rich Content) */}
        <div className="glass-panel" style={{
          padding: '1.75rem',
          borderRadius: '18px',
          border: '1.5px solid rgba(200, 135, 74, 0.35)',
          backgroundColor: 'rgba(254, 252, 248, 0.98)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px rgba(124, 77, 46, 0.1)',
        }}>
          <div>
            {/* AI Badge & Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.15rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(200, 135, 74, 0.16)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B07848',
                  boxShadow: '0 0 10px rgba(200, 135, 74, 0.2)',
                }}>
                  <Sparkles size={16} />
                </div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2C1810', margin: 0 }}>
                  AI Work Synthesis
                </h2>
              </div>

              <div style={{
                fontSize: '0.675rem',
                fontWeight: 700,
                color: '#059669',
                backgroundColor: 'rgba(5, 150, 105, 0.1)',
                border: '1px solid rgba(5, 150, 105, 0.25)',
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#059669' }} />
                <span>Grounded RAG</span>
              </div>
            </div>

            {/* Quote Body */}
            <blockquote style={{
              fontSize: '0.925rem',
              lineHeight: '1.6',
              color: '#4A2E1A',
              margin: '0 0 1.25rem 0',
              padding: '0.85rem 1rem',
              backgroundColor: 'rgba(251, 246, 238, 0.85)',
              borderLeft: '3px solid #C8874A',
              borderRadius: '0 10px 10px 0',
            }}>
              {activities.length > 0 ? (
                <>
                  "Your recent work has primarily focused on <strong style={{ color: '#7C4D2E' }}>{topProject}</strong>. Strong technical velocity maintained across your logged contributions."
                </>
              ) : (
                "Log your daily work to generate grounded AI insights into your velocity, strengths, and competencies."
              )}
            </blockquote>

            {/* Momentum & Cadence Pill */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              backgroundColor: 'rgba(124, 77, 46, 0.06)',
              border: '1px solid rgba(124, 77, 46, 0.12)',
              marginBottom: '1.25rem',
            }}>
              <div style={{ color: '#C8874A' }}>
                <Flame size={18} />
              </div>
              <div style={{ fontSize: '0.8rem', color: '#5A3E2B', lineHeight: 1.4 }}>
                <strong>Steady Delivery Cadence:</strong> {totalEntries} work items cataloged for the {reviewYear} performance period.
              </div>
            </div>

            {/* Recent Tech Stack / Extracted Skills */}
            {recentSkills.length > 0 && (
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#A89080', letterSpacing: '0.04em', marginBottom: '0.45rem' }}>
                  KEY DETECTED SKILLS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {recentSkills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        fontSize: '0.725rem',
                        fontWeight: 600,
                        backgroundColor: '#FEFCF8',
                        color: '#7C4D2E',
                        border: '1px solid rgba(139, 90, 43, 0.2)',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '9999px',
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => navigate('/insights')}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '9999px',
                backgroundColor: 'rgba(124, 77, 46, 0.08)',
                border: '1px solid rgba(124, 77, 46, 0.25)',
                color: '#2C1810',
                fontWeight: 700,
                fontSize: '0.875rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <span>Explore AI Insights & Trends</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Reliable Interactive Daily Activity Calendar */}
      <ActivityCalendar activities={activities} reviewYear={reviewYear} />
    </div>
  );
};
