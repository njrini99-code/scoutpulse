import { useState, useEffect } from 'react';
import { Upload, Search, Filter, Phone, Mail, MapPin, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types/database';
import { CSVImport } from '../Import/CSVImport';

export function LeadsView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user]);

  useEffect(() => {
    filterLeads();
  }, [searchQuery, leads]);

  const loadLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
      setFilteredLeads(data);
    }
    setLoading(false);
  };

  const filterLeads = () => {
    if (!searchQuery.trim()) {
      setFilteredLeads(leads);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = leads.filter(
      (lead) =>
        lead.business_name?.toLowerCase().includes(query) ||
        lead.owner_name?.toLowerCase().includes(query) ||
        lead.address?.toLowerCase().includes(query) ||
        lead.industry?.toLowerCase().includes(query) ||
        lead.city?.toLowerCase().includes(query) ||
        String(lead.zip || '').toLowerCase().includes(query)
    );
    setFilteredLeads(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading leads...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">All Leads</h1>
          <p className="text-sm md:text-base text-gray-600">
            {filteredLeads.length} of {leads.length} leads
          </p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
        >
          <Upload className="w-4 h-4 md:w-5 md:h-5" />
          Import CSV
        </button>
      </div>

      <div className="mb-4 md:mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads..."
            className="w-full pl-9 md:pl-10 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm md:text-base"
          />
        </div>
      </div>

      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 md:p-12 text-center">
          <Filter className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2">No leads found</h3>
          <p className="text-sm md:text-base text-gray-600 mb-4">
            {searchQuery ? 'Try adjusting your search' : 'Get started by importing a CSV file'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowImport(true)}
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm md:text-base"
            >
              <Upload className="w-4 h-4 md:w-5 md:h-5" />
              Import CSV
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:gap-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className="bg-white border border-gray-200 rounded-lg md:rounded-xl p-4 md:p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3 md:mb-4">
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-1">{lead.business_name}</h3>
                  {lead.owner_name && (
                    <p className="text-sm md:text-base text-gray-600 mb-2">
                      {lead.owner_name}
                      {lead.decision_maker_title && ` - ${lead.decision_maker_title}`}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {lead.status && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        lead.status === 'closed_won'
                          ? 'bg-green-100 text-green-800'
                          : lead.status === 'qualified'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {lead.status.replace('_', ' ')}
                    </span>
                  )}
                  {lead.deal_value && (
                    <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      ${lead.deal_value.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                {lead.industry && (
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="font-medium text-gray-900">{lead.industry}</p>
                  </div>
                )}

                {lead.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-900">{lead.address}</p>
                      <p className="text-sm text-gray-600">
                        {lead.city && `${lead.city}, `}
                        {lead.state} {lead.zip}
                      </p>
                    </div>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a
                      href={`tel:${lead.phone}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {lead.phone}
                    </a>
                  </div>
                )}

                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      {lead.email}
                    </a>
                  </div>
                )}

                {lead.google_rating && (
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-900">
                      {lead.google_rating}
                    </span>
                    {lead.user_ratings_total && (
                      <span className="text-sm text-gray-500">({lead.user_ratings_total} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              {(lead.notes || lead.pain_points) && (
                <div className="bg-gray-50 rounded-lg p-3 text-xs md:text-sm text-gray-700">
                  {lead.pain_points && (
                    <p className="mb-2">
                      <span className="font-medium">Pain Points:</span> {lead.pain_points}
                    </p>
                  )}
                  {lead.notes && (
                    <p>
                      <span className="font-medium">Notes:</span> {lead.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showImport && (
        <CSVImport
          onClose={() => setShowImport(false)}
          onComplete={() => {
            setShowImport(false);
            loadLeads();
          }}
        />
      )}
    </div>
  );
}
