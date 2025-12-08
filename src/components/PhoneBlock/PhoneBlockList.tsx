import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types/database';
import { findDecisionMaker } from '../../services/decisionMaker';
import { Filter, X, Search, Loader, Star, CheckCircle, AlertCircle, Mail, Phone, Sparkles } from 'lucide-react';
import { EmailComposerModal } from '../Email/EmailComposerModal';

const extractCityFromAddress = (address: string | null): string | null => {
  if (!address) return null;
  const parts = address.split(',');
  if (parts.length >= 2) {
    return parts[parts.length - 2].trim();
  }
  return null;
};

const industryGroups = {
  'Industrial & Manufacturing': [
    'Manufacturing',
    'Warehousing',
    'Logistics',
    'Distribution',
    'Food Processing',
    'Commercial Laundries',
    'Packaging',
    'Printing',
    'Plastics',
    'Injection Molding',
    'Metal Fabrication',
    'Machine Shops',
    'Chemical',
    'Industrial Supply',
    'Transportation',
    'Fleet Services',
  ],
  'Food & Beverage': [
    'Food Service',
    'Restaurants',
    'Catering',
    'Commissary Kitchens',
    'Coffee Shops',
    'Cafés',
    'Bakeries',
    'Breweries',
    'Distilleries',
    'Butcher Shops',
    'Markets',
    'Food Wholesalers',
    'Cold Storage',
  ],
  'Construction & Facilities': [
    'Construction',
    'Contracting',
    'HVAC',
    'Plumbing',
    'Electrical',
    'Janitorial',
    'Facility Maintenance',
    'Equipment Rental',
    'Heavy Machinery',
    'Landscaping',
    'Groundskeeping',
    'Pest Control',
  ],
  'Automotive & Fleet': [
    'Auto Service',
    'Collision Repair',
    'Trucking',
    'Towing',
    'Fleet Maintenance',
  ],
  'Healthcare & Medical': [
    'Healthcare',
    'Clinics',
    'Urgent Care',
    'Dental Offices',
    'Nursing Homes',
    'Assisted Living',
    'Physical Therapy',
    'Rehab Centers',
    'Veterinary',
  ],
};

interface LoadingState {
  [key: string]: boolean;
}

