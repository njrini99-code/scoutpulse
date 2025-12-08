import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { StartDayView } from './components/StartDay/StartDayView';
import { DayBuilderView } from './components/DayBuilder/DayBuilderView';
import { PhoneBlockList } from './components/PhoneBlock/PhoneBlockList';
import { FollowUpsView } from './components/FollowUps/FollowUpsView';
import { EmailView } from './components/Email/EmailView';
import { AnalyticsView } from './components/Analytics/AnalyticsView';
import { PerformanceView } from './components/Performance/PerformanceView';
import { WeeksView } from './components/Performance/WeeksView';
import { GoalsView } from './components/Goals/GoalsView';
import { QuickLogFAB } from './components/QuickLog/QuickLogFAB';
import { ManagerDashboardEnhanced } from './components/Manager/ManagerDashboardEnhanced';
import { ManagerOnboarding } from './components/Manager/ManagerOnboarding';
import { RepOnboarding } from './components/Onboarding/RepOnboarding';
import { NewBizView } from './components/NewBiz/NewBizView';
import { supabase } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRole();
    } else {
      setCheckingOnboarding(false);
    }
  }, [user]);

  const loadUserRole = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('user_role, onboarding_completed')
      .eq('user_id', user?.id)
      .single();

    if (error) {
      console.error('Error loading user role:', error);
      setCheckingOnboarding(false);
      return;
    }

    if (data) {
      setUserRole(data.user_role);

      // Set default view based on role
      if (data.user_role === 'manager') {
        setActiveView('manager');

        // Check if manager needs onboarding
        const { data: profileData } = await supabase
          .from('manager_profiles')
          .select('id')
          .eq('user_id', user?.id)
          .maybeSingle();

        setNeedsOnboarding(!profileData);
      } else {
        // Check if rep needs onboarding
        setNeedsOnboarding(!data.onboarding_completed);
      }
    }

    setCheckingOnboarding(false);
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    loadUserRole();
  };

  // Set default view based on role (must be before any conditional returns)
  useEffect(() => {
    if (userRole === 'manager') {
      setActiveView('manager');
    }
  }, [userRole]);

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Show onboarding for users who haven't completed setup
  if (needsOnboarding) {
    if (userRole === 'manager') {
      return <ManagerOnboarding onComplete={handleOnboardingComplete} />;
    } else {
      return <RepOnboarding onComplete={handleOnboardingComplete} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header activeView={activeView} onViewChange={setActiveView} userRole={userRole} />
      <main className="h-[calc(100vh-73px)] lg:h-[calc(100vh-73px)] pb-20 lg:pb-0">
        {activeView === 'dashboard' && <DashboardView />}
        {activeView === 'manager' && userRole === 'manager' && <ManagerDashboardEnhanced />}
        {activeView === 'start-day' && <StartDayView />}
        {activeView === 'day-builder' && <DayBuilderView />}
        {activeView === 'phone-block' && <PhoneBlockList />}
        {activeView === 'follow-ups' && <FollowUpsView userRole={userRole} />}
        {activeView === 'email' && <EmailView />}
        {activeView === 'new-biz' && userRole !== 'manager' && <NewBizView />}
        {activeView === 'performance' && <PerformanceView />}
        {activeView === '52-weeks' && <WeeksView />}
        {activeView === 'goals' && <GoalsView />}
        {activeView === 'analytics' && <AnalyticsView />}
      </main>
      <QuickLogFAB />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
