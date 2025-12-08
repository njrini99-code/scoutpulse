import { useState, useEffect } from 'react';
import { Mail, Star } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types/database';
import { EmailComposerModal } from './EmailComposerModal';

export function EmailView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadLeads();
    }
  }, [user]);

  const loadLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (!error && data) {
      setLeads(data);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Email Composer</h1>
        <p className="text-gray-600">Generate personalized cold outreach emails powered by AI</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-4 text-lg">Select Lead to Email</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[70vh] overflow-y-auto">
          {leads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => {
                setSelectedLead(lead);
                setEmailComposerOpen(true);
              }}
              className="text-left p-4 rounded-lg transition-all bg-gray-50 hover:bg-blue-50 hover:border-blue-500 border-2 border-transparent"
            >
              <p className="font-semibold text-gray-900 mb-1">{lead.business_name}</p>
              {lead.owner_name && lead.owner_name !== 'None found' && (
                <p className="text-sm text-gray-700 mb-1">{lead.owner_name}</p>
              )}
              <div className="flex items-center gap-2 mb-2">
                {lead.decision_maker_email || lead.email ? (
                  <p className="text-xs text-blue-600 truncate">
                    {lead.decision_maker_email || lead.email}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">No email</p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {lead.industry && (
                  <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                    {lead.industry}
                  </span>
                )}
                {lead.city && (
                  <span className="inline-block px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                    {lead.city}
                  </span>
                )}
                {lead.google_rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-gray-900">{lead.google_rating}</span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {leads.length === 0 && (
          <div className="text-center py-12">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No leads found
            </h3>
            <p className="text-gray-600">
              Import or create leads to start sending personalized emails
            </p>
          </div>
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
