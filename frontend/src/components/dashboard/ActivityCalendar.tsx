import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Plus,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Activity } from '../../types/activity';

interface ActivityCalendarProps {
  activities: Activity[];
  reviewYear: number;
}

interface DayData {
  date: Date;
  dateKey: string; // YYYY-MM-DD
  dayOfMonth: number;
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  isFuture: boolean;
  activities: Activity[];
  count: number;
  projects: string[];
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  activities,
  reviewYear,
}) => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<{
    day: DayData;
    x: number;
    y: number;
  } | null>(null);

  const monthNames = [
    'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'
  ];

  const fullMonthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Map activities by ISO date (YYYY-MM-DD)
  const activityDateMap = useMemo(() => {
    const map = new Map<string, Activity[]>();
    activities.forEach((act) => {
      if (!act.workDate) return;
      const d = new Date(act.workDate);
      if (isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const list = map.get(key) || [];
      list.push(act);
      map.set(key, list);
    });
    return map;
  }, [activities]);

  // Compute Year Data with TRUE days in each month
  const yearData = useMemo(() => {
    const now = new Date();
    const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const months: DayData[][] = [];

    for (let m = 0; m < 12; m++) {
      const daysInMonth = new Date(reviewYear, m + 1, 0).getDate(); // True days (28, 29, 30, 31)
      const monthDays: DayData[] = [];

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(reviewYear, m, d);
        // ISO day of week: Mon = 0, Sun = 6
        const rawDay = dateObj.getDay();
        const dayOfWeek = rawDay === 0 ? 6 : rawDay - 1;
        const dateKey = `${reviewYear}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const acts = activityDateMap.get(dateKey) || [];
        const isFuture = dateKey > todayKey;
        const uniqueProjects = Array.from(new Set(acts.map((a) => a.project).filter(Boolean)));

        monthDays.push({
          date: dateObj,
          dateKey,
          dayOfMonth: d,
          dayOfWeek,
          isFuture,
          activities: acts,
          count: acts.length,
          projects: uniqueProjects,
        });
      }
      months.push(monthDays);
    }
    return months;
  }, [reviewYear, activityDateMap]);

  // Compute Reliability & Streak Statistics
  const stats = useMemo(() => {
    let totalActiveDays = 0;
    let totalActivitiesInYear = 0;
    let maxStreak = 0;
    let currentStreak = 0;
    let runningStreak = 0;
    const projectCounts = new Map<string, number>();

    const allDaysSorted: DayData[] = [];
    yearData.forEach((mDays) => {
      mDays.forEach((d) => {
        if (!d.isFuture) {
          allDaysSorted.push(d);
        }
      });
    });

    allDaysSorted.forEach((d) => {
      if (d.count > 0) {
        totalActiveDays++;
        totalActivitiesInYear += d.count;
        runningStreak++;
        if (runningStreak > maxStreak) maxStreak = runningStreak;
        d.projects.forEach((p) => {
          projectCounts.set(p, (projectCounts.get(p) || 0) + 1);
        });
      } else {
        runningStreak = 0;
      }
    });

    // Compute current streak ending at today / most recent active day
    let curr = 0;
    for (let i = allDaysSorted.length - 1; i >= 0; i--) {
      if (allDaysSorted[i].count > 0) {
        curr++;
      } else if (i === allDaysSorted.length - 1) {
        // Today might not have an activity yet, check yesterday
        continue;
      } else {
        break;
      }
    }
    currentStreak = curr;

    let topProject = 'None';
    let topCount = 0;
    projectCounts.forEach((c, p) => {
      if (c > topCount) {
        topCount = c;
        topProject = p;
      }
    });

    return {
      totalActiveDays,
      totalActivitiesInYear,
      maxStreak,
      currentStreak,
      topProject,
    };
  }, [yearData]);

  // Heatmap color intensity scale matching warm-caramel glass theme
  const getCellColor = (count: number, isFuture: boolean, isSelected: boolean) => {
    if (isSelected) return '#5A3319'; // High contrast selected
    if (isFuture) return 'rgba(139, 90, 43, 0.03)';
    if (count === 0) return 'rgba(139, 90, 43, 0.08)';
    if (count === 1) return '#D8BA97'; // Light caramel tan
    if (count <= 3) return '#B07848'; // Warm rich caramel
    return '#7C4D2E'; // Deep executive brown
  };

  // Selected Day Details for the Day Inspector
  const selectedDayData = useMemo(() => {
    if (!selectedDateKey) return null;
    for (const mDays of yearData) {
      const found = mDays.find((d) => d.dateKey === selectedDateKey);
      if (found) return found;
    }
    return null;
  }, [selectedDateKey, yearData]);

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', position: 'relative' }}>
      {/* Header & Controls Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            backgroundColor: 'rgba(124, 77, 46, 0.1)',
            border: '1px solid rgba(124, 77, 46, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7C4D2E',
          }}>
            <CalendarIcon size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2C1810', margin: 0 }}>
              {reviewYear} Daily Activity Log
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#7A6355' }}>
              True date-accurate activity tracking and daily cadence
            </span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          backgroundColor: 'rgba(139, 90, 43, 0.08)',
          borderRadius: '9999px',
          padding: '3px',
          border: '1px solid rgba(139, 90, 43, 0.15)',
        }}>
          <button
            onClick={() => setViewMode('year')}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: viewMode === 'year' ? '#7C4D2E' : 'transparent',
              color: viewMode === 'year' ? '#FFFFFF' : '#7A6355',
            }}
          >
            Year Heatmap
          </button>
          <button
            onClick={() => setViewMode('month')}
            style={{
              padding: '0.35rem 0.85rem',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: '9999px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: viewMode === 'month' ? '#7C4D2E' : 'transparent',
              color: viewMode === 'month' ? '#FFFFFF' : '#7A6355',
            }}
          >
            Month Explorer
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="dashboard-metrics-grid" style={{
        marginBottom: '1.75rem',
      }}>
        <div className="glass-card-interactive dashboard-metric-card" style={{
          backgroundColor: 'rgba(254, 252, 248, 0.85)',
          border: '1px solid rgba(139, 90, 43, 0.12)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{ color: '#7C4D2E' }}>
            <CheckCircle2 size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2C1810' }}>
              {stats.totalActiveDays}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#7A6355', fontWeight: 600 }}>Active Days</div>
          </div>
        </div>

        <div className="glass-card-interactive dashboard-metric-card" style={{
          backgroundColor: 'rgba(254, 252, 248, 0.85)',
          border: '1px solid rgba(139, 90, 43, 0.12)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{ color: '#C8874A' }}>
            <Flame size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2C1810' }}>
              {stats.currentStreak} {stats.currentStreak === 1 ? 'day' : 'days'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#7A6355', fontWeight: 600 }}>Current Streak</div>
          </div>
        </div>

        <div className="glass-card-interactive dashboard-metric-card" style={{
          backgroundColor: 'rgba(254, 252, 248, 0.85)',
          border: '1px solid rgba(139, 90, 43, 0.12)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{ color: '#B07848' }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2C1810' }}>
              {stats.maxStreak} {stats.maxStreak === 1 ? 'day' : 'days'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#7A6355', fontWeight: 600 }}>Best Streak</div>
          </div>
        </div>

        <div className="glass-card-interactive dashboard-metric-card" style={{
          backgroundColor: 'rgba(254, 252, 248, 0.85)',
          border: '1px solid rgba(139, 90, 43, 0.12)',
          borderRadius: '12px',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <div style={{ color: '#7C4D2E' }}>
            <Layers size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: '#2C1810',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {stats.topProject}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#7A6355', fontWeight: 600 }}>Top Project</div>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: YEAR HEATMAP (True Days for All 12 Months) */}
      {viewMode === 'year' && (
        <div style={{ width: '100%' }}>
          <div className="calendar-month-grid">
            {yearData.map((monthDays, mIndex) => {
              const firstDayWeekday = monthDays[0].dayOfWeek; // 0 = Mon
              const totalCells = firstDayWeekday + monthDays.length;
              const paddedSlots = Math.ceil(totalCells / 7) * 7;

              return (
                <div key={monthNames[mIndex]} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  {/* Month Name */}
                  <div
                    onClick={() => {
                      setSelectedMonthIndex(mIndex);
                      setViewMode('month');
                    }}
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: selectedMonthIndex === mIndex ? '#7C4D2E' : '#7A6355',
                      textAlign: 'center',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      padding: '3px 0',
                      borderRadius: '6px',
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(124, 77, 46, 0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    title="Click to explore month in detail"
                  >
                    {monthNames[mIndex]}
                  </div>

                  {/* Weekday grid for month */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: '2.5px',
                  }}>
                    {Array.from({ length: paddedSlots }).map((_, slotIndex) => {
                      const dayIndex = slotIndex - firstDayWeekday;
                      if (dayIndex < 0 || dayIndex >= monthDays.length) {
                        // Blank slot outside month bounds
                        return (
                          <div
                            key={`pad-${slotIndex}`}
                            style={{ width: '11px', height: '11px', opacity: 0 }}
                          />
                        );
                      }

                      const day = monthDays[dayIndex];
                      const isSelected = selectedDateKey === day.dateKey;

                      return (
                        <div
                          key={day.dateKey}
                          onClick={() => {
                            if (day.isFuture) return; // Future dates can NEVER be selected or clicked
                            setSelectedDateKey(isSelected ? null : day.dateKey);
                          }}
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            setHoveredDay({
                              day,
                              x: rect.left + rect.width / 2,
                              y: rect.top - 8,
                            });
                          }}
                          onMouseLeave={() => setHoveredDay(null)}
                          style={{
                            width: '11px',
                            height: '11px',
                            borderRadius: '2.5px',
                            backgroundColor: getCellColor(day.count, day.isFuture, isSelected),
                            border: isSelected
                              ? '1.5px solid #2C1810'
                              : day.isFuture
                              ? '1px dashed rgba(139, 90, 43, 0.12)'
                              : '1px solid rgba(139, 90, 43, 0.06)',
                            cursor: day.isFuture ? 'not-allowed' : 'pointer',
                            opacity: day.isFuture ? 0.28 : 1,
                            transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                            transition: 'transform 0.15s ease, background-color 0.15s ease',
                            zIndex: isSelected ? 5 : 1,
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MONTH EXPLORER (Deep dive into selected month) */}
      {viewMode === 'month' && (
        <div style={{
          backgroundColor: 'rgba(254, 252, 248, 0.95)',
          borderRadius: '16px',
          border: '1px solid rgba(139, 90, 43, 0.15)',
          padding: '1.25rem',
        }}>
          {/* Month Navigator */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}>
            <button
              onClick={() => setSelectedMonthIndex((prev) => (prev > 0 ? prev - 1 : 11))}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}
            >
              <ChevronLeft size={14} />
              <span>{monthNames[selectedMonthIndex > 0 ? selectedMonthIndex - 1 : 11]}</span>
            </button>

            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#2C1810' }}>
              {fullMonthNames[selectedMonthIndex]} {reviewYear}
            </div>

            <button
              onClick={() => setSelectedMonthIndex((prev) => (prev < 11 ? prev + 1 : 0))}
              className="btn-secondary"
              style={{ padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.75rem' }}
            >
              <span>{monthNames[selectedMonthIndex < 11 ? selectedMonthIndex + 1 : 0]}</span>
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.5rem',
            textAlign: 'center',
            fontWeight: 700,
            fontSize: '0.75rem',
            color: '#7A6355',
            paddingBottom: '0.5rem',
            borderBottom: '1px solid rgba(139, 90, 43, 0.1)',
          }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((w, i) => (
              <div key={w}>
                <span className="mobile-hide">{w}</span>
                <span className="mobile-only">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '0.25rem',
            marginTop: '0.75rem',
          }}>
            {(() => {
              const mDays = yearData[selectedMonthIndex];
              const firstDayWeekday = mDays[0].dayOfWeek;
              const totalCells = firstDayWeekday + mDays.length;
              const paddedSlots = Math.ceil(totalCells / 7) * 7;

              return Array.from({ length: paddedSlots }).map((_, slotIndex) => {
                const dayIndex = slotIndex - firstDayWeekday;
                if (dayIndex < 0 || dayIndex >= mDays.length) {
                  return (
                    <div
                      key={`month-pad-${slotIndex}`}
                      style={{
                        minHeight: '48px',
                        backgroundColor: 'rgba(139, 90, 43, 0.02)',
                        borderRadius: '8px',
                        opacity: 0.3,
                      }}
                    />
                  );
                }

                const day = mDays[dayIndex];
                const isSelected = selectedDateKey === day.dateKey;

                return (
                  <div
                    key={day.dateKey}
                    onClick={() => {
                      if (!day.isFuture) {
                        setSelectedDateKey(isSelected ? null : day.dateKey);
                      }
                    }}
                    style={{
                      minHeight: '48px',
                      padding: '0.35rem 0.25rem',
                      borderRadius: '8px',
                      backgroundColor: isSelected
                        ? 'rgba(124, 77, 46, 0.14)'
                        : day.count > 0
                        ? 'rgba(254, 252, 248, 0.95)'
                        : 'rgba(139, 90, 43, 0.03)',
                      border: isSelected
                        ? '2px solid #7C4D2E'
                        : day.count > 0
                        ? '1px solid rgba(139, 90, 43, 0.2)'
                        : '1px solid rgba(139, 90, 43, 0.06)',
                      cursor: day.isFuture ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: day.isFuture ? 0.4 : 1,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: day.count > 0 ? '#2C1810' : '#A89080',
                      }}>
                        {day.dayOfMonth}
                      </span>
                      {day.count > 0 && (
                        <div style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          backgroundColor: getCellColor(day.count, false, false),
                        }} />
                      )}
                    </div>

                    {day.count > 0 ? (
                      <div style={{ fontSize: '0.7rem', color: '#7C4D2E', fontWeight: 600 }}>
                        <span className="mobile-hide">{day.count} {day.count === 1 ? 'entry' : 'entries'}</span>
                        <span className="mobile-only">{day.count}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.65rem', color: '#C4A882' }}>—</div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Heatmap Legend Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.65rem',
        marginTop: '1.25rem',
        paddingTop: '0.85rem',
        borderTop: '1px solid rgba(139, 90, 43, 0.1)',
        fontSize: '0.75rem',
        color: '#7A6355',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span>Click any day to inspect logged entries</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ fontSize: '0.7rem' }}>Less</span>
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'rgba(139, 90, 43, 0.08)' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#D8BA97' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#B07848' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#7C4D2E' }} />
          <span style={{ fontSize: '0.7rem' }}>More</span>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredDay && (
        <div
          style={{
            position: 'fixed',
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y}px`,
            transform: 'translate(-50%, -100%)',
            backgroundColor: '#2C1810',
            color: '#FEFCF8',
            borderRadius: '8px',
            padding: '0.45rem 0.65rem',
            fontSize: '0.75rem',
            pointerEvents: 'none',
            zIndex: 9999,
            boxShadow: '0 6px 18px rgba(44, 24, 16, 0.35)',
            whiteSpace: 'nowrap',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.2rem',
          }}
        >
          <div style={{ fontWeight: 700 }}>
            {hoveredDay.day.date.toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>
          <div style={{ color: hoveredDay.day.isFuture ? '#DC2626' : hoveredDay.day.count > 0 ? '#F3D1A5' : '#C4A882', fontSize: '0.7rem' }}>
            {hoveredDay.day.isFuture
              ? 'Future date • Logging ahead is not allowed'
              : hoveredDay.day.count === 0
              ? 'No activities logged'
              : `${hoveredDay.day.count} ${hoveredDay.day.count === 1 ? 'activity' : 'activities'} logged`}
          </div>
          {hoveredDay.day.projects.length > 0 && (
            <div style={{ fontSize: '0.65rem', color: '#D8BA97' }}>
              Projects: {hoveredDay.day.projects.join(', ')}
            </div>
          )}
        </div>
      )}

      {/* DAY INSPECTOR PANEL (Revealed when a day is clicked) */}
      {selectedDayData && (
        <div style={{
          marginTop: '1.5rem',
          padding: '1.25rem',
          backgroundColor: 'rgba(254, 252, 248, 0.98)',
          border: '1.5px solid rgba(124, 77, 46, 0.25)',
          borderRadius: '16px',
          boxShadow: '0 8px 24px -4px rgba(44, 24, 16, 0.08)',
          animation: 'worklogFadeIn 0.2s ease-out',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid rgba(139, 90, 43, 0.1)',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C4D2E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                DAY INSPECTOR
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#2C1810', margin: '0.15rem 0 0 0' }}>
                {selectedDayData.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                onClick={() => setSelectedDateKey(null)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderRadius: '8px' }}
              >
                Close
              </button>
              {selectedDayData.isFuture ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  color: '#DC2626',
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '8px',
                  fontWeight: 600,
                }}>
                  <AlertCircle size={13} />
                  <span>Future Date</span>
                </div>
              ) : (
                <button
                  onClick={() => navigate(`/add-work?date=${selectedDayData.dateKey}`)}
                  className="btn-primary"
                  style={{ padding: '0.35rem 0.85rem', fontSize: '0.75rem', borderRadius: '8px' }}
                >
                  <Plus size={13} />
                  <span>Add Work for this Date</span>
                </button>
              )}
            </div>
          </div>

          {selectedDayData.isFuture ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#7A6355' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: '#DC2626' }}>
                Future dates cannot be selected for work logs.
              </p>
              <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.8rem', color: '#A89080' }}>
                WorkLog AI records activities that have been completed. Please select today or a past date.
              </p>
            </div>
          ) : selectedDayData.activities.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#7A6355' }}>
              <p style={{ margin: 0, fontSize: '0.875rem' }}>
                No activities logged on this date.
              </p>
              <button
                onClick={() => navigate(`/add-work?date=${selectedDayData.dateKey}`)}
                className="btn-secondary"
                style={{ marginTop: '0.75rem', fontSize: '0.8rem', padding: '0.4rem 1rem' }}
              >
                Log an activity for {selectedDayData.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {selectedDayData.activities.map((act) => (
                <div
                  key={act.id}
                  onClick={() => navigate(`/records/${act.id}`)}
                  className="glass-card-interactive"
                  style={{
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '1px solid rgba(139, 90, 43, 0.12)',
                    backgroundColor: '#FEFCF8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="tag-chip" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem' }}>
                        {act.category}
                      </span>
                      {act.project && (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C4D2E' }}>
                          {act.project}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#7C4D2E', fontSize: '0.75rem', fontWeight: 600 }}>
                      <span>View details</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2C1810' }}>
                    {act.title || act.project}
                  </div>

                  <p style={{
                    fontSize: '0.8rem',
                    color: '#5A3E2B',
                    margin: 0,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {act.aiRefinedText || act.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
