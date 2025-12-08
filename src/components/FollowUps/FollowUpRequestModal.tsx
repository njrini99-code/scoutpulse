import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface FollowUpRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessData?: {
    name: string;
    address?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
}

export function FollowUpRequestModal({ isOpen, onClose, businessData }: FollowUpRequestModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [teamCode, setTeamCode] = useState('');

  const [formData, setFormData] = useState({
    business_name: businessData?.name || '',
    address: businessData?.address || '',
    contact_name: businessData?.contactName || '',
    contact_phone: businessData?.contactPhone || '',
    contact_email: businessData?.contactEmail || '',
    category: 'Other',
    priority: 'Medium',
    rep_description: ''
  });

  useEffect(() => {
    if (businessData) {
      setFormData(prev => ({
        ...prev,
        business_name: businessData.name || '',
        address: businessData.address || '',
        contact_name: businessData.contactName || '',
        contact_phone: businessData.contactPhone || '',
        contact_email: businessData.contactEmail || ''
      }));
    }
  }, [businessData]);

  useEffect(() => {
    if (user) {
      loadUserTeamCode();
    }
  }, [user]);

  const loadUserTeamCode = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('team_code')
      .eq('user_id', user?.id)
      .single();

    if (data) {
      setTeamCode(data.team_code);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.business_name.trim()) {
      setError('Business name is required');
      return;
    }

    if (!formData.contact_phone.trim()) {
      setError('Contact phone number is required');
      return;
    }

    if (!formData.rep_description.trim()) {
      setError('Description is required');
      return;
    }

    if (!teamCode) {
      setError('Unable to determine your team. Please contact support.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: submitError } = await supabase
      .from('follow_up_requests')
      .insert({
        rep_id: user?.id,
        team_code: teamCode,
        business_name: formData.business_name,
        address: formData.address,
        contact_name: formData.contact_name,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        category: formData.category,
        priority: formData.priority,
        rep_description: formData.rep_description,
        status: 'submitted'
      });

    setLoading(false);

    if (submitError) {
      setError('Failed to submit request: ' + submitError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      onClose();
      setSuccess(false);
      setFormData({
        business_name: '',
        address: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        category: 'Other',
        priority: 'Medium',
        rep_description: ''
      });
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold text-gray-900">Request Manager Follow-Up</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
            <p className="text-gray-600">Your manager will review this shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Ghosted">Ghosted</option>
                  <option value="Presented">Presented</option>
                  <option value="Can't Set NP">Can't Set NP</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priority *
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={formData.rep_description}
                onChange={(e) => setFormData({ ...formData, rep_description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Explain the situation and what you need help with..."
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
