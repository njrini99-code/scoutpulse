import { useState, useEffect } from 'react';
import { Target, TrendingUp, DollarSign, Award, AlertCircle, CheckCircle, Clock, Sparkles, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface GoalMetrics {
  awv_goal: number;
  total_revenue: number;
  close_rate: number;
  avg_account_size: number;
  required_nps: number;
  projected_awv: number;
  pace_status: string;
  total_nps: number;
  total_osvs: number;
  total_closes: number;
  actual_close_rate: number;
  actual_avg_deal_size: number;
}

interface IndustryData {
  industry: string;
  total_nps: number;
  total_closes: number;
  total_revenue: number;
  close_rate: number;
  avg_deal_size: number;
}

interface QuarterlyData {
  quarter: number;
  total_revenue: number;
  total_nps: number;
  total_osvs: number;
  total_closes: number;
  close_rate: number;
}

export function GoalsView() {
  const { user } = useAuth();
  const [currentYear] = useState(new Date().getFullYear());
  const [metrics, setMetrics] = useState<GoalMetrics | null>(null);
  const [industries, setIndustries] = useState<IndustryData[]>([]);
  const [quarters, setQuarters] = useState<QuarterlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const [goalInputs, setGoalInputs] = useState({
    awv_goal: 150,
    avg_account_size: 1200,
    close_rate: 0.30
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: existingGoal } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('year', currentYear)
        .maybeSingle();

      if (existingGoal) {
        setGoalInputs({
          awv_goal: existingGoal.awv_goal,
          avg_account_size: existingGoal.avg_account_size,
          close_rate: existingGoal.close_rate
        });
      } else {
        await supabase.from('goals').insert({
          user_id: user?.id,
          year: currentYear,
          awv_goal: 150,
          avg_account_size: 1200,
          close_rate: 0.30
        });
      }

      const { data: metricsData } = await supabase.rpc('calculate_goal_metrics', {
        p_user_id: user?.id,
        p_year: currentYear
      });

      if (metricsData && metricsData.length > 0) {
        setMetrics(metricsData[0]);
      }

      const { data: industryData } = await supabase.rpc('get_industry_breakdown', {
        p_user_id: user?.id,
        p_year: currentYear
      });

      if (industryData) {
        setIndustries(industryData);
      }

      const { data: quarterlyData } = await supabase.rpc('get_quarterly_metrics', {
        p_user_id: user?.id,
        p_year: currentYear
      });

      if (quarterlyData) {
        setQuarters(quarterlyData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveGoals = async () => {
    try {
      await supabase
        .from('goals')
        .update({
          awv_goal: goalInputs.awv_goal,
          avg_account_size: goalInputs.avg_account_size,
          close_rate: goalInputs.close_rate,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user?.id)
        .eq('year', currentYear);

      setEditing(false);
      await loadData();
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const generateAIInsight = async () => {
    if (!metrics) return;

    setLoadingInsight(true);
    try {
      const prompt = `Based on these sales metrics:
- Total Revenue: $${metrics.total_revenue.toFixed(2)}
- Goal: $${metrics.awv_goal}
- NPs: ${metrics.total_nps}
- Closes: ${metrics.total_closes}
- Close Rate: ${(metrics.actual_close_rate * 100).toFixed(1)}%
- Pace Status: ${metrics.pace_status}
${industries.length > 0 ? `- Top Industry: ${industries[0].industry} ($${industries[0].total_revenue})` : ''}

Provide a brief, motivational insight (2-3 sentences) with specific recommendations to hit the AWV goal.`;

      const { data, error } = await supabase.functions.invoke('tempo-copilot', {
        body: { prompt }
      });

      if (error) throw error;
      setAiInsight(data.response);
    } catch (error) {
      console.error('Error generating insight:', error);
      setAiInsight('Unable to generate insights at this time. Keep pushing toward your goals!');
    } finally {
      setLoadingInsight(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading goals...</p>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No goal data available</p>
        </div>
      </div>
    );
  }

  const progressPercent = (metrics.total_revenue / metrics.awv_goal) * 100;
  const requiredNPsRemaining = Math.max(0, metrics.required_nps - metrics.total_nps);

  const getPaceColor = (status: string) => {
    if (status === 'ahead') return 'text-green-600 bg-green-100';
    if (status === 'on pace') return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPaceIcon = (status: string) => {
    if (status === 'ahead') return CheckCircle;
    if (status === 'on pace') return Clock;
    return AlertCircle;
  };

  const PaceIcon = getPaceIcon(metrics.pace_status);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Goals & Forecast</h1>
          <p className="text-lg text-gray-600">Track your AWV goal and calculate required inputs</p>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">{currentYear} AWV Goal</h2>
                <p className="text-blue-100">Annual Weekly Volume Target</p>
              </div>
            </div>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${getPaceColor(metrics.pace_status)}`}>
              <PaceIcon className="w-5 h-5" />
              <span className="font-bold capitalize">{metrics.pace_status}</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-blue-100 text-sm mb-1">Goal</div>
              <div className="text-3xl font-bold">${metrics.awv_goal.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm mb-1">Actual</div>
              <div className="text-3xl font-bold">${metrics.total_revenue.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-blue-100 text-sm mb-1">Remaining</div>
              <div className="text-3xl font-bold">${Math.max(0, metrics.awv_goal - metrics.total_revenue).toFixed(0)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progressPercent.toFixed(1)}% Complete</span>
              <span>${metrics.total_revenue.toFixed(0)} / ${metrics.awv_goal.toLocaleString()}</span>
            </div>
            <div className="h-4 bg-blue-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Goal Parameters</h3>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveGoals}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AWV Goal ($)
                </label>
                <input
                  type="number"
                  value={goalInputs.awv_goal}
                  onChange={(e) => setGoalInputs({ ...goalInputs, awv_goal: Number(e.target.value) })}
                  disabled={!editing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Average Account Size ($)
                </label>
                <input
                  type="number"
                  value={goalInputs.avg_account_size}
                  onChange={(e) => setGoalInputs({ ...goalInputs, avg_account_size: Number(e.target.value) })}
                  disabled={!editing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Close Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={goalInputs.close_rate * 100}
                  onChange={(e) => setGoalInputs({ ...goalInputs, close_rate: Number(e.target.value) / 100 })}
                  disabled={!editing}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Required Inputs</h3>
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">NPs Required (Total)</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{metrics.required_nps}</span>
                </div>
                <div className="text-sm text-blue-700">
                  Completed: {metrics.total_nps} | Remaining: {requiredNPsRemaining}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Projected AWV</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">${metrics.projected_awv.toFixed(0)}</span>
                </div>
                <div className="text-sm text-green-700">
                  Based on current pace: {((metrics.projected_awv / metrics.awv_goal) * 100).toFixed(1)}% of goal
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-purple-900">Total OSVs</span>
                  </div>
                  <span className="text-2xl font-bold text-purple-600">{metrics.total_osvs}</span>
                </div>
                <div className="text-sm text-purple-700">
                  Closes: {metrics.total_closes} | Close Rate: {(metrics.actual_close_rate * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-gray-900">AI Insights</h3>
              </div>
              <button
                onClick={generateAIInsight}
                disabled={loadingInsight}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {loadingInsight ? 'Generating...' : 'Generate Insight'}
              </button>
            </div>
            {aiInsight ? (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4">
                <p className="text-gray-700">{aiInsight}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Click "Generate Insight" to get AI-powered recommendations
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Performance Metrics</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Actual Avg Deal Size</span>
                <span className="text-xl font-bold text-gray-900">${metrics.actual_avg_deal_size.toFixed(0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Actual Close Rate</span>
                <span className="text-xl font-bold text-gray-900">{(metrics.actual_close_rate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Avg Deal Size</span>
                <span className="text-xl font-bold text-gray-900">${metrics.avg_account_size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Target Close Rate</span>
                <span className="text-xl font-bold text-gray-900">{(metrics.close_rate * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {industries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Industry Breakdown</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Industry</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">NPs</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Closes</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Close %</th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg Deal</th>
                  </tr>
                </thead>
                <tbody>
                  {industries.map((ind, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{ind.industry}</td>
                      <td className="text-right py-3 px-4 text-gray-600">{ind.total_nps}</td>
                      <td className="text-right py-3 px-4 text-gray-600">{ind.total_closes}</td>
                      <td className="text-right py-3 px-4 text-gray-900 font-semibold">${ind.total_revenue.toFixed(0)}</td>
                      <td className="text-right py-3 px-4 text-gray-600">{(ind.close_rate * 100).toFixed(1)}%</td>
                      <td className="text-right py-3 px-4 text-gray-600">${ind.avg_deal_size.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {quarters.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Quarterly Performance</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {quarters.map((q) => (
                <div key={q.quarter} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="text-sm font-medium text-blue-900 mb-2">Q{q.quarter} {currentYear}</div>
                  <div className="text-2xl font-bold text-blue-600 mb-3">${q.total_revenue.toFixed(0)}</div>
                  <div className="space-y-1 text-xs text-blue-700">
                    <div className="flex justify-between">
                      <span>OSVs:</span>
                      <span className="font-semibold">{q.total_osvs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>NPs:</span>
                      <span className="font-semibold">{q.total_nps}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Closes:</span>
                      <span className="font-semibold">{q.total_closes}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rate:</span>
                      <span className="font-semibold">{(q.close_rate * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
