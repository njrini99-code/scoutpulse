import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Target, Clock, MapPin, Phone, Mail, Zap, CheckCircle2, Star, Sparkles, Send, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types/database';
import { CopilotWidget } from '../Copilot/CopilotWidget';
import { JoinTeamCard } from './JoinTeamCard';
import { geocodeAddress } from '../../services/googleMaps';
import { enrichBusinessData } from '../../services/serper';

export function DashboardView() {
  const [todayAppointments, setTodayAppointments] = useState<Lead[]>([]);
  const [upcomingFollowUps, setUpcomingFollowUps] = useState<Lead[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [metrics, setMetrics] = useState({
    todayNP: 0,
    todayOSV: 0,
    weekNP: 0,
    weekOSV: 0,
    pipelineValue: 0,
    closeRatio: 0,
  });
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [hasTeam, setHasTeam] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvResults, setCsvResults] = useState<{ success: number; errors: number } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserName();
      checkTeamStatus();
      loadDashboardData();
      generateDailyInsight();
    }
  }, [user]);

  const loadUserName = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('full_name')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (!error && data?.full_name) {
      const firstName = data.full_name.split(' ')[0];
      setUserName(firstName);
    } else {
      setUserName(user?.email?.split('@')[0] || '');
    }
  };

  const checkTeamStatus = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('team_code')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (!error && data) {
      setHasTeam(!!data.team_code);
    } else {
      setHasTeam(false);
    }
  };

  const loadDashboardData = async () => {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: appointments } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .eq('appointment_date', today)
      .order('appointment_time', { ascending: true });

    if (appointments) setTodayAppointments(appointments);

    const { data: followUps } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .gte('follow_up_date', today)
      .order('follow_up_date', { ascending: true })
      .limit(5);

    if (followUps) setUpcomingFollowUps(followUps);

    const { data: recent } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recent) setRecentLeads(recent);

    const { data: allLeads } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id);

    if (allLeads) {
      const todayNP = allLeads.filter(l => l.appointment_date === today && l.np_set).length;
      const todayOSV = allLeads.filter(l => l.appointment_date === today && l.osv_completed).length;
      const weekNP = allLeads.filter(l => l.appointment_date >= weekAgo && l.np_set).length;
      const weekOSV = allLeads.filter(l => l.appointment_date >= weekAgo && l.osv_completed).length;
      const pipeline = allLeads
        .filter(l => l.deal_value && l.status !== 'closed_lost')
        .reduce((sum, l) => sum + (l.deal_value || 0), 0);
      const closed = allLeads.filter(l => l.status === 'closed_won').length;
      const qualified = allLeads.filter(l => l.status === 'qualified').length;

      setMetrics({
        todayNP,
        todayOSV,
        weekNP,
        weekOSV,
        pipelineValue: pipeline,
        closeRatio: qualified > 0 ? (closed / qualified) * 100 : 0,
      });
    }
  };

  const generateDailyInsight = async () => {
    try {
      const prompt = `Based on today's schedule and metrics, provide a brief motivational insight (2 sentences) for a sales rep starting their day. Focus on opportunities and encouragement.`;

      const { data, error } = await supabase.functions.invoke('tempo-copilot', {
        body: { prompt }
      });

      if (error) throw error;
      setAiInsight(data.response);
    } catch (error) {
      console.error('Error generating daily insight:', error);
      setAiInsight('Ready to make today count? Every conversation is an opportunity!');
    }
  };

  const handleAskAI = async () => {
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    setAiResponse('');

    try {
      const contextPrompt = `Today's metrics: ${metrics.todayNP} NPs, ${metrics.todayOSV} OSVs, ${todayAppointments.length} appointments, ${upcomingFollowUps.length} follow-ups.
Week metrics: ${metrics.weekNP} NPs, ${metrics.weekOSV} OSVs, $${metrics.pipelineValue.toFixed(0)} pipeline.

User question: ${aiQuery}

Provide a helpful, actionable response.`;

      const { data, error } = await supabase.functions.invoke('tempo-copilot', {
        body: { prompt: contextPrompt }
      });

      if (error) throw error;
      setAiResponse(data.response);
      setAiQuery('');
    } catch (error) {
      console.error('Error asking AI:', error);
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

    const records = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const values = lines[i].split(',');
      const record: any = {};

      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value) {
          record[header] = value;
        }
      });

      if (record.business_name || record.name) {
        records.push(record);
      }
    }

    return records;
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
      setCsvResults(null);
      handleCsvImport(e.target.files[0]);
    }
  };

  const handleCsvImport = async (file: File) => {
    if (!file || !user) return;

    setCsvImporting(true);
    setCsvProgress(0);

    try {
      const text = await file.text();
      const records = parseCSV(text);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < records.length; i++) {
        const record = records[i];
        setCsvProgress(Math.round(((i + 1) / records.length) * 100));

        try {
          const address = `${record.address || ''} ${record.city || ''} ${record.state || ''} ${
            record.zip || ''
          }`.trim();

          let latitude = null;
          let longitude = null;

          if (address) {
            const geocode = await geocodeAddress(address);
            if (geocode) {
              latitude = geocode.latitude;
              longitude = geocode.longitude;
            }
          }

          const enrichment = await enrichBusinessData(
            record.business_name || record.name,
            record.city,
            record.state
          );

          const leadData = {
            user_id: user.id,
            business_name: record.business_name || record.name || null,
            industry: record.industry || null,
            address: record.address || null,
            city: record.city || null,
            state: record.state || null,
            zip: record.zip || null,
            latitude,
            longitude,
            phone: record.phone || enrichment?.phone || null,
            email: record.email || enrichment?.email || null,
            website: record.website || enrichment?.website || null,
            owner_name: record.owner_name || record.owner || null,
            decision_maker_title: record.decision_maker_title || record.title || null,
            competitor: record.competitor || null,
            pain_points: record.pain_points || enrichment?.description || null,
            notes: record.notes || null,
            status: record.status || 'prospect',
            deal_stage: record.deal_stage || null,
            deal_value: record.deal_value ? parseFloat(record.deal_value) : null,
            np_set: false,
            osv_completed: false,
          };

          const { error } = await supabase.from('leads').insert(leadData);

          if (error) {
            errorCount++;
            console.error('Import error:', error);
          } else {
            successCount++;
          }
        } catch (err) {
          errorCount++;
          console.error('Record processing error:', err);
        }
      }

      setCsvResults({ success: successCount, errors: errorCount });
      loadDashboardData();

      setTimeout(() => {
        setCsvImporting(false);
        setCsvFile(null);
        setCsvResults(null);
      }, 3000);
    } catch (error) {
      console.error('CSV import error:', error);
      setCsvResults({ success: 0, errors: 1 });
      setTimeout(() => {
        setCsvImporting(false);
        setCsvFile(null);
        setCsvResults(null);
      }, 3000);
    }
  };

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? 'Good Morning' : currentHour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {greeting}, {userName || user?.email?.split('@')[0]}
          </h1>
          <p className="text-lg text-gray-600">Here's your daily outlook</p>
        </div>

        {aiInsight && (
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-2xl mb-8">
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-full p-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">AI Daily Insight</h3>
                <p className="text-blue-50 leading-relaxed">{aiInsight}</p>
              </div>
            </div>
          </div>
        )}

        {hasTeam === false && (
          <div className="mb-8">
            <JoinTeamCard onTeamJoined={() => setHasTeam(true)} />
          </div>
        )}

        {(csvImporting || csvResults) && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 rounded-full p-3">
                {csvResults ? (
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                ) : (
                  <FileText className="w-6 h-6 text-blue-600 animate-pulse" />
                )}
              </div>
              <div className="flex-1">
                {csvImporting && !csvResults && (
                  <>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Importing CSV...</h3>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Processing records</span>
                        <span className="text-sm font-semibold text-blue-600">{csvProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${csvProgress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Geocoding addresses, enriching business data, and importing leads...
                    </p>
                  </>
                )}
                {csvResults && (
                  <>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">Import Complete!</h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-semibold text-green-700">
                          {csvResults.success} leads imported
                        </span>
                      </div>
                      {csvResults.errors > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-semibold text-orange-700">
                            {csvResults.errors} errors
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">This message will disappear shortly...</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!csvImporting && !csvResults && (
          <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 mb-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 rounded-full p-3">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Quick Import</h3>
                  <p className="text-blue-100 text-sm">Import leads from CSV with auto-enrichment</p>
                </div>
              </div>
              <div>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="dashboard-csv-upload"
                />
                <label
                  htmlFor="dashboard-csv-upload"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer font-semibold shadow-lg"
                >
                  <FileText className="w-5 h-5" />
                  Choose CSV File
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Today</span>
            </div>
            <div className="text-4xl font-bold mb-1">{metrics.todayNP}</div>
            <div className="text-blue-100 text-sm">New Prospects Set</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle2 className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Today</span>
            </div>
            <div className="text-4xl font-bold mb-1">{metrics.todayOSV}</div>
            <div className="text-green-100 text-sm">On-Site Visits</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">This Week</span>
            </div>
            <div className="text-4xl font-bold mb-1">{metrics.weekNP + metrics.weekOSV}</div>
            <div className="text-purple-100 text-sm">Total Activities</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <Zap className="w-8 h-8 opacity-80" />
              <span className="text-sm font-medium opacity-90">Pipeline</span>
            </div>
            <div className="text-4xl font-bold mb-1">${(metrics.pipelineValue / 1000).toFixed(0)}k</div>
            <div className="text-orange-100 text-sm">Total Value</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Today's Appointments
              </h2>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                {todayAppointments.length}
              </span>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Calendar className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>No appointments today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{apt.business_name}</h3>
                        {apt.owner_name && (
                          <p className="text-sm text-gray-600">{apt.owner_name}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-blue-600 font-semibold">
                        <Clock className="w-4 h-4" />
                        {apt.appointment_time?.slice(0, 5)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                      {apt.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{apt.address}</span>
                        </div>
                      )}
                      {apt.phone && (
                        <a href={`tel:${apt.phone}`} className="text-blue-600 hover:underline font-medium">
                          {apt.phone}
                        </a>
                      )}
                      {apt.google_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-semibold">{apt.google_rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Phone className="w-6 h-6 text-green-600" />
                Upcoming Follow-ups
              </h2>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {upcomingFollowUps.length}
              </span>
            </div>

            {upcomingFollowUps.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Phone className="w-16 h-16 mx-auto mb-3 opacity-50" />
                <p>No upcoming follow-ups</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingFollowUps.map((lead) => (
                  <div
                    key={lead.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{lead.business_name}</h3>
                        {lead.owner_name && (
                          <p className="text-sm text-gray-600">{lead.owner_name}</p>
                        )}
                      </div>
                      <span className="text-sm font-medium text-green-600">
                        {lead.follow_up_date}
                      </span>
                    </div>
                    {lead.follow_up_notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                        {lead.follow_up_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-full p-3">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Assistant</h2>
              <p className="text-sm text-gray-600">Ask me anything about your metrics, strategy, or goals</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAskAI()}
                placeholder="Ask me anything... (e.g., 'How am I tracking toward my goals?')"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={aiLoading}
              />
              <button
                onClick={handleAskAI}
                disabled={aiLoading || !aiQuery.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {aiLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>

            {aiResponse && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <p className="text-gray-700 leading-relaxed">{aiResponse}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAiQuery('How am I tracking this week?')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                Weekly progress
              </button>
              <button
                onClick={() => setAiQuery('What should I focus on today?')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                Today's priorities
              </button>
              <button
                onClick={() => setAiQuery('Tips for my follow-ups?')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                Follow-up tips
              </button>
              <button
                onClick={() => setAiQuery('How can I improve my close rate?')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
              >
                Close rate tips
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
