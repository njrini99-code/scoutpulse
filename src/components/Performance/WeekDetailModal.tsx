import { X, Calendar, TrendingUp, DollarSign, MapPin, Briefcase } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface WeekDetail {
  business_name: string;
  industry: string;
  event_type: string;
  revenue: number;
  distance_miles: number;
  notes: string;
  created_at: string;
}

interface WeekDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekNumber: number;
  year: number;
  userId: string;
}

export function WeekDetailModal({ isOpen, onClose, weekNumber, year, userId }: WeekDetailModalProps) {
  const [details, setDetails] = useState<WeekDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'osv' | 'np' | 'closed'>('all');

  useEffect(() => {
    if (isOpen && userId) {
      loadWeekDetails();
    }
  }, [isOpen, weekNumber, year, userId]);

  const loadWeekDetails = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_week_details', {
        p_user_id: userId,
        p_week_number: weekNumber,
        p_year: year
      });

      if (error) throw error;
      setDetails(data || []);
    } catch (error) {
      console.error('Error loading week details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDateRange = () => {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (weekNumber - 1) * 7;
    const weekStart = new Date(firstDayOfYear.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);

    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  };

  const filteredDetails = details.filter(d => {
    if (filter === 'all') return true;
    if (filter === 'osv') return d.event_type === 'osv_completed';
    if (filter === 'np') return d.event_type === 'np_set';
    if (filter === 'closed') return d.event_type === 'closed';
    return true;
  });

  const stats = {
    osvs: details.filter(d => d.event_type === 'osv_completed').length,
    nps: details.filter(d => d.event_type === 'np_set').length,
    closes: details.filter(d => d.event_type === 'closed').length,
    revenue: details.reduce((sum, d) => sum + (d.revenue || 0), 0),
    distance: details.reduce((sum, d) => sum + (d.distance_miles || 0), 0)
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Week {weekNumber}</h2>
            <p className="text-blue-100">{getWeekDateRange()}, {year}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4 p-6 border-b border-gray-200">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.osvs}</div>
            <div className="text-sm text-gray-600">OSVs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.nps}</div>
            <div className="text-sm text-gray-600">NPs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{stats.closes}</div>
            <div className="text-sm text-gray-600">Closes</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">${stats.revenue.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Revenue</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-600">{stats.distance.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Miles</div>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('osv')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'osv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              OSVs
            </button>
            <button
              onClick={() => setFilter('np')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'np'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              NPs
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'closed'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Closed
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading...</div>
          ) : filteredDetails.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No activities found</div>
          ) : (
            <div className="space-y-3">
              {filteredDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{detail.business_name}</h3>
                      {detail.industry && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <Briefcase className="w-4 h-4" />
                          {detail.industry}
                        </div>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        detail.event_type === 'osv_completed'
                          ? 'bg-blue-100 text-blue-700'
                          : detail.event_type === 'np_set'
                          ? 'bg-green-100 text-green-700'
                          : detail.event_type === 'closed'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {detail.event_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {detail.revenue > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        ${detail.revenue.toFixed(2)}
                      </div>
                    )}
                    {detail.distance_miles > 0 && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {detail.distance_miles.toFixed(1)} mi
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(detail.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {detail.notes && (
                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded">
                      {detail.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
