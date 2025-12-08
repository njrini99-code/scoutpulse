'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Clock, MapPin, Plane, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format, addHours, isAfter, isBefore } from 'date-fns';

interface TimeSlot {
  start: Date;
  end: Date;
  timezone: string;
  available: boolean;
  reason?: string;
}

interface SmartSchedulingAssistantProps {
  coachId?: string;
  playerId?: string;
  onSchedule?: (slot: TimeSlot) => void;
}

export function SmartSchedulingAssistant({ 
  coachId, 
  playerId, 
  onSchedule 
}: SmartSchedulingAssistantProps) {
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [coachTimezone, setCoachTimezone] = useState('America/New_York');
  const [playerTimezone, setPlayerTimezone] = useState('America/Los_Angeles');
  const supabase = createClient();

  useEffect(() => {
    detectTimezones();
    if (selectedDate) {
      generateSuggestions();
    }
  }, [selectedDate, coachId, playerId]);

  const detectTimezones = async () => {
    try {
      // Get user timezone
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setCoachTimezone(userTimezone);

      // Try to get player timezone from profile
      if (playerId) {
        const { data: player } = await supabase
          .from('players')
          .select('city, state')
          .eq('id', playerId)
          .single();

        if (player?.state) {
          // Simple timezone mapping (can be enhanced)
          const timezoneMap: Record<string, string> = {
            'CA': 'America/Los_Angeles',
            'NY': 'America/New_York',
            'TX': 'America/Chicago',
            'FL': 'America/New_York'
          };
          setPlayerTimezone(timezoneMap[player.state] || userTimezone);
        }
      }
    } catch (error) {
      console.error('Error detecting timezones:', error);
    }
  };

  const generateSuggestions = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      // Get existing calendar events
      const { data: existingEvents } = await supabase
        .from('calendar_events')
        .select('start_time, end_time')
        .gte('start_time', new Date(selectedDate).toISOString())
        .lt('start_time', new Date(new Date(selectedDate).getTime() + 24 * 60 * 60 * 1000).toISOString());

      const busySlots = (existingEvents || []).map(e => ({
        start: new Date(e.start_time),
        end: new Date(e.end_time)
      }));

      // Generate suggested time slots (business hours: 9 AM - 5 PM)
      const suggestions: TimeSlot[] = [];
      const date = new Date(selectedDate);
      
      for (let hour = 9; hour <= 16; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        // Check for conflicts
        const hasConflict = busySlots.some(busy => 
          (isAfter(slotStart, busy.start) && isBefore(slotStart, busy.end)) ||
          (isAfter(busy.start, slotStart) && isBefore(busy.start, slotEnd))
        );

        suggestions.push({
          start: slotStart,
          end: slotEnd,
          timezone: coachTimezone,
          available: !hasConflict,
          reason: hasConflict ? 'Conflict with existing event' : undefined
        });
      }

      setSuggestedSlots(suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeInTimezone = (date: Date, tz: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  const calculateTravelTime = async (location1: string, location2: string): Promise<number> => {
    // Mock travel time calculation (would use Google Maps API in production)
    return 30; // minutes
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Smart Scheduling</h3>
        <p className="text-sm text-muted-foreground">
          Select a date to see optimal meeting times
        </p>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Select Date</label>
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={format(new Date(), 'yyyy-MM-dd')}
        />
      </div>

      {selectedDate && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Coach: {coachTimezone}</span>
            <span>•</span>
            <span>Player: {playerTimezone}</span>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Generating suggestions...</div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">Suggested Time Slots</p>
              {suggestedSlots.map((slot, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg border transition-colors",
                    slot.available
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 opacity-50"
                  )}
                  onClick={() => slot.available && onSchedule?.(slot)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">
                          {formatTimeInTimezone(slot.start, coachTimezone)} - {formatTimeInTimezone(slot.end, coachTimezone)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Player time: {formatTimeInTimezone(slot.start, playerTimezone)}
                        </p>
                      </div>
                    </div>
                    {slot.available ? (
                      <Button size="sm" variant="outline">
                        Select
                      </Button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <AlertCircle className="w-3 h-3" />
                        <span>{slot.reason}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDate && suggestedSlots.length > 0 && (
        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Smart Scheduling Tips
              </p>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1 list-disc list-inside">
                <li>Times shown in both your timezones</li>
                <li>Conflicts automatically detected</li>
                <li>Best times highlighted in green</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
