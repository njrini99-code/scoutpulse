import { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Loader, AlertCircle, Plus, Building2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Lead {
  id: string;
  business_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  google_rating?: number;
  user_ratings_total?: number;
  decision_maker?: string;
}

interface ManualBusinessEntryModalProps {
  onClose: () => void;
  onSave: (leadId: string) => void;
}

interface FormData {
  business_name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  industry: string;
  decision_maker: string;
}

interface FormErrors {
  business_name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

export function ManualBusinessEntryModal({
  onClose,
  onSave,
}: ManualBusinessEntryModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<'search' | 'add'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const [formData, setFormData] = useState<FormData>({
    business_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: '',
    industry: '',
    decision_maker: ''
  });

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      setError(null);
      return;
    }

    setSearching(true);
    setError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('leads')
          .select('*')
          .eq('user_id', user?.id)
          .ilike('business_name', `%${searchQuery}%`)
          .order('business_name')
          .limit(20);

        if (error) throw error;

        setSearchResults(data || []);

        if (!data || data.length === 0) {
          setError('No businesses found. Try adding a new business below.');
        }
      } catch (err) {
        console.error('Search error:', err);
        setError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, user?.id]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.business_name.trim()) {
      errors.business_name = 'Business name is required';
    }

    if (!formData.address.trim()) {
      errors.address = 'Street address is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    } else if (!US_STATES.includes(formData.state.toUpperCase())) {
      errors.state = 'Please enter a valid 2-letter state code';
    }

    if (!formData.zip.trim()) {
      errors.zip = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip)) {
      errors.zip = 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const geocodeAddress = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const fullAddress = `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`;
      console.log('Geocoding address:', fullAddress);

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      console.log('Geocoding response:', data);

      if (data.status === 'OK' && data.results[0]) {
        const coords = {
          lat: data.results[0].geometry.location.lat,
          lng: data.results[0].geometry.location.lng
        };
        console.log('Geocoded successfully:', coords);
        return coords;
      }

      console.warn('Geocoding failed with status:', data.status);
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setGeocoding(true);

    try {
      const coordinates = await geocodeAddress();
      setGeocoding(false);

      if (!coordinates) {
        setError(`Could not recognize the address: "${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}". Please verify it's a valid address and try again.`);
        setSubmitting(false);
        return;
      }

      console.log('Business will be saved with coordinates:', coordinates);

      const leadData = {
        id: crypto.randomUUID(),
        user_id: user?.id,
        business_name: formData.business_name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.toUpperCase().trim(),
        zip: formData.zip.trim(),
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        phone: formData.phone.trim() || null,
        industry: formData.industry.trim() || null,
        decision_maker: formData.decision_maker.trim() || null,
        owner_name: formData.decision_maker.trim() || null,
        source_method: 'manual_entry',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();

      if (error) throw error;

      setSuccess('Business added successfully!');

      setTimeout(() => {
        onSave(data.id);
        onClose();
      }, 1000);

    } catch (err: any) {
      console.error('Error adding business:', err);
      setError(err.message || 'Failed to add business. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectBusiness = (lead: Lead) => {
    onSave(lead.id);
    onClose();
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add Business</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setMode('search')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              mode === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Search className="w-4 h-4" />
              Search Existing
            </div>
          </button>
          <button
            onClick={() => setMode('add')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${
              mode === 'add'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add New
            </div>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {mode === 'search' ? (
            <div className="flex flex-col h-full">
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search your businesses..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  {searching && (
                    <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-600 animate-spin" />
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {searchResults.length === 0 && searchQuery.length >= 2 && !searching && !error && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No businesses found</p>
                    <p className="text-sm mt-1">Try adding a new business using the "Add New" tab</p>
                  </div>
                )}

                {searchResults.length === 0 && searchQuery.length < 2 && (
                  <div className="text-center py-8 text-gray-400">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Type at least 2 characters to search</p>
                  </div>
                )}

                {searchResults.map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => handleSelectBusiness(lead)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">{lead.business_name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{lead.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                          <span>{lead.city}, {lead.state} {lead.zip}</span>
                          {lead.phone && <span>{lead.phone}</span>}
                        </div>
                        {lead.google_rating && (
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-yellow-500">★</span>
                              <span className="text-sm font-medium text-gray-900">{lead.google_rating}</span>
                            </div>
                            {lead.user_ratings_total && (
                              <span className="text-sm text-gray-500">({lead.user_ratings_total} reviews)</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{success}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.business_name}
                    onChange={(e) => handleInputChange('business_name', e.target.value)}
                    placeholder="ABC Company Inc."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.business_name ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {formErrors.business_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.business_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.address ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.address && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Greensboro"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.city ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.city && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formErrors.state ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select...</option>
                    {US_STATES.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {formErrors.state && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.state}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => handleInputChange('zip', e.target.value)}
                  placeholder="27401"
                  maxLength={10}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    formErrors.zip ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {formErrors.zip && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.zip}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(336) 555-1234"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    placeholder="e.g., Restaurant, Retail"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Decision Maker <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.decision_maker}
                  onChange={(e) => handleInputChange('decision_maker', e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {geocoding ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Validating address...
                    </>
                  ) : submitting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Business
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
