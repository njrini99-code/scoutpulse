import { useState, useEffect } from 'react';
import { X, Copy, RefreshCw, Mail, Calendar, CheckCircle, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types/database';

interface EmailComposerModalProps {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
}

export function EmailComposerModal({ open, onClose, lead }: EmailComposerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [tone, setTone] = useState<'professional' | 'warm' | 'direct'>('professional');
  const [length, setLength] = useState<'short' | 'standard'>('standard');
  const [copied, setCopied] = useState<'subject' | 'email' | 'body' | null>(null);
  const [followUpAdded, setFollowUpAdded] = useState(false);

  useEffect(() => {
    if (open && lead) {
      setEmailTo(lead.decision_maker_email || lead.email || '');
      setFollowUpAdded(false);
      setSubject('');
      setBody('');
      generate();
    }
  }, [open, lead]);

  async function generate() {
    if (!lead) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-email`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            leadId: lead.id,
            tone,
            length,
          }),
        }
      );

      const data = await response.json();

      if (data.ok) {
        setSubject(data.subject);
        setBody(data.body);
        setEmailTo(data.emailTo || emailTo);

        await logKPI('EMAIL_DRAFTED', { tone, length, hasDM: !!lead.owner_name });
      } else {
        console.error('Failed to generate email:', data.error);
        alert('Failed to generate email. Please try again.');
      }
    } catch (error) {
      console.error('Error generating email:', error);
      alert('Failed to generate email. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, type: 'subject' | 'email' | 'body') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);

      await logKPI('EMAIL_COPIED', { copiedField: type });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  async function logKPI(eventType: string, metadata: Record<string, any> = {}) {
    if (!user || !lead) return;

    try {
      await supabase.from('kpi_activities').insert({
        user_id: user.id,
        lead_id: lead.id,
        activity_type: eventType,
        notes: JSON.stringify(metadata),
      });
    } catch (error) {
      console.error('Failed to log KPI:', error);
    }
  }

  async function addToFollowUps() {
    if (!user || !lead) return;

    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);

      const { error } = await supabase.from('follow_ups').insert({
        user_id: user.id,
        lead_id: lead.id,
        date_due: dueDate.toISOString().split('T')[0],
        notes: `Follow up on email sent to ${emailTo}`,
      });

      if (!error) {
        setFollowUpAdded(true);
        await logKPI('FOLLOW_UP_CREATED', { dueDate: dueDate.toISOString() });
        setTimeout(() => setFollowUpAdded(false), 3000);
      }
    } catch (error) {
      console.error('Failed to add follow-up:', error);
      alert('Failed to add follow-up. Please try again.');
    }
  }

  if (!open || !lead) return null;

  const hasDM = lead.owner_name && lead.owner_name.trim() !== '';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Email Composer</h2>
            <p className="text-sm text-gray-600 mt-1">
              {lead.business_name}
              {hasDM && ` • ${lead.owner_name}`}
              {lead.decision_maker_title && ` (${lead.decision_maker_title})`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && !subject && !body && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader className="w-12 h-12 text-blue-600 animate-spin mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating your email...</h3>
              <p className="text-sm text-gray-600 text-center">
                AI is crafting a personalized message for {lead.business_name}
              </p>
            </div>
          )}

          {(!loading || subject || body) && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Subject
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    placeholder="Email subject..."
                  />
                  <button
                    onClick={() => copyToClipboard(subject, 'subject')}
                    disabled={!subject}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    {copied === 'subject' ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span className="text-sm">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                placeholder="recipient@email.com"
              />
              <button
                onClick={() => copyToClipboard(emailTo, 'email')}
                disabled={!emailTo}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                {copied === 'email' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Body
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-none"
              rows={12}
              placeholder="Email body..."
            />
            <button
              onClick={() => copyToClipboard(body, 'body')}
              disabled={!body}
              className="mt-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-lg transition-colors flex items-center gap-2"
            >
              {copied === 'body' ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy Body</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={generate}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm">Regenerate</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Tone:</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="professional">Professional</option>
                <option value="warm">Warm</option>
                <option value="direct">Direct</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Length:</label>
              <select
                value={length}
                onChange={(e) => setLength(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="short">Short</option>
                <option value="standard">Standard</option>
              </select>
            </div>
          </div>
            </>
          )}
        </div>

        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={addToFollowUps}
                disabled={followUpAdded}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  followUpAdded
                    ? 'bg-green-100 text-green-700'
                    : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                {followUpAdded ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Added to Follow-Ups</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">Add to Follow-Ups</span>
                  </>
                )}
              </button>

              {emailTo && (
                <a
                  href={`mailto:${emailTo}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                  onClick={() => logKPI('EMAIL_SENT')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">Open in Mail</span>
                </a>
              )}
            </div>

            <p className="text-xs text-gray-500">
              CAN-SPAM compliant • Include unsubscribe option in sent emails
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
