import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { useAuthStore } from './store/authStore';

// Pages
import { LoginPage } from './pages/auth/LoginPage';
import { SignupPage } from './pages/auth/SignupPage';
import { ProfileSetupPage } from './pages/onboarding/ProfileSetupPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { RecordsListPage } from './pages/records/RecordsListPage';
import { WorkDetailsPage } from './pages/records/WorkDetailsPage';
import { AddWorkPage } from './pages/activities/AddWorkPage';
import { AchievedGoalsListPage } from './pages/goals/AchievedGoalsListPage';
import { AddAchievedGoalPage } from './pages/goals/AddAchievedGoalPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { InsightsPage } from './pages/insights/InsightsPage';

export const App: React.FC = () => {
  const { fetchProfile, token } = useAuthStore();

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected App Routes with Layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/onboarding" element={<ProfileSetupPage />} />
            <Route path="/records" element={<RecordsListPage />} />
            <Route path="/records/:id" element={<WorkDetailsPage />} />
            <Route path="/add-work" element={<AddWorkPage />} />
            <Route path="/achieved-goals" element={<AchievedGoalsListPage />} />
            <Route path="/achieved-goals/new" element={<AddAchievedGoalPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
          </Route>
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
