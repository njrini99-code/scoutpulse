import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Navigation, GripVertical, Plus } from 'lucide-react';
import { Lead } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { ManualBusinessEntryModal } from './ManualBusinessEntryModal';
import { useAuth } from '../../contexts/AuthContext';

interface CalendarPanelProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointments: Lead[];
  onRefresh: () => void;
  loading: boolean;
  industries: string[];
}

export function CalendarPanel({
  selectedDate,
  onDateChange,
  appointments,
  onRefresh,
  loading,
  industries,
}: CalendarPanelProps) {
  const { user } = useAuth();
  const [draggedAppointment, setDraggedAppointment] = useState<Lead | null>(null);
  const [showManualEntryModal, setShowManualEntryModal] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState<string | null>(null);

  useEffect(() => {
    if (appointments.length > 0 && user) {
      recalculateRouteOrder();
    }
  }, [selectedDate]);

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 7; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeStr);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime12Hour = (time24: string) => {
    const [hour, minute] = time24.split(':');
    const hourNum = parseInt(hour);
    const minuteNum = parseInt(minute);

    let displayHour = hourNum;
    let period = 'AM';

    if (hourNum === 0) {
      displayHour = 12;
    } else if (hourNum === 12) {
      period = 'PM';
    } else if (hourNum > 12) {
      displayHour = hourNum - 12;
      period = 'PM';
    }

    if (minuteNum === 0) {
      return `${displayHour} ${period}`;
    }
    return `${displayHour}:${minute} ${period}`;
  };

  const time24ToMinutes = (time: string): number => {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
  };

  const isAppointmentInSlot = (apt: Lead, slotTime: string): boolean => {
    if (!apt.appointment_time) return false;

    const aptStartMinutes = time24ToMinutes(apt.appointment_time.slice(0, 5));
    const slotStartMinutes = time24ToMinutes(slotTime);
    const slotEndMinutes = slotStartMinutes + 15;

    return aptStartMinutes >= slotStartMinutes && aptStartMinutes < slotEndMinutes;
  };

  const calculateAppointmentHeight = (duration: number): number => {
    return (duration / 15) * 60;
  };

  const previousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const openInGoogleMaps = () => {
    if (appointments.length === 0) return;

    const waypoints = appointments
      .filter((a) => a.latitude && a.longitude)
      .map((a) => `${a.latitude},${a.longitude}`)
      .join('/');

    if (waypoints) {
      window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank');
    }
  };

  const getAppointmentsForTimeSlot = (timeSlot: string) => {
    return appointments.filter((apt) => isAppointmentInSlot(apt, timeSlot));
  };

  const timeToMinutes = (time: string): number => {
    if (!time) return 0;
    const parts = time.trim().split(' ');
    if (parts.length < 2) return 0;

    const [timeStr, period] = parts;
    let [hours, minutes] = timeStr.split(':').map(Number);
    if (!minutes) minutes = 0;

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  };

  const recalculateRouteOrder = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    const { data: allAppointments, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .eq('appointment_date', dateStr);

    if (fetchError || !allAppointments) return;

    const sorted = [...allAppointments].sort((a, b) => {
      const timeA = timeToMinutes(a.appointment_time || '');
      const timeB = timeToMinutes(b.appointment_time || '');
      return timeA - timeB;
    });

    for (let i = 0; i < sorted.length; i++) {
      await supabase
        .from('leads')
        .update({ route_order: i + 1 })
        .eq('id', sorted[i].id);
    }
  };

  const handleDragStart = (e: React.DragEvent, appointment: Lead) => {
    setDraggedAppointment(appointment);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(timeSlot);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(null);
  };

  const handleDrop = async (e: React.DragEvent, newTime: string) => {
    e.preventDefault();
    setIsDraggingOver(null);

    if (draggedAppointment) {
      const { error } = await supabase
        .from('leads')
        .update({
          appointment_time: newTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', draggedAppointment.id);

      if (!error) {
        await recalculateRouteOrder();
        onRefresh();
      }

      setDraggedAppointment(null);
      return;
    }

    try {
      const dragDataRaw = e.dataTransfer.getData('application/json');
      if (dragDataRaw) {
        const dragData = JSON.parse(dragDataRaw);
        const lead = dragData.lead;
        const appointmentType = dragData.appointmentType;
        const duration = dragData.duration;
        const meetingWith = dragData.meetingWith;

        const dateStr = selectedDate.toISOString().split('T')[0];
        const { error } = await supabase
          .from('leads')
          .update({
            appointment_date: dateStr,
            appointment_time: newTime,
            appointment_type: appointmentType,
            appointment_duration: duration,
            meeting_with: meetingWith || lead.owner_name,
            status: 'qualified',
            np_set: appointmentType === 'NP',
            osv_completed: appointmentType === 'OSV',
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        if (!error) {
          await recalculateRouteOrder();
          onRefresh();
        }
      }
    } catch (error) {
      console.error('Error parsing dropped lead:', error);
    }
  };

  const handleManualBusinessSelect = async (leadId: string) => {
    setShowManualEntryModal(false);
    await recalculateRouteOrder();
    onRefresh();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Calendar</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowManualEntryModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Business
            </button>
            <button
              onClick={onRefresh}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <button
            onClick={previousDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <p className="text-lg font-semibold text-gray-900">{formatDate(selectedDate)}</p>
            <p className="text-sm text-gray-600">{appointments.length} appointments</p>
          </div>

          <button
            onClick={nextDay}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {appointments.length > 0 && (
          <button
            onClick={openInGoogleMaps}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Navigation className="w-5 h-5" />
            Open Route in Maps
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading appointments...</div>
        ) : (
          <div className="space-y-1">
            {timeSlots.map((timeSlot) => {
              const slotAppointments = getAppointmentsForTimeSlot(timeSlot);

              return (
                <div
                  key={timeSlot}
                  className="flex gap-3 relative"
                  style={{ height: '60px' }}
                  onDragOver={(e) => handleDragOver(e, timeSlot)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, timeSlot)}
                >
                  <div className="w-20 flex-shrink-0 pt-1">
                    <span className="text-xs font-semibold text-gray-700">
                      {formatTime12Hour(timeSlot)}
                    </span>
                  </div>

                  <div className="flex-1 border-t border-gray-200 relative">
                    {slotAppointments.length === 0 ? (
                      <div
                        className={`absolute inset-0 rounded-lg border-2 border-dashed transition-all flex items-center justify-center ${
                          isDraggingOver === timeSlot
                            ? 'border-blue-500 bg-blue-100 scale-105 opacity-100'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <span className="text-xs font-medium text-gray-500">
                          {isDraggingOver === timeSlot ? 'Drop to schedule' : 'Drop here'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {slotAppointments.map((appointment) => {
                          const duration = appointment.appointment_duration || 30;
                          const height = calculateAppointmentHeight(duration);

                          return (
                            <div
                              key={appointment.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, appointment)}
                              className={`absolute left-0 right-0 text-white rounded-lg p-2 cursor-move hover:shadow-lg transition-all ${
                                appointment.appointment_type === 'OSV'
                                  ? 'bg-gradient-to-r from-green-500 to-green-600'
                                  : 'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}
                              style={{ height: `${height}px`, zIndex: 10 }}
                            >
                              <div className="flex items-start gap-2 h-full">
                                <GripVertical className="w-4 h-4 flex-shrink-0 mt-0.5 opacity-60" />
                                <div className="flex-1 min-w-0 overflow-hidden">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold truncate text-sm">{appointment.business_name}</h3>
                                    {appointment.appointment_type && (
                                      <span className="px-1.5 py-0.5 bg-white bg-opacity-20 rounded text-[9px] font-bold uppercase flex-shrink-0">
                                        {appointment.appointment_type}
                                      </span>
                                    )}
                                  </div>
                                  {appointment.meeting_with && (
                                    <p className="text-xs opacity-90 truncate">
                                      {appointment.meeting_with}
                                    </p>
                                  )}
                                  {appointment.appointment_duration && (
                                    <p className="text-xs opacity-75 mt-0.5">
                                      {appointment.appointment_duration} min
                                    </p>
                                  )}
                                  {duration >= 30 && appointment.phone && (
                                    <a
                                      href={`tel:${appointment.phone}`}
                                      className="text-xs text-white underline hover:opacity-80 inline-block mt-1"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {appointment.phone}
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showManualEntryModal && (
        <ManualBusinessEntryModal
          onSave={handleManualBusinessSelect}
          onClose={() => setShowManualEntryModal(false)}
        />
      )}
    </div>
  );
}
