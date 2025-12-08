'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Upload,
  Eye,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Star,
  TrendingUp,
  Building2,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  CheckCircle2,
  ArrowUpDown,
  Loader2,
  UserPlus,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import Link from 'next/link';
import { toast } from 'sonner';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { getTeamForOwner, getTeamRoster, type Team, type TeamMember } from '@/lib/queries/team';
import { GlassProgressBar } from '@/components/ui/GlassProgressBar';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerWithInterest extends TeamMember {
  collegeInterests?: CollegeInterest[];
  stats?: PlayerStats;
}

interface CollegeInterest {
  id: string;
  collegeName: string;
  level: 'D1' | 'D2' | 'D3' | 'NAIA' | 'JUCO';
  status: 'viewing' | 'interested' | 'offered' | 'committed';
  lastContact?: string;
}

interface PlayerStats {
  gpa?: number;
  satScore?: number;
  battingAvg?: number;
  era?: number;
  velocity?: number;
}

type SortField = 'name' | 'position' | 'gradYear' | 'jerseyNumber' | 'collegeInterest';
type SortDirection = 'asc' | 'desc';

const POSITIONS = [
  'RHP', 'LHP', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF', 'DH', 'UTL'
];

const GRAD_YEARS = [2024, 2025, 2026, 2027, 2028];

// Mock college interest data
const MOCK_COLLEGE_INTERESTS: Record<string, CollegeInterest[]> = {};

// ═══════════════════════════════════════════════════════════════════════════
// Add/Edit Player Modal
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  player?: PlayerWithInterest | null;
  onSave: (data: PlayerFormData) => void;
  loading?: boolean;
}

interface PlayerFormData {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  secondaryPosition: string;
  gradYear: number;
  jerseyNumber: string;
  heightFeet: string;
  heightInches: string;
  weight: string;
  bats: string;
  throws: string;
  gpa: string;
  notes: string;
}

