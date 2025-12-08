'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { addPlayerToWatchlist, getRecruitingPipelineForCoach, updateRecruitStatus, type RecruitPipelineEntry } from '@/lib/queries/recruits';
import { createClient } from '@/lib/supabase/client';
import { 
  Loader2, Plus, NotebookPen, ArrowRightLeft, MoreHorizontal, 
  Eye, ExternalLink, User
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { Confetti } from '@/components/ui/Confetti';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type RecruitingStatus = 'watchlist' | 'high_priority' | 'offer_extended' | 'committed' | 'uninterested';

interface RingColorStyle extends React.CSSProperties {
  '--tw-ring-color'?: string;
}

interface PlannerPlayer {
  id: string;
  entryId: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  primaryPosition: string;
  gradYear: number;
  status: RecruitingStatus;
  height: string | null;
  weight: number | null;
  state: string | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Sample Data
// ═══════════════════════════════════════════════════════════════════════════

const makePlayer = (id: string, firstName: string, lastName: string, gradYear: number, position: string, state: string, height?: string, weight?: number) => ({
  id,
  first_name: firstName,
  last_name: lastName,
  full_name: `${firstName} ${lastName}`,
  grad_year: gradYear,
  primary_position: position,
  secondary_position: null,
  high_school_state: state,
  avatar_url: null,
  height: height ?? null,
  weight: weight ?? null,
  pitch_velo: null,
  exit_velo: null,
  sixty_time: null,
});

const makeEntry = (id: string, player: ReturnType<typeof makePlayer>, status: RecruitPipelineEntry['status']): RecruitPipelineEntry => ({
  id,
  player_id: player.id,
  status,
  position_role: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  player,
});

const SAMPLE_PIPELINE: RecruitPipelineEntry[] = [
  makeEntry('p1', makePlayer('p1', 'Cole', 'Mitchell', 2025, 'P', 'TX', "6'2\"", 195), 'committed'),
  makeEntry('p2', makePlayer('p2', 'Jake', 'Miller', 2026, 'P', 'OH', "6'4\"", 210), 'offer_extended'),
  makeEntry('p3', makePlayer('p3', 'Austin', 'Reed', 2026, 'P', 'TN', "6'1\"", 185), 'high_priority'),
  makeEntry('p4', makePlayer('p4', 'Ryan', 'Martinez', 2026, 'P', 'FL', "6'3\"", 200), 'watchlist'),
  makeEntry('c1', makePlayer('c1', 'Mason', 'Wilson', 2025, 'C', 'TX', "6'0\"", 205), 'committed'),
  makeEntry('c2', makePlayer('c2', 'Jake', 'Rodriguez', 2026, 'C', 'FL', "5'11\"", 200), 'offer_extended'),
  makeEntry('1b1', makePlayer('1b1', 'Tyler', 'Hoffman', 2026, '1B', 'OH', "6'4\"", 225), 'high_priority'),
  makeEntry('1b2', makePlayer('1b2', 'Chris', 'Yamamoto', 2026, '1B', 'CA', "6'3\"", 215), 'watchlist'),
  makeEntry('2b1', makePlayer('2b1', 'Derek', 'Johnson', 2026, '2B', 'GA', "5'10\"", 175), 'offer_extended'),
  makeEntry('2b2', makePlayer('2b2', 'Josh', 'Park', 2027, '2B', 'CA', "5'9\"", 170), 'watchlist'),
  makeEntry('3b1', makePlayer('3b1', 'Hunter', 'Davis', 2026, '3B', 'TX', "6'1\"", 200), 'committed'),
  makeEntry('3b2', makePlayer('3b2', 'Kyle', 'Adams', 2027, '3B', 'SC', "6'0\"", 195), 'high_priority'),
  makeEntry('ss1', makePlayer('ss1', 'Brandon', 'Lee', 2026, 'SS', 'CA', "6'0\"", 180), 'committed'),
  makeEntry('ss2', makePlayer('ss2', 'Malik', 'Pierre', 2026, 'SS', 'LA', "5'11\"", 175), 'offer_extended'),
  makeEntry('ss3', makePlayer('ss3', 'Ryan', 'Schmidt', 2025, 'SS', 'OH', "6'1\"", 185), 'high_priority'),
  makeEntry('lf1', makePlayer('lf1', 'Marcus', 'Thompson', 2026, 'LF', 'VA', "6'2\"", 195), 'offer_extended'),
  makeEntry('lf2', makePlayer('lf2', 'Jaylen', 'Harris', 2026, 'LF', 'AL', "6'1\"", 190), 'watchlist'),
  makeEntry('cf1', makePlayer('cf1', 'Caleb', 'Anderson', 2026, 'CF', 'TX', "5'11\"", 180), 'committed'),
  makeEntry('cf2', makePlayer('cf2', 'Miguel', 'Torres', 2027, 'CF', 'AZ', "5'10\"", 175), 'high_priority'),
  makeEntry('rf1', makePlayer('rf1', 'Tyler', 'Brooks', 2025, 'RF', 'GA', "6'3\"", 210), 'committed'),
  makeEntry('rf2', makePlayer('rf2', 'Colton', 'James', 2025, 'RF', 'OK', "6'2\"", 200), 'offer_extended'),
  makeEntry('rf3', makePlayer('rf3', 'Marcus', 'Brown', 2026, 'RF', 'NC', "6'1\"", 195), 'watchlist'),
];

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const STATUS_CONFIG: Record<RecruitingStatus, { label: string; short: string; color: string; dotClass: string; bgClass: string; borderClass: string; textClass: string }> = {
  watchlist: { label: 'Watchlist', short: 'Watch', color: '#3B82F6', dotClass: 'bg-blue-500', bgClass: 'bg-blue-50', borderClass: 'border-blue-200', textClass: 'text-blue-700' },
  high_priority: { label: 'High Priority', short: 'High', color: '#F59E0B', dotClass: 'bg-amber-500', bgClass: 'bg-amber-50', borderClass: 'border-amber-200', textClass: 'text-amber-700' },
  offer_extended: { label: 'Offer Extended', short: 'Offer', color: '#8B5CF6', dotClass: 'bg-violet-500', bgClass: 'bg-violet-50', borderClass: 'border-violet-200', textClass: 'text-violet-700' },
  committed: { label: 'Committed', short: 'Commit', color: '#10B981', dotClass: 'bg-emerald-500', bgClass: 'bg-emerald-50', borderClass: 'border-emerald-200', textClass: 'text-emerald-700' },
  uninterested: { label: 'Uninterested', short: 'Pass', color: '#6B7280', dotClass: 'bg-slate-400', bgClass: 'bg-slate-50', borderClass: 'border-slate-200', textClass: 'text-slate-600' },
};

const POSITION_SLOTS: Record<string, { top: string; left: string }> = {
  CF: { top: '5%', left: '50%' },
  LF: { top: '14%', left: '14%' },
  RF: { top: '14%', left: '86%' },
  SS: { top: '36%', left: '35%' },
  '2B': { top: '32%', left: '65%' },
  '3B': { top: '50%', left: '16%' },
  '1B': { top: '50%', left: '84%' },
  P: { top: '46%', left: '50%' },
  C: { top: '76%', left: '50%' },
};

// ═══════════════════════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════════════════════

function transformToPlanner(entries: RecruitPipelineEntry[]): PlannerPlayer[] {
  return entries.map((entry) => ({
    id: entry.player.id,
    entryId: entry.id,
    name: entry.player.full_name,
    initials: entry.player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
    avatarUrl: entry.player.avatar_url,
    primaryPosition: entry.player.primary_position?.toUpperCase() || 'UTIL',
    gradYear: entry.player.grad_year,
    status: entry.status as RecruitingStatus,
    height: (entry.player as any).height || null,
    weight: (entry.player as any).weight || null,
    state: entry.player.high_school_state,
  }));
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function RecruitingPlannerPage() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') as RecruitingStatus | null;
  
  const [pipeline, setPipeline] = useState<RecruitPipelineEntry[]>(SAMPLE_PIPELINE);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<RecruitingStatus | 'all'>(
    initialStatus && Object.keys(STATUS_CONFIG).includes(initialStatus) ? initialStatus : 'all'
  );
  const [gradYearFilter, setGradYearFilter] = useState<number | 'all'>('all');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [positionModalData, setPositionModalData] = useState<{ position: string; players: PlannerPlayer[] } | null>(null);
  const router = useRouter();

  const [coachId, setCoachId] = useState<string | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RecruitPipelineEntry | null>(null);
  const [pendingStatus, setPendingStatus] = useState<RecruitingStatus>('watchlist');
  const [pendingNote, setPendingNote] = useState('');
  const [newPlayerId, setNewPlayerId] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    const supabase = createClient();
    
    if (isDevMode()) {
      setCoachId(DEV_ENTITY_IDS.coach);
      setPipeline(SAMPLE_PIPELINE);
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPipeline(SAMPLE_PIPELINE);
      setLoading(false);
      return;
    }

    const { data: coach } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .eq('coach_type', 'college')
      .single();

    if (!coach) {
      setPipeline(SAMPLE_PIPELINE);
      setLoading(false);
      return;
    }
    setCoachId(coach.id);

    const entries = await getRecruitingPipelineForCoach(coach.id);
    setPipeline(entries.length > 0 ? entries : SAMPLE_PIPELINE);
    setLoading(false);
  };

  const filteredPipeline = useMemo(() => {
    return pipeline.filter((entry) => {
      const matchesStatus = statusFilter === 'all' || entry.status === statusFilter;
      const matchesGrad = gradYearFilter === 'all' || entry.player.grad_year === gradYearFilter;
      return matchesStatus && matchesGrad;
    });
  }, [pipeline, statusFilter, gradYearFilter]);

  const allPlannerPlayers = useMemo(() => transformToPlanner(pipeline), [pipeline]);

  const playersByPosition = useMemo(() => {
    const grouped: Record<string, PlannerPlayer[]> = {};
    allPlannerPlayers.forEach((player) => {
      const pos = player.primaryPosition;
      if (!grouped[pos]) grouped[pos] = [];
      grouped[pos].push(player);
    });
    return grouped;
  }, [allPlannerPlayers]);

  const handleStatusChange = (entry: RecruitPipelineEntry) => {
    setSelectedEntry(entry);
    setPendingStatus(entry.status as RecruitingStatus);
    setStatusDialogOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedEntry) return;
    setPipeline((prev) =>
      prev.map((e) => (e.id === selectedEntry.id ? { ...e, status: pendingStatus, updated_at: new Date().toISOString() } : e))
    );
    setStatusDialogOpen(false);
    const success = await updateRecruitStatus(selectedEntry.id, pendingStatus);
    if (success) {
      toast.success('Status updated');
      
      // Trigger confetti if player committed
      if (pendingStatus === 'committed') {
        setShowConfetti(true);
      }
    } else {
      toast.error('Could not update status');
      loadPipeline();
    }
  };

  const handleAddNote = (entry: RecruitPipelineEntry) => {
    setSelectedEntry(entry);
    setPendingNote(entry.notes || '');
    setNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedEntry) return;
    setPipeline((prev) =>
      prev.map((e) => (e.id === selectedEntry.id ? { ...e, notes: pendingNote, updated_at: new Date().toISOString() } : e))
    );
    setNoteDialogOpen(false);
    const supabase = createClient();
    const { error } = await supabase
      .from('recruit_watchlist')
      .update({ notes: pendingNote, updated_at: new Date().toISOString() })
      .eq('id', selectedEntry.id);
    if (error) {
      toast.error('Could not save note');
      loadPipeline();
    } else {
      toast.success('Note saved');
    }
  };

  const handleAddPlayer = async () => {
    if (!coachId) {
      toast.error('Need a coach profile to add recruits');
      return;
    }
    if (!newPlayerId) {
      toast.error('Enter a player ID to add');
      return;
    }
    const ok = await addPlayerToWatchlist(coachId, newPlayerId, 'watchlist');
    if (ok) {
      toast.success('Player added to watchlist');
      setAddDialogOpen(false);
      setNewPlayerId('');
      await loadPipeline();
    } else {
      toast.error('Could not add player');
    }
  };

  // Click on pill → highlight in pipeline (don't navigate)
  const handlePlayerSelect = useCallback((playerId: string) => {
    setSelectedPlayerId(playerId);
    setTimeout(() => setSelectedPlayerId(null), 3000);
  }, []);

  const handleViewProfile = useCallback((playerId: string) => {
    router.push(`/coach/college/player/${playerId}`);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 bg-emerald-600/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-[1600px] mx-auto px-4 py-5 space-y-5">
        
        {/* Header / Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Recruiting Planner</h1>
            <p className="text-sm text-slate-500 mt-0.5">Visualize your recruiting class by position.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="h-9 w-[150px] text-sm bg-white border-slate-200">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(gradYearFilter)} onValueChange={(v) => setGradYearFilter(v === 'all' ? 'all' : Number(v))}>
              <SelectTrigger className="h-9 w-[110px] text-sm bg-white border-slate-200">
                <SelectValue placeholder="All years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {[2025, 2026, 2027, 2028].map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="h-6 w-px bg-slate-200" />

            <Button size="sm" variant="outline" className="h-9" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              Add Player
            </Button>
          </div>
        </div>

        {/* Main Layout: Pipeline (Left) | Diamond (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          
          {/* Left: Pipeline */}
          <div className="order-2 lg:order-1">
            <PipelinePanel
              pipeline={filteredPipeline}
              selectedPlayerId={selectedPlayerId}
              onPlayerSelect={handlePlayerSelect}
              onChangeStatus={handleStatusChange}
              onAddNote={handleAddNote}
              onViewProfile={handleViewProfile}
            />
          </div>

          {/* Right: Diamond */}
          <div className="order-1 lg:order-2">
            <RecruitingDiamond
              playersByPosition={playersByPosition}
              statusFilter={statusFilter}
              selectedPlayerId={selectedPlayerId}
              onPlayerSelect={handlePlayerSelect}
              onViewProfile={handleViewProfile}
              onChangeStatus={(player) => {
                const entry = pipeline.find(e => e.player.id === player.id);
                if (entry) handleStatusChange(entry);
              }}
              onShowAllAtPosition={(position, players) => setPositionModalData({ position, players })}
            />
          </div>
        </div>

        {/* Dialogs */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Update Status</DialogTitle>
              <DialogDescription>Move {selectedEntry?.player.full_name} to a new stage.</DialogDescription>
            </DialogHeader>
            <Select value={pendingStatus} onValueChange={(v) => setPendingStatus(v as RecruitingStatus)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveStatus} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>Private note for {selectedEntry?.player.full_name}.</DialogDescription>
            </DialogHeader>
            <Textarea rows={4} value={pendingNote} onChange={(e) => setPendingNote(e.target.value)} placeholder="Scouting notes..." />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveNote} className="bg-emerald-600 hover:bg-emerald-700">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Add Player</DialogTitle>
              <DialogDescription>Add a recruit to your watchlist.</DialogDescription>
            </DialogHeader>
            <Input placeholder="Player ID" value={newPlayerId} onChange={(e) => setNewPlayerId(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPlayer} className="bg-emerald-600 hover:bg-emerald-700">Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Position Modal */}
        <Dialog open={!!positionModalData} onOpenChange={() => setPositionModalData(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>All {positionModalData?.position} Players</DialogTitle>
              <DialogDescription>{positionModalData?.players.length || 0} players at this position</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {positionModalData?.players.map((player) => {
                const config = STATUS_CONFIG[player.status];
                return (
                  <div
                    key={player.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${config.bgClass} ${config.borderClass}`}
                    onClick={() => { handlePlayerSelect(player.id); setPositionModalData(null); }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white" style={{ backgroundColor: config.color }}>
                      {player.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{player.name}</p>
                      <p className="text-xs text-slate-500">{player.gradYear} • {player.height || 'N/A'} • {player.state || 'N/A'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${config.bgClass} ${config.textClass}`}>
                      {config.short}
                    </span>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Confetti celebration */}
      <Confetti 
        show={showConfetti} 
        onComplete={() => setShowConfetti(false)} 
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Pipeline Panel Component
// ═══════════════════════════════════════════════════════════════════════════

function PipelinePanel({
  pipeline,
  selectedPlayerId,
  onPlayerSelect,
  onChangeStatus,
  onAddNote,
  onViewProfile,
}: {
  pipeline: RecruitPipelineEntry[];
  selectedPlayerId: string | null;
  onPlayerSelect: (id: string) => void;
  onChangeStatus: (entry: RecruitPipelineEntry) => void;
  onAddNote: (entry: RecruitPipelineEntry) => void;
  onViewProfile: (id: string) => void;
}) {
  const columns = (['watchlist', 'high_priority', 'offer_extended', 'committed'] as const).map((status) => ({
    status,
    config: STATUS_CONFIG[status],
    entries: pipeline.filter((e) => e.status === status),
  }));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-sm font-semibold text-slate-800">Pipeline by Status</h2>
        <p className="text-xs text-slate-400 mt-0.5">{pipeline.length} recruits</p>
      </div>
      
      <div className="grid grid-cols-2 gap-px bg-slate-100">
        {columns.map(({ status, config, entries }) => (
          <div key={status} className="bg-white p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${config.dotClass}`} />
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wide">{config.short}</span>
              <span className="ml-auto text-xs text-slate-400 font-medium">{entries.length}</span>
            </div>
            
            <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
              {entries.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-300">No players</div>
              ) : (
                entries.map((entry) => {
                  const isSelected = selectedPlayerId === entry.player.id;
                  const initials = entry.player.full_name.split(' ').map(n => n[0]).join('').slice(0, 2);
                  return (
                    <div
                      key={entry.id}
                      className={`group flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected ? `${config.bgClass} ${config.borderClass} shadow-sm ring-2` : 'border-transparent hover:bg-slate-50 hover:border-slate-100'
                      }`}
                      style={isSelected ? { '--tw-ring-color': config.color } as RingColorStyle : {}}
                      onClick={() => onPlayerSelect(entry.player.id)}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0" style={{ backgroundColor: config.color }}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800 truncate">{entry.player.full_name}</p>
                        <p className="text-[11px] text-slate-400">{entry.player.primary_position} • {entry.player.grad_year}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-100 transition-all" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="w-4 h-4 text-slate-400" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => onViewProfile(entry.player.id)}><Eye className="w-4 h-4 mr-2" /> View profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onChangeStatus(entry)}><ArrowRightLeft className="w-4 h-4 mr-2" /> Change status</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAddNote(entry)}><NotebookPen className="w-4 h-4 mr-2" /> Add note</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Recruiting Diamond Component
// ═══════════════════════════════════════════════════════════════════════════

function RecruitingDiamond({
  playersByPosition,
  statusFilter,
  selectedPlayerId,
  onPlayerSelect,
  onViewProfile,
  onChangeStatus,
  onShowAllAtPosition,
}: {
  playersByPosition: Record<string, PlannerPlayer[]>;
  statusFilter: RecruitingStatus | 'all';
  selectedPlayerId: string | null;
  onPlayerSelect: (id: string) => void;
  onViewProfile: (id: string) => void;
  onChangeStatus: (player: PlannerPlayer) => void;
  onShowAllAtPosition: (position: string, players: PlannerPlayer[]) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Recruiting Diamond</h2>
          <p className="text-xs text-slate-400 mt-0.5">Click a player to highlight in pipeline</p>
        </div>
        <div className="flex items-center gap-4">
          {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${config.dotClass}`} />
              <span className="text-[10px] text-slate-500 font-medium">{config.short}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Diamond Canvas */}
      <div 
        className="relative w-full p-6"
        style={{
          aspectRatio: '4/3',
          minHeight: '440px',
          background: 'linear-gradient(170deg, #047857 0%, #065F46 50%, #064E3B 100%)',
        }}
      >
        {/* Soft radial glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(255,255,255,0.08),transparent_55%)]" />
        
        {/* Very soft vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_55%,rgba(0,0,0,0.15))]" />

        {/* Diamond Field Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
          {/* Outfield Arc - subtle */}
          <path d="M 45 200 Q 200 25 355 200" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          {/* Infield Diamond - slightly brighter */}
          <path d="M 200 78 L 280 150 L 200 222 L 120 150 Z" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          {/* Home plate */}
          <path d="M 193 222 L 200 230 L 207 222 L 207 216 L 193 216 Z" fill="rgba(255,255,255,0.12)" />
        </svg>

        {/* Position Clusters */}
        {Object.entries(POSITION_SLOTS).map(([pos, coords]) => (
          <PositionCluster
            key={pos}
            position={pos}
            coords={coords}
            players={playersByPosition[pos] || []}
            statusFilter={statusFilter}
            selectedPlayerId={selectedPlayerId}
            onPlayerSelect={onPlayerSelect}
            onViewProfile={onViewProfile}
            onChangeStatus={onChangeStatus}
            onShowAll={() => onShowAllAtPosition(pos, playersByPosition[pos] || [])}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Position Cluster Component
// ═══════════════════════════════════════════════════════════════════════════

function PositionCluster({
  position,
  coords,
  players,
  statusFilter,
  selectedPlayerId,
  onPlayerSelect,
  onViewProfile,
  onChangeStatus,
  onShowAll,
}: {
  position: string;
  coords: { top: string; left: string };
  players: PlannerPlayer[];
  statusFilter: RecruitingStatus | 'all';
  selectedPlayerId: string | null;
  onPlayerSelect: (id: string) => void;
  onViewProfile: (id: string) => void;
  onChangeStatus: (player: PlannerPlayer) => void;
  onShowAll: () => void;
}) {
  const MAX_VISIBLE = 3;
  const visiblePlayers = players.slice(0, MAX_VISIBLE);
  const extraCount = players.length - MAX_VISIBLE;

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ top: coords.top, left: coords.left, transform: 'translate(-50%, 0)' }}
    >
      {/* Position Label */}
      <div className="mb-1.5 text-[10px] font-bold text-white/60 uppercase tracking-wider">
        {position}
      </div>

      {/* Player Stack */}
      <div className="flex flex-col items-center space-y-1">
        {players.length === 0 ? (
          <div className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-[10px] text-white/40 italic">
            Empty
          </div>
        ) : (
          <>
            {visiblePlayers.map((player) => (
              <RecruitingDiamondPlayerPill
                key={player.id}
                player={player}
                position={position}
                statusFilter={statusFilter}
                isSelected={selectedPlayerId === player.id}
                onSelect={() => onPlayerSelect(player.id)}
                onViewProfile={() => onViewProfile(player.id)}
                onChangeStatus={() => onChangeStatus(player)}
              />
            ))}
            {extraCount > 0 && (
              <button
                onClick={onShowAll}
                className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-[10px] font-semibold text-white/80 hover:text-white transition-all"
              >
                +{extraCount} more
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Player Pill Component - ALWAYS VISIBLE NAMES
// ═══════════════════════════════════════════════════════════════════════════

interface RecruitingDiamondPlayerPillProps {
  player: PlannerPlayer;
  position: string;
  statusFilter: RecruitingStatus | 'all';
  isSelected: boolean;
  onSelect: () => void;
  onViewProfile: () => void;
  onChangeStatus: () => void;
}

function RecruitingDiamondPlayerPill({
  player,
  position,
  statusFilter,
  isSelected,
  onSelect,
  onViewProfile,
  onChangeStatus,
}: RecruitingDiamondPlayerPillProps) {
  const [hovered, setHovered] = useState(false);
  const config = STATUS_CONFIG[player.status];
  const isDimmed = statusFilter !== 'all' && statusFilter !== player.status;

  // Truncate name if too long
  const displayName = player.name.length > 12 ? player.name.slice(0, 10) + '…' : player.name;

  // Determine tooltip placement based on position
  // Right side positions (RF, 1B): show tooltip on left
  // Left side positions (LF, 3B): show tooltip on right
  // Center positions: show tooltip on right (default)
  const isRightSide = position === 'RF' || position === '1B';
  const tooltipClasses = isRightSide
    ? 'right-full mr-2 top-1/2 -translate-y-1/2'
    : 'left-full ml-2 top-1/2 -translate-y-1/2';
  // CSS keyframes require proper formatting with newlines between from/to blocks
  const animationStyle = isRightSide
    ? `from { opacity: 0; transform: translateX(4px) translateY(-50%); }
          to { opacity: 1; transform: translateX(0) translateY(-50%); }`
    : `from { opacity: 0; transform: translateX(-4px) translateY(-50%); }
          to { opacity: 1; transform: translateX(0) translateY(-50%); }`;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main Pill - Names ALWAYS visible */}
      <button
        onClick={onSelect}
        className={`
          flex items-center gap-2 px-2.5 py-1.5 rounded-xl
          bg-white border shadow-sm
          transition-all duration-200 ease-out
          ${config.borderClass}
          ${isDimmed ? 'opacity-50' : ''}
          ${isSelected ? 'ring-2 ring-offset-2 ring-offset-emerald-700 scale-105 shadow-md' : ''}
          ${hovered && !isSelected ? 'scale-105 shadow-md border-opacity-100' : ''}
        `}
        style={isSelected ? { '--tw-ring-color': config.color } as RingColorStyle : {}}
      >
        {/* Avatar Circle */}
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0"
          style={{ backgroundColor: config.color }}
        >
          {player.initials}
        </div>
        
        {/* Player Info - ALWAYS VISIBLE */}
        <div className="flex flex-col items-start min-w-0">
          <span className="text-xs font-medium text-slate-800 leading-tight" title={player.name}>
            {displayName}
          </span>
          <span className="text-[9px] text-slate-500 leading-tight">
            {player.gradYear} • <span className={config.textClass}>{config.short}</span>
          </span>
        </div>
      </button>

      {/* Hover Tooltip - Enhanced info on hover with edge-aware positioning */}
      {hovered && (
        <div
          className={`absolute z-50 w-56 rounded-xl bg-white border border-slate-200 shadow-xl p-3 ${tooltipClasses}`}
          style={{ animation: 'fadeIn 150ms ease-out' }}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-2.5">
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: config.color }}
            >
              {player.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{player.name}</p>
              <p className="text-xs text-slate-500">{player.primaryPosition} • Class of {player.gradYear}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-1 mb-2.5 text-xs text-slate-600">
            {(player.height || player.weight) && (
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-slate-400" />
                {player.height && <span>{player.height}</span>}
                {player.height && player.weight && <span>•</span>}
                {player.weight && <span>{player.weight} lbs</span>}
              </div>
            )}
            {player.state && <div className="text-slate-500">{player.state}</div>}
          </div>

          {/* Status Badge */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold mb-3 ${config.bgClass} border ${config.borderClass}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
            <span className={config.textClass}>{config.label}</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View Profile
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onChangeStatus(); }}
              className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-xs font-medium text-emerald-700 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Move
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          ${animationStyle}
        }
      `}</style>
    </div>
  );
}
