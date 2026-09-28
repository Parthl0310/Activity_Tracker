import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { ToastContainer } from '../common/ToastContainer';
import { useActivityStore } from '../../store/activityStore';
import { useGoalStore } from '../../store/goalStore';

export const AppLayout: React.FC = () => {
  const { fetchActivities } = useActivityStore();
  const { fetchGoals } = useGoalStore();

  React.useEffect(() => {
    fetchActivities();
    fetchGoals();
  }, [fetchActivities, fetchGoals]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', backgroundColor: '#F5EDE0' }}>
      {/* Subtle top ambient lighting glow */}
      <div className="ambient-glow-top no-print" />
      <div className="ambient-curve-line no-print" />

      {/* Main App Navigation Bar */}
      <div className="no-print">
        <Navbar />
      </div>

      {/* Main Content Area with ample top clearance */}
      <main
        className="app-main-content"
        style={{
          flex: 1,
          padding: '2.75rem 2rem 5rem 2rem',
          maxWidth: '1280px',
          margin: '0 auto',
          width: '100%',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Outlet />
      </main>

      {/* Floating Global Toast Notification Container */}
      <div className="no-print">
        <ToastContainer />
      </div>

      {/* Wireframe-accurate Footer */}
      <footer
        className="no-print"
        style={{
          marginTop: 'auto',
          borderTop: '1px solid rgba(139, 90, 43, 0.1)',
          padding: '1.75rem 2rem',
          backgroundColor: 'rgba(245, 237, 224, 0.98)',
          fontSize: '0.8rem',
          color: '#A89080',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>© 2026 WorkLog AI. All rights reserved.</div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="#privacy" style={{ color: '#7A6355', textDecoration: 'none', transition: 'color 0.2s' }}>Privacy Policy</a>
            <a href="#terms" style={{ color: '#7A6355', textDecoration: 'none', transition: 'color 0.2s' }}>Terms of Service</a>
            <a href="#help" style={{ color: '#7A6355', textDecoration: 'none', transition: 'color 0.2s' }}>Help Center</a>
            <a href="#feedback" style={{ color: '#7A6355', textDecoration: 'none', transition: 'color 0.2s' }}>Feedback</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
