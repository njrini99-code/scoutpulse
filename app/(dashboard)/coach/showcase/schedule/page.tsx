'use client';

import { useEffect, useState } from 'react';
import { getTeamForOwner, getTeamSchedule, addScheduleEvent, deleteScheduleEvent } from '@/lib/queries/team';
import type { ScheduleEvent } from '@/lib/queries/team';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Plus, Trash2, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ShowcaseSchedulePage() {
  const router = useRouter();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .eq('coach_type', 'showcase')
        .single();

      if (!coach) {
        toast.error('Coach profile not found');
        return;
      }

      const team = await getTeamForOwner(coach.id);
      if (!team) {
        toast.error('Team not found');
        return;
      }

      setTeamId(team.id);
      const schedule = await getTeamSchedule(team.id);
      setEvents(schedule);
    } catch (error) {
      console.error('Error loading schedule:', error);
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (eventId: string) => {
    const success = await deleteScheduleEvent(eventId);
    if (success) {
      toast.success('Event deleted');
      loadSchedule();
    } else {
      toast.error('Failed to delete event');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-8 h-8 text-emerald-600" />
                <h1 className="text-3xl font-bold text-slate-800">Event Schedule</h1>
              </div>
              <p className="text-slate-600">Manage your showcases, tournaments, and events</p>
            </div>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>

        {events.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-4">No events scheduled yet</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Card key={event.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-sm font-medium">
                          {event.event_type}
                        </span>
                        {event.opponent_name && (
                          <span className="text-slate-600">vs {event.opponent_name}</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 mb-1">
                        {event.event_name || event.opponent_name || 'Event'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(event.start_time)}
                        </div>
                        {event.location_name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {event.location_name}
                          </div>
                        )}
                      </div>
                      {event.notes && (
                        <p className="mt-2 text-sm text-slate-600">{event.notes}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(event.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Add Event</CardTitle>
              </CardHeader>
              <CardContent>
                <AddEventForm
                  teamId={teamId!}
                  onSuccess={() => {
                    setShowAddModal(false);
                    loadSchedule();
                  }}
                  onCancel={() => setShowAddModal(false)}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function AddEventForm({
  teamId,
  onSuccess,
  onCancel
}: {
  teamId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    event_type: 'showcase' as 'game' | 'practice' | 'tournament' | 'showcase',
    event_name: '',
    opponent_name: '',
    location_name: '',
    start_time: '',
    notes: '',
    is_public: true
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const success = await addScheduleEvent(teamId, {
        ...formData,
        location_address: null,
        end_time: null
      });

      if (success) {
        toast.success('Event added successfully');
        onSuccess();
      } else {
        toast.error('Failed to add event');
      }
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Event Type</label>
        <select
          value={formData.event_type}
          onChange={(e) => setFormData({ ...formData, event_type: e.target.value as any })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          required
        >
          <option value="showcase">Showcase</option>
          <option value="tournament">Tournament</option>
          <option value="game">Game</option>
          <option value="practice">Practice</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Event Name</label>
        <input
          type="text"
          value={formData.event_name}
          onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          placeholder="e.g., Perfect Game Southeast"
          required
        />
      </div>

      {formData.event_type === 'game' && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Opponent</label>
          <input
            type="text"
            value={formData.opponent_name}
            onChange={(e) => setFormData({ ...formData, opponent_name: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-md"
            placeholder="e.g., Atlanta Aces"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
        <input
          type="text"
          value={formData.location_name}
          onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          placeholder="e.g., LakePoint Sports Complex"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
        <input
          type="datetime-local"
          value={formData.start_time}
          onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border border-slate-300 rounded-md"
          rows={3}
          placeholder="Additional details..."
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={saving} className="flex-1">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Add Event
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
