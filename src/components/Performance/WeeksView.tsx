import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { WeekDetailModal } from './WeekDetailModal';

interface WeekStats {
  week_number: number;
  year: number;
  osvs: number;
  nps: number;
  closes: number;
  nsf: number;
  total_revenue: number;
  distance_miles: number;
  route_efficiency: number;
}

interface WeeklyGoals {
  osv_goal: number;
  np_goal: number;
  revenue_goal: number;
  nsf_goal: number;
}

export function WeeksView() {
  const { user } = useAuth();
  const [weekStats, setWeekStats] = useState<WeekStats[]>([]);
  const [goals, setGoals] = useState<WeeklyGoals>({ osv_goal: 50, np_goal: 10, revenue_goal: 150, nsf_goal: 2 });
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'weeks' | 'quarters' | 'year'>('weeks');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      await supabase.rpc('refresh_weekly_stats');

      const { data: statsData } = await supabase
        .from('weekly_stats')
        .select('*')
        .eq('user_id', user?.id)
        .eq('year', selectedYear)
        .order('week_number', { ascending: true });

      if (statsData) {
        setWeekStats(statsData);
      }

      const currentWeekStart = new Date();
      currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());

      const { data: goalsData } = await supabase
        .from('weekly_goals')
        .select('osv_goal, np_goal, revenue_goal, nsf_goal')
        .eq('user_id', user?.id)
        .gte('week_start', currentWeekStart.toISOString().split('T')[0])
        .order('week_start', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalsData) {
        setGoals(goalsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekNumber = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const diff = now.getTime() - start.getTime();
    const oneWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.ceil(diff / oneWeek);
  };

  const getWeekProgress = (week: WeekStats) => {
    const osvProgress = (week.osvs / goals.osv_goal) * 100;
    const npProgress = (week.nps / goals.np_goal) * 100;
    const revenueProgress = (week.total_revenue / goals.revenue_goal) * 100;
    const avgProgress = (osvProgress + npProgress + revenueProgress) / 3;
    return Math.min(avgProgress, 100);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const allWeeks = Array.from({ length: 52 }, (_, i) => {
    const weekNum = i + 1;
    const stats = weekStats.find(w => w.week_number === weekNum);
    return {
      week_number: weekNum,
      year: selectedYear,
      osvs: stats?.osvs || 0,
      nps: stats?.nps || 0,
      closes: stats?.closes || 0,
      nsf: stats?.nsf || 0,
      total_revenue: stats?.total_revenue || 0,
      distance_miles: stats?.distance_miles || 0,
      route_efficiency: stats?.route_efficiency || 0
    };
  });

  const currentWeek = getCurrentWeekNumber();

  const yearSummary = {
    totalOSVs: weekStats.reduce((sum, w) => sum + w.osvs, 0),
    totalNPs: weekStats.reduce((sum, w) => sum + w.nps, 0),
    totalCloses: weekStats.reduce((sum, w) => sum + w.closes, 0),
    totalRevenue: weekStats.reduce((sum, w) => sum + w.total_revenue, 0),
    totalDistance: weekStats.reduce((sum, w) => sum + w.distance_miles, 0),
    avgRouteEfficiency: weekStats.length > 0
      ? weekStats.reduce((sum, w) => sum + w.route_efficiency, 0) / weekStats.length
      : 0
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">52 Weeks Performance</h1>
          <p className="text-lg text-gray-600">Your year-long activity tracker</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('weeks')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'weeks'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Weeks
              </button>
              <button
                onClick={() => setViewMode('quarters')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'quarters'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Quarters
              </button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'year'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Year Summary
              </button>
            </div>

            <div className="text-right">
              <div className="text-sm text-gray-600">Weekly Goals</div>
              <div className="text-xs text-gray-500 space-x-3">
                <span>{goals.osv_goal} OSVs</span>
                <span>{goals.np_goal} NPs</span>
                <span>${goals.revenue_goal} AWV</span>
                <span>{goals.nsf_goal} NSF</span>
              </div>
            </div>
          </div>

          {viewMode === 'weeks' && (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-13 gap-3">
              {allWeeks.map((week) => {
                const progress = getWeekProgress(week);
                const isCurrent = week.week_number === currentWeek;
                const hasData = week.osvs > 0 || week.nps > 0;

                return (
                  <button
                    key={week.week_number}
                    onClick={() => setSelectedWeek(week.week_number)}
                    className={`relative p-3 rounded-xl border-2 transition-all hover:shadow-lg ${
                      isCurrent
                        ? 'border-blue-500 bg-blue-50'
                        : hasData
                        ? 'border-gray-200 bg-white hover:border-blue-300'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <div className="text-xs font-semibold text-gray-500 mb-2">W{week.week_number}</div>
                    {hasData && (
                      <>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">OSV</span>
                            <span className="font-bold text-blue-600">{week.osvs}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">NP</span>
                            <span className="font-bold text-green-600">{week.nps}</span>
                          </div>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(progress)} transition-all`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </>
                    )}
                    {!hasData && (
                      <div className="text-xs text-gray-400 text-center mt-2">No data</div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {viewMode === 'year' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Total OSVs</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{yearSummary.totalOSVs}</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Total NPs</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{yearSummary.totalNPs}</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Total Closes</span>
                  </div>
                  <div className="text-3xl font-bold text-purple-600">{yearSummary.totalCloses}</div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-900">Total Revenue</span>
                  </div>
                  <div className="text-3xl font-bold text-orange-600">${yearSummary.totalRevenue.toFixed(0)}</div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Total Miles</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-600">{yearSummary.totalDistance.toFixed(0)}</div>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-medium text-indigo-900">Avg Efficiency</span>
                  </div>
                  <div className="text-3xl font-bold text-indigo-600">{yearSummary.avgRouteEfficiency.toFixed(1)}</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Year {selectedYear} Overview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Weeks with Activity:</span>
                    <span className="ml-2 font-bold text-gray-900">{weekStats.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg OSVs/Week:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {weekStats.length > 0 ? (yearSummary.totalOSVs / weekStats.length).toFixed(1) : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg NPs/Week:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      {weekStats.length > 0 ? (yearSummary.totalNPs / weekStats.length).toFixed(1) : 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Revenue/Week:</span>
                    <span className="ml-2 font-bold text-gray-900">
                      ${weekStats.length > 0 ? (yearSummary.totalRevenue / weekStats.length).toFixed(0) : 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedWeek && user && (
        <WeekDetailModal
          isOpen={!!selectedWeek}
          onClose={() => setSelectedWeek(null)}
          weekNumber={selectedWeek}
          year={selectedYear}
          userId={user.id}
        />
      )}
    </div>
  );
}
