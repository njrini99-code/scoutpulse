import { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { Lead } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AppointmentScheduleModalProps {
  lead: Lead;
  onSchedule: () => void;
  onClose: () => void;
}

export function AppointmentScheduleModal({
  lead,
  onSchedule,
  onClose,
}: AppointmentScheduleModalProps) {
  const { user } = useAuth();
  const [appointmentType, setAppointmentType] = useState<'OSV' | 'NP'>('NP');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00 AM');
  const [submitting, setSubmitting] = useState(false);

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await supabase
        .from('leads')
        .update({
          appointment_date: date,
          appointment_time: time,
          appointment_type: appointmentType,
          status: 'qualified',
          np_set: appointmentType === 'NP' ? 'true' : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      onSchedule();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Schedule Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business
            </label>
            <p className="text-gray-900 font-semibold">{lead.business_name}</p>
            {lead.address && (
              <p className="text-sm text-gray-600 mt-1">{lead.address}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Appointment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAppointmentType('NP')}
                className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                  appointmentType === 'NP'
                    ? 'border-green-600 bg-green-50 text-green-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                New Presentation (NP)
              </button>
              <button
                type="button"
                onClick={() => setAppointmentType('OSV')}
                className={`px-4 py-3 rounded-lg border-2 font-semibold transition-all ${
                  appointmentType === 'OSV'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                }`}
              >
                OSV
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time
            </label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                appointmentType === 'NP'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              <Calendar className="w-5 h-5" />
              {submitting ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
