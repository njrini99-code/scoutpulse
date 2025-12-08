import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader, Building2, TrendingUp, Shield, Zap, Star, FileText, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Lead } from '../../types/database';

interface BusinessInsight {
  id: string;
  business_name: string;
  focus: 'safety' | 'image' | 'efficiency' | 'mixed';
  years_open: number | null;
  industry: string | null;
  insight: string;
  nearby_clients: string | null;
  ai_summary: string;
  google_rating: number | null;
  review_count: number | null;
  last_updated: string;
}

interface BusinessSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export function BusinessSummaryModal({ isOpen, onClose, lead }: BusinessSummaryModalProps) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<BusinessInsight | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  console.log('[BusinessSummaryModal] Render - isOpen:', isOpen, 'lead:', lead?.business_name);

  useEffect(() => {
    console.log('[BusinessSummaryModal] useEffect triggered - isOpen:', isOpen, 'lead:', lead?.business_name);
    if (isOpen && lead) {
      console.log('[BusinessSummaryModal] Calling loadBusinessSummary...');
      loadBusinessSummary();
    } else {
      console.log('[BusinessSummaryModal] Skipping load - isOpen:', isOpen, 'lead exists:', !!lead);
    }
  }, [isOpen, lead]);

  const loadBusinessSummary = async (forceRefresh = false) => {
    console.log('loadBusinessSummary called with lead:', lead);

    if (forceRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/business-summary`;
      console.log('Calling business-summary API:', apiUrl);

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
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);

      if (result.status === 'success') {
        setInsight(result.insight);
      } else {
        console.error('Error loading business summary:', result.error);
        alert(`Error: ${result.error || 'Failed to load business summary'}`);
      }
    } catch (error) {
      console.error('Error loading business summary:', error);
      alert(`Error loading business summary: ${error.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFocusIcon = (focus: string) => {
    switch (focus) {
      case 'safety':
        return Shield;
      case 'image':
        return Star;
      case 'efficiency':
        return Zap;
      default:
        return TrendingUp;
    }
  };

  const getFocusColor = (focus: string) => {
    switch (focus) {
      case 'safety':
        return 'bg-red-500';
      case 'image':
        return 'bg-blue-500';
      case 'efficiency':
        return 'bg-green-500';
      default:
        return 'bg-purple-500';
    }
  };

  const getFocusLabel = (focus: string) => {
    switch (focus) {
      case 'safety':
        return 'Safety First';
      case 'image':
        return 'Image & Brand';
      case 'efficiency':
        return 'Cost Efficiency';
      default:
        return 'Mixed Focus';
    }
  };

  if (!isOpen) {
    console.log('[BusinessSummaryModal] Not rendering - isOpen is false');
    return null;
  }

  if (!lead) {
    console.log('[BusinessSummaryModal] Not rendering - lead is null');
    return null;
  }

  console.log('[BusinessSummaryModal] Rendering modal with lead:', lead.business_name);

  const modalContent = (
    <>
      <div
        className="fixed inset-0 bg-black transition-opacity duration-300"
        style={{
          zIndex: 9998,
          opacity: isOpen ? 0.5 : 0,
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 w-full md:w-[600px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out overflow-hidden"
        style={{
          zIndex: 9999,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)'
        }}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">Business Summary</h2>
              <p className="text-blue-100 text-sm">AI-powered insights for your pitch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {loading && !insight ? (
            <div className="text-center py-12">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Generating business insights...</p>
              <p className="text-sm text-gray-500 mt-2">Analyzing data from Google, reviews, and more</p>
            </div>
          ) : insight ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{insight.business_name}</h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  {insight.years_open && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Years Open</p>
                      <p className="text-xl font-bold text-gray-900">{insight.years_open} years</p>
                      <p className="text-xs text-gray-500">Since {new Date().getFullYear() - insight.years_open}</p>
                    </div>
                  )}

                  {insight.industry && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Industry</p>
                      <p className="text-lg font-semibold text-gray-900">{insight.industry}</p>
                    </div>
                  )}

                  {insight.google_rating && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Google Rating</p>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <p className="text-xl font-bold text-gray-900">{insight.google_rating}</p>
                        {insight.review_count && (
                          <span className="text-sm text-gray-500">({insight.review_count} reviews)</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Business Focus</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-2 ${getFocusColor(insight.focus)} text-white rounded-lg font-semibold`}>
                      {(() => {
                        const Icon = getFocusIcon(insight.focus);
                        return <Icon className="w-5 h-5" />;
                      })()}
                      {getFocusLabel(insight.focus)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">Key Insight</h4>
                    <p className="text-gray-700 leading-relaxed">{insight.insight}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">AI Strategic Summary</h4>
                    <p className="text-gray-700 leading-relaxed">{insight.ai_summary}</p>
                  </div>
                </div>
              </div>

              {insight.nearby_clients && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                  <h4 className="font-bold text-gray-900 mb-2">Similar Clients Nearby</h4>
                  <p className="text-gray-700">{insight.nearby_clients}</p>
                  <p className="text-sm text-gray-600 mt-2">Mention these success stories to build credibility</p>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Last updated: {new Date(insight.last_updated).toLocaleDateString()}
                </p>
                <button
                  onClick={() => loadBusinessSummary(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">Unable to load business insights</p>
              <button
                onClick={() => loadBusinessSummary()}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
