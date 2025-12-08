import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, MapPin, Navigation, Loader, Building2, Star, Plus, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface TempOsv {
  id: string;
  name: string;
  address: string;
  industry: string;
  latitude: number;
  longitude: number;
  distance_km: number;
  detour_minutes: number;
  place_id: string;
  phone: string | null;
  google_rating: number | null;
}

interface FindOSVsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLat: number;
  currentLng: number;
  nextLat: number;
  nextLng: number;
  onAddOSV: (osv: TempOsv) => void;
}

export function FindOSVsModal({
  isOpen,
  onClose,
  currentLat,
  currentLng,
  nextLat,
  nextLng,
  onAddOSV
}: FindOSVsModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TempOsv[]>([]);
  const [industry, setIndustry] = useState('restaurant');
  const [maxDistance, setMaxDistance] = useState(5);

  useEffect(() => {
    if (isOpen) {
      findOSVsOnRoute();
    }
  }, [isOpen]);

  const findOSVsOnRoute = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/find-osvs-on-route`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_lat: currentLat,
          current_lng: currentLng,
          next_lat: nextLat,
          next_lng: nextLng,
          industry,
          max_distance_km: maxDistance
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSuggestions(result.suggestions || []);
      } else {
        console.error('Error finding OSVs:', result.error);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error finding OSVs on route:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToRoute = async (osv: TempOsv) => {
    try {
      const { data: existingLead } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user?.id)
        .eq('business_name', osv.name)
        .maybeSingle();

      if (existingLead) {
        onAddOSV(osv);
        onClose();
        return;
      }

      const { data: newLead, error } = await supabase
        .from('leads')
        .insert({
          user_id: user?.id,
          business_name: osv.name,
          address: osv.address,
          industry: osv.industry,
          latitude: osv.latitude,
          longitude: osv.longitude,
          phone: osv.phone,
          google_rating: osv.google_rating,
          status: 'new',
          appointment_type: 'OSV',
        })
        .select()
        .single();

      if (error) throw error;

      if (newLead) {
        onAddOSV({ ...osv, id: newLead.id });
      }

      onClose();
    } catch (error) {
      console.error('Error adding OSV:', error);
      alert('Failed to add OSV. Please try again.');
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="w-7 h-7" />
              Find OSVs On The Way
            </h2>
            <p className="text-blue-100 mt-1">Fill time between appointments</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry Type
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="restaurant">Restaurants</option>
                <option value="auto">Auto Services</option>
                <option value="retail">Retail</option>
                <option value="service">Services</option>
                <option value="professional">Professional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Distance (km)
              </label>
              <input
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={findOSVsOnRoute}
            disabled={loading}
            className="w-full mb-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Search Route
              </>
            )}
          </button>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading && (
              <div className="text-center py-12">
                <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Finding businesses along your route...</p>
              </div>
            )}

            {!loading && suggestions.length === 0 && (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No businesses found on your route</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting the distance or industry filter</p>
              </div>
            )}

            {!loading && suggestions.map((osv) => (
              <div
                key={osv.id}
                className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">{osv.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                        {osv.industry}
                      </span>
                      {osv.google_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold text-gray-700">{osv.google_rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddToRoute(osv)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold flex items-center gap-2 shadow-md"
                  >
                    <Plus className="w-5 h-5" />
                    Add
                  </button>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{osv.address}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-blue-600 font-semibold">
                      <Navigation className="w-4 h-4" />
                      {osv.distance_km.toFixed(1)} km away
                    </div>
                    <div className="text-orange-600 font-semibold">
                      ~{osv.detour_minutes} min detour
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
