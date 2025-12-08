import { useState, useEffect } from 'react';
import { Calendar, Phone, Mail, User, Star, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types/database';
import { FollowUpRequestModal } from './FollowUpRequestModal';

interface FollowUpRequest {
  id: string;
  business_name: string;
  address: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  priority: string;
  rep_description: string;
  manager_notes: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_settings?: {
    user_id: string;
    full_name: string;
    email: string;
  };
}

interface FollowUpsViewProps {
  userRole?: string | null;
}

export function FollowUpsView({ userRole }: FollowUpsViewProps) {
  const [followUps, setFollowUps] = useState<Lead[]>([]);
  const [managerRequests, setManagerRequests] = useState<FollowUpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const { user } = useAuth();
  const isManager = userRole === 'manager';

  useEffect(() => {
    if (user) {
      loadFollowUps();
      loadManagerRequests();
    }
  }, [user]);

  const loadFollowUps = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .lte('follow_up_date', today)
      .not('follow_up_date', 'is', null)
      .order('follow_up_date', { ascending: true });

    if (!error && data) {
      setFollowUps(data);
    }
    setLoading(false);
  };

  const loadManagerRequests = async () => {
    if (isManager) {
      const { data: teamData } = await supabase
        .from('teams')
        .select('team_code')
        .eq('manager_id', user?.id);

      if (!teamData || teamData.length === 0) {
        return;
      }

      const teamCodes = teamData.map(t => t.team_code);

      const { data, error } = await supabase
        .from('follow_up_requests')
        .select('*')
        .in('team_code', teamCodes)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const repIds = [...new Set(data.map((r: any) => r.rep_id))];
        console.log('Rep IDs to fetch:', repIds);

        const { data: userData, error: userError } = await supabase
          .from('user_settings')
          .select('user_id, full_name, email')
          .in('user_id', repIds);

        console.log('User data fetched:', userData, 'Error:', userError);

        const userMap = new Map(userData?.map(u => [u.user_id, u]) || []);
        console.log('User map:', userMap);

        const enrichedData = data.map((request: any) => ({
          ...request,
          user_settings: userMap.get(request.rep_id)
        }));

        console.log('Enriched follow-up requests:', enrichedData);
        setManagerRequests(enrichedData);
      } else if (error) {
        console.error('Error loading manager requests:', error);
      }
    } else {
      const { data, error } = await supabase
        .from('follow_up_requests')
        .select('*')
        .eq('rep_id', user?.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setManagerRequests(data);
      }
    }
  };

  const updateFollowUpDate = async (leadId: string, newDate: string) => {
    const { error } = await supabase
      .from('leads')
      .update({
        follow_up_date: newDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (!error) {
      loadFollowUps();
    }
  };

  const completeFollowUp = async (leadId: string) => {
    const { error } = await supabase
      .from('leads')
      .update({
        follow_up_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', leadId);

    if (!error) {
      loadFollowUps();
    }
  };

  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completingRequestId, setCompletingRequestId] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

  const handleManagerComplete = (requestId: string) => {
    setCompletingRequestId(requestId);
    setCompletionNotes('');
    setShowCompletionModal(true);
  };

  const submitCompletion = async () => {
    if (!completingRequestId) return;

    const { error } = await supabase
      .from('follow_up_requests')
      .update({
        status: 'completed',
        manager_notes: completionNotes || null,
        completed_at: new Date().toISOString(),
        completed_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', completingRequestId);

    if (!error) {
      setShowCompletionModal(false);
      setCompletingRequestId(null);
      setCompletionNotes('');
      loadManagerRequests();
    }
  };

  const handleManagerSendBack = async (requestId: string) => {
    const notes = prompt('What additional information do you need?');

    if (!notes) return;

    const { error } = await supabase
      .from('follow_up_requests')
      .update({
        status: 'needs_more_info',
        manager_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (!error) {
      alert('Request sent back to rep with your notes.');
      loadManagerRequests();
    }
  };

  const handleManagerAddNotes = async (requestId: string, currentNotes: string) => {
    const notes = prompt('Add coaching notes:', currentNotes || '');

    if (notes === null) return;

    const { error } = await supabase
      .from('follow_up_requests')
      .update({
        manager_notes: notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (!error) {
      alert('Notes updated!');
      loadManagerRequests();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading follow-ups...</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'needs_more_info':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_more_info':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAskManagerHelp = (lead: Lead) => {
    setSelectedLead(lead);
    setShowRequestModal(true);
  };

  if (isManager) {
    const pendingRequests = managerRequests.filter(r => r.status === 'submitted' || r.status === 'needs_more_info');
    const completedRequests = managerRequests.filter(r => r.status === 'completed');

    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Follow-up Requests</h1>
          <p className="text-gray-600">
            {activeTab === 'pending' ? `${pendingRequests.length} pending requests` : `${completedRequests.length} completed requests`}
          </p>
        </div>

        <div className="mb-6 border-b border-gray-200">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Completed ({completedRequests.length})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {(activeTab === 'pending' ? pendingRequests : completedRequests).length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {activeTab === 'pending' ? 'No pending requests' : 'No completed requests yet'}
              </h3>
              <p className="text-gray-600">
                {activeTab === 'pending' ? 'Team requests will appear here.' : 'Completed requests will be archived here.'}
              </p>
            </div>
          ) : (
            (activeTab === 'pending' ? pendingRequests : completedRequests).map((request: any) => {
              console.log('Rendering request:', request.business_name, 'user_settings:', request.user_settings);
              return (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <h3 className="font-semibold text-lg text-gray-900">{request.business_name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                        {request.status === 'submitted' ? 'New' : request.status === 'needs_more_info' ? 'Needs Info' : 'Completed'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                        {request.priority} Priority
                      </span>
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold bg-purple-600 text-white shadow-sm flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        Rep: {request.user_settings?.full_name || request.user_settings?.email || 'Loading...'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{request.address}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-base font-medium text-blue-600 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    <Phone className="h-5 w-5" />
                    <a href={`tel:${request.contact_phone}`} className="hover:underline">
                      {request.contact_phone}
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {request.contact_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{request.contact_name}</span>
                      </div>
                    )}
                    {request.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{request.contact_email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span className="font-medium">Category:</span>
                      <span>{request.category}</span>
                    </div>
                  </div>
                </div>

                {request.rep_description && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-blue-900 mb-1">Rep Description:</p>
                    <p className="text-sm text-blue-800">{request.rep_description}</p>
                  </div>
                )}

                {request.manager_notes && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-green-900 mb-1">Your Notes:</p>
                    <p className="text-sm text-green-800">{request.manager_notes}</p>
                  </div>
                )}

                {activeTab === 'pending' && (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleManagerComplete(request.id)}
                      className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => handleManagerSendBack(request.id)}
                      className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                    >
                      Send Back
                    </button>
                    <button
                      onClick={() => handleManagerAddNotes(request.id, request.manager_notes)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                    >
                      Add Notes
                    </button>
                  </div>
                )}
              </div>
              );
            })
          )}
        </div>

        {showCompletionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Complete Follow-up Request</h3>
              <p className="text-gray-600 mb-4">
                Add notes about what happened during the call. This will be sent back to the rep.
              </p>

              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="What was the outcome of the call? Any feedback for the rep?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={6}
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={submitCompletion}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Complete & Notify Rep
                </button>
                <button
                  onClick={() => {
                    setShowCompletionModal(false);
                    setCompletingRequestId(null);
                    setCompletionNotes('');
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Follow-ups</h1>
        <p className="text-gray-600">
          {activeTab === 'pending' ? `${followUps.length} leads need your attention` : `${managerRequests.length} manager requests`}
        </p>
      </div>

      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            My Follow-ups ({followUps.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Manager Requests ({managerRequests.length})
          </button>
        </div>
      </div>

      {activeTab === 'pending' ? (
        followUps.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h3>
            <p className="text-gray-600">No follow-ups are currently due</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {followUps.map((lead) => (
            <div
              key={lead.id}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{lead.business_name}</h3>
                  {lead.owner_name && (
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <User className="w-4 h-4" />
                      {lead.owner_name}
                      {lead.decision_maker_title && ` - ${lead.decision_maker_title}`}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    Follow-up due: {lead.follow_up_date}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAskManagerHelp(lead)}
                    className="px-4 py-2 border border-orange-500 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Ask Manager
                  </button>
                  <button
                    onClick={() => {
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      updateFollowUpDate(lead.id, tomorrow.toISOString().split('T')[0]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Snooze 1 Day
                  </button>
                  <button
                    onClick={() => completeFollowUp(lead.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                  >
                    Complete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {lead.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Phone className="w-4 h-4" />
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Mail className="w-4 h-4" />
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.google_rating && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-900">{lead.google_rating}</span>
                    {lead.user_ratings_total && (
                      <span className="text-sm text-gray-500">({lead.user_ratings_total} reviews)</span>
                    )}
                  </div>
                )}
              </div>

              {lead.competitor && (
                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-medium">
                    Competitor: {lead.competitor}
                  </span>
                </div>
              )}

              {lead.pain_points && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Pain Points:</p>
                  <p className="text-sm text-gray-600">{lead.pain_points}</p>
                </div>
              )}

              {lead.follow_up_notes && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                  <p className="text-sm text-gray-600">{lead.follow_up_notes}</p>
                </div>
              )}
            </div>
          ))}
          </div>
        )
      ) : (
        managerRequests.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No manager requests yet</h3>
            <p className="text-gray-600">When you need help with a lead, click "Ask Manager" on any follow-up card.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {managerRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{request.business_name}</h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(request.priority)}`}>
                        {request.priority}
                      </span>
                    </div>
                    {request.address && (
                      <p className="text-sm text-gray-600 mb-2">{request.address}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(request.status)}`}>
                      {request.status === 'needs_more_info' ? 'Needs More Info' : request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                    {request.category}
                  </span>
                </div>

                {(request.contact_name || request.contact_phone || request.contact_email) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    {request.contact_name && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <User className="w-4 h-4" />
                        {request.contact_name}
                      </div>
                    )}
                    {request.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${request.contact_phone}`} className="text-blue-600 hover:underline">
                          {request.contact_phone}
                        </a>
                      </div>
                    )}
                    {request.contact_email && (
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Mail className="w-4 h-4" />
                        <a href={`mailto:${request.contact_email}`} className="text-blue-600 hover:underline">
                          {request.contact_email}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Your Description:</p>
                  <p className="text-sm text-gray-600">{request.rep_description}</p>
                </div>

                {request.manager_notes && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-blue-900 mb-2">Manager Response:</p>
                    <p className="text-sm text-blue-800">{request.manager_notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                  <span>Submitted {new Date(request.created_at).toLocaleDateString()}</span>
                  {request.status !== 'submitted' && (
                    <span>Updated {new Date(request.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <FollowUpRequestModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedLead(null);
          loadManagerRequests();
        }}
        businessData={selectedLead ? {
          name: selectedLead.business_name,
          address: selectedLead.address,
          contactName: selectedLead.owner_name || selectedLead.decision_maker || '',
          contactPhone: selectedLead.phone || '',
          contactEmail: selectedLead.email || ''
        } : undefined}
      />
    </div>
  );
}
