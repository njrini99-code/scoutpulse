'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Calendar,
  Plus,
  MapPin,
  Clock,
  Users,
  Loader2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import type { CampEvent, Coach } from '@/lib/types';

export default function CoachCampsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CampEvent[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    event_date: '',
    start_time: '',
    end_time: '',
    event_type: 'Prospect Camp',
    description: '',
    location: '',
    registration_link: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data: coachData } = await supabase
        .from('coaches')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (coachData) {
        setCoach(coachData);
        
        const { data: eventsData } = await supabase
          .from('camp_events')
          .select('*')
          .eq('coach_id', coachData.id)
          .order('event_date', { ascending: true });
        
        if (eventsData) {
          setEvents(eventsData);
        }
      }
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coach) return;

    setSaving(true);
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('camp_events')
        .insert({
          coach_id: coach.id,
          name: formData.name,
          event_date: formData.event_date,
          start_time: formData.start_time || null,
          end_time: formData.end_time || null,
          event_type: formData.event_type,
          description: formData.description || null,
          location: formData.location || null,
          registration_link: formData.registration_link || null,
        });

      if (error) {
        toast.error('Failed to create event');
        return;
      }

      toast.success('Event created successfully');
      setShowForm(false);
      setFormData({
        name: '',
        event_date: '',
        start_time: '',
        end_time: '',
        event_type: 'Prospect Camp',
        description: '',
        location: '',
        registration_link: '',
      });
      loadData();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  const upcomingEvents = events.filter(e => new Date(e.event_date) >= new Date());
  const pastEvents = events.filter(e => new Date(e.event_date) < new Date());

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Camps & Events</h1>
          <p className="text-slate-400">
            Create and manage your recruiting events
          </p>
        </div>
        <Button variant="success" className="gap-2" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" />
          Create Event
        </Button>
      </div>

      {/* Create Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-slate-900 border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Create Event</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Event Name</Label>
                  <Input
                    placeholder="Summer Prospect Camp"
                    value={formData.name}
                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(v) => setFormData(f => ({ ...f, event_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prospect Camp">Prospect Camp</SelectItem>
                      <SelectItem value="Clinic">Clinic</SelectItem>
                      <SelectItem value="Showcase">Showcase</SelectItem>
                      <SelectItem value="Visit Day">Visit Day</SelectItem>
                      <SelectItem value="ID Camp">ID Camp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData(f => ({ ...f, event_date: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(f => ({ ...f, start_time: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(f => ({ ...f, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Location</Label>
                  <Input
                    placeholder="Stadium name and address"
                    value={formData.location}
                    onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe the event..."
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Registration Link (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.registration_link}
                    onChange={(e) => setFormData(f => ({ ...f, registration_link: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="success" className="flex-1" disabled={saving}>
                    {saving ? <div className="w-4 h-4 bg-white/20 rounded animate-pulse" /> : 'Create Event'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-8">
        {/* Upcoming Events */}
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <Card className="bg-slate-900/50 border-white/5">
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No upcoming events scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="bg-slate-900/50 border-white/5 hover:border-emerald-500/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-sm">
                        {event.event_type}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <Users className="w-4 h-4" />
                        0 interested
                      </span>
                    </div>

                    <h3 className="font-semibold text-white text-lg mb-3">{event.name}</h3>

                    <div className="space-y-2 text-sm text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.event_date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      {event.start_time && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {event.start_time}{event.end_time && ` - ${event.end_time}`}
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {event.location}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {pastEvents.map((event) => (
                <Card key={event.id} className="bg-slate-900/50 border-white/5">
                  <CardContent className="p-6">
                    <span className="px-3 py-1 bg-slate-500/10 text-slate-400 rounded-full text-sm">
                      {event.event_type}
                    </span>
                    <h3 className="font-semibold text-white text-lg mt-4 mb-2">{event.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

