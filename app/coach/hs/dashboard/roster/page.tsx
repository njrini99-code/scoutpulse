'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { logError } from '@/lib/utils/errorLogger';
import { useCurrentHighSchoolOrg } from '@/lib/hooks/useCurrentHighSchoolOrg';
import { useCurrentCoach } from '@/lib/hooks/useCurrentCoach';
import { useHighSchoolTeams } from '@/lib/hooks/useHighSchoolTeams';
import { HsRosterFilters } from '@/components/coach/hs/Roster/hs-roster-filters';
import { HsRosterTable } from '@/components/coach/hs/Roster/hs-roster-table';
import { HsRosterBulkActions } from '@/components/coach/hs/Roster/hs-roster-bulk-actions';
import { getHighSchoolRoster, type HsRosterPlayer, type HsRosterFiltersState } from '@/lib/api/hs/getHighSchoolRoster';
import { HsNewConversationModal } from '@/components/coach/hs/Messaging/hs-new-conversation-modal';

export default function HsCoachRosterPage() {
  const { coachProfile } = useCurrentCoach();
  const { org, isLoading: loadingOrg } = useCurrentHighSchoolOrg(coachProfile?.id);
  const { teams } = useHighSchoolTeams(org?.id);

  const [filters, setFilters] = useState<HsRosterFiltersState>({});
  const [players, setPlayers] = useState<HsRosterPlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageParticipants, setMessageParticipants] = useState<string[]>([]);

  useEffect(() => {
    if (!org?.id) return;
    
    const loadRoster = async () => {
      setLoading(true);
      try {
        const rosterData = await getHighSchoolRoster(org.id, filters);
        setPlayers(rosterData);
      } catch (error) {
        logError(error, { component: 'HsCoachRosterPage', action: 'loadRoster' });
        toast.error('Failed to load roster');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoster();
  }, [org?.id, filters]);

  const selectedPlayers = useMemo(
    () => players.filter((p) => selected.has(p.playerId)),
    [players, selected]
  );

  const openMessageSelected = () => {
    const participants = selectedPlayers.map((p) => p.profileId);
    setMessageParticipants(participants);
    setMessageModalOpen(true);
  };

  if (loadingOrg) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 bg-emerald-400/20 rounded animate-pulse" />
      </div>
    );
  }

  if (!org) {
    return (
      <Card className="bg-slate-900/70 border-white/5 p-4 text-white">
        <p className="text-sm text-slate-300">No high school organization linked yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <HsRosterFilters teams={teams} value={filters} onChange={setFilters} />
      {selectedPlayers.length > 0 && (
        <HsRosterBulkActions
          selected={selectedPlayers}
          onClear={() => setSelected(new Set())}
          onMessageSelected={openMessageSelected}
        />
      )}
      <HsRosterTable
        players={players}
        loading={loading}
        teams={teams}
        selected={selected}
        onToggleSelect={(id) =>
          setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
          })
        }
      />
      <HsNewConversationModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        defaultParticipantProfileIds={messageParticipants}
        defaultTitle="Message selected players"
        type="group"
        orgId={org.id}
        coachProfileId={coachProfile?.id || ''}
      />
    </div>
  );
}
