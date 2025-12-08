'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Search,
  Users,
  Eye,
  Trash2,
  MessageSquare,
  MapPin,
  MoreHorizontal,
  Sparkles,
  TrendingUp,
  Video,
  ArrowUpRight,
  Filter,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  UserPlus,
  CheckSquare,
  Square,
  Download,
  X,
  Loader2,
  SortAsc,
  SortDesc,
  StickyNote,
  Star,
  StarOff,
  Tag,
  Calendar,
  ArrowRight,
  Save,
  FileText,
  Settings2,
  Zap,
  Target,
  GraduationCap,
  Ruler,
  Weight,
} from 'lucide-react';
import { WatchlistSkeleton } from '@/components/ui/loading-state';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface Recruit {
  id: string;
  player_id: string;
  name: string;
  grad_year: string | null;
  primary_position: string | null;
  high_school_name: string | null;
  high_school_state: string | null;
  stage: string;
  priority: string;
  notes: string | null;
  rating: number | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  player?: {
    first_name: string | null;
    last_name: string | null;
    grad_year: number | null;
    primary_position: string | null;
    height_feet: number | null;
    height_inches: number | null;
    weight_lbs: number | null;
    high_school_state: string | null;
    avatar_url: string | null;
  };
}

interface AdvancedFilters {
  positions: string[];
  gradYearMin: number | null;
  gradYearMax: number | null;
  ratingMin: number;
  ratingMax: number;
  stages: string[];
  priorities: string[];
  states: string[];
  hasTags: string[];
}

type SortOption = 'name' | 'grad_year' | 'position' | 'rating' | 'stage' | 'created_at' | 'updated_at';
type SortDirection = 'asc' | 'desc';

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const POSITIONS = [
  { id: 'P', label: 'Pitcher', category: 'pitchers' },
  { id: 'C', label: 'Catcher', category: 'catchers' },
  { id: '1B', label: 'First Base', category: 'infielders' },
  { id: '2B', label: 'Second Base', category: 'infielders' },
  { id: 'SS', label: 'Shortstop', category: 'infielders' },
  { id: '3B', label: 'Third Base', category: 'infielders' },
  { id: 'LF', label: 'Left Field', category: 'outfielders' },
  { id: 'CF', label: 'Center Field', category: 'outfielders' },
  { id: 'RF', label: 'Right Field', category: 'outfielders' },
  { id: 'DH', label: 'Designated Hitter', category: 'utility' },
  { id: 'UTIL', label: 'Utility', category: 'utility' },
];

const GRAD_YEARS = [2024, 2025, 2026, 2027, 2028, 2029];

const STAGES = [
  { id: 'Watchlist', label: 'Watchlist', color: 'blue', bgLight: 'bg-blue-50', borderLight: 'border-blue-200', hoverBorder: 'hover:border-blue-300', headerBg: 'bg-blue-500', textColor: 'text-blue-700', order: 1 },
  { id: 'Evaluating', label: 'Evaluating', color: 'amber', bgLight: 'bg-amber-50', borderLight: 'border-amber-200', hoverBorder: 'hover:border-amber-300', headerBg: 'bg-amber-500', textColor: 'text-amber-700', order: 2 },
  { id: 'High Priority', label: 'High Priority', color: 'orange', bgLight: 'bg-orange-50', borderLight: 'border-orange-200', hoverBorder: 'hover:border-orange-300', headerBg: 'bg-orange-500', textColor: 'text-orange-700', order: 3 },
  { id: 'Offered', label: 'Offered', color: 'purple', bgLight: 'bg-purple-50', borderLight: 'border-purple-200', hoverBorder: 'hover:border-purple-300', headerBg: 'bg-purple-500', textColor: 'text-purple-700', order: 4 },
  { id: 'Committed', label: 'Committed', color: 'emerald', bgLight: 'bg-emerald-50', borderLight: 'border-emerald-200', hoverBorder: 'hover:border-emerald-300', headerBg: 'bg-emerald-500', textColor: 'text-emerald-700', order: 5 },
];

const PRIORITIES = [
  { id: 'high', label: 'High Priority', color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'medium', label: 'Medium', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'low', label: 'Low', color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'name', label: 'Name' },
  { id: 'grad_year', label: 'Graduation Year' },
  { id: 'position', label: 'Position' },
  { id: 'rating', label: 'Rating' },
  { id: 'stage', label: 'Stage' },
  { id: 'created_at', label: 'Date Added' },
  { id: 'updated_at', label: 'Last Updated' },
];

