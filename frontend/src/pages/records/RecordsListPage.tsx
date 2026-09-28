import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Calendar,
  Folder,
  Tag,
  SlidersHorizontal,
  Sparkles,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { useActivityStore } from '../../store/activityStore';
import { WorkEntryCard } from '../../components/activities/WorkEntryCard';
import { DatePicker } from '../../components/layout/DatePicker';

export const RecordsListPage: React.FC = () => {
  const {
    filter,
    setSearchQuery,
    setTab,
    setProjectFilter,
    setCategoryFilter,
    setDateFilter,
    getFilteredActivities
  } = useActivityStore();

  const navigate = useNavigate();
  const [selectedDateFilter, setSelectedDateFilter] = useState('All Time');
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);

  const activities = getFilteredActivities();
  const allActivities = useActivityStore(state => state.activities);

  const projects = ['All Projects', ...Array.from(new Set(allActivities.map(a => a.project).filter(Boolean)))];
  const categories = ['All Categories', 'Bug Fix', 'Feature', 'Optimization', 'Refactor', 'Learning', 'Discussion', 'Production Issue', 'Documentation', 'Other'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header section matching Wireframe 3 */}
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
            My Records
          </h1>
          <p style={{
            fontSize: '0.95rem',
            color: '#7A6355',
            marginTop: '0.35rem',
          }}>
            Your complete history of completed work.
          </p>
        </div>

        <button
          onClick={() => navigate('/add-work')}
          className="btn-primary"
          style={{
            padding: '0.65rem 1.35rem',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Add Work</span>
        </button>
      </div>

      {/* Search Bar & Filter Controls */}
      <div className="glass-panel" style={{
        padding: '1.25rem 1.5rem',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.25rem',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Row 1: Search input + Filter Dropdowns */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          {/* Search Input */}
          <div style={{ flex: '1 1 200px', minWidth: '160px', position: 'relative' }}>
            <input
              type="text"
              value={filter.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your work..."
              className="input-capsule"
              style={{
                paddingLeft: '2.8rem',
                fontSize: '0.9rem',
                paddingTop: '0.65rem',
                paddingBottom: '0.65rem',
              }}
            />
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '1.15rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#A89080',
              }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowDateMenu(!showDateMenu);
                setShowProjectMenu(false);
                setShowCategoryMenu(false);
              }}
              className="btn-secondary"
              style={{
                padding: '0.65rem 1.1rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                gap: '0.4rem',
                borderColor: filter.date ? '#7C4D2E' : undefined,
              }}
            >
              <Calendar size={14} color="#94A3B8" />
              <span>{filter.date ? filter.date.toLocaleDateString() : 'Date'}</span>
              <ChevronDown size={14} color="#64748B" />
            </button>
            {showDateMenu && (
              <DatePicker
                selectedDate={filter.date}
                onChange={(d) => setDateFilter(d)}
                onClose={() => setShowDateMenu(false)}
                maxDate={new Date()}
              />
            )}
          </div>

          {/* Project Filter Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowProjectMenu(!showProjectMenu);
                setShowCategoryMenu(false);
                setShowDateMenu(false);
              }}
              className="btn-secondary"
              style={{
                padding: '0.65rem 1.1rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                gap: '0.4rem',
                borderColor: filter.project !== 'all' ? '#7C4D2E' : undefined,
              }}
            >
              <Folder size={14} color="#94A3B8" />
              <span>{filter.project === 'all' ? 'Project' : filter.project}</span>
              <ChevronDown size={14} color="#64748B" />
            </button>

            {showProjectMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '200px',
                backgroundColor: '#FEFCF8',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                borderRadius: '12px',
                padding: '0.5rem',
                zIndex: 30,
                boxShadow: '0 10px 25px rgba(124, 77, 46, 0.12)',
              }}>
                {projects.map((proj) => (
                  <div
                    key={proj}
                    onClick={() => {
                      setProjectFilter(proj === 'All Projects' ? 'all' : proj);
                      setShowProjectMenu(false);
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.825rem',
                      color: (proj === 'All Projects' && filter.project === 'all') || filter.project === proj ? '#C8874A' : '#7A6355',
                      cursor: 'pointer',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124, 77, 46, 0.07)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {proj}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter Pill */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                setShowCategoryMenu(!showCategoryMenu);
                setShowProjectMenu(false);
                setShowDateMenu(false);
              }}
              className="btn-secondary"
              style={{
                padding: '0.65rem 1.1rem',
                fontSize: '0.85rem',
                borderRadius: '9999px',
                gap: '0.4rem',
                borderColor: filter.category !== 'all' ? '#7C4D2E' : undefined,
              }}
            >
              <Tag size={14} color="#94A3B8" />
              <span>{filter.category === 'all' ? 'Category' : filter.category}</span>
              <ChevronDown size={14} color="#64748B" />
            </button>

            {showCategoryMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0,
                width: '200px',
                backgroundColor: '#FEFCF8',
                border: '1px solid rgba(139, 90, 43, 0.15)',
                borderRadius: '12px',
                padding: '0.5rem',
                zIndex: 30,
                boxShadow: '0 10px 25px rgba(124, 77, 46, 0.12)',
              }}>
                {categories.map((cat) => (
                  <div
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat === 'All Categories' ? 'all' : cat);
                      setShowCategoryMenu(false);
                    }}
                    style={{
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.825rem',
                      color: (cat === 'All Categories' && filter.category === 'all') || filter.category === cat ? '#C8874A' : '#7A6355',
                      cursor: 'pointer',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124, 77, 46, 0.07)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Subtabs (All, Work, Achievements, Achieved Goals) */}
        <div className="mobile-scroll-x" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          borderTop: '1px solid rgba(139, 90, 43, 0.1)',
          paddingTop: '1rem',
          whiteSpace: 'nowrap',
        }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'work', label: 'Work' },
            { id: 'goals', label: 'Achieved Goals' },
          ].map((tabItem) => {
            const isActive = filter.tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                onClick={() => {
                  if (tabItem.id === 'goals') {
                    navigate('/achieved-goals');
                  } else {
                    setTab(tabItem.id as any);
                  }
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isActive ? '#2C1810' : '#94A3B8',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  padding: '0.2rem 0',
                  position: 'relative',
                  transition: 'color 0.15s ease',
                }}
              >
                <span>{tabItem.label}</span>
                {isActive && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-1rem',
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#7C4D2E',
                    borderRadius: '2px',
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline Section */}
      <div>
        {/* Month Header Label */}
        <div style={{
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          color: '#A89080',
          marginBottom: '1.5rem',
          paddingLeft: '0.25rem',
        }}>
          AUGUST 2026
        </div>

        {/* Timeline Entries List */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Continuous vertical timeline connector line */}
          <div style={{
            position: 'absolute',
            left: '26px',
            top: '20px',
            bottom: '20px',
            width: '2px',
            backgroundColor: 'rgba(139, 90, 43, 0.1)',
            zIndex: 0,
          }} />

          {activities.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#A89080', position: 'relative', zIndex: 1 }}>
              <Folder size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
              <h3 style={{ fontSize: '1.1rem', color: '#7C4D2E', marginBottom: '0.5rem', fontWeight: 600 }}>No Records Found</h3>
              <p>You haven't logged any work yet, or no records match your filters.</p>
            </div>
          )}

          {activities.map((activity, index) => {
            const isFirst = index === 0;
            return (
              <div
                key={activity.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '52px minmax(0, 1fr)',
                  gap: '1.25rem',
                  alignItems: 'flex-start',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {/* Timeline Circle Node & Date */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  {/* Concentric Circle Icon */}
                  <div style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#F5EDE0',
                    border: isFirst ? '2px solid #7C4D2E' : '2px solid #475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isFirst ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none',
                  }}>
                    <div style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: isFirst ? '#7C4D2E' : '#64748B',
                    }} />
                  </div>

                  {/* Date Badge: e.g. "19 AUG" */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#4A2E1A',
                    textAlign: 'center',
                    lineHeight: '1.1',
                    marginTop: '0.2rem',
                  }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800 }}>{activity.dayNum || '19'}</span>
                    <span style={{ fontSize: '0.65rem', color: '#7A6355', letterSpacing: '0.05em' }}>{activity.monthStr || 'AUG'}</span>
                  </div>
                </div>

                {/* Entry Card (Matches Wireframe 3 item card with highlight for first item) */}
                <WorkEntryCard activity={activity} isExpanded={isFirst} />
              </div>
            );
          })}
        </div>

        {/* Loading earlier records indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          color: '#A89080',
          fontSize: '0.85rem',
          marginTop: '2.5rem',
          padding: '1rem 0',
        }}>
          {/* <Loader2 size={16} className="animate-spin" />
          <span>Loading earlier records...</span> */}
        </div>
      </div>
    </div>
  );
};
