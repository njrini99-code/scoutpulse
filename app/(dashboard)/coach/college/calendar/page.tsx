'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Cloud, 
  Loader2,
  Calendar as CalendarIcon,
  List,
  LayoutGrid,
} from 'lucide-react';
import { toast } from 'sonner';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import {
  CalendarView,
  UpcomingEventsPanel,
  QuickActionsPanel,
  PlayerSchedulePanel,
  CalendarEventModal,
} from '@/components/coach/college/calendar';
import {
  type CalendarEvent,
  type CalendarEventType,
  type CalendarEventInput,
  getCalendarEvents,
  getUpcomingEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from '@/lib/queries/calendar';
import { getTodayLocal } from '@/lib/utils/date';

type ViewMode = 'month' | 'week' | 'agenda';

export default function CollegeCoachCalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [preselectedDate, setPreselectedDate] = useState<string>('');
  const [preselectedType, setPreselectedType] = useState<CalendarEventType | undefined>();

  // Load coach and events
  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();
      
      let id: string | null = null;
      
      if (isDevMode()) {
        id = DEV_ENTITY_IDS.coach;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: coachData } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!coachData) {
          toast.error('Finish coach onboarding to access the calendar.');
          router.push('/onboarding/coach');
          return;
        }
        id = coachData.id;
      }

      setCoachId(id);
      
      if (!id) return;
      
      // Load events
      const [allEvents, upcoming] = await Promise.all([
        getCalendarEvents(id),
        getUpcomingEvents(id, 14),
      ]);
      
      setEvents(allEvents);
      setUpcomingEvents(upcoming);
      setLoading(false);
    };

    loadData();
  }, [router]);

  const refreshEvents = useCallback(async () => {
    if (!coachId) return;
    const [allEvents, upcoming] = await Promise.all([
      getCalendarEvents(coachId),
      getUpcomingEvents(coachId, 14),
    ]);
    setEvents(allEvents);
    setUpcomingEvents(upcoming);
  }, [coachId]);

  const handleDayClick = (date: string) => {
    setEditingEvent(null);
    setPreselectedDate(date);
    setPreselectedType(undefined);
    setModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setEditingEvent(event);
    setPreselectedDate('');
    setPreselectedType(undefined);
    setModalOpen(true);
  };

  const handleAddEvent = (type?: CalendarEventType) => {
    setEditingEvent(null);
    setPreselectedDate(getTodayLocal());
    setPreselectedType(type);
    setModalOpen(true);
  };

  const handleSaveEvent = async (input: CalendarEventInput) => {
    if (!coachId) return;

    if (editingEvent) {
      const success = await updateCalendarEvent(editingEvent.id, input);
      if (success) {
        toast.success('Event updated');
        await refreshEvents();
      } else {
        toast.error('Failed to update event');
      }
    } else {
      const newEvent = await createCalendarEvent(coachId, input);
      if (newEvent) {
        toast.success('Event created');
        await refreshEvents();
      } else {
        toast.error('Failed to create event');
      }
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;

    const success = await deleteCalendarEvent(editingEvent.id);
    if (success) {
      toast.success('Event deleted');
      await refreshEvents();
    } else {
      toast.error('Failed to delete event');
    }
  };

  const handleSyncGoogle = () => {
    toast.info('Google Calendar sync coming soon!');
  };

  const handleViewAllEvents = () => {
    setViewMode('agenda');
  };

  const handleViewProfile = (playerId: string) => {
    router.push(`/coach/college/player/${playerId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 bg-emerald-500/20 rounded animate-pulse" />
          <p className="text-sm text-slate-500">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-5 space-y-4">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Plan camps, evaluations, and player visits in one view.
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-8 bg-white border border-slate-200 p-0.5">
                <TabsTrigger 
                  value="month" 
                  className="text-xs gap-1.5 px-3 h-7 data-[state=active]:bg-slate-100 data-[state=active]:shadow-none"
                >
                  <LayoutGrid className="w-3.5 h-3.5" strokeWidth={2} />
                  Month
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className="text-xs gap-1.5 px-3 h-7 data-[state=active]:bg-slate-100 data-[state=active]:shadow-none"
                >
                  <CalendarIcon className="w-3.5 h-3.5" strokeWidth={2} />
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="agenda" 
                  className="text-xs gap-1.5 px-3 h-7 data-[state=active]:bg-slate-100 data-[state=active]:shadow-none"
                >
                  <List className="w-3.5 h-3.5" strokeWidth={2} />
                  Agenda
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-slate-200 text-slate-600"
              onClick={handleSyncGoogle}
            >
              <Cloud className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
              Sync Calendar
            </Button>
            
            <Button
              size="sm"
              className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white"
              onClick={() => handleAddEvent()}
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
              Add Event
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            MAIN CONTENT
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Calendar (takes 2 columns) */}
          <div className="lg:col-span-2">
            <CalendarView
              events={events}
              onDayClick={handleDayClick}
              onEventClick={handleEventClick}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            <UpcomingEventsPanel
              events={upcomingEvents}
              onEventClick={handleEventClick}
              onViewAll={handleViewAllEvents}
            />
            
            <QuickActionsPanel
              onAddEvent={handleAddEvent}
              onSyncGoogle={handleSyncGoogle}
            />
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            PLAYER SCHEDULE (BOTTOM)
        ═══════════════════════════════════════════════════════════════════ */}
        {coachId && (
          <PlayerSchedulePanel
            coachId={coachId}
            onEventClick={handleEventClick}
            onViewProfile={handleViewProfile}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            EVENT MODAL
        ═══════════════════════════════════════════════════════════════════ */}
        {coachId && (
          <CalendarEventModal
            open={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setEditingEvent(null);
            }}
            onSave={handleSaveEvent}
            onDelete={editingEvent ? handleDeleteEvent : undefined}
            coachId={coachId}
            event={editingEvent}
            preselectedDate={preselectedDate}
            preselectedType={preselectedType}
          />
        )}
      </div>
    </div>
  );
}
