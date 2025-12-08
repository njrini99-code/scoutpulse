import { useState, useEffect } from 'react';
import { Loader, TrendingUp, Shield, Zap, Star, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types/database';

interface BusinessInsight {
  focus: 'safety' | 'image' | 'efficiency' | 'mixed';
  years_open: number | null;
  industry: string | null;
  insight: string;
  nearby_clients: string | null;
  ai_summary: string;
  google_rating: number | null;
  review_count: number | null;
}

interface Props {
  lead: Lead;
}

export function BusinessSummarySection({ lead }: Props) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<BusinessInsight | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSummary();
  }, [lead.id]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-summary`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lead_id: lead.id,
          business_name: lead.business_name,
          address: lead.address,
          industry: lead.industry
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setInsight(result.insight);
      } else {
        setError(result.error || 'Failed to load summary');
      }
    } catch (err: any) {
      console.error('Error loading business summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getFocusIcon = (focus: string) => {
    switch (focus) {
      case 'safety': return Shield;
      case 'image': return Star;
      case 'efficiency': return Zap;
      default: return TrendingUp;
    }
  };

  const getFocusColor = (focus: string) => {
    switch (focus) {
      case 'safety': return 'bg-red-600';
      case 'image': return 'bg-purple-600';
      case 'efficiency': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getFocusLabel = (focus: string) => {
    switch (focus) {
      case 'safety': return 'Safety Focused';
      case 'image': return 'Image Conscious';
      case 'efficiency': return 'Efficiency Driven';
      default: return 'Mixed Focus';
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-center gap-3">
          <Loader className="w-5 h-5 text-blue-600 animate-spin" />
          <p className="text-gray-600 font-medium">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-6 border border-red-200">
        <p className="text-red-800 text-sm">Failed to load insights: {error}</p>
        <button
          onClick={loadSummary}
          className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!insight) return null;

  const Icon = getFocusIcon(insight.focus);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Business Insights
          </h3>
          <div className={`flex items-center gap-2 px-3 py-1 ${getFocusColor(insight.focus)} text-white rounded-full text-sm font-semibold`}>
            <Icon className="w-4 h-4" />
            {getFocusLabel(insight.focus)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          {insight.years_open && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Years Open</p>
              <p className="text-lg font-bold text-gray-900">{insight.years_open} years</p>
            </div>
          )}
          {insight.google_rating && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Google Rating</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="text-lg font-bold text-gray-900">{insight.google_rating}</p>
                {insight.review_count && (
                  <span className="text-xs text-gray-500">({insight.review_count})</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white/80 rounded-lg p-4 mb-3">
          <p className="text-sm font-semibold text-gray-700 mb-1">Key Insight</p>
          <p className="text-gray-900">{insight.insight}</p>
        </div>

        <div className="bg-white/80 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">Strategic Approach</p>
          <p className="text-gray-900">{insight.ai_summary}</p>
        </div>

        {insight.nearby_clients && (
          <div className="bg-green-50 rounded-lg p-4 mt-3 border border-green-200">
            <p className="text-sm font-semibold text-green-900 mb-1">Nearby Clients</p>
            <p className="text-sm text-green-800">{insight.nearby_clients}</p>
          </div>
        )}
      </div>
    </div>
  );
}
