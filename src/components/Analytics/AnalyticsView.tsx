import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Target, Users, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { generateLeadInsights } from '../../services/openai';

export function AnalyticsView() {
  const [metrics, setMetrics] = useState({
    totalLeads: 0,
    npTotal: 0,
    osvTotal: 0,
    closeRatio: 0,
    pipelineValue: 0,
    avgDealSize: 0,
  });
  const [industryStats, setIndustryStats] = useState<any[]>([]);
  const [zipStats, setZipStats] = useState<any[]>([]);
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
  }, [user]);

  const loadAnalytics = async () => {
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id);

    if (!error && leads) {
      const npCount = leads.filter((l) => l.np_set).length;
      const osvCount = leads.filter((l) => l.osv_completed).length;
      const closedWon = leads.filter((l) => l.status === 'closed_won').length;
      const qualified = leads.filter((l) => l.status === 'qualified').length;

      const pipelineValue = leads
        .filter((l) => l.deal_value && l.status !== 'closed_lost')
        .reduce((sum, l) => sum + (l.deal_value || 0), 0);

      const closedDeals = leads.filter((l) => l.status === 'closed_won');
      const avgDeal =
        closedDeals.length > 0
          ? closedDeals.reduce((sum, l) => sum + (l.deal_value || 0), 0) / closedDeals.length
          : 0;

      setMetrics({
        totalLeads: leads.length,
        npTotal: npCount,
        osvTotal: osvCount,
        closeRatio: qualified > 0 ? (closedWon / qualified) * 100 : 0,
        pipelineValue,
        avgDealSize: avgDeal,
      });

      const industryGroups = leads.reduce((acc: any, lead) => {
        const industry = lead.industry || 'Unknown';
        if (!acc[industry]) {
          acc[industry] = { count: 0, revenue: 0 };
        }
        acc[industry].count++;
        if (lead.deal_value && lead.status === 'closed_won') {
          acc[industry].revenue += lead.deal_value;
        }
        return acc;
      }, {});

      const industryArray = Object.entries(industryGroups)
        .map(([name, data]: any) => ({
          name,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setIndustryStats(industryArray);

      const zipGroups = leads.reduce((acc: any, lead) => {
        const zip = lead.zip || 'Unknown';
        if (!acc[zip]) {
          acc[zip] = { count: 0, revenue: 0 };
        }
        acc[zip].count++;
        if (lead.deal_value && lead.status === 'closed_won') {
          acc[zip].revenue += lead.deal_value;
        }
        return acc;
      }, {});

      const zipArray = Object.entries(zipGroups)
        .map(([name, data]: any) => ({
          name,
          count: data.count,
          revenue: data.revenue,
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      setZipStats(zipArray);

      const aiInsights = await generateLeadInsights(leads);
      if (aiInsights) {
        setInsights(aiInsights);
      }
    }

    setLoading(false);
  };

  const MetricCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Track your sales performance and insights</p>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <MetricCard
          icon={Calendar}
          title="New Prospects (NP)"
          value={metrics.npTotal}
          color="bg-blue-600"
        />
        <MetricCard
          icon={CheckCircle}
          title="On-Site Visits (OSV)"
          value={metrics.osvTotal}
          color="bg-green-600"
        />
        <MetricCard
          icon={Target}
          title="Close Ratio"
          value={`${metrics.closeRatio.toFixed(1)}%`}
          color="bg-purple-600"
        />
        <MetricCard
          icon={DollarSign}
          title="Pipeline Value"
          value={`$${metrics.pipelineValue.toLocaleString()}`}
          color="bg-emerald-600"
        />
        <MetricCard
          icon={TrendingUp}
          title="Avg Deal Size"
          value={`$${metrics.avgDealSize.toLocaleString()}`}
          color="bg-orange-600"
        />
        <MetricCard
          icon={Users}
          title="Total Leads"
          value={metrics.totalLeads}
          color="bg-slate-600"
        />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Industries</h3>
          <div className="space-y-3">
            {industryStats.map((industry, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{industry.name}</p>
                  <p className="text-sm text-gray-600">{industry.count} leads</p>
                </div>
                <p className="font-semibold text-gray-900">
                  ${industry.revenue.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Top Zip Codes</h3>
          <div className="space-y-3">
            {zipStats.map((zip, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{zip.name}</p>
                  <p className="text-sm text-gray-600">{zip.count} leads</p>
                </div>
                <p className="font-semibold text-gray-900">${zip.revenue.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {insights && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            AI Insights
          </h3>
          <div className="text-gray-700 whitespace-pre-line">{insights}</div>
        </div>
      )}
    </div>
  );
}
