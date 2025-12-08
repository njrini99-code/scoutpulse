import { useState, useEffect } from 'react';
import { DiscoveryPanel } from './DiscoveryPanel';
import { AppointmentScheduleModal } from './AppointmentScheduleModal';
import { Lead } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export function DayBuilderView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [osvBank, setOsvBank] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadLeads();
      loadOsvBank();
      loadAppointments();
    }
  }, [user, selectedDate]);

  const loadLeads = async () => {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .is('appointment_date', null)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLeads(data);
    }
    setLoading(false);
  };

  const loadOsvBank = async () => {
    const { data, error } = await supabase
      .from('osv_bank')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOsvBank(data);
    }
  };

  const loadAppointments = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .eq('appointment_date', dateStr)
      .order('route_order', { ascending: true, nullsFirst: false })
      .order('appointment_time', { ascending: true });

    if (!error && data) {
      setAppointments(data);
    }
  };

  const handleAddToOsvBank = async (lead: Lead) => {
    try {
      await supabase.from('osv_bank').insert({
        user_id: user?.id,
        lead_id: lead.id,
        business_name: lead.business_name,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        industry: lead.industry,
        phone: lead.phone,
        google_rating: lead.google_rating,
      });

      await loadOsvBank();
    } catch (error) {
      console.error('Error adding to OSV bank:', error);
    }
  };

  const handleScheduleAppointment = (lead: Lead) => {
    setSelectedLead(lead);
    setShowScheduleModal(true);
  };

  const handleScheduleComplete = async () => {
    setShowScheduleModal(false);
    setSelectedLead(null);
    await loadLeads();
    await loadAppointments();
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    return `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-3 py-2">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex-1 flex items-center gap-1 overflow-x-auto">
            {timeSlots.map((slot) => {
              const hasAppointment = appointments.some(apt => apt.appointment_time === slot);
              return (
                <div
                  key={slot}
                  className={`flex-shrink-0 w-12 h-8 rounded text-xs flex items-center justify-center font-medium ${
                    hasAppointment
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                  title={slot}
                >
                  {slot.split(':')[0]}{slot.includes('PM') ? 'p' : 'a'}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() - 1);
                setSelectedDate(newDate);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Today
            </button>
            <button
              onClick={() => {
                const newDate = new Date(selectedDate);
                newDate.setDate(newDate.getDate() + 1);
                setSelectedDate(newDate);
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <DiscoveryPanel
          leads={leads}
          osvBank={osvBank}
          onAddToOsvBank={handleAddToOsvBank}
          onScheduleAppointment={handleScheduleAppointment}
          onRefresh={loadLeads}
          loading={loading}
        />
      </div>

      {showScheduleModal && selectedLead && (
        <AppointmentScheduleModal
          lead={selectedLead}
          onClose={() => setShowScheduleModal(false)}
          onSchedule={handleScheduleComplete}
        />
      )}
    </div>
  );
}
