'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Plus, FileText, MapPin, GraduationCap, Handshake, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TimelineEvent {
  id: string;
  type: 'contact' | 'visit' | 'offer' | 'decision' | 'transcript' | 'custom';
  title: string;
  description?: string;
  date: Date;
  createdBy: 'coach' | 'player';
  attachments?: string[];
}

const EVENT_TEMPLATES = [
  { type: 'contact' as const, label: 'First Contact', icon: Mail },
  { type: 'visit' as const, label: 'Campus Visit', icon: MapPin },
  { type: 'offer' as const, label: 'Scholarship Offer', icon: Handshake },
  { type: 'decision' as const, label: 'Decision Made', icon: GraduationCap },
  { type: 'transcript' as const, label: 'Transcript Sent', icon: FileText },
];

export function RecruitmentTimeline({ 
  playerId, 
  coachId 
}: { 
  playerId?: string;
  coachId?: string;
}) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadTimeline();
  }, [playerId, coachId]);

  const loadTimeline = async () => {
    try {
      const { data: timelineEvents } = await supabase
        .from('recruitment_timeline')
        .select('*')
        .eq(playerId ? 'player_id' : 'coach_id', playerId || coachId)
        .order('date', { ascending: false });

      if (timelineEvents) {
        setEvents(timelineEvents.map(e => ({
          ...e,
          date: new Date(e.date)
        })));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading timeline:', error);
      setLoading(false);
    }
  };

  const addEvent = async (event: Omit<TimelineEvent, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('recruitment_timeline')
        .insert({
          player_id: playerId,
          coach_id: coachId,
          type: event.type,
          title: event.title,
          description: event.description,
          date: event.date.toISOString(),
          created_by: event.createdBy
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setEvents([{ ...event, id: data.id }, ...events]);
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading timeline...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recruitment Timeline</h3>
          <p className="text-sm text-muted-foreground">Track your recruiting journey</p>
        </div>
        <Button
          size="sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Event
        </Button>
      </div>

      {showAddForm && (
        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-medium mb-3">Quick Add Event</h4>
          <div className="grid grid-cols-2 gap-2">
            {EVENT_TEMPLATES.map(template => {
              const Icon = template.icon;
              return (
                <Button
                  key={template.type}
                  variant="outline"
                  className="justify-start"
                  onClick={() => {
                    addEvent({
                      type: template.type,
                      title: template.label,
                      date: new Date(),
                      createdBy: 'player'
                    });
                  }}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {template.label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

        <div className="space-y-6">
          {events.map((event, index) => {
            const Icon = EVENT_TEMPLATES.find(t => t.type === event.type)?.icon || Calendar;
            return (
              <div key={event.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background",
                  event.createdBy === 'coach' ? "border-blue-500" : "border-emerald-500"
                )}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Event content */}
                <div className="flex-1 pb-6">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium">{event.title}</h4>
                    <span className="text-xs text-muted-foreground">
                      {format(event.date, 'MMM d, yyyy')}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      event.createdBy === 'coach' 
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300"
                    )}>
                      {event.createdBy === 'coach' ? 'Coach' : 'You'}
                    </span>
                    {event.attachments && event.attachments.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {event.attachments.length} attachment(s)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {events.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No timeline events yet.</p>
            <p className="text-xs mt-1">Add events to track your recruiting progress.</p>
          </div>
        )}
      </div>
    </div>
  );
}
