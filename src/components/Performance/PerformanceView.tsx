import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Navigation,
  Users,
  Mail,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface KPIDashboard {
  user_id: string;
  week_start: string;
  osvs: number;
  osv_goal: number;
  osv_pace_pct: number;
  nps: number;
  np_goal: number;
  np_pace_pct: number;
  closes: number;
  close_rate_pct: number;
  emails_sent: number;
  follow_ups: number;
  follow_up_goal: number;
  total_revenue: number;
  revenue_goal: number;
  avg_deal_value: number;
  route_efficiency: number;
  route_efficiency_goal: number;
  unique_leads_touched: number;
  overall_status: 'on_track' | 'at_risk' | 'behind';
}

export const PerformanceView: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<KPIDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadDashboard = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
      currentWeekStart.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('v_kpi_dashboard')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart.toISOString().split('T')[0])
        .maybeSingle();

      if (error) throw error;
      setDashboard(data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncKPIs = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sync-kpi`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ syncType: 'current_user' })
        }
      );

      const result = await response.json();
      if (result.ok && result.dashboard) {
        setDashboard(result.dashboard);
      } else {
        await loadDashboard();
      }
    } catch (error) {
      console.error('Error syncing KPIs:', error);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_track': return 'bg-green-100 text-green-800 border-green-300';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'behind': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track': return <CheckCircle2 className="w-5 h-5" />;
      case 'at_risk': return <AlertCircle className="w-5 h-5" />;
      case 'behind': return <XCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getPaceColor = (pace: number) => {
    if (pace >= 100) return 'text-green-600';
    if (pace >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressBarColor = (pace: number) => {
    if (pace >= 100) return 'bg-green-500';
    if (pace >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Data Yet</h3>
          <p className="text-gray-600 mb-4">Start logging activities to see your performance metrics.</p>
          <button
            onClick={syncKPIs}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync KPIs'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Week of {new Date(dashboard.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg border-2 flex items-center gap-2 ${getStatusColor(dashboard.overall_status)}`}>
            {getStatusIcon(dashboard.overall_status)}
            <span className="font-semibold capitalize">{dashboard.overall_status.replace('_', ' ')}</span>
          </div>
          <button
            onClick={syncKPIs}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="OSVs Completed"
          value={dashboard.osvs}
          goal={dashboard.osv_goal}
          pace={dashboard.osv_pace_pct}
          icon={<Target className="w-6 h-6" />}
          color="blue"
        />
        <MetricCard
          title="NPs Set"
          value={dashboard.nps}
          goal={dashboard.np_goal}
          pace={dashboard.np_pace_pct}
          icon={<Calendar className="w-6 h-6" />}
          color="purple"
        />
        <MetricCard
          title="Deals Closed"
          value={dashboard.closes}
          goal={null}
          pace={null}
          subtitle={`${dashboard.close_rate_pct || 0}% close rate`}
          icon={<CheckCircle2 className="w-6 h-6" />}
          color="green"
        />
        <MetricCard
          title="Revenue"
          value={`$${dashboard.total_revenue?.toLocaleString() || '0'}`}
          goal={dashboard.revenue_goal}
          pace={((dashboard.total_revenue || 0) / dashboard.revenue_goal) * 100}
          icon={<DollarSign className="w-6 h-6" />}
          color="emerald"
          isRevenue
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Emails Sent"
          value={dashboard.emails_sent}
          icon={<Mail className="w-5 h-5" />}
        />
        <StatCard
          title="Follow-Ups"
          value={dashboard.follow_ups}
          goal={dashboard.follow_up_goal}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          title="Route Efficiency"
          value={`${dashboard.route_efficiency?.toFixed(1) || '0'} mi/OSV`}
          goal={dashboard.route_efficiency_goal}
          icon={<Navigation className="w-5 h-5" />}
          isEfficiency
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Progress</h3>
          <div className="space-y-4">
            <ProgressBar label="OSVs" current={dashboard.osvs} goal={dashboard.osv_goal} />
            <ProgressBar label="NPs" current={dashboard.nps} goal={dashboard.np_goal} />
            <ProgressBar label="Closes" current={dashboard.closes} goal={1} />
            <ProgressBar
              label="Revenue"
              current={dashboard.total_revenue || 0}
              goal={dashboard.revenue_goal}
              isCurrency
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
          <div className="space-y-3">
            <Insight
              icon={<TrendingUp className="w-5 h-5 text-green-600" />}
              text={`Touched ${dashboard.unique_leads_touched} unique leads this week`}
            />
            {dashboard.avg_deal_value && (
              <Insight
                icon={<DollarSign className="w-5 h-5 text-blue-600" />}
                text={`Average deal value: $${dashboard.avg_deal_value.toFixed(0)}`}
              />
            )}
            {dashboard.close_rate_pct && dashboard.close_rate_pct >= 25 && (
              <Insight
                icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
                text={`Exceeding ${dashboard.close_rate_pct.toFixed(0)}% close rate target`}
              />
            )}
            {dashboard.route_efficiency && dashboard.route_efficiency <= dashboard.route_efficiency_goal && (
              <Insight
                icon={<Navigation className="w-5 h-5 text-green-600" />}
                text="Route efficiency on target"
              />
            )}
            {dashboard.osv_pace_pct < 70 && (
              <Insight
                icon={<AlertCircle className="w-5 h-5 text-yellow-600" />}
                text="OSV pace needs attention - increase daily visits"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: number | string;
  goal: number | null;
  pace: number | null;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  isRevenue?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, goal, pace, subtitle, icon, color, isRevenue }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600'
  };

  const getPaceColor = (pace: number) => {
    if (pace >= 100) return 'text-green-600';
    if (pace >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {pace !== null && (
          <div className={`text-2xl font-bold ${getPaceColor(pace)}`}>
            {pace.toFixed(0)}%
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {goal !== null && (
          <p className="text-sm text-gray-500">
            / {isRevenue ? `$${goal.toLocaleString()}` : goal}
          </p>
        )}
      </div>
      {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number | string;
  goal?: number;
  icon: React.ReactNode;
  isEfficiency?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, goal, icon, isEfficiency }) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isOnTarget = goal ? (isEfficiency ? numValue <= goal : numValue >= goal) : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <div className="flex items-center gap-2">
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {isOnTarget !== null && (
              isOnTarget ?
                <TrendingUp className="w-4 h-4 text-green-600" /> :
                <TrendingDown className="w-4 h-4 text-red-600" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ProgressBarProps {
  label: string;
  current: number;
  goal: number;
  isCurrency?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ label, current, goal, isCurrency }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  const getColor = () => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-600">
          {isCurrency ? `$${current.toLocaleString()}` : current} / {isCurrency ? `$${goal.toLocaleString()}` : goal}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface InsightProps {
  icon: React.ReactNode;
  text: string;
}

const Insight: React.FC<InsightProps> = ({ icon, text }) => {
  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {icon}
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
};