export function PhoneBlockList() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedZips, setSelectedZips] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [zipSearch, setZipSearch] = useState('');
  const [loadingDecisionMakers, setLoadingDecisionMakers] = useState<LoadingState>({});
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);
  const [availableZips, setAvailableZips] = useState<string[]>([]);
  const [availableIndustries, setAvailableIndustries] = useState<Record<string, string[]>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadAvailableZips();
      loadAvailableIndustries();
    }
  }, [user]);

  useEffect(() => {
    if (user && hasAppliedFilters) {
      loadLeads();
    }
  }, [user, hasAppliedFilters]);

  useEffect(() => {
    if (selectedIndustries.length === 0 && selectedZips.length === 0) {
      setFilteredLeads(leads);
      return;
    }

    let filtered = leads;

    if (selectedIndustries.length > 0) {
      filtered = filtered.filter((lead) => selectedIndustries.includes(lead.industry || ''));
    }

    if (selectedZips.length > 0) {
      filtered = filtered.filter((lead) => selectedZips.includes(String(lead.zip)));
    }

    setFilteredLeads(filtered);
  }, [selectedIndustries, selectedZips, leads]);

  const loadLeads = async () => {
    setLoading(true);

    console.log('Loading leads with filters:', {
      selectedIndustries,
      selectedZips,
      userId: user?.id
    });

    let query = supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id);

    if (selectedIndustries.length > 0) {
      query = query.in('industry', selectedIndustries);
    }

    if (selectedZips.length > 0) {
      const zipNumbers = selectedZips.map(z => parseInt(z, 10));
      console.log('Filtering by ZIP codes:', zipNumbers);
      query = query.in('zip', zipNumbers);
    }

    query = query.order('business_name', { ascending: true });

    const { data, error } = await query;

    console.log('Query result:', { data, error, count: data?.length });

    if (!error && data) {
      setLeads(data);
      setFilteredLeads(data);
    } else {
      console.error('Error loading leads:', error);
    }
    setLoading(false);
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]
    );
  };

  const toggleGroup = (industries: string[]) => {
    const allSelected = industries.every((ind) => selectedIndustries.includes(ind));
    if (allSelected) {
      setSelectedIndustries((prev) => prev.filter((i) => !industries.includes(i)));
    } else {
      setSelectedIndustries((prev) => [...new Set([...prev, ...industries])]);
    }
  };

  const toggleZip = (zip: string) => {
    setSelectedZips((prev) => (prev.includes(zip) ? prev.filter((z) => z !== zip) : [...prev, zip]));
  };

  const loadAvailableZips = async () => {
    console.log('Loading available ZIPs for user:', user?.id);
    const { data, error } = await supabase
      .from('leads')
      .select('zip')
      .eq('user_id', user?.id)
      .not('zip', 'is', null);

    if (error) {
      console.error('Error loading ZIPs:', error);
      return;
    }

    if (data) {
      console.log('Raw ZIP data:', data.length, 'records');
      const uniqueZips = Array.from(new Set(data.map((l) => String(l.zip)).filter((z) => z && z !== 'null'))).sort();
      setAvailableZips(uniqueZips);
      console.log('Available ZIPs loaded:', uniqueZips.length, uniqueZips.slice(0, 10));
    }
  };

  const loadAvailableIndustries = async () => {
    console.log('Loading available industries for user:', user?.id);
    const { data, error } = await supabase
      .from('leads')
      .select('industry')
      .eq('user_id', user?.id)
      .not('industry', 'is', null);

    if (error) {
      console.error('Error loading industries:', error);
      return;
    }

    if (data) {
      console.log('Raw industry data:', data.length, 'records');
      const uniqueIndustries = Array.from(new Set(data.map((l) => l.industry).filter((i) => i)));
      console.log('Unique industries from database:', uniqueIndustries);

      // Create simple groups from actual industries
      const grouped: Record<string, string[]> = {};
      uniqueIndustries.forEach(industry => {
        grouped[industry] = [industry];
      });

      console.log('Grouped industries:', grouped);
      console.log('Number of groups with data:', Object.keys(grouped).length);
      setAvailableIndustries(grouped);
    }
  };

  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupName) ? prev.filter((g) => g !== groupName) : [...prev, groupName]
    );
  };

  const clearFilters = () => {
    setSelectedIndustries([]);
    setSelectedZips([]);
    setFilteredLeads([]);
    setLeads([]);
    setHasAppliedFilters(false);
  };

  const applyFilters = () => {
    if (selectedIndustries.length === 0 && selectedZips.length === 0) {
      alert('Please select at least one filter (industry or ZIP code)');
      return;
    }
    setHasAppliedFilters(true);
    setShowFilters(false);
    loadLeads();
  };

  const filteredZips = zipSearch
    ? availableZips.filter((zip) => zip.includes(zipSearch))
    : availableZips;

  const handleFindDecisionMaker = async (lead: Lead) => {
    if (!lead.business_name || !lead.state) {
      return;
    }

    setLoadingDecisionMakers((prev) => ({ ...prev, [lead.id]: true }));

    const city = lead.city || extractCityFromAddress(lead.address) || '';

    try {
      const result = await findDecisionMaker(
        lead.business_name,
        city,
        lead.state,
        lead.address || undefined,
        lead.website || undefined
      );

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (result && result.confidence >= 50) {
        updateData.owner_name = result.name;
        updateData.decision_maker_title = result.title || null;
        updateData.decision_maker_confidence = result.confidence;
        updateData.decision_maker_last_updated = new Date().toISOString();
        updateData.decision_maker_email = result.emailResult?.email || null;
        updateData.decision_maker_email_confidence = result.emailResult?.confidence || null;
        updateData.decision_maker_email_last_updated = result.emailResult ? new Date().toISOString() : null;
      } else if (result && result.confidence < 50) {
        updateData.owner_name = 'None found';
        updateData.decision_maker_title = null;
        updateData.decision_maker_confidence = result.confidence;
        updateData.decision_maker_last_updated = new Date().toISOString();
        updateData.decision_maker_email = result.emailResult?.email || null;
        updateData.decision_maker_email_confidence = result.emailResult?.confidence || null;
        updateData.decision_maker_email_last_updated = result.emailResult ? new Date().toISOString() : null;
      } else {
        updateData.owner_name = 'None found';
        updateData.decision_maker_title = null;
        updateData.decision_maker_confidence = 0;
        updateData.decision_maker_last_updated = new Date().toISOString();
      }

      await supabase
        .from('leads')
        .update(updateData)
        .eq('id', lead.id);

      setLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === lead.id
            ? { ...l, ...updateData }
            : l
        )
      );

      setFilteredLeads((prevLeads) =>
        prevLeads.map((l) =>
          l.id === lead.id
            ? { ...l, ...updateData }
            : l
        )
      );
    } catch (error) {
      console.error('Error finding decision maker:', error);
      alert('Failed to find decision maker. Please try again.');
    } finally {
      setLoadingDecisionMakers((prev) => ({ ...prev, [lead.id]: false }));
    }
  };

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-100 text-green-700 border-green-300';
    if (confidence >= 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-orange-100 text-orange-700 border-orange-300';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3 md:py-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="w-6 h-6 md:w-7 md:h-7" />
            <div>
              <h1 className="text-lg md:text-xl font-bold">Phone Block List</h1>
              {filteredLeads.length > 0 && (
                <p className="text-xs md:text-sm text-blue-100">{filteredLeads.length} businesses</p>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg font-medium transition-all text-sm md:text-base shadow-sm ${
              showFilters
                ? 'bg-white text-blue-600 hover:bg-blue-50'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">Filters</span>
            {(selectedIndustries.length > 0 || selectedZips.length > 0) && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                showFilters ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
              }`}>
                {selectedIndustries.length + selectedZips.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white border-b border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Filter Businesses</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={applyFilters}
                className="px-4 md:px-5 py-2 md:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-sm text-sm md:text-base"
              >
                Generate
              </button>
              {(selectedIndustries.length > 0 || selectedZips.length > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-xs md:text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Industry</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.keys(availableIndustries).length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      Loading industries...
                    </div>
                  ) : (
                    Object.entries(availableIndustries).map(([groupName, industries]) => {
                    const groupSelected = industries.every((ind) => selectedIndustries.includes(ind));
                    const someSelected = industries.some((ind) => selectedIndustries.includes(ind));
                    const isExpanded = expandedGroups.includes(groupName);

                    return (
                      <div key={groupName} className="border border-gray-200 rounded-lg p-3 bg-white">
                        <div className="flex items-center gap-2 w-full">
                          <button
                            onClick={() => toggleGroup(industries)}
                            className="flex items-center gap-2"
                          >
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                groupSelected
                                  ? 'bg-blue-600 border-blue-600'
                                  : someSelected
                                  ? 'bg-blue-200 border-blue-400'
                                  : 'border-gray-300'
                              }`}
                            >
                              {(groupSelected || someSelected) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={() => toggleGroupExpansion(groupName)}
                            className="flex-1 flex items-center justify-between text-left hover:text-blue-600 transition-colors"
                          >
                            <span className="font-semibold text-gray-900">{groupName}</span>
                            <svg
                              className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="grid grid-cols-3 gap-1.5 ml-7 mt-2">
                            {industries.map((industry) => {
                              const count = hasAppliedFilters ? leads.filter((l) => l.industry === industry).length : 0;
                              if (hasAppliedFilters && count === 0) return null;

                              return (
                                <button
                                  key={industry}
                                  onClick={() => toggleIndustry(industry)}
                                  className={`text-left px-2 py-1.5 rounded text-xs transition-colors ${
                                    selectedIndustries.includes(industry)
                                      ? 'bg-blue-100 text-blue-700 font-medium'
                                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {industry} {hasAppliedFilters && `(${count})`}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">ZIP Code</h4>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search ZIP codes..."
                    value={zipSearch}
                    onChange={(e) => setZipSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredZips.length > 0 ? (
                    <div className="grid grid-cols-4 gap-2">
                      {filteredZips.map((zip) => {
                        const count = hasAppliedFilters ? leads.filter((l) => String(l.zip) === zip).length : null;
                        return (
                          <button
                            key={zip}
                            onClick={() => toggleZip(zip)}
                            className={`text-center px-2 py-2 rounded-lg transition-colors ${
                              selectedZips.includes(zip)
                                ? 'bg-blue-100 text-blue-700 font-semibold border-2 border-blue-300'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            <div className="text-sm font-medium">{zip}</div>
                            {count !== null && (
                              <div className="text-xs text-gray-500">({count})</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No ZIP codes found
                    </div>
                  )}
                </div>
              </div>
            </div>

          {hasAppliedFilters && (
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredLeads.length} of {leads.length} businesses
            </div>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
          </div>
        ) : !hasAppliedFilters ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4 md:px-6">
            <Filter className="w-16 h-16 md:w-20 md:h-20 text-gray-300 mb-4" />
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 text-center">Select Filters to Get Started</h3>
            <p className="text-sm md:text-base text-gray-600 text-center max-w-md mb-6">
              Choose industries and ZIP codes, then click Generate to load your phone block list.
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition-all shadow-md text-sm md:text-base"
            >
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
              Open Filters
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No businesses match the selected filters
          </div>
        ) : (
          <>
            <div className="md:hidden bg-white px-4 py-3 space-y-3">
              {filteredLeads.map((lead) => {
                const cleanBusinessName = lead.business_name?.replace(/^["'\s]+|["'\s]+$/g, '') || '';
                const cleanIndustry = lead.industry?.replace(/^["'\s]+|["'\s]+$/g, '') || '';

                return (
                  <div key={lead.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-1">{cleanBusinessName}</h3>
                        {cleanIndustry && (
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {cleanIndustry}
                          </span>
                        )}
                      </div>
                      {lead.google_rating && (
                        <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-bold">{lead.google_rating}</span>
                        </div>
                      )}
                    </div>

                    {lead.phone && (
                      <a
                        href={`tel:${lead.phone}`}
                        className="block text-blue-600 font-semibold text-sm mb-2 hover:underline"
                      >
                        {lead.phone}
                      </a>
                    )}

                    {(lead.address || lead.city) && (
                      <div className="text-xs text-gray-600 mb-3">
                        {lead.address && <div>{lead.address}</div>}
                        <div>
                          {lead.city && lead.state && lead.zip && `${lead.city}, ${lead.state} ${lead.zip}`}
                          {lead.city && lead.state && !lead.zip && `${lead.city}, ${lead.state}`}
                          {!lead.city && lead.state && lead.zip && `${lead.state} ${lead.zip}`}
                        </div>
                      </div>
                    )}

                    {lead.owner_name && lead.owner_name !== 'None found' ? (
                      <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <p className="text-sm font-bold text-gray-900">{lead.owner_name}</p>
                        </div>
                        {lead.decision_maker_title && (
                          <p className="text-xs text-gray-600 ml-6">{lead.decision_maker_title}</p>
                        )}
                        {(lead as any).decision_maker_email && (
                          <a
                            href={`mailto:${(lead as any).decision_maker_email}`}
                            className="text-xs text-blue-600 hover:underline ml-6 block mt-1"
                          >
                            {(lead as any).decision_maker_email}
                          </a>
                        )}
                        {lead.decision_maker_confidence && (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ml-6 mt-1 ${getConfidenceBadgeColor(lead.decision_maker_confidence)}`}>
                            {lead.decision_maker_confidence}% confidence
                          </div>
                        )}
                      </div>
                    ) : lead.owner_name === 'None found' ? (
                      <p className="text-red-500 text-sm font-medium mb-3">Decision Maker: None found</p>
                    ) : null}

                    {lead.owner_name && lead.owner_name !== 'None found' && (lead as any).decision_maker_email ? (
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setEmailComposerOpen(true);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm"
                      >
                        <Sparkles className="w-4 h-4" />
                        Generate AI Email
                      </button>
                    ) : (!lead.owner_name || lead.owner_name === 'None found') && (
                      <button
                        onClick={() => handleFindDecisionMaker(lead)}
                        disabled={loadingDecisionMakers[lead.id] || !lead.state}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingDecisionMakers[lead.id] ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Finding...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4" />
                            {lead.owner_name === 'None found' ? 'Retry Find Decision Maker' : 'Find Decision Maker'}
                          </>
                        )}
                      </button>
                    )}
                    {!lead.state && (!lead.owner_name || lead.owner_name === 'None found') && (
                      <div className="flex items-center gap-1 text-xs text-orange-600 mt-2">
                        <AlertCircle className="w-3 h-3" />
                        Missing state data
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="hidden md:block bg-white">
              <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Decision Maker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredLeads.map((lead) => {
                  const cleanBusinessName = lead.business_name?.replace(/^["'\s]+|["'\s]+$/g, '') || '';
                  const cleanIndustry = lead.industry?.replace(/^["'\s]+|["'\s]+$/g, '') || '';

                  return (
                    <tr key={lead.id} className="hover:bg-blue-50 transition-all">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-gray-900 text-base">{cleanBusinessName}</p>
                          {cleanIndustry && (
                            <span className="inline-block mt-1.5 px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full text-xs font-semibold shadow-sm">
                              {cleanIndustry}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone}`}
                            className="text-blue-600 hover:text-blue-700 font-semibold text-base hover:underline transition-colors"
                          >
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-sm">No phone</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.address || lead.city ? (
                          <div className="text-sm text-gray-700">
                            {lead.address && <div className="font-medium">{lead.address}</div>}
                            <div className="text-gray-600 mt-0.5">
                              {lead.city && lead.state && lead.zip && (
                                <span>{lead.city}, {lead.state} {lead.zip}</span>
                              )}
                              {lead.city && lead.state && !lead.zip && (
                                <span>{lead.city}, {lead.state}</span>
                              )}
                              {!lead.city && lead.state && lead.zip && (
                                <span>{lead.state} {lead.zip}</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No address</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.owner_name && lead.owner_name !== 'None found' ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-bold text-gray-900">{lead.owner_name}</p>
                              <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            </div>
                            {lead.decision_maker_title && (
                              <p className="text-xs text-gray-600 font-medium">{lead.decision_maker_title}</p>
                            )}
                            {(lead as any).decision_maker_email && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Mail className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                <a
                                  href={`mailto:${(lead as any).decision_maker_email}`}
                                  className="text-xs text-blue-600 hover:underline font-medium"
                                >
                                  {(lead as any).decision_maker_email}
                                </a>
                              </div>
                            )}
                            {lead.decision_maker_confidence && (
                              <div
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border mt-1.5 ${getConfidenceBadgeColor(
                                  lead.decision_maker_confidence
                                )}`}
                              >
                                {lead.decision_maker_confidence}% confidence
                              </div>
                            )}
                          </div>
                        ) : lead.owner_name === 'None found' ? (
                          <span className="text-red-500 text-sm font-medium">None found</span>
                        ) : (
                          <span className="text-gray-400 text-sm">Not searched</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.google_rating ? (
                          <div className="flex items-center gap-1.5 bg-yellow-50 px-3 py-1.5 rounded-lg border border-yellow-200 w-fit">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-bold text-gray-900">{lead.google_rating}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No rating</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {lead.owner_name && lead.owner_name !== 'None found' && (lead as any).decision_maker_email ? (
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setEmailComposerOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-semibold text-sm shadow-sm hover:shadow-md"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate Email
                          </button>
                        ) : !lead.owner_name || lead.owner_name === 'None found' ? (
                          <button
                            onClick={() => handleFindDecisionMaker(lead)}
                            disabled={loadingDecisionMakers[lead.id] || !lead.state}
                            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                          >
                            {loadingDecisionMakers[lead.id] ? (
                              <>
                                <Loader className="w-4 h-4 animate-spin" />
                                Finding...
                              </>
                            ) : (
                              <>
                                <Search className="w-4 h-4" />
                                {lead.owner_name === 'None found' ? 'Retry' : 'Find'}
                              </>
                            )}
                          </button>
                        ) : null}
                        {!lead.state && (!lead.owner_name || lead.owner_name === 'None found') && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 mt-1 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Missing state
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </div>

      <EmailComposerModal
        open={emailComposerOpen}
        onClose={() => {
          setEmailComposerOpen(false);
          setSelectedLead(null);
        }}
        lead={selectedLead}
      />
    </div>
  );
}
