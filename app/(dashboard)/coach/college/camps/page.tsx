'use client';

import { useSearchParams } from 'next/navigation';
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
import { useTheme } from '@/lib/theme-context';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

export default function CollegeCoachCamps() {
  const searchParams = useSearchParams();
  const showCreate = searchParams.get('action') === 'create';
  const highlightCamp = searchParams.get('camp');
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CampEvent[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [showForm, setShowForm] = useState(showCreate);
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

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-emerald-200/60 shadow-lg shadow-emerald-500/5',
    inputBg: isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-emerald-200',
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    let coachData = null;
    
    if (isDevMode()) {
      const { data } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', DEV_ENTITY_IDS.coach)
        .single();
      coachData = data;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('coaches')
          .select('*')
          .eq('user_id', user.id)
          .single();
        coachData = data;
      }
    }
    
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
          <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>Camps & Events</h1>
          <p className={theme.textMuted}>
            Create and manage your recruiting events
          </p>
        </div>
        <Button 
          className={isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'}
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Event
        </Button>
      </div>

      {/* Create Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className={`w-full max-w-lg max-h-[90vh] overflow-y-auto ${theme.cardBg}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className={theme.text}>Create Event</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className={theme.text}>Event Name</Label>
                  <Input
                    placeholder="Summer Prospect Camp"
                    value={formData.name}
                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    required
                    className={theme.inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme.text}>Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(v) => setFormData(f => ({ ...f, event_type: v }))}
                  >
                    <SelectTrigger className={theme.inputBg}>
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
                    <Label className={theme.text}>Date</Label>
                    <Input
                      type="date"
                      value={formData.event_date}
                      onChange={(e) => setFormData(f => ({ ...f, event_date: e.target.value }))}
                      required
                      className={theme.inputBg}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={theme.text}>Start Time</Label>
                    <Input
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData(f => ({ ...f, start_time: e.target.value }))}
                      className={theme.inputBg}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className={theme.text}>End Time</Label>
                    <Input
                      type="time"
                      value={formData.end_time}
                      onChange={(e) => setFormData(f => ({ ...f, end_time: e.target.value }))}
                      className={theme.inputBg}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className={theme.text}>Location</Label>
                  <Input
                    placeholder="Stadium name and address"
                    value={formData.location}
                    onChange={(e) => setFormData(f => ({ ...f, location: e.target.value }))}
                    className={theme.inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme.text}>Description</Label>
                  <Textarea
                    placeholder="Describe the event..."
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    className={theme.inputBg}
                  />
                </div>

                <div className="space-y-2">
                  <Label className={theme.text}>Registration Link (optional)</Label>
                  <Input
                    placeholder="https://..."
                    value={formData.registration_link}
                    onChange={(e) => setFormData(f => ({ ...f, registration_link: e.target.value }))}
                    className={theme.inputBg}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className={`flex-1 ${isDark ? 'border-slate-600 text-slate-300' : 'border-emerald-200 text-emerald-700'}`}
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className={`flex-1 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                    disabled={saving}
                  >
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
          <h2 className={`text-xl font-semibold mb-4 ${theme.text}`}>Upcoming Events</h2>
          {upcomingEvents.length === 0 ? (
            <Card className={theme.cardBg}>
              <CardContent className="py-12 text-center">
                <Calendar className={`w-12 h-12 mx-auto mb-4 ${theme.textMuted}`} />
                <p className={theme.textMuted}>No upcoming events scheduled</p>
                <Button 
                  className={`mt-4 ${isDark ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                  onClick={() => setShowForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className={`transition-all ${theme.cardBg} ${highlightCamp === event.id ? 'ring-2 ring-emerald-500' : ''} ${isDark ? 'hover:border-emerald-500/30' : 'hover:border-emerald-300'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                        {event.event_type}
                      </span>
                      <span className={`flex items-center gap-1 text-sm ${theme.textMuted}`}>
                        <Users className="w-4 h-4" />
                        0 interested
                      </span>
                    </div>

                    <h3 className={`font-semibold text-lg mb-3 ${theme.text}`}>{event.name}</h3>

                    <div className={`space-y-2 text-sm ${theme.textMuted}`}>
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
            <h2 className={`text-xl font-semibold mb-4 ${theme.text}`}>Past Events</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
              {pastEvents.map((event) => (
                <Card key={event.id} className={theme.cardBg}>
                  <CardContent className="p-6">
                    <span className={`px-3 py-1 rounded-full text-sm ${isDark ? 'bg-slate-500/10 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                      {event.event_type}
                    </span>
                    <h3 className={`font-semibold text-lg mt-4 mb-2 ${theme.text}`}>{event.name}</h3>
                    <div className={`flex items-center gap-2 text-sm ${theme.textMuted}`}>
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