function PlayerModal({ isOpen, onClose, player, onSave, loading }: PlayerModalProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState<PlayerFormData>({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    secondaryPosition: '',
    gradYear: 2026,
    jerseyNumber: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    bats: 'R',
    throws: 'R',
    gpa: '',
    notes: '',
  });

  useEffect(() => {
    if (player) {
      setFormData({
        fullName: player.player.full_name || '',
        email: '',
        phone: '',
        position: player.player.primary_position || '',
        secondaryPosition: '',
        gradYear: player.player.grad_year || 2026,
        jerseyNumber: player.jersey_number || '',
        heightFeet: '',
        heightInches: '',
        weight: '',
        bats: 'R',
        throws: 'R',
        gpa: '',
        notes: '',
      });
    } else {
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        position: '',
        secondaryPosition: '',
        gradYear: 2026,
        jerseyNumber: '',
        heightFeet: '',
        heightInches: '',
        weight: '',
        bats: 'R',
        throws: 'R',
        gpa: '',
        notes: '',
      });
    }
  }, [player, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : ''}>
            {player ? 'Edit Player' : 'Add New Player'}
          </DialogTitle>
          <DialogDescription>
            {player ? 'Update player information' : 'Enter player details to add them to your roster'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Basic Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter player's full name"
                  required
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="player@email.com"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
            </div>
          </div>

          {/* Baseball Info */}
          <div className="space-y-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Baseball Information
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="position">Primary Position *</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="secondaryPosition">Secondary Position</Label>
                <Select
                  value={formData.secondaryPosition}
                  onValueChange={(value) => setFormData({ ...formData, secondaryPosition: value })}
                >
                  <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="jerseyNumber">Jersey #</Label>
                <Input
                  id="jerseyNumber"
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                  placeholder="00"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              <div>
                <Label htmlFor="gradYear">Graduation Year *</Label>
                <Select
                  value={formData.gradYear.toString()}
                  onValueChange={(value) => setFormData({ ...formData, gradYear: parseInt(value) })}
                >
                  <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GRAD_YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Bats</Label>
                <Select
                  value={formData.bats}
                  onValueChange={(value) => setFormData({ ...formData, bats: value })}
                >
                  <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R">Right</SelectItem>
                    <SelectItem value="L">Left</SelectItem>
                    <SelectItem value="S">Switch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Throws</Label>
                <Select
                  value={formData.throws}
                  onValueChange={(value) => setFormData({ ...formData, throws: value })}
                >
                  <SelectTrigger className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R">Right</SelectItem>
                    <SelectItem value="L">Left</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Physical & Academic */}
          <div className="space-y-4">
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Physical & Academic
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label>Height (ft)</Label>
                <Input
                  value={formData.heightFeet}
                  onChange={(e) => setFormData({ ...formData, heightFeet: e.target.value })}
                  placeholder="5"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              <div>
                <Label>Height (in)</Label>
                <Input
                  value={formData.heightInches}
                  onChange={(e) => setFormData({ ...formData, heightInches: e.target.value })}
                  placeholder="10"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              <div>
                <Label>Weight (lbs)</Label>
                <Input
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  placeholder="175"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
              <div>
                <Label>GPA</Label>
                <Input
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  placeholder="3.5"
                  className={isDark ? 'bg-slate-800 border-slate-700' : ''}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the player..."
              className={`min-h-[80px] ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-amber-500 hover:bg-amber-600">
              {loading && <div className="w-4 h-4 bg-white/20 rounded animate-pulse mr-2" />}
              {player ? 'Save Changes' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// College Interest Modal
// ═══════════════════════════════════════════════════════════════════════════

interface CollegeInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: PlayerWithInterest | null;
}

function CollegeInterestModal({ isOpen, onClose, player }: CollegeInterestModalProps) {
  const { isDark } = useTheme();
  
  // Generate mock interests for demo
  const interests: CollegeInterest[] = player ? [
    { id: '1', collegeName: 'Georgia Tech', level: 'D1', status: 'interested', lastContact: '2 days ago' },
    { id: '2', collegeName: 'Clemson', level: 'D1', status: 'viewing', lastContact: '1 week ago' },
    { id: '3', collegeName: 'Wake Forest', level: 'D1', status: 'offered', lastContact: 'Yesterday' },
  ] : [];

  const statusColors: Record<string, string> = {
    viewing: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    interested: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    offered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    committed: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-lg ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white'}`}>
        <DialogHeader>
          <DialogTitle className={isDark ? 'text-white' : ''}>
            College Interest - {player?.player.full_name}
          </DialogTitle>
          <DialogDescription>
            Track college programs interested in this player
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {interests.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                No college interest tracked yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {interests.map((interest) => (
                <div 
                  key={interest.id}
                  className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-white'}`}>
                        <GraduationCap className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      </div>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          {interest.collegeName}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {interest.level} • Last contact: {interest.lastContact}
                        </p>
                      </div>
                    </div>
                    <Badge className={statusColors[interest.status]}>
                      {interest.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" className="w-full gap-2">
            <Plus className="w-4 h-4" />
            Add College Interest
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function HSCoachRosterPage() {
  const router = useRouter();
  const { isDark } = useTheme();

  // Data state
  const [team, setTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<PlayerWithInterest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<string>('all');
  const [gradYearFilter, setGradYearFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [playerModalOpen, setPlayerModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<PlayerWithInterest | null>(null);
  const [collegeInterestModalOpen, setCollegeInterestModalOpen] = useState(false);
  const [selectedPlayerForInterest, setSelectedPlayerForInterest] = useState<PlayerWithInterest | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<PlayerWithInterest | null>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    let coachId: string | null = null;

    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: coach } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coach) {
        router.push('/onboarding/coach');
        return;
      }
      coachId = coach.id;
    }

    const teamData = await getTeamForOwner(coachId!);
    if (teamData) {
      setTeam(teamData);
      const rosterData = await getTeamRoster(teamData.id);
      // Add mock college interests
      const enrichedRoster = rosterData.map(member => ({
        ...member,
        collegeInterests: Math.random() > 0.5 ? [
          { id: '1', collegeName: 'Georgia Tech', level: 'D1' as const, status: 'interested' as const },
        ] : [],
      }));
      setRoster(enrichedRoster);
    }

    setLoading(false);
  };

  // Computed values
  const positions = useMemo(() => 
    Array.from(new Set(roster.map(m => m.player.primary_position).filter(Boolean))).sort(),
    [roster]
  );

  const gradYears = useMemo(() => 
    Array.from(new Set(roster.map(m => m.player.grad_year).filter(Boolean))).sort(),
    [roster]
  );

  // Filter and sort roster
  const filteredRoster = useMemo(() => {
    let result = roster.filter(member => {
      const name = member.player.full_name || '';
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.player.primary_position?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPosition = positionFilter === 'all' || 
        member.player.primary_position === positionFilter;
      
      const matchesGradYear = gradYearFilter === 'all' ||
        member.player.grad_year?.toString() === gradYearFilter;

      return matchesSearch && matchesPosition && matchesGradYear;
    });

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = (a.player.full_name || '').localeCompare(b.player.full_name || '');
          break;
        case 'position':
          comparison = (a.player.primary_position || '').localeCompare(b.player.primary_position || '');
          break;
        case 'gradYear':
          comparison = (a.player.grad_year || 0) - (b.player.grad_year || 0);
          break;
        case 'jerseyNumber':
          comparison = parseInt(a.jersey_number || '0') - parseInt(b.jersey_number || '0');
          break;
        case 'collegeInterest':
          comparison = (b.collegeInterests?.length || 0) - (a.collegeInterests?.length || 0);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [roster, searchQuery, positionFilter, gradYearFilter, sortField, sortDirection]);

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedIds.size === filteredRoster.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRoster.map(m => m.id)));
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Player actions
  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setPlayerModalOpen(true);
  };

  const handleEditPlayer = (player: PlayerWithInterest) => {
    setEditingPlayer(player);
    setPlayerModalOpen(true);
  };

  const handleSavePlayer = async (data: PlayerFormData) => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (editingPlayer) {
      toast.success('Player updated successfully');
    } else {
      toast.success('Player added to roster');
    }
    
    setSaving(false);
    setPlayerModalOpen(false);
    loadData(); // Reload roster
  };

  const handleDeletePlayer = (player: PlayerWithInterest) => {
    setPlayerToDelete(player);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!playerToDelete) return;
    
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    toast.success('Player removed from roster');
    setDeleteConfirmOpen(false);
    setPlayerToDelete(null);
    setSaving(false);
    loadData();
  };

  const handleViewCollegeInterest = (player: PlayerWithInterest) => {
    setSelectedPlayerForInterest(player);
    setCollegeInterestModalOpen(true);
  };

  // Bulk actions
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    toast.success(`${selectedIds.size} player(s) removed from roster`);
    setSelectedIds(new Set());
  };

  const handleBulkExport = () => {
    const selectedPlayers = roster.filter(m => selectedIds.has(m.id));
    if (selectedPlayers.length === 0) {
      toast.error('No players selected');
      return;
    }

    const headers = ['Name', 'Position', 'Grad Year', 'Jersey #', 'College Interest Count'];
    const rows = selectedPlayers.map(m => [
      m.player.full_name || '',
      m.player.primary_position || '',
      m.player.grad_year?.toString() || '',
      m.jersey_number || '',
      (m.collegeInterests?.length || 0).toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roster-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedPlayers.length} player(s) to CSV`);
  };

  const handleExportAll = () => {
    const headers = ['Name', 'Position', 'Grad Year', 'Jersey #', 'College Interest Count'];
    const rows = roster.map(m => [
      m.player.full_name || '',
      m.player.primary_position || '',
      m.player.grad_year?.toString() || '',
      m.jersey_number || '',
      (m.collegeInterests?.length || 0).toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `full-roster-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`Exported full roster (${roster.length} players) to CSV`);
  };

  // Stats
  const stats = useMemo(() => ({
    total: roster.length,
    seniors: roster.filter(m => m.player.grad_year === 2025).length,
    juniors: roster.filter(m => m.player.grad_year === 2026).length,
    withCollegeInterest: roster.filter(m => (m.collegeInterests?.length || 0) > 0).length,
  }), [roster]);

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div className="w-8 h-8 bg-amber-500/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                  <Users className={`w-6 h-6 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                </div>
                <div>
                  <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    Roster Management
                  </h1>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Manage your team's players and track college interest
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={isDark ? 'bg-slate-800 border-slate-700' : ''}>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportAll}>
                    <FileText className="w-4 h-4 mr-2" />
                    Export All to CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkExport} disabled={selectedIds.size === 0}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Selected ({selectedIds.size})
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleAddPlayer} className="bg-amber-500 hover:bg-amber-600 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.total}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Players</p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.seniors}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Seniors (2025)</p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.juniors}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Juniors (2026)</p>
            </div>
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
              <p className={`text-2xl font-bold text-emerald-500`}>{stats.withCollegeInterest}</p>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>College Interest</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <Card className={isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}>
          <CardHeader className="pb-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search by name or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`pl-10 ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                />
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className={`w-full md:w-[160px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos || ''}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gradYearFilter} onValueChange={setGradYearFilter}>
                <SelectTrigger className={`w-full md:w-[160px] ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}>
                  <SelectValue placeholder="Grad Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {gradYears.map((year) => (
                    <SelectItem key={year} value={year?.toString() || ''}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className={`flex items-center gap-3 mt-4 p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  {selectedIds.size} selected
                </span>
                <div className="flex-1" />
                <Button variant="outline" size="sm" onClick={handleBulkExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={handleBulkDelete}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                    <th className="py-3 px-4 text-left">
                      <Checkbox
                        checked={selectedIds.size === filteredRoster.length && filteredRoster.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th 
                      className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        Player
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                      onClick={() => handleSort('position')}
                    >
                      <div className="flex items-center gap-1">
                        Position
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                      onClick={() => handleSort('gradYear')}
                    >
                      <div className="flex items-center gap-1">
                        Class
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                      onClick={() => handleSort('jerseyNumber')}
                    >
                      <div className="flex items-center gap-1">
                        Jersey
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className={`py-3 px-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${isDark ? 'text-slate-400' : 'text-slate-500'}`}
                      onClick={() => handleSort('collegeInterest')}
                    >
                      <div className="flex items-center gap-1">
                        College Interest
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className={`py-3 px-4 text-right text-xs font-medium uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                        <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {searchQuery || positionFilter !== 'all' || gradYearFilter !== 'all'
                            ? 'No players match your filters'
                            : 'No players on roster yet'}
                        </p>
                        {!searchQuery && positionFilter === 'all' && gradYearFilter === 'all' && (
                          <Button variant="outline" size="sm" className="mt-3" onClick={handleAddPlayer}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add your first player
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredRoster.map((member) => (
                      <tr 
                        key={member.id}
                        className={`border-b transition-colors ${
                          isDark 
                            ? 'border-slate-700/50 hover:bg-slate-700/30' 
                            : 'border-slate-100 hover:bg-slate-50'
                        } ${selectedIds.has(member.id) ? (isDark ? 'bg-slate-700/50' : 'bg-amber-50') : ''}`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={selectedIds.has(member.id)}
                            onCheckedChange={() => handleSelectOne(member.id)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={member.player.avatar_url || undefined} />
                              <AvatarFallback className={isDark ? 'bg-slate-700 text-white' : 'bg-amber-100 text-amber-700'}>
                                {member.player.full_name?.slice(0, 2).toUpperCase() || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                {member.player.full_name || 'Unknown'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className={isDark ? 'border-slate-600' : ''}>
                            {member.player.primary_position || '-'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                            {member.player.grad_year || '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>
                            {member.jersey_number ? `#${member.jersey_number}` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {(member.collegeInterests?.length || 0) > 0 ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCollegeInterest(member)}
                              className="gap-1"
                            >
                              <Building2 className="w-4 h-4 text-emerald-500" />
                              <span className="text-emerald-500 font-medium">
                                {member.collegeInterests?.length} schools
                              </span>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewCollegeInterest(member)}
                              className={`gap-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </Button>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/coach/player/${member.player.id}`)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/coach/player/${member.player.id}`)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Profile
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditPlayer(member)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Player
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleViewCollegeInterest(member)}>
                                  <Building2 className="w-4 h-4 mr-2" />
                                  College Interest
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => handleDeletePlayer(member)}
                                  className="text-red-500 focus:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove from Roster
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination placeholder */}
            {filteredRoster.length > 0 && (
              <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Showing {filteredRoster.length} of {roster.length} players
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <PlayerModal
        isOpen={playerModalOpen}
        onClose={() => setPlayerModalOpen(false)}
        player={editingPlayer}
        onSave={handleSavePlayer}
        loading={saving}
      />

      <CollegeInterestModal
        isOpen={collegeInterestModalOpen}
        onClose={() => setCollegeInterestModalOpen(false)}
        player={selectedPlayerForInterest}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className={isDark ? 'bg-slate-900 border-slate-700' : ''}>
          <DialogHeader>
            <DialogTitle className={isDark ? 'text-white' : ''}>Remove Player</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {playerToDelete?.player.full_name} from the roster? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmDelete} 
              disabled={saving}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {saving && <div className="w-4 h-4 bg-white/20 rounded animate-pulse mr-2" />}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
