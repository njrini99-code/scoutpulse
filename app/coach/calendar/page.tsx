'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logError } from '@/lib/utils/errorLogger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar,
  Plus,
  MapPin,
  Clock,
  Users,
  Loader2,
  Download,
  MessageSquare,
  User,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import type { CampEvent } from '@/lib/types';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

type CalendarEvent = Pick<
  CampEvent,
  'id' | 'name' | 'event_date' | 'start_time' | 'end_time' | 'event_type' | 'description' | 'location'
> & { interested_count: number };

export default function CoachCalendarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const supabase = createClient();

    try {
      let coachId: string | null = null;
      
      if (isDevMode()) {
        coachId = DEV_ENTITY_IDS.coach;
      } else {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          toast.error('Unable to verify your session. Please sign in again.');
          return;
        }

        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data: coachData, error: coachError } = await supabase
          .from('coaches')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (coachError) {
          toast.error('Unable to load your coach profile.');
          return;
        }

        if (!coachData) {
          toast.error('Finish coach onboarding to access the calendar.');
          router.push('/onboarding/coach');
          return;
        }
        coachId = coachData.id;
      }

      const { data: campsData, error: eventsError } = await supabase
        .from('camp_events')
        .select('id, name, event_date, start_time, end_time, event_type, description, location')
        .eq('coach_id', coachId)
        .order('event_date', { ascending: true });

      if (eventsError) {
        toast.error('Unable to load events right now.');
        return;
      }

      const formatted: CalendarEvent[] = (campsData ?? []).map(camp => ({
        id: camp.id,
        name: camp.name,
        event_date: camp.event_date,
        start_time: camp.start_time,
        end_time: camp.end_time,
        event_type: camp.event_type,
        description: camp.description,
        location: camp.location,
        interested_count: 0,
      }));
      setEvents(formatted);
    } catch (error) {
      logError(error, { component: 'CoachCalendarPage', action: 'loadEvents' });
      toast.error('Unexpected error while loading your calendar.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCalendar = () => {
    toast.info('Google Calendar sync coming soon!');
  };

  const handleBulkMessage = (_eventId: string) => {
    toast.info('Bulk messaging coming soon!');
  };

  const getUpcomingEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(e => e.event_date >= today).slice(0, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="min-h-screen bg-[#0B0D0F]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Calendar</h1>
            <p className="text-slate-400">
              Manage camps, evaluations, and player visits
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleSyncCalendar}>
              <Download className="w-4 h-4" />
              Sync Calendar
            </Button>
            <Link href="/coach/camps">
              <Button variant="success" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <Card className="bg-[#111315] border-white/5 lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  Schedule
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'month' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('month')}
                  >
                    Month
                  </Button>
                  <Button
                    variant={viewMode === 'week' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('week')}
                  >
                    Week
                  </Button>
                  <Button
                    variant={viewMode === 'day' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('day')}
                  >
                    Day
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Simple Calendar Grid */}
              <div className="text-center py-12 text-slate-400">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="mb-2">Calendar view coming soon</p>
                <p className="text-sm">Full calendar integration with drag-and-drop scheduling</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setViewMode('month')}>
                  <Plus className="w-4 h-4" />
                  Add Evaluation Session
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-6">
            <Card className="bg-[#111315] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No upcoming events</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 bg-[#161a1f] rounded-xl border border-white/5 hover:border-emerald-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm mb-1">{event.name}</h3>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                {event.event_type}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-xs text-slate-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(event.event_date).toLocaleDateString()}
                              </div>
                              {event.start_time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.start_time}
                                  {event.end_time && ` - ${event.end_time}`}
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location}
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {event.interested_count} interested
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleBulkMessage(event.id)}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Message
                          </Button>
                          <Link href={`/coach/camps`}>
                            <Button variant="ghost" size="sm">
                              <ChevronRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-[#111315] border-white/5">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.info('Coming soon')}>
                  <Plus className="w-4 h-4" />
                  Add Evaluation Session
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => toast.info('Coming soon')}>
                  <User className="w-4 h-4" />
                  Schedule Player Visit
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleSyncCalendar}>
                  <Download className="w-4 h-4" />
                  Sync Google Calendar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
