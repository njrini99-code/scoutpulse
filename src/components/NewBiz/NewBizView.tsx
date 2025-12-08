import { useState, useEffect, useRef } from 'react';
import { Upload, Search, Phone, Mail, Calendar, Star, Building2, MapPin, User, CheckCircle, Clock, Target, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NewBusiness {
  id: string;
  business_name: string;
  business_name_norm: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  zip5: string;
  latitude: number;
  longitude: number;
  place_id: string;
  owner_name: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  industry: string;
  deal_stage: string;
  rating: number;
  notes: string;
  np_set: boolean;
  osv_completed: boolean;
  appointment_date: string;
  presented: boolean;
  in_territory: boolean;
  business_status: string;
  description: string;
  timeline: string;
  report_date: string;
  created_at: string;
  newbiz_lead_links: any[];
}

export function NewBizView() {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<NewBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [territoryOnly, setTerritoryOnly] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadBusinesses();
  }, [searchTerm, territoryOnly, startDate, endDate]);

  const loadBusinesses = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No session');
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newbiz-inbox`;
      const params = new URLSearchParams({
        search: searchTerm,
        territory_only: territoryOnly.toString(),
        page: '1',
        limit: '100',
      });

      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }

      const response = await fetch(`${apiUrl}?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.businesses) {
        setBusinesses(data.businesses);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      await processFile(files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      await processFile(files[0]);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Not authenticated');
        return;
      }

      const text = await file.text();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newbiz-ingest-csv`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csv_text: text }),
      });

      const result = await response.json();
      if (result.success) {
        alert(`Successfully imported ${result.results.inserted} businesses!\nSkipped: ${result.results.skipped}`);
        loadBusinesses();
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert('Failed to upload CSV');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAction = async (businessId: string, actionType: string, data?: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Not authenticated');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/newbiz-action`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          business_id: businessId,
          action_type: actionType,
          data,
        }),
      });

      const result = await response.json();
      if (result.success) {
        loadBusinesses();
      }
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const handleDeleteBusiness = async (businessId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to remove "${businessName}" from the list?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rep_new_businesses')
        .delete()
        .eq('id', businessId);

      if (error) {
        throw error;
      }

      loadBusinesses();
    } catch (error) {
      console.error('Error deleting business:', error);
      alert('Failed to remove business. Please try again.');
    }
  };

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'qualified': return 'bg-green-100 text-green-800 border-green-200';
      case 'presented': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading new businesses...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">New Businesses</h1>
        <p className="text-gray-600">
          Upload and manage businesses from your territory
        </p>
      </div>

      <div
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-2">
          Drop CSV file here or click to upload
        </p>
        <p className="text-sm text-gray-500 mb-4">
          CSV should include: business_name, zip, address, city, state, contact_name, contact_phone, etc.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInput}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Select File'}
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name, contact, or ZIP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={territoryOnly}
              onChange={(e) => setTerritoryOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm font-medium text-gray-700">Territory Only</span>
          </label>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Report Date:</span>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="Start Date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="End Date"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No businesses found</p>
          <p className="text-gray-500 text-sm mt-2">Upload a CSV to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {businesses.map((business) => (
            <div
              key={business.id}
              className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${
                !business.in_territory ? 'border-orange-200 bg-orange-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{business.business_name}</h3>
                    {!business.in_territory && (
                      <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                        Out of Territory
                      </span>
                    )}
                    {business.newbiz_lead_links?.length > 0 && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        Matched to Lead
                      </span>
                    )}
                    {business.business_status && (
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                        {business.business_status}
                      </span>
                    )}
                    {business.timeline && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {business.timeline}
                      </span>
                    )}
                    {business.report_date && (
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(business.report_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {business.address && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">
                        {business.address}, {business.city}, {business.state} {business.zip}
                      </span>
                    </div>
                  )}

                  {business.description && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-gray-800 leading-relaxed">{business.description}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 text-sm">
                    {business.owner_name && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="h-4 w-4" />
                        <span>{business.owner_name}</span>
                      </div>
                    )}
                    {business.contact_phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="h-4 w-4" />
                        <span>{business.contact_phone}</span>
                      </div>
                    )}
                    {business.contact_email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="h-4 w-4" />
                        <span>{business.contact_email}</span>
                      </div>
                    )}
                    {business.industry && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="h-4 w-4" />
                        <span>{business.industry}</span>
                      </div>
                    )}
                    {business.rating && (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: business.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDealStageColor(business.deal_stage)}`}>
                    {business.deal_stage}
                  </span>
                </div>
              </div>

              {business.notes && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{business.notes}</p>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {!business.np_set && (
                  <button
                    onClick={() => handleAction(business.id, 'np_set')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    <Target className="h-4 w-4" />
                    Add to Follow-Up (NP)
                  </button>
                )}
                {business.np_set && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    Added to Follow-Up
                  </span>
                )}

                {!business.osv_completed && (
                  <button
                    onClick={() => handleAction(business.id, 'osv_completed')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark OSV Complete
                  </button>
                )}
                {business.osv_completed && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    <CheckCircle className="h-4 w-4" />
                    OSV Complete
                  </span>
                )}

                {!business.appointment_date && (
                  <button
                    onClick={() => {
                      const date = prompt('Enter appointment date (YYYY-MM-DD):');
                      if (date) {
                        handleAction(business.id, 'schedule', { appointment_date: date });
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                  >
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </button>
                )}
                {business.appointment_date && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    {new Date(business.appointment_date).toLocaleDateString()}
                  </span>
                )}

                {business.contact_phone && (
                  <a
                    href={`tel:${business.contact_phone}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}

                {business.contact_email && (
                  <a
                    href={`mailto:${business.contact_email}`}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </a>
                )}

                <button
                  onClick={() => handleDeleteBusiness(business.id, business.business_name)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium ml-auto"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
