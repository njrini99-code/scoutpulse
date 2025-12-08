import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Lead } from '../../types/database';
import {
  MapPin,
  Phone,
  Clock,
  Navigation,
  CheckCircle,
  MessageSquarePlus,
  Loader,
  Star,
  Building2,
  ChevronLeft,
  ChevronRight,
  Map,
  Sparkles,
  Play,
  Briefcase,
  Calendar as CalendarIcon,
  X,
  Mail,
  Trash2,
  TrendingUp,
  FileText
} from 'lucide-react';
import { findDecisionMaker } from '../../services/decisionMaker';
import { optimizeRoute, calculateRouteSummary, RouteSummary } from '../../services/routeOptimization';
import { RouteSummaryModal } from './RouteSummaryModal';
import { EmailComposerModal } from '../Email/EmailComposerModal';
import { FindOSVsModal } from './FindOSVsModal';
import { BusinessSummarySection } from './BusinessSummarySection';

export function StartDayView() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Lead[]>([]);
  const [osvBank, setOsvBank] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingDM, setLoadingDM] = useState(false);
  const [completingAction, setCompletingAction] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState('');
  const [kpiStats, setKpiStats] = useState({ osv: 0, np: 0, followUps: 0 });
  const [draggedOsvId, setDraggedOsvId] = useState<string | null>(null);
  const [showStartDayFlow, setShowStartDayFlow] = useState(false);
  const [optimizationStage, setOptimizationStage] = useState('');
  const [movingAppointments, setMovingAppointments] = useState<Set<string>>(new Set());
  const [routeSummary, setRouteSummary] = useState<RouteSummary | null>(null);
  const [pendingSchedule, setPendingSchedule] = useState<any[]>([]);
  const [selectedOsvs, setSelectedOsvs] = useState<Set<string>>(new Set());
  const [beforeOptimization, setBeforeOptimization] = useState<RouteSummary | null>(null);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [selectedLeadForEmail, setSelectedLeadForEmail] = useState<Lead | null>(null);
  const [findOSVsModalOpen, setFindOSVsModalOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [startingPoint, setStartingPoint] = useState<{ address: string; lat: number; lng: number } | null>(null);
  const [editingStartPoint, setEditingStartPoint] = useState(false);
  const [startPointAddress, setStartPointAddress] = useState('');

  useEffect(() => {
    if (user) {
      loadAppointmentsForDate();
      loadOsvBank();
      loadTodayKPIs();
      loadStartingPoint();
    }
  }, [user, selectedDate]);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const loadAppointmentsForDate = async () => {
    const dateStr = selectedDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .eq('appointment_date', dateStr)
      .order('route_order', { ascending: true, nullsLast: true })
      .order('appointment_time', { ascending: true });

    if (!error && data) {
      setAppointments(data);

      if (data.length > 0) {
        await recalculateRouteOrder(data, dateStr);
      }
    }
    setLoading(false);
  };

  const recalculateRouteOrder = async (appts: Lead[], dateStr: string) => {
    const timeToMinutes = (time: string): number => {
      const [timePart, period] = time.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);

      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const sorted = [...appts]
      .filter(apt => apt.appointment_time)
      .sort((a, b) => {
        const timeA = timeToMinutes(a.appointment_time!);
        const timeB = timeToMinutes(b.appointment_time!);
        return timeA - timeB;
      });

    for (let i = 0; i < sorted.length; i++) {
      const apt = sorted[i];
      if (apt.route_order !== i + 1) {
        await supabase
          .from('leads')
          .update({ route_order: i + 1 })
          .eq('id', apt.id);
      }
    }

    const { data: refreshed } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user?.id)
      .eq('appointment_date', dateStr)
      .order('route_order', { ascending: true, nullsLast: true });

    if (refreshed) {
      setAppointments(refreshed);
    }
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

  const loadStartingPoint = async () => {
    const { data } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user?.id)
      .maybeSingle();

    if (data && data.starting_point_address) {
      setStartingPoint({
        address: data.starting_point_address,
        lat: data.starting_point_latitude,
        lng: data.starting_point_longitude
      });
      setStartPointAddress(data.starting_point_address);
    }
  };

  const saveStartingPoint = async () => {
    if (!startPointAddress.trim()) return;

    try {
      const geocodeResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(startPointAddress)}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
      );
      const geocodeData = await geocodeResponse.json();

      if (geocodeData.results && geocodeData.results.length > 0) {
        const location = geocodeData.results[0].geometry.location;

        const { data: existing } = await supabase
          .from('user_settings')
          .select('id')
          .eq('user_id', user?.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('user_settings')
            .update({
              starting_point_address: startPointAddress,
              starting_point_latitude: location.lat,
              starting_point_longitude: location.lng,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user?.id);
        } else {
          await supabase
            .from('user_settings')
            .insert({
              user_id: user?.id,
              starting_point_address: startPointAddress,
              starting_point_latitude: location.lat,
              starting_point_longitude: location.lng
            });
        }

        setStartingPoint({
          address: startPointAddress,
          lat: location.lat,
          lng: location.lng
        });
        setEditingStartPoint(false);
      }
    } catch (error) {
      console.error('Error saving starting point:', error);
      alert('Failed to geocode address');
    }
  };

  const handleDeleteFromOsvBank = async (osvId: string) => {
    if (!confirm('Delete this business from OSV Bank?')) return;

    try {
      const { error } = await supabase
        .from('osv_bank')
        .delete()
        .eq('id', osvId);

      if (error) throw error;

      setSelectedOsvs(prev => {
        const newSet = new Set(prev);
        newSet.delete(osvId);
        return newSet;
      });

      await loadOsvBank();
    } catch (error) {
      console.error('Error deleting from OSV bank:', error);
    }
  };

  const loadTodayKPIs = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('kpi_activities')
      .select('activity_type')
      .eq('user_id', user?.id)
      .eq('activity_date', today);

    if (!error && data) {
      const stats = {
        osv: data.filter(a => a.activity_type === 'OSV_COMPLETED').length,
        np: data.filter(a => a.activity_type === 'NP_COMPLETED').length,
        followUps: data.filter(a => a.activity_type === 'FOLLOW_UP_ADDED').length,
      };
      setKpiStats(stats);
    }
  };

  const handleOptimizeRoute = async () => {
    const osvAppointments = appointments.filter(apt => apt.appointment_type === 'OSV');

    if (osvAppointments.length === 0 && selectedOsvs.size === 0) {
      setOptimizationResult('No OSV appointments to optimize');
      setTimeout(() => setOptimizationResult(''), 3000);
      return;
    }

    setOptimizing(true);
    setOptimizationResult('');
    setOptimizationStage('Analyzing appointments...');

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const allAppointments = [...appointments];

      for (const osvId of selectedOsvs) {
        const osvFromBank = osvBank.find(o => o.id === osvId);
        if (osvFromBank && !allAppointments.find(a => a.id === osvFromBank.lead_id)) {
          allAppointments.push({
            ...osvFromBank,
            id: osvFromBank.lead_id,
            appointment_type: 'OSV',
            appointment_date: selectedDate.toISOString().split('T')[0],
          } as Lead);
        }
      }

      console.log('Starting optimization with appointments:', allAppointments);

      if (allAppointments.length === 0) {
        setOptimizationResult('No appointments to optimize');
        setOptimizing(false);
        setOptimizationStage('');
        setTimeout(() => setOptimizationResult(''), 3000);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const sessionToken = session?.access_token;

      if (!sessionToken) {
        setOptimizationResult('Session expired. Please refresh the page.');
        setOptimizing(false);
        setOptimizationStage('');
        return;
      }

      setOptimizationStage('Calculating baseline route...');
      const beforeSchedule = await optimizeRoute(
        allAppointments,
        selectedDate,
        startingPoint?.lat,
        startingPoint?.lng,
        sessionToken
      );
      const beforeSummary = beforeSchedule.length > 0 ? calculateRouteSummary(beforeSchedule) : null;
      setBeforeOptimization(beforeSummary);

      setOptimizationStage('Calculating optimal route...');
      const schedule = await optimizeRoute(
        allAppointments,
        selectedDate,
        startingPoint?.lat,
        startingPoint?.lng,
        sessionToken
      );

      console.log('Optimization schedule returned:', schedule);

      if (schedule.length === 0) {
        setOptimizationResult('Unable to optimize - appointments missing addresses or coordinates');
        setOptimizing(false);
        setOptimizationStage('');
        setTimeout(() => setOptimizationResult(''), 5000);
        return;
      }

      const osvToUpdate = schedule.filter(s => s.lead.appointment_type === 'OSV');
      const osvIds = new Set(osvToUpdate.map(item => item.lead.id));
      const osvNotOptimized = osvAppointments.filter(apt => !osvIds.has(apt.id));

      console.log('OSVs to update:', osvToUpdate.length);
      console.log('OSVs not optimized (missing coords):', osvNotOptimized.length);

      if (osvToUpdate.length === 0) {
        setOptimizationResult('No OSV appointments could be optimized - please add addresses');
        setOptimizing(false);
        setOptimizationStage('');
        setTimeout(() => setOptimizationResult(''), 5000);
        return;
      }

      setOptimizationStage('Preparing route summary...');
      await new Promise(resolve => setTimeout(resolve, 500));

      const summary = calculateRouteSummary(schedule);
      console.log('Route summary:', summary);

      setRouteSummary(summary);
      setPendingSchedule(schedule);
      setOptimizing(false);
      setOptimizationStage('');
    } catch (error) {
      console.error('Optimization error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error optimizing route - please try again';
      setOptimizationResult(errorMessage);
      setTimeout(() => setOptimizationResult(''), 8000);
      setOptimizing(false);
      setOptimizationStage('');
    }
  };

  const handleAcceptRoute = async () => {
    try {
      setOptimizing(true);
      setOptimizationStage('Saving optimized schedule...');

      const movingIds = new Set(pendingSchedule.map((item: any) => item.lead.id));
      setMovingAppointments(movingIds);

      const dateStr = selectedDate.toISOString().split('T')[0];

      for (let i = 0; i < pendingSchedule.length; i++) {
        const item = pendingSchedule[i];
        console.log(`Saving ${item.lead.business_name} to time ${item.startTime} with route_order ${i + 1}`);

        const { error } = await supabase
          .from('leads')
          .update({
            appointment_date: dateStr,
            appointment_time: item.startTime,
            route_order: i + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.lead.id);

        if (error) {
          console.error('Error updating appointment:', error);
        } else {
          console.log(`✓ Successfully saved ${item.lead.business_name} with route_order ${i + 1}`);
        }

        await new Promise(resolve => setTimeout(resolve, 150));
      }

      await new Promise(resolve => setTimeout(resolve, 300));
      await loadAppointmentsForDate();

      setMovingAppointments(new Set());
      setRouteSummary(null);
      setPendingSchedule([]);
      setOptimizationStage('');
      setOptimizationResult(`✓ Optimized ${pendingSchedule.length} appointments`);
      setTimeout(() => setOptimizationResult(''), 5000);
    } catch (error) {
      console.error('Error saving route:', error);
      setOptimizationResult('Error saving route - please try again');
      setTimeout(() => setOptimizationResult(''), 3000);
    } finally {
      setOptimizing(false);
    }
  };

  const handleCancelRoute = () => {
    setRouteSummary(null);
    setPendingSchedule([]);
    setOptimizationResult('Route optimization cancelled');
    setTimeout(() => setOptimizationResult(''), 3000);
  };

  const handleDragStart = (osvId: string) => {
    setDraggedOsvId(osvId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, timeSlot: string) => {
    e.preventDefault();

    if (!draggedOsvId) return;

    const osvItem = osvBank.find(item => item.id === draggedOsvId);
    if (!osvItem) return;

    const dateStr = selectedDate.toISOString().split('T')[0];

    const { data: leadData } = await supabase
      .from('leads')
      .select('*')
      .eq('id', osvItem.lead_id)
      .maybeSingle();

    if (leadData) {
      await supabase
        .from('leads')
        .update({
          appointment_date: dateStr,
          appointment_time: timeSlot,
          appointment_type: 'OSV',
          status: 'qualified',
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadData.id);

      await supabase
        .from('osv_bank')
        .delete()
        .eq('id', draggedOsvId);

      await loadAppointmentsForDate();
      await loadOsvBank();
    }

    setDraggedOsvId(null);
  };

  const handleRemoveFromCalendar = async (appointment: Lead) => {
    await supabase
      .from('leads')
      .update({
        appointment_date: null,
        appointment_time: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointment.id);

    if (appointment.appointment_type === 'OSV') {
      await supabase.from('osv_bank').insert({
        user_id: user?.id,
        lead_id: appointment.id,
        business_name: appointment.business_name,
        address: appointment.address,
        city: appointment.city,
        state: appointment.state,
        zip: appointment.zip,
        industry: appointment.industry,
        phone: appointment.phone,
        google_rating: appointment.google_rating,
      });
    }

    await loadAppointmentsForDate();
    await loadOsvBank();
  };

  const handleFindDecisionMaker = async (lead: Lead) => {
    if (!lead.business_name || !lead.state) return;

    setLoadingDM(true);
    try {
      const result = await findDecisionMaker(lead.business_name, lead.state);

      if (result.name) {
        await supabase
          .from('leads')
          .update({
            decision_maker: result.name,
            decision_maker_confidence: result.confidence,
            decision_maker_title: result.title || null,
            decision_maker_last_updated: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', lead.id);

        await loadAppointmentsForDate();
      }
    } catch (error) {
      console.error('Error finding decision maker:', error);
    } finally {
      setLoadingDM(false);
    }
  };

  const handleCompleteOSV = async (lead: Lead) => {
    setCompletingAction(true);
    try {
      await supabase.from('kpi_activities').insert({
        user_id: user?.id,
        lead_id: lead.id,
        activity_type: 'OSV_COMPLETED',
        activity_date: new Date().toISOString().split('T')[0],
      });

      await supabase
        .from('leads')
        .update({
          osv_completed: 'true',
          status: 'contacted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      await loadTodayKPIs();
      if (currentIndex < appointments.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('Error completing OSV:', error);
    } finally {
      setCompletingAction(false);
    }
  };

  const handleCompleteNP = async (lead: Lead) => {
    setCompletingAction(true);
    try {
      await supabase.from('kpi_activities').insert({
        user_id: user?.id,
        lead_id: lead.id,
        activity_type: 'NP_COMPLETED',
        activity_date: new Date().toISOString().split('T')[0],
      });

      await supabase
        .from('leads')
        .update({
          status: 'qualified',
          np_set: 'true',
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      await loadTodayKPIs();
      if (currentIndex < appointments.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (error) {
      console.error('Error completing NP:', error);
    } finally {
      setCompletingAction(false);
    }
  };

  const handleAddFollowUp = async (lead: Lead) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase
        .from('leads')
        .update({
          follow_up_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) {
        throw error;
      }

      alert(`✅ Follow-up added for ${lead.business_name}!\n\nCheck the Follow-Ups tab to manage it.`);
      await loadTodayKPIs();
    } catch (error) {
      console.error('Error adding follow-up:', error);
      alert('Failed to add follow-up. Please try again.');
    }
  };

  const handleMapAllStops = () => {
    if (appointments.length === 0) return;

    const addresses = appointments
      .map(apt => apt.address)
      .filter(addr => addr)
      .join(' / ');

    const mapsUrl = `https://www.google.com/maps/dir/${encodeURIComponent(addresses)}`;
    window.open(mapsUrl, '_blank');
  };

  const handleNavigate = (lead: Lead) => {
    if (!lead.address) return;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(lead.address)}`;
    window.open(mapsUrl, '_blank');
  };

  const timeSlots = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  });

  const progressPercentage = appointments.length > 0
    ? Math.round(((kpiStats.osv + kpiStats.np) / appointments.length) * 100)
    : 0;

  const todayAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    return apt.appointment_date === today;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (showStartDayFlow && todayAppointments.length > 0) {
    const currentAppointment = todayAppointments[currentIndex];
    const isOSV = currentAppointment.appointment_type === 'OSV';
    const isNP = currentAppointment.appointment_type === 'NP';

    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-blue-50 to-gray-50">
        <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowStartDayFlow(false)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Start Day</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {currentIndex + 1} of {todayAppointments.length} stops • {currentAppointment.appointment_time}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentIndex < todayAppointments.length - 1 && currentLocation && (
                <button
                  onClick={() => {
                    const nextAppointment = todayAppointments[currentIndex + 1];
                    if (nextAppointment.latitude && nextAppointment.longitude) {
                      setFindOSVsModalOpen(true);
                    } else {
                      alert('Next appointment needs coordinates. Please add an address.');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-md font-semibold"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="hidden sm:inline">Find OSVs On The Way</span>
                </button>
              )}
              <button
                onClick={handleMapAllStops}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md"
              >
                <Map className="w-5 h-5" />
                <span className="hidden sm:inline">Map All</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {todayAppointments.map((apt, idx) => {
                const isCurrent = idx === currentIndex;
                const isPast = idx < currentIndex;
                const aptType = apt.appointment_type === 'NP' ? 'NP' : 'OSV';
                const bgColor = isCurrent
                  ? (apt.appointment_type === 'NP' ? 'bg-green-600' : 'bg-blue-600')
                  : isPast
                  ? 'bg-gray-400'
                  : 'bg-gray-200';

                return (
                  <div key={apt.id} className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentIndex(idx)}
                      className={`flex flex-col items-center px-3 py-2 rounded-lg transition-all ${bgColor} ${isCurrent ? 'text-white scale-110 shadow-lg' : isPast ? 'text-white' : 'text-gray-600'}`}
                      title={`${apt.business_name} - ${apt.appointment_time}`}
                    >
                      <span className="text-xs font-bold">{apt.appointment_time}</span>
                      <span className="text-xs">{aptType}</span>
                    </button>
                    {idx < todayAppointments.length - 1 && (
                      <div className={`w-4 h-0.5 ${isPast ? 'bg-gray-400' : 'bg-gray-300'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="relative">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span className="font-medium">Progress: {progressPercentage}%</span>
                <div className="flex items-center gap-3">
                  <span>OSV: {kpiStats.osv}</span>
                  <span>NP: {kpiStats.np}</span>
                  <span>Follow-ups: {kpiStats.followUps}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 rounded-full"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl w-full mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-gray-100">
              <div className={`px-8 py-6 ${isNP ? 'bg-gradient-to-r from-green-600 to-green-700' : 'bg-gradient-to-r from-blue-600 to-blue-700'} text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Building2 className="w-10 h-10" />
                    <div>
                      <h2 className="text-3xl font-bold">
                        {currentAppointment.business_name}
                      </h2>
                      <p className="text-base opacity-90 mt-1">
                        {currentAppointment.appointment_time} • {isNP ? 'New Presentation' : 'OSV'}
                      </p>
                    </div>
                  </div>
                  <div className={`px-5 py-2 rounded-full font-bold text-base ${isNP ? 'bg-green-500' : 'bg-blue-500'}`}>
                    {isNP ? 'NP' : 'OSV'}
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <MapPin className="w-7 h-7 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-500 mb-1">Address</p>
                    <p className="text-gray-900 font-semibold text-lg">{currentAppointment.address}</p>
                    {currentAppointment.city && (
                      <p className="text-gray-600 mt-1">{currentAppointment.city}, {currentAppointment.state} {currentAppointment.zip}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleNavigate(currentAppointment)}
                    className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg whitespace-nowrap font-semibold"
                  >
                    <Navigation className="w-5 h-5" />
                    Navigate
                  </button>
                </div>

                <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-600" />
                      Decision Maker
                    </h3>
                    {!currentAppointment.owner_name && !loadingDM && (
                      <button
                        onClick={async () => {
                          if (!currentAppointment.business_name || !currentAppointment.state) {
                            return;
                          }

                          setLoadingDM(true);

                          const extractCityFromAddress = (address: string | null): string | null => {
                            if (!address) return null;
                            const parts = address.split(',');
                            if (parts.length >= 2) {
                              return parts[parts.length - 2].trim();
                            }
                            return null;
                          };

                          const city = currentAppointment.city || extractCityFromAddress(currentAppointment.address) || '';

                          try {
                            const result = await findDecisionMaker(
                              currentAppointment.business_name,
                              city,
                              currentAppointment.state,
                              currentAppointment.address || undefined,
                              currentAppointment.website || undefined
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
                              .eq('id', currentAppointment.id);

                            await loadAppointmentsForDate();
                          } catch (error) {
                            console.error('Error finding decision maker:', error);
                          }

                          setLoadingDM(false);
                        }}
                        disabled={loadingDM}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold text-sm disabled:opacity-50"
                      >
                        {loadingDM ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Finding...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Find DM
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  {loadingDM ? (
                    <div className="flex items-center gap-3 text-gray-600">
                      <Loader className="w-5 h-5 animate-spin" />
                      <p className="text-sm">Searching for decision maker...</p>
                    </div>
                  ) : currentAppointment.owner_name && currentAppointment.owner_name !== 'None found' ? (
                    <div>
                      <p className="font-bold text-gray-900 text-xl">{currentAppointment.owner_name}</p>
                      {currentAppointment.decision_maker_title && (
                        <p className="text-gray-600 mt-1 text-base">{currentAppointment.decision_maker_title}</p>
                      )}
                      {currentAppointment.decision_maker_email && (
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="w-4 h-4" />
                            <a href={`mailto:${currentAppointment.decision_maker_email}`} className="text-blue-600 hover:underline">
                              {currentAppointment.decision_maker_email}
                            </a>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedLeadForEmail(currentAppointment);
                              setEmailComposerOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-sm shadow-md"
                          >
                            <Sparkles className="w-4 h-4" />
                            Generate AI Email
                          </button>
                        </div>
                      )}
                      {currentAppointment.decision_maker_confidence && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${currentAppointment.decision_maker_confidence}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">{currentAppointment.decision_maker_confidence}% confident</span>
                        </div>
                      )}
                    </div>
                  ) : currentAppointment.owner_name === 'None found' ? (
                    <p className="text-orange-600 italic font-medium">No decision maker found</p>
                  ) : (
                    <p className="text-gray-500 italic">Click "Find DM" to search</p>
                  )}
                </div>

                {isNP && <BusinessSummarySection lead={currentAppointment} />}

                <div className="space-y-4 pt-4">
                  {isOSV && (
                    <button
                      onClick={() => handleCompleteOSV(currentAppointment)}
                      disabled={completingAction}
                      className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all font-bold text-xl shadow-xl disabled:opacity-50"
                    >
                      <CheckCircle className="w-7 h-7" />
                      {completingAction ? 'Completing...' : 'Complete OSV'}
                    </button>
                  )}
                  {isNP && (
                    <button
                      onClick={() => handleCompleteNP(currentAppointment)}
                      disabled={completingAction}
                      className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-2xl hover:from-green-700 hover:to-green-800 transition-all font-bold text-xl shadow-xl disabled:opacity-50"
                    >
                      <CheckCircle className="w-7 h-7" />
                      {completingAction ? 'Completing...' : 'Complete NP'}
                    </button>
                  )}
                  <button
                    onClick={() => handleAddFollowUp(currentAppointment)}
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-all font-bold text-lg shadow-lg"
                  >
                    <MessageSquarePlus className="w-6 h-6" />
                    Add Follow-Up
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-8 gap-4">
              <button
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg font-semibold transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
                Previous
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {currentIndex + 1} <span className="text-gray-400">/</span> {todayAppointments.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">Appointment</p>
              </div>
              <button
                onClick={() => setCurrentIndex(Math.min(todayAppointments.length - 1, currentIndex + 1))}
                disabled={currentIndex === todayAppointments.length - 1}
                className="flex items-center gap-2 px-6 py-3 bg-white rounded-xl border-2 border-gray-300 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg font-semibold transition-all"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-gray-50">
      {/* OSV Bank Sidebar - Smaller */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-3 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              OSV Bank
            </h3>
            <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
              {osvBank.length}
            </span>
          </div>
          {selectedOsvs.size > 0 && (
            <p className="text-xs text-blue-100 mt-1">
              {selectedOsvs.size} selected for optimization
            </p>
          )}
        </div>

        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-gray-700">Starting Point (8:00 AM)</label>
            {!editingStartPoint && startingPoint && (
              <button
                onClick={() => setEditingStartPoint(true)}
                className="text-xs text-blue-600 hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {editingStartPoint ? (
            <div className="space-y-1">
              <input
                type="text"
                value={startPointAddress}
                onChange={(e) => setStartPointAddress(e.target.value)}
                placeholder="Enter address"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex gap-1">
                <button
                  onClick={saveStartingPoint}
                  className="flex-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingStartPoint(false);
                    setStartPointAddress(startingPoint?.address || '');
                  }}
                  className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : startingPoint ? (
            <p className="text-xs text-gray-600 truncate">{startingPoint.address}</p>
          ) : (
            <button
              onClick={() => setEditingStartPoint(true)}
              className="w-full px-2 py-1 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
            >
              + Set Starting Point
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {osvBank.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-xs">No OSVs</p>
            </div>
          ) : (
            osvBank.map((osv) => (
              <div
                key={osv.id}
                className={`p-2 rounded-lg border transition-all ${
                  selectedOsvs.has(osv.id)
                    ? 'bg-blue-100 border-blue-400 shadow-md'
                    : 'bg-blue-50 border-blue-200 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    checked={selectedOsvs.has(osv.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedOsvs);
                      if (e.target.checked) {
                        newSelected.add(osv.id);
                      } else {
                        newSelected.delete(osv.id);
                      }
                      setSelectedOsvs(newSelected);
                    }}
                    className="w-4 h-4 text-blue-600 rounded mt-0.5 cursor-pointer"
                  />
                  <Building2 className="w-3 h-3 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs text-gray-900 truncate">{osv.business_name}</h4>
                    {osv.industry && (
                      <p className="text-xs text-gray-600 mt-0.5 truncate">{osv.industry}</p>
                    )}
                    {osv.city && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{osv.city}, {osv.state}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteFromOsvBank(osv.id)}
                    className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
                    title="Delete from OSV Bank"
                  >
                    <Trash2 className="w-3 h-3 text-red-600" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col">
        {/* Compact Header */}
        <div className="bg-white border-b border-gray-200 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            {optimizing && optimizationStage && (
              <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium flex items-center gap-2 animate-pulse">
                <Loader className="w-3 h-3 animate-spin" />
                {optimizationStage}
              </div>
            )}
            {!optimizing && optimizationResult && (
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                optimizationResult.includes('✓')
                  ? 'bg-green-50 text-green-700'
                  : optimizationResult.includes('Address not recognized') || optimizationResult.includes('Error')
                  ? 'bg-red-50 text-red-700'
                  : 'bg-yellow-50 text-yellow-700'
              }`}>
                {optimizationResult}
              </div>
            )}
            <div className="flex items-center gap-2">
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
              <button
                onClick={handleOptimizeRoute}
                disabled={optimizing || appointments.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:opacity-50 ml-2"
              >
                {optimizing ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Optimizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Optimize</span>
                  </>
                )}
              </button>
              {todayAppointments.length > 0 && (
                <button
                  onClick={() => setShowStartDayFlow(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-semibold"
                >
                  <Play className="w-4 h-4" />
                  <span>Start</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-y-auto p-3 bg-white">
          <div className="space-y-2">
            {timeSlots.map((timeSlot) => {
              const slotHour = parseInt(timeSlot.split(':')[0]);
              const slotPeriod = timeSlot.includes('PM') ? 'PM' : 'AM';

              const appointmentsInSlot = appointments.filter(apt => {
                if (!apt.appointment_time) return false;

                const aptHour = parseInt(apt.appointment_time.split(':')[0]);
                const aptPeriod = apt.appointment_time.includes('PM') ? 'PM' : 'AM';

                return aptHour === slotHour && aptPeriod === slotPeriod;
              });

              return (
                <div
                  key={timeSlot}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, timeSlot)}
                  className="flex items-start gap-3 p-2 border-2 border-dashed border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors min-h-[50px]"
                >
                  <div className="w-16 flex-shrink-0">
                    <span className="text-xs font-medium text-gray-700">{timeSlot}</span>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {appointmentsInSlot.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Drop OSV here</p>
                    ) : (
                      appointmentsInSlot.map(apt => {
                        const isMoving = movingAppointments.has(apt.id);
                        return (
                          <div
                            key={apt.id}
                            className={`flex items-center justify-between p-2 rounded-lg transition-all duration-500 ${
                              isMoving ? 'animate-pulse scale-105 shadow-lg' : ''
                            } ${
                              apt.appointment_type === 'NP'
                                ? 'bg-green-100 border border-green-300'
                                : 'bg-blue-100 border border-blue-300'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {isMoving && <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-600 font-medium">{apt.appointment_time}</span>
                                <h4 className="font-semibold text-sm text-gray-900 truncate">{apt.business_name}</h4>
                                <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                                  apt.appointment_type === 'NP' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                                }`}>
                                  {apt.appointment_type}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCalendar(apt)}
                              className="p-0.5 hover:bg-red-100 rounded ml-2"
                              disabled={optimizing}
                            >
                              <X className="w-3.5 h-3.5 text-red-600" />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {routeSummary && (
        <RouteSummaryModal
          summary={routeSummary}
          beforeSummary={beforeOptimization}
          onAccept={handleAcceptRoute}
          onCancel={handleCancelRoute}
        />
      )}

      <EmailComposerModal
        open={emailComposerOpen}
        onClose={() => {
          setEmailComposerOpen(false);
          setSelectedLeadForEmail(null);
        }}
        lead={selectedLeadForEmail}
      />

      {currentLocation && currentIndex < todayAppointments.length - 1 && todayAppointments[currentIndex + 1] && (
        <FindOSVsModal
          isOpen={findOSVsModalOpen}
          onClose={() => setFindOSVsModalOpen(false)}
          currentLat={currentLocation.lat}
          currentLng={currentLocation.lng}
          nextLat={todayAppointments[currentIndex + 1]?.latitude || 0}
          nextLng={todayAppointments[currentIndex + 1]?.longitude || 0}
          onAddOSV={async (osv) => {
            alert(`Added ${osv.name} to your route! You can optimize your schedule to include it.`);
            await loadAppointmentsForDate();
          }}
        />
      )}
    </div>
  );
}