const DEFAULT_FILTERS: AdvancedFilters = {
  positions: [],
  gradYearMin: null,
  gradYearMax: null,
  ratingMin: 0,
  ratingMax: 100,
  stages: [],
  priorities: [],
  states: [],
  hasTags: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function CollegeCoachWatchlistPage() {
  const router = useRouter();
  const [recruits, setRecruits] = useState<Recruit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  
  // Advanced filters
  const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Notes modal
  const [notesModal, setNotesModal] = useState<{ open: boolean; recruit: Recruit | null }>({ open: false, recruit: null });
  const [noteText, setNoteText] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Pipeline view
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  useEffect(() => {
    loadRecruits();
  }, []);

  const loadRecruits = async () => {
    const supabase = createClient();
    
    let coachId: string | null = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) {
        setLoading(false);
        return;
      }
      coachId = coachData.id;
    }

    const { data: recruitsData } = await supabase
      .from('recruits')
      .select(`
        *,
        players:player_id (
          first_name,
          last_name,
          grad_year,
          primary_position,
          height_feet,
          height_inches,
          weight_lbs,
          high_school_state,
          avatar_url
        )
      `)
      .eq('coach_id', coachId)
      .order('created_at', { ascending: false });

    if (recruitsData) {
      const formatted: Recruit[] = recruitsData.map(r => ({
        ...r,
        player: r.players as Recruit['player'],
        name: r.name || `${(r.players as any)?.first_name || ''} ${(r.players as any)?.last_name || ''}`.trim(),
        rating: r.rating || Math.floor(Math.random() * 30 + 70), // Demo rating if none
        tags: r.tags || [],
      }));
      setRecruits(formatted);
    }

    setLoading(false);
  };

  // Get unique states from recruits
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    recruits.forEach(r => {
      const state = r.player?.high_school_state || r.high_school_state;
      if (state) states.add(state);
    });
    return Array.from(states).sort();
  }, [recruits]);

  // Get unique tags from recruits
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    recruits.forEach(r => {
      r.tags?.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [recruits]);

  // Apply filters and sorting
  const filteredAndSortedRecruits = useMemo(() => {
    let result = [...recruits];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => 
        r.name.toLowerCase().includes(query) ||
        r.player?.first_name?.toLowerCase().includes(query) ||
        r.player?.last_name?.toLowerCase().includes(query) ||
        r.high_school_name?.toLowerCase().includes(query)
      );
    }

    // Position filter (multi-select)
    if (filters.positions.length > 0) {
      result = result.filter(r => {
        const pos = r.player?.primary_position || r.primary_position || '';
        return filters.positions.some(p => pos.toLowerCase().includes(p.toLowerCase()));
      });
    }

    // Grad year range
    if (filters.gradYearMin !== null) {
      result = result.filter(r => {
        const year = r.player?.grad_year || parseInt(r.grad_year || '0');
        return year >= filters.gradYearMin!;
      });
    }
    if (filters.gradYearMax !== null) {
      result = result.filter(r => {
        const year = r.player?.grad_year || parseInt(r.grad_year || '9999');
        return year <= filters.gradYearMax!;
      });
    }

    // Rating range
    if (filters.ratingMin > 0) {
      result = result.filter(r => (r.rating || 0) >= filters.ratingMin);
    }
    if (filters.ratingMax < 100) {
      result = result.filter(r => (r.rating || 100) <= filters.ratingMax);
    }

    // Stage filter
    if (filters.stages.length > 0) {
      result = result.filter(r => filters.stages.includes(r.stage));
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      result = result.filter(r => filters.priorities.includes(r.priority));
    }

    // State filter
    if (filters.states.length > 0) {
      result = result.filter(r => {
        const state = r.player?.high_school_state || r.high_school_state;
        return state && filters.states.includes(state);
      });
    }

    // Tags filter
    if (filters.hasTags.length > 0) {
      result = result.filter(r => 
        filters.hasTags.some(t => r.tags?.includes(t))
      );
    }

    // Sorting
    result.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'grad_year':
          const yearA = a.player?.grad_year || parseInt(a.grad_year || '0');
          const yearB = b.player?.grad_year || parseInt(b.grad_year || '0');
          comparison = yearA - yearB;
          break;
        case 'position':
          const posA = a.player?.primary_position || a.primary_position || '';
          const posB = b.player?.primary_position || b.primary_position || '';
          comparison = posA.localeCompare(posB);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'stage':
          const stageOrderA = STAGES.find(s => s.id === a.stage)?.order || 0;
          const stageOrderB = STAGES.find(s => s.id === b.stage)?.order || 0;
          comparison = stageOrderA - stageOrderB;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          comparison = new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [recruits, searchQuery, filters, sortBy, sortDirection]);

  // Stats calculations
  const stats = useMemo(() => {
    const byStage: Record<string, number> = {};
    STAGES.forEach(s => byStage[s.id] = 0);
    recruits.forEach(r => {
      if (byStage[r.stage] !== undefined) byStage[r.stage]++;
    });
    
    const pitchers = recruits.filter(r => {
      const pos = r.player?.primary_position || r.primary_position || '';
      return ['P', 'Pitcher', 'RHP', 'LHP'].some(p => pos.toLowerCase().includes(p.toLowerCase()));
    }).length;
    
    const avgRating = recruits.length > 0 
      ? Math.round(recruits.reduce((sum, r) => sum + (r.rating || 0), 0) / recruits.length)
      : 0;

    return { 
      total: recruits.length, 
      filtered: filteredAndSortedRecruits.length,
      byStage,
      pitchers,
      avgRating,
    };
  }, [recruits, filteredAndSortedRecruits]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.positions.length > 0) count++;
    if (filters.gradYearMin !== null || filters.gradYearMax !== null) count++;
    if (filters.ratingMin > 0 || filters.ratingMax < 100) count++;
    if (filters.stages.length > 0) count++;
    if (filters.priorities.length > 0) count++;
    if (filters.states.length > 0) count++;
    if (filters.hasTags.length > 0) count++;
    return count;
  }, [filters]);

  // Handlers
  const handleViewPlayer = (playerId: string) => {
    router.push(`/coach/college/player/${playerId}`);
  };

  const handleMessagePlayer = (playerId: string, playerName: string) => {
    toast.success(`Opening message to ${playerName}...`);
    router.push(`/coach/college/messages?player=${playerId}`);
  };

  const handleRemoveFromWatchlist = async (recruitId: string, playerName: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .delete()
      .eq('id', recruitId);

    if (error) {
      toast.error('Failed to remove from watchlist');
    } else {
      toast.success(`${playerName} removed from watchlist`);
      setRecruits(recruits.filter(r => r.id !== recruitId));
    }
  };

  const handleUpdateStage = async (recruitId: string, newStage: string, playerName: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', recruitId);

    if (error) {
      toast.error('Failed to update stage');
    } else {
      const stageName = STAGES.find(s => s.id === newStage)?.label;
      toast.success(`${playerName} moved to ${stageName}`);
      setRecruits(recruits.map(r => r.id === recruitId ? { ...r, stage: newStage, updated_at: new Date().toISOString() } : r));
    }
  };

  const handleUpdateRating = async (recruitId: string, rating: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .update({ rating, updated_at: new Date().toISOString() })
      .eq('id', recruitId);

    if (error) {
      toast.error('Failed to update rating');
    } else {
      setRecruits(recruits.map(r => r.id === recruitId ? { ...r, rating, updated_at: new Date().toISOString() } : r));
    }
  };

  const handleUpdatePriority = async (recruitId: string, priority: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .update({ priority, updated_at: new Date().toISOString() })
      .eq('id', recruitId);

    if (error) {
      toast.error('Failed to update priority');
    } else {
      toast.success('Priority updated');
      setRecruits(recruits.map(r => r.id === recruitId ? { ...r, priority, updated_at: new Date().toISOString() } : r));
    }
  };

  const handleOpenNotes = (recruit: Recruit) => {
    setNoteText(recruit.notes || '');
    setNotesModal({ open: true, recruit });
  };

  const handleSaveNotes = async () => {
    if (!notesModal.recruit) return;
    
    setSavingNotes(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .update({ notes: noteText, updated_at: new Date().toISOString() })
      .eq('id', notesModal.recruit.id);

    if (error) {
      toast.error('Failed to save notes');
    } else {
      toast.success('Notes saved');
      setRecruits(recruits.map(r => 
        r.id === notesModal.recruit!.id 
          ? { ...r, notes: noteText, updated_at: new Date().toISOString() } 
          : r
      ));
      setNotesModal({ open: false, recruit: null });
    }
    setSavingNotes(false);
  };

  // Bulk selection handlers
  const toggleSelectRecruit = (recruitId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recruitId)) {
        newSet.delete(recruitId);
      } else {
        newSet.add(recruitId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAndSortedRecruits.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSortedRecruits.map(r => r.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk actions
  const handleBulkMoveStage = async (newStage: string) => {
    if (selectedIds.size === 0) return;
    
    setBulkActionLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .in('id', Array.from(selectedIds));

    if (error) {
      toast.error('Failed to move selected recruits');
    } else {
      const stageName = STAGES.find(s => s.id === newStage)?.label;
      toast.success(`${selectedIds.size} recruits moved to ${stageName}`);
      setRecruits(recruits.map(r => 
        selectedIds.has(r.id) ? { ...r, stage: newStage, updated_at: new Date().toISOString() } : r
      ));
      clearSelection();
    }
    setBulkActionLoading(false);
  };

  const handleBulkSetPriority = async (priority: string) => {
    if (selectedIds.size === 0) return;
    
    setBulkActionLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .update({ priority, updated_at: new Date().toISOString() })
      .in('id', Array.from(selectedIds));

    if (error) {
      toast.error('Failed to set priority');
    } else {
      const priorityName = PRIORITIES.find(p => p.id === priority)?.label;
      toast.success(`${selectedIds.size} recruits set to ${priorityName}`);
      setRecruits(recruits.map(r => 
        selectedIds.has(r.id) ? { ...r, priority, updated_at: new Date().toISOString() } : r
      ));
      clearSelection();
    }
    setBulkActionLoading(false);
  };

  const handleBulkRemove = async () => {
    if (selectedIds.size === 0) return;
    
    const confirmRemove = confirm(`Remove ${selectedIds.size} recruits from your watchlist?`);
    if (!confirmRemove) return;

    setBulkActionLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('recruits')
      .delete()
      .in('id', Array.from(selectedIds));

    if (error) {
      toast.error('Failed to remove selected recruits');
    } else {
      toast.success(`${selectedIds.size} recruits removed from watchlist`);
      setRecruits(recruits.filter(r => !selectedIds.has(r.id)));
      clearSelection();
    }
    setBulkActionLoading(false);
  };

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    
    const selectedRecruits = recruits.filter(r => selectedIds.has(r.id));
    const csvContent = [
      ['Name', 'Position', 'Grad Year', 'State', 'Stage', 'Priority', 'Rating', 'Notes'].join(','),
      ...selectedRecruits.map(r => [
        `"${r.name}"`,
        r.player?.primary_position || r.primary_position || '',
        r.player?.grad_year || r.grad_year || '',
        r.player?.high_school_state || r.high_school_state || '',
        r.stage,
        r.priority || '',
        r.rating || '',
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `watchlist-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${selectedIds.size} recruits to CSV`);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery('');
  };

  if (loading) {
    return <WatchlistSkeleton />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 space-y-4">
        
        {/* ═══════════════════════════════════════════════════════════════════
            HEADER WITH PIPELINE STATS
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Watchlist</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {stats.total} prospects tracked • Avg rating: {stats.avgRating}
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === 'kanban' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    viewMode === 'list' 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>

          {/* Pipeline Progress Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-slate-700">Pipeline Progress</span>
            </div>
            <div className="flex items-center gap-1">
              {STAGES.map((stage, idx) => {
                const count = stats.byStage[stage.id] || 0;
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={stage.id} className="flex-1 relative group">
                    <div className={`h-8 ${stage.headerBg} ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === STAGES.length - 1 ? 'rounded-r-lg' : ''} flex items-center justify-center transition-all hover:opacity-90`}>
                      <span className="text-[10px] font-semibold text-white">{count}</span>
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-slate-500 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {stage.label}
                    </div>
                    {idx < STAGES.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-300 absolute -right-2 top-1/2 -translate-y-1/2 z-10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTROLS ROW
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            {/* Search */}
            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search recruits..."
                className="pl-9 h-9 bg-white border-slate-200 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Advanced Filters Button */}
            <Button
              variant="outline"
              size="sm"
              className={`h-9 px-3 text-xs ${showFilters || activeFilterCount > 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px]">
                  {activeFilterCount}
                </span>
              )}
              {showFilters ? <ChevronUp className="w-3.5 h-3.5 ml-1.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-1.5" />}
            </Button>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 px-3 text-xs">
                  {sortDirection === 'asc' ? <SortAsc className="w-3.5 h-3.5 mr-1.5" /> : <SortDesc className="w-3.5 h-3.5 mr-1.5" />}
                  Sort: {SORT_OPTIONS.find(o => o.id === sortBy)?.label}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                {SORT_OPTIONS.map(option => (
                  <DropdownMenuItem 
                    key={option.id}
                    onClick={() => {
                      if (sortBy === option.id) {
                        setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy(option.id);
                        setSortDirection('asc');
                      }
                    }}
                    className="text-xs"
                  >
                    {sortBy === option.id && (
                      sortDirection === 'asc' ? <SortAsc className="w-3.5 h-3.5 mr-2" /> : <SortDesc className="w-3.5 h-3.5 mr-2" />
                    )}
                    {sortBy !== option.id && <div className="w-3.5 h-3.5 mr-2" />}
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 lg:ml-auto">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-3 text-xs text-slate-600 hover:text-slate-800"
                onClick={toggleSelectAll}
              >
                {selectedIds.size === filteredAndSortedRecruits.length && filteredAndSortedRecruits.length > 0 ? (
                  <CheckSquare className="w-3.5 h-3.5 mr-1.5" />
                ) : (
                  <Square className="w-3.5 h-3.5 mr-1.5" />
                )}
                Select All
              </Button>
              <Link href="/coach/college/recruiting-planner">
                <Button variant="ghost" size="sm" className="h-8 px-3 text-xs text-slate-600 hover:text-slate-800">
                  View Planner
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
              <Link href="/coach/college/discover">
                <Button size="sm" className="h-8 px-3 text-xs bg-emerald-500 hover:bg-emerald-600 text-white">
                  <UserPlus className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
                  Find Players
                </Button>
              </Link>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              ADVANCED FILTERS PANEL
          ═══════════════════════════════════════════════════════════════════ */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Advanced Filters</span>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Position Multi-Select */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Positions</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 justify-between text-xs font-normal">
                        {filters.positions.length > 0 
                          ? `${filters.positions.length} selected`
                          : 'Select positions'
                        }
                        <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2" align="start">
                      <div className="space-y-1 max-h-[200px] overflow-y-auto">
                        {POSITIONS.map(pos => (
                          <label key={pos.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.positions.includes(pos.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(f => ({ ...f, positions: [...f.positions, pos.id] }));
                                } else {
                                  setFilters(f => ({ ...f, positions: f.positions.filter(p => p !== pos.id) }));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300"
                            />
                            <span className="text-xs">{pos.label}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Graduation Year Range */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Graduation Year</label>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={filters.gradYearMin?.toString() || ''} 
                      onValueChange={(v) => setFilters(f => ({ ...f, gradYearMin: v ? parseInt(v) : null }))}
                    >
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue placeholder="From" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        {GRAD_YEARS.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-slate-400">—</span>
                    <Select 
                      value={filters.gradYearMax?.toString() || ''} 
                      onValueChange={(v) => setFilters(f => ({ ...f, gradYearMax: v ? parseInt(v) : null }))}
                    >
                      <SelectTrigger className="h-9 text-xs flex-1">
                        <SelectValue placeholder="To" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Any</SelectItem>
                        {GRAD_YEARS.map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Rating Range */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">
                    Rating Range: {filters.ratingMin} - {filters.ratingMax}
                  </label>
                  <div className="px-2">
                    <Slider
                      min={0}
                      max={100}
                      step={5}
                      value={[filters.ratingMin, filters.ratingMax]}
                      onValueChange={([min, max]) => setFilters(f => ({ ...f, ratingMin: min, ratingMax: max }))}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Stage Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Stage</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 justify-between text-xs font-normal">
                        {filters.stages.length > 0 
                          ? `${filters.stages.length} selected`
                          : 'All stages'
                        }
                        <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2" align="start">
                      <div className="space-y-1">
                        {STAGES.map(stage => (
                          <label key={stage.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.stages.includes(stage.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(f => ({ ...f, stages: [...f.stages, stage.id] }));
                                } else {
                                  setFilters(f => ({ ...f, stages: f.stages.filter(s => s !== stage.id) }));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300"
                            />
                            <div className={`w-2 h-2 rounded-full ${stage.headerBg}`} />
                            <span className="text-xs">{stage.label}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* State Filter */}
                {availableStates.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-600">State</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full h-9 justify-between text-xs font-normal">
                          {filters.states.length > 0 
                            ? `${filters.states.length} selected`
                            : 'All states'
                          }
                          <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-2" align="start">
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {availableStates.map(state => (
                            <label key={state} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer">
                              <input
                                type="checkbox"
                                checked={filters.states.includes(state)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFilters(f => ({ ...f, states: [...f.states, state] }));
                                  } else {
                                    setFilters(f => ({ ...f, states: f.states.filter(s => s !== state) }));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300"
                              />
                              <span className="text-xs">{state}</span>
                            </label>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Priority</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full h-9 justify-between text-xs font-normal">
                        {filters.priorities.length > 0 
                          ? `${filters.priorities.length} selected`
                          : 'All priorities'
                        }
                        <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-2" align="start">
                      <div className="space-y-1">
                        {PRIORITIES.map(priority => (
                          <label key={priority.id} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={filters.priorities.includes(priority.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFilters(f => ({ ...f, priorities: [...f.priorities, priority.id] }));
                                } else {
                                  setFilters(f => ({ ...f, priorities: f.priorities.filter(p => p !== priority.id) }));
                                }
                              }}
                              className="w-3.5 h-3.5 rounded border-slate-300"
                            />
                            <span className="text-xs">{priority.label}</span>
                          </label>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Active Filter Tags */}
              {activeFilterCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500">Active:</span>
                  {filters.positions.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {filters.positions.length} positions
                      <button onClick={() => setFilters(f => ({ ...f, positions: [] }))} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  )}
                  {(filters.gradYearMin || filters.gradYearMax) && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {filters.gradYearMin || 'Any'} - {filters.gradYearMax || 'Any'}
                      <button onClick={() => setFilters(f => ({ ...f, gradYearMin: null, gradYearMax: null }))} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  )}
                  {(filters.ratingMin > 0 || filters.ratingMax < 100) && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      Rating {filters.ratingMin}-{filters.ratingMax}
                      <button onClick={() => setFilters(f => ({ ...f, ratingMin: 0, ratingMax: 100 }))} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  )}
                  {filters.stages.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {filters.stages.length} stages
                      <button onClick={() => setFilters(f => ({ ...f, stages: [] }))} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  )}
                  {filters.states.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {filters.states.length} states
                      <button onClick={() => setFilters(f => ({ ...f, states: [] }))} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  )}
                  {filters.priorities.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                      {filters.priorities.length} priorities
                      <button onClick={() => setFilters(f => ({ ...f, priorities: [] }))} className="ml-1 hover:text-red-500">×</button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            BULK ACTIONS TOOLBAR
        ═══════════════════════════════════════════════════════════════════ */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="h-4 w-px bg-emerald-200" />
            <div className="flex items-center gap-2 flex-1 flex-wrap">
              {/* Move to Stage */}
              <Select onValueChange={handleBulkMoveStage} disabled={bulkActionLoading}>
                <SelectTrigger className="h-8 w-36 text-xs bg-white border-emerald-200">
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stage.headerBg}`} />
                        {stage.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Set Priority */}
              <Select onValueChange={handleBulkSetPriority} disabled={bulkActionLoading}>
                <SelectTrigger className="h-8 w-36 text-xs bg-white border-emerald-200">
                  <SelectValue placeholder="Set priority..." />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(priority => (
                    <SelectItem key={priority.id} value={priority.id}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Export */}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                onClick={handleBulkExport}
                disabled={bulkActionLoading}
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export CSV
              </Button>

              {/* Remove */}
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50"
                onClick={handleBulkRemove}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                )}
                Remove
              </Button>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100"
              onClick={clearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Results Count */}
        {(searchQuery || activeFilterCount > 0) && (
          <div className="text-sm text-slate-500">
            Showing {filteredAndSortedRecruits.length} of {stats.total} prospects
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            KANBAN BOARD VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
            {STAGES.map((stage) => {
              const stageRecruits = filteredAndSortedRecruits.filter(r => r.stage === stage.id);
              return (
                <RecruitBoardColumn
                  key={stage.id}
                  stage={stage}
                  recruits={stageRecruits}
                  onViewPlayer={handleViewPlayer}
                  onMessagePlayer={handleMessagePlayer}
                  onRemove={handleRemoveFromWatchlist}
                  onUpdateStage={handleUpdateStage}
                  onUpdateRating={handleUpdateRating}
                  onUpdatePriority={handleUpdatePriority}
                  onOpenNotes={handleOpenNotes}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelectRecruit}
                />
              );
            })}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            LIST VIEW
        ═══════════════════════════════════════════════════════════════════ */}
        {viewMode === 'list' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-10 px-4 py-3">
                    <button
                      onClick={toggleSelectAll}
                      className="w-5 h-5 rounded border-2 border-slate-300 flex items-center justify-center hover:border-emerald-400"
                    >
                      {selectedIds.size === filteredAndSortedRecruits.length && filteredAndSortedRecruits.length > 0 && (
                        <svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Player</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Class</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rating</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Stage</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Notes</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedRecruits.map((recruit) => (
                  <RecruitListRow
                    key={recruit.id}
                    recruit={recruit}
                    isSelected={selectedIds.has(recruit.id)}
                    onToggleSelect={() => toggleSelectRecruit(recruit.id)}
                    onView={() => handleViewPlayer(recruit.player_id)}
                    onMessage={() => handleMessagePlayer(recruit.player_id, recruit.name)}
                    onRemove={() => handleRemoveFromWatchlist(recruit.id, recruit.name)}
                    onUpdateStage={(stage) => handleUpdateStage(recruit.id, stage, recruit.name)}
                    onUpdatePriority={(priority) => handleUpdatePriority(recruit.id, priority)}
                    onOpenNotes={() => handleOpenNotes(recruit)}
                  />
                ))}
              </tbody>
            </table>
            {filteredAndSortedRecruits.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">No prospects match your filters</p>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            NOTES MODAL
        ═══════════════════════════════════════════════════════════════════ */}
        <Dialog open={notesModal.open} onOpenChange={(open) => !open && setNotesModal({ open: false, recruit: null })}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <StickyNote className="w-5 h-5 text-amber-500" />
                Private Notes - {notesModal.recruit?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                These notes are private to you and won't be visible to other coaches or the player.
              </p>
              <Textarea
                placeholder="Add your observations, evaluations, or reminders about this prospect..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="min-h-[200px] text-sm"
              />
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <FileText className="w-3.5 h-3.5" />
                <span>Supports markdown formatting</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setNotesModal({ open: false, recruit: null })}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotes} disabled={savingNotes} className="bg-emerald-500 hover:bg-emerald-600">
                {savingNotes ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Notes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Column Component
// ═══════════════════════════════════════════════════════════════════════════

interface RecruitBoardColumnProps {
  stage: typeof STAGES[0];
  recruits: Recruit[];
  onViewPlayer: (playerId: string) => void;
  onMessagePlayer: (playerId: string, playerName: string) => void;
  onRemove: (recruitId: string, playerName: string) => void;
  onUpdateStage: (recruitId: string, newStage: string, playerName: string) => void;
  onUpdateRating: (recruitId: string, rating: number) => void;
  onUpdatePriority: (recruitId: string, priority: string) => void;
  onOpenNotes: (recruit: Recruit) => void;
  selectedIds: Set<string>;
  onToggleSelect: (recruitId: string) => void;
}

function RecruitBoardColumn({ 
  stage, 
  recruits, 
  onViewPlayer, 
  onMessagePlayer, 
  onRemove,
  onUpdateStage,
  onUpdateRating,
  onUpdatePriority,
  onOpenNotes,
  selectedIds,
  onToggleSelect,
}: RecruitBoardColumnProps) {
  return (
    <div className="flex-shrink-0 w-[300px]">
      {/* Column Header */}
      <div className={`rounded-t-2xl ${stage.bgLight} border ${stage.borderLight} border-b-0 px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stage.headerBg}`} />
            <h3 className={`text-sm font-semibold ${stage.textColor}`}>{stage.label}</h3>
          </div>
          <Badge className={`${stage.bgLight} ${stage.textColor} border ${stage.borderLight} text-[10px] font-semibold px-2 py-0.5`}>
            {recruits.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className={`min-h-[480px] max-h-[600px] overflow-y-auto rounded-b-2xl border ${stage.borderLight} border-t-0 bg-white p-3 space-y-2`}>
        {recruits.length === 0 ? (
          <RecruitBoardEmptyState stage={stage} />
        ) : (
          recruits.map((recruit) => (
            <RecruitBoardCard
              key={recruit.id}
              recruit={recruit}
              stage={stage}
              onView={() => onViewPlayer(recruit.player_id)}
              onMessage={() => onMessagePlayer(recruit.player_id, recruit.name)}
              onRemove={() => onRemove(recruit.id, recruit.name)}
              onUpdateStage={(newStage) => onUpdateStage(recruit.id, newStage, recruit.name)}
              onUpdateRating={(rating) => onUpdateRating(recruit.id, rating)}
              onUpdatePriority={(priority) => onUpdatePriority(recruit.id, priority)}
              onOpenNotes={() => onOpenNotes(recruit)}
              isSelected={selectedIds.has(recruit.id)}
              onToggleSelect={() => onToggleSelect(recruit.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Empty State Component
// ═══════════════════════════════════════════════════════════════════════════

function RecruitBoardEmptyState({ stage }: { stage: typeof STAGES[0] }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className={`w-10 h-10 rounded-xl ${stage.bgLight} flex items-center justify-center mb-3`}>
        <Users className={`w-5 h-5 ${stage.textColor} opacity-60`} strokeWidth={1.5} />
      </div>
      <p className="text-xs font-medium text-slate-600 mb-1">
        No recruits in {stage.label} yet
      </p>
      <p className="text-[10px] text-slate-400 max-w-[180px] mb-3">
        Drag players here from Discover or move them between columns.
      </p>
      <Link href="/coach/college/discover">
        <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5 border-slate-200 text-slate-600 hover:bg-slate-50">
          Browse recruits
        </Button>
      </Link>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Card Component
// ═══════════════════════════════════════════════════════════════════════════

interface RecruitBoardCardProps {
  recruit: Recruit;
  stage: typeof STAGES[0];
  onView: () => void;
  onMessage: () => void;
  onRemove: () => void;
  onUpdateStage: (newStage: string) => void;
  onUpdateRating: (rating: number) => void;
  onUpdatePriority: (priority: string) => void;
  onOpenNotes: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
}

function RecruitBoardCard({ recruit, stage, onView, onMessage, onRemove, onUpdateStage, onUpdateRating, onUpdatePriority, onOpenNotes, isSelected, onToggleSelect }: RecruitBoardCardProps) {
  const initials = `${recruit.player?.first_name?.[0] || ''}${recruit.player?.last_name?.[0] || ''}`.toUpperCase() || 'NA';
  const position = recruit.player?.primary_position || recruit.primary_position || '';
  const gradYear = recruit.player?.grad_year || recruit.grad_year;
  const height = recruit.player?.height_feet && recruit.player?.height_inches 
    ? `${recruit.player.height_feet}'${recruit.player.height_inches}"` 
    : null;
  const weight = recruit.player?.weight_lbs ? `${recruit.player.weight_lbs} lbs` : null;
  const state = recruit.player?.high_school_state || recruit.high_school_state || '';
  const priorityConfig = PRIORITIES.find(p => p.id === recruit.priority);

  return (
    <div 
      className={`rounded-xl border bg-white p-3 transition-all cursor-pointer hover:shadow-md group ${
        isSelected 
          ? 'border-emerald-400 bg-emerald-50/50 ring-1 ring-emerald-400' 
          : `border-slate-200 ${stage.hoverBorder}`
      }`}
      onClick={onView}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect();
          }}
          className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-slate-300 hover:border-emerald-400'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Avatar */}
        <Avatar className="h-9 w-9 rounded-lg shadow-sm flex-shrink-0">
          <AvatarImage src={recruit.player?.avatar_url || undefined} />
          <AvatarFallback className="rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-800 truncate">{recruit.name}</p>
            {position && (
              <span className="text-[10px] text-slate-500 font-medium">— {position}</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {[gradYear, height, weight, state].filter(Boolean).join(' · ')}
          </p>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onView} className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMessage} className="text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-2" />
              Send Message
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onOpenNotes} className="text-xs">
              <StickyNote className="w-3.5 h-3.5 mr-2" />
              {recruit.notes ? 'Edit Notes' : 'Add Notes'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="text-xs">
                <Zap className="w-3.5 h-3.5 mr-2" />
                Set Priority
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {PRIORITIES.map(p => (
                  <DropdownMenuItem key={p.id} onClick={() => onUpdatePriority(p.id)} className="text-xs">
                    {p.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-xs" asChild>
              <Link href={`/coach/college/recruiting-planner?player=${recruit.player_id}`}>
                <ArrowUpRight className="w-3.5 h-3.5 mr-2" />
                View in Planner
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className="text-xs text-red-600 focus:text-red-600">
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tags Row */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {/* Rating Badge */}
        {recruit.rating && (
          <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-semibold">
            {recruit.rating}
          </span>
        )}
        
        {/* Priority Badge */}
        {priorityConfig && (
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${priorityConfig.color}`}>
            {priorityConfig.label}
          </span>
        )}

        {/* Notes Indicator */}
        {recruit.notes && (
          <button 
            onClick={(e) => { e.stopPropagation(); onOpenNotes(); }}
            className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] flex items-center gap-1"
          >
            <StickyNote className="w-3 h-3" />
            Notes
          </button>
        )}

        {/* Stage selector (compact) */}
        <div className="ml-auto">
          <Select
            value={recruit.stage}
            onValueChange={(value) => {
              onUpdateStage(value);
            }}
          >
            <SelectTrigger 
              className="h-5 text-[10px] px-2 border-0 bg-slate-100 hover:bg-slate-200 w-auto gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${s.headerBg}`} />
                    {s.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// List Row Component
// ═══════════════════════════════════════════════════════════════════════════

interface RecruitListRowProps {
  recruit: Recruit;
  isSelected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onMessage: () => void;
  onRemove: () => void;
  onUpdateStage: (stage: string) => void;
  onUpdatePriority: (priority: string) => void;
  onOpenNotes: () => void;
}

function RecruitListRow({ recruit, isSelected, onToggleSelect, onView, onMessage, onRemove, onUpdateStage, onUpdatePriority, onOpenNotes }: RecruitListRowProps) {
  const initials = `${recruit.player?.first_name?.[0] || ''}${recruit.player?.last_name?.[0] || ''}`.toUpperCase() || 'NA';
  const position = recruit.player?.primary_position || recruit.primary_position || '';
  const gradYear = recruit.player?.grad_year || recruit.grad_year;
  const stageConfig = STAGES.find(s => s.id === recruit.stage);
  const priorityConfig = PRIORITIES.find(p => p.id === recruit.priority);

  return (
    <tr className={`hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-emerald-50' : ''}`} onClick={onView}>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onToggleSelect}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected 
              ? 'bg-emerald-500 border-emerald-500 text-white' 
              : 'border-slate-300 hover:border-emerald-400'
          }`}
        >
          {isSelected && (
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={recruit.player?.avatar_url || undefined} />
            <AvatarFallback className="rounded-lg bg-emerald-100 text-emerald-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-slate-800">{recruit.name}</p>
            <p className="text-xs text-slate-500">{recruit.player?.high_school_state || ''}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">{position}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{gradYear}</td>
      <td className="px-4 py-3">
        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold">
          {recruit.rating || 'N/A'}
        </span>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Select value={recruit.stage} onValueChange={onUpdateStage}>
          <SelectTrigger className="h-7 text-xs w-32">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${stageConfig?.headerBg}`} />
              <SelectValue />
            </div>
          </SelectTrigger>
          <SelectContent>
            {STAGES.map(s => (
              <SelectItem key={s.id} value={s.id} className="text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${s.headerBg}`} />
                  {s.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Select value={recruit.priority || ''} onValueChange={onUpdatePriority}>
          <SelectTrigger className="h-7 text-xs w-28">
            <SelectValue placeholder="Set..." />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map(p => (
              <SelectItem key={p.id} value={p.id} className="text-xs">{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </td>
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onOpenNotes}>
          <StickyNote className="w-3.5 h-3.5 mr-1" />
          {recruit.notes ? 'View' : 'Add'}
        </Button>
      </td>
      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={onView} className="text-xs">
              <Eye className="w-3.5 h-3.5 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onMessage} className="text-xs">
              <MessageSquare className="w-3.5 h-3.5 mr-2" />
              Message
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className="text-xs text-red-600">
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
