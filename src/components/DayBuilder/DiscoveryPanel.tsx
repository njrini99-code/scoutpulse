import { useState, useEffect } from 'react';
import { Search, MapPin, Building2, Upload, Star, Plus, Calendar, Briefcase, X, Loader, ChevronDown, ChevronRight } from 'lucide-react';
import { Lead } from '../../types/database';
import { CSVImport } from '../Import/CSVImport';
import { ManualBusinessEntryModal } from './ManualBusinessEntryModal';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DiscoveryPanelProps {
  leads: Lead[];
  osvBank: any[];
  onAddToOsvBank: (lead: Lead) => void;
  onScheduleAppointment: (lead: Lead) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function DiscoveryPanel({
  leads,
  osvBank,
  onAddToOsvBank,
  onScheduleAppointment,
  onRefresh,
  loading,
}: DiscoveryPanelProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Lead[]>([]);
  const [searching, setSearching] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'bank'>('search');
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [showIndustries, setShowIndustries] = useState(false);
  const [showZipCodes, setShowZipCodes] = useState(false);
  const [filterResults, setFilterResults] = useState<Lead[]>([]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        searchBusinesses();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (selectedIndustries.length > 0 || selectedZipCodes.length > 0) {
      loadFilteredBusinesses();
    } else {
      setFilterResults([]);
    }
  }, [selectedIndustries, selectedZipCodes]);

  const isValidIndustry = (industry: string): boolean => {
    const cleaned = industry.trim().replace(/["\\]/g, '');
    const invalidPatterns = [
      /^(DDS|DMD|MD|PA|PT|NP|DC|DVM|OD)$/i,
      /^(Inc|LLC|Corp|Ltd|Co)\.?$/i,
      /^(NC|VA|SC|TN|GA|FL)$/i,
      /^North Carolina$/i,
      /^Dr\./i,
      /^\d+/,
      /^[A-Z]{2,3}\d+$/i,
      /\d{3,}/,
    ];
    if (cleaned.length < 3) return false;
    return !invalidPatterns.some(pattern => pattern.test(cleaned));
  };

  const isValidZipCode = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip.trim());
  };

  const industries = Array.from(
    new Set(
      leads
        .map((l) => l.industry)
        .filter((i): i is string => Boolean(i) && isValidIndustry(i))
        .map(i => i.trim().replace(/["\\]/g, ''))
    )
  ).sort();

  const zipCodes = Array.from(
    new Set(
      leads
        .map((l) => String(l.zip))
        .filter((z) => z && z !== 'null' && isValidZipCode(z))
        .map(z => z.trim())
    )
  ).sort();

  const loadFilteredBusinesses = async () => {
    if (!user) return;

    setSearching(true);
    try {
      let query = supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id);

      if (selectedIndustries.length > 0) {
        query = query.in('industry', selectedIndustries);
      }

      if (selectedZipCodes.length > 0) {
        query = query.in('zip', selectedZipCodes);
      }

      const { data, error } = await query.order('business_name').limit(100);

      if (error) throw error;
      setFilterResults(data || []);
    } catch (err) {
      console.error('Filter error:', err);
      setFilterResults([]);
    } finally {
      setSearching(false);
    }
  };

  const searchBusinesses = async () => {
    if (!user || searchQuery.length < 2) return;

    setSearching(true);
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .ilike('business_name', `%${searchQuery}%`)
        .order('business_name')
        .limit(50);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const filteredBankItems = osvBank.filter((item) => {
    if (!searchQuery) return true;
    return (
      item.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.industry?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleAddToOsvBankFromSearch = async (lead: Lead) => {
    await onAddToOsvBank(lead);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleScheduleFromSearch = async (lead: Lead) => {
    onScheduleAppointment(lead);
    setSearchQuery('');
    setSearchResults([]);
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const toggleZipCode = (zip: string) => {
    setSelectedZipCodes((prev) =>
      prev.includes(zip) ? prev.filter((z) => z !== zip) : [...prev, zip]
    );
  };

  const displayResults = searchQuery.length >= 2 ? searchResults : filterResults;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Compact Header with Tabs and Actions */}
      <div className="bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Search className="w-4 h-4" />
              Search
            </button>
            <button
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'bank'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Bank ({osvBank.length})
            </button>
          </div>
          {activeTab === 'search' && (
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search businesses by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searching && (
                  <Loader className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-600 animate-spin" />
                )}
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowManualEntryModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Business</span>
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'search' && (
          <div className="flex h-full">
            {/* Compact Filters Sidebar */}
            <div className="w-48 bg-white border-r border-gray-200 p-3 space-y-2">
              {/* Industries Filter */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowIndustries(!showIndustries)}
                  className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-700">Industries</span>
                  <div className="flex items-center gap-1">
                    {selectedIndustries.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {selectedIndustries.length}
                      </span>
                    )}
                    {showIndustries ? (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                </button>
                {showIndustries && (
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                    {industries.map((industry) => (
                      <label key={industry} className="flex items-start gap-1.5 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs">
                        <input
                          type="checkbox"
                          checked={selectedIndustries.includes(industry)}
                          onChange={() => toggleIndustry(industry)}
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-gray-700 leading-tight">{industry}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Zip Codes Filter */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowZipCodes(!showZipCodes)}
                  className="w-full flex items-center justify-between px-2 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <span className="text-xs font-medium text-gray-700">Zip Codes</span>
                  <div className="flex items-center gap-1">
                    {selectedZipCodes.length > 0 && (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                        {selectedZipCodes.length}
                      </span>
                    )}
                    {showZipCodes ? (
                      <ChevronDown className="w-3 h-3 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                </button>
                {showZipCodes && (
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                    {zipCodes.map((zip) => (
                      <label key={zip} className="flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 p-1 rounded text-xs">
                        <input
                          type="checkbox"
                          checked={selectedZipCodes.includes(zip)}
                          onChange={() => toggleZipCode(zip)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                        />
                        <span className="text-gray-700">{zip}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              {(selectedIndustries.length > 0 || selectedZipCodes.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedIndustries([]);
                    setSelectedZipCodes([]);
                  }}
                  className="w-full px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Area */}
            <div className="flex-1 p-4 overflow-y-auto">
              {searchQuery.length < 2 && displayResults.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Find businesses</h3>
                  <p className="text-gray-600">Search by name or filter by industry and zip code</p>
                </div>
              )}

              {searchQuery.length >= 2 && displayResults.length === 0 && !searching && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No businesses found</h3>
                  <p className="text-gray-600">Try a different search term or adjust your filters</p>
                </div>
              )}

              <div className="space-y-3">
                {displayResults.map((lead) => (
                <div key={lead.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{lead.business_name}</h3>
                      {lead.industry && (
                        <p className="text-sm text-gray-600 mt-1">{lead.industry}</p>
                      )}
                      {lead.address && (
                        <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{lead.address}, {lead.city}, {lead.state} {lead.zip}</span>
                        </div>
                      )}
                      {lead.phone && (
                        <p className="text-sm text-gray-600 mt-1">{lead.phone}</p>
                      )}
                      {lead.google_rating && (
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-medium text-gray-900">{lead.google_rating}</span>
                          {lead.user_ratings_total && (
                            <span className="text-sm text-gray-500">({lead.user_ratings_total} reviews)</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleScheduleFromSearch(lead)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        <Calendar className="w-4 h-4" />
                        Schedule
                      </button>
                      <button
                        onClick={() => handleAddToOsvBankFromSearch(lead)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        <Briefcase className="w-4 h-4" />
                        Add to Bank
                      </button>
                    </div>
                  </div>
                </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="p-4 space-y-3">
            {osvBank.length === 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Your OSV Bank is empty</h3>
                <p className="text-gray-600">Add businesses from the Discover tab to build your OSV bank</p>
              </div>
            )}

            {filteredBankItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{item.business_name}</h3>
                    {item.industry && (
                      <p className="text-sm text-gray-600 mt-1">{item.industry}</p>
                    )}
                    {item.address && (
                      <div className="flex items-start gap-2 mt-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span className="break-words">{item.address}</span>
                      </div>
                    )}
                    {item.google_rating && (
                      <div className="flex items-center gap-2 mt-2">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium text-gray-900">{item.google_rating}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    <p>Drag to Start Day calendar</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showImportModal && <CSVImport onClose={() => setShowImportModal(false)} onImport={onRefresh} />}

      {showManualEntryModal && (
        <ManualBusinessEntryModal
          onClose={() => setShowManualEntryModal(false)}
          onSave={(leadId) => {
            setShowManualEntryModal(false);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
