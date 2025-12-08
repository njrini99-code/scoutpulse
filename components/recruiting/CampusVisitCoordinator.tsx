'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, MapPin, Plane, Hotel, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Visit {
  id: string;
  playerId: string;
  coachId: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  requestedDate: Date;
  confirmedDate?: Date;
  location: string;
  itinerary?: string;
  travelInfo?: {
    flight?: string;
    hotel?: string;
  };
}

export function CampusVisitCoordinator({ 
  playerId, 
  coachId 
}: { 
  playerId?: string;
  coachId?: string;
}) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestDate, setRequestDate] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const supabase = createClient();

  useEffect(() => {
    loadVisits();
  }, [playerId, coachId]);

  const loadVisits = async () => {
    try {
      const { data: visitData } = await supabase
        .from('campus_visits')
        .select('*')
        .eq(playerId ? 'player_id' : 'coach_id', playerId || coachId)
        .order('requested_date', { ascending: false });

      if (visitData) {
        setVisits(visitData.map(v => ({
          ...v,
          requestedDate: new Date(v.requested_date),
          confirmedDate: v.confirmed_date ? new Date(v.confirmed_date) : undefined
        })));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading visits:', error);
      setLoading(false);
    }
  };

  const requestVisit = async () => {
    if (!requestDate) return;

    try {
      const { data, error } = await supabase
        .from('campus_visits')
        .insert({
          player_id: playerId,
          coach_id: coachId,
          requested_date: requestDate,
          status: 'pending',
          notes: requestNotes
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setVisits([{
          ...data,
          requestedDate: new Date(data.requested_date)
        }, ...visits]);
        setShowRequestForm(false);
        setRequestDate('');
        setRequestNotes('');
      }
    } catch (error) {
      console.error('Error requesting visit:', error);
    }
  };

  const confirmVisit = async (visitId: string, confirmedDate: string) => {
    try {
      const { error } = await supabase
        .from('campus_visits')
        .update({
          status: 'confirmed',
          confirmed_date: confirmedDate
        })
        .eq('id', visitId);

      if (error) throw error;
      loadVisits();
    } catch (error) {
      console.error('Error confirming visit:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading visits...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Campus Visits</h3>
          <p className="text-sm text-muted-foreground">Manage your campus visit schedule</p>
        </div>
        {playerId && (
          <Button
            size="sm"
            onClick={() => setShowRequestForm(!showRequestForm)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Request Visit
          </Button>
        )}
      </div>

      {showRequestForm && (
        <div className="p-4 border rounded-lg bg-card">
          <h4 className="font-medium mb-3">Request Campus Visit</h4>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Preferred Date</label>
              <Input
                type="date"
                value={requestDate}
                onChange={(e) => setRequestDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Notes</label>
              <Textarea
                value={requestNotes}
                onChange={(e) => setRequestNotes(e.target.value)}
                placeholder="Any specific requests or questions..."
              />
            </div>
            <Button onClick={requestVisit} className="w-full">
              Submit Request
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {visits.map(visit => (
          <div
            key={visit.id}
            className={cn(
              "p-4 rounded-lg border",
              visit.status === 'confirmed' && "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20",
              visit.status === 'pending' && "border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-950/20",
              visit.status === 'cancelled' && "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20"
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(visit.requestedDate, 'MMM d, yyyy')}
                </span>
                {visit.confirmedDate && (
                  <span className="text-sm text-muted-foreground">
                    (Confirmed: {format(visit.confirmedDate, 'MMM d')})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {visit.status === 'confirmed' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                {visit.status === 'cancelled' && (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  visit.status === 'confirmed' && "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300",
                  visit.status === 'pending' && "bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300",
                  visit.status === 'cancelled' && "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
                )}>
                  {visit.status.toUpperCase()}
                </span>
              </div>
            </div>

            {visit.location && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="w-3 h-3" />
                <span>{visit.location}</span>
              </div>
            )}

            {visit.itinerary && (
              <div className="mb-2">
                <p className="text-sm font-medium mb-1">Itinerary:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {visit.itinerary}
                </p>
              </div>
            )}

            {visit.travelInfo && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                {visit.travelInfo.flight && (
                  <div className="flex items-center gap-1">
                    <Plane className="w-3 h-3" />
                    <span>Flight: {visit.travelInfo.flight}</span>
                  </div>
                )}
                {visit.travelInfo.hotel && (
                  <div className="flex items-center gap-1">
                    <Hotel className="w-3 h-3" />
                    <span>Hotel: {visit.travelInfo.hotel}</span>
                  </div>
                )}
              </div>
            )}

            {visit.status === 'pending' && coachId && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const date = prompt('Confirm date (YYYY-MM-DD):');
                    if (date) confirmVisit(visit.id, date);
                  }}
                >
                  Confirm Visit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    // Cancel visit logic
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {visits.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No campus visits scheduled.</p>
          <p className="text-xs mt-1">Request a visit to get started.</p>
        </div>
      )}
    </div>
  );
}
