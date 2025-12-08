import { useState, useEffect } from 'react';
import { X, CheckCircle, Target, TrendingUp, Award, Clock, MapPin, Mic, MicOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface QuickLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Location {
  latitude: number;
  longitude: number;
}

export function QuickLogModal({ isOpen, onClose }: QuickLogModalProps) {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [revenue, setRevenue] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      captureLocation();
    }
  }, [isOpen]);

  const captureLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const actionTypes = [
    {
      id: 'osv_completed',
      label: 'OSV Completed',
      icon: Target,
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'On-Site Visit'
    },
    {
      id: 'np_set',
      label: 'NP Set',
      icon: TrendingUp,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'New Presentation'
    },
    {
      id: 'close_won',
      label: 'Close Won',
      icon: Award,
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Deal Closed'
    },
    {
      id: 'follow_up',
      label: 'Follow-Up',
      icon: Clock,
      color: 'bg-orange-500 hover:bg-orange-600',
      description: 'Follow-Up Created'
    }
  ];

  const handleQuickLog = async (eventType: string) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No active session');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quick-log`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: eventType,
          latitude: location?.latitude || null,
          longitude: location?.longitude || null,
          note: note || null,
          business_name: businessName || null,
          revenue: revenue ? parseFloat(revenue) : 0
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSuccessMessage(result.message);
        setShowSuccess(true);

        setTimeout(() => {
          setShowSuccess(false);
          resetForm();
          onClose();
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to log activity');
      }
    } catch (error) {
      console.error('Error logging activity:', error);
      alert('Failed to log activity. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedType(null);
    setNote('');
    setBusinessName('');
    setRevenue('');
    setLocation(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center animate-bounce">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{successMessage}</h2>
          <p className="text-gray-600">Activity logged successfully</p>
        </div>
      </div>
    );
  }

  if (!selectedType) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Quick Log</h2>
              <p className="text-blue-100">Record activity in seconds</p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            {location && (
              <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <MapPin className="w-4 h-4 text-green-600" />
                <span>Location captured: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {actionTypes.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => setSelectedType(action.id)}
                    className={`${action.color} text-white rounded-xl p-6 transition-all transform hover:scale-105 shadow-lg`}
                  >
                    <Icon className="w-12 h-12 mx-auto mb-3" />
                    <div className="text-lg font-bold mb-1">{action.label}</div>
                    <div className="text-sm opacity-90">{action.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedAction = actionTypes.find(a => a.id === selectedType);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedAction && <selectedAction.icon className="w-8 h-8" />}
            <div>
              <h2 className="text-2xl font-bold">{selectedAction?.label}</h2>
              <p className="text-blue-100">Add details (optional)</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedType(null)}
            className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {location && (
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <MapPin className="w-4 h-4 text-green-600" />
              <span>Location: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Name
            </label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Enter business name"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {(selectedType === 'close_won' || selectedType === 'closed') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue ($)
              </label>
              <input
                type="number"
                value={revenue}
                onChange={(e) => setRevenue(e.target.value)}
                placeholder="0.00"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add optional notes..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setSelectedType(null)}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => handleQuickLog(selectedType)}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
