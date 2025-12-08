'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Search,
  MapPin,
  GraduationCap,
  Heart,
  Filter,
  ChevronRight,
  Trophy,
  Users,
  Globe,
  X,
  SlidersHorizontal,
  Building2,
  Star,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { PlayerDiscoverSkeleton } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { getColleges, type College } from '@/lib/api/player/recruitingInterests';
import { logError } from '@/lib/utils/errorLogger';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { cn } from '@/lib/utils';
import { 
  glassCard, 
  glassCardHover, 
  glassInput, 
  glassStatCard,
  glassDarkZone,
  glassTransitionZone,
  glassLightZone,
  glassSegmentedControl,
  glassSegmentedPillActive,
  glassSegmentedPillInactive,
} from '@/lib/glassmorphism';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import Image from 'next/image';

const DIVISIONS = ['All', 'D1', 'D2', 'D3', 'NAIA', 'JUCO'];
const REGIONS = ['All', 'Northeast', 'Southeast', 'Midwest', 'Southwest', 'West'];

const STATE_TO_REGION: Record<string, string> = {
  // Northeast
  CT: 'Northeast', DE: 'Northeast', MA: 'Northeast', MD: 'Northeast', ME: 'Northeast',
  NH: 'Northeast', NJ: 'Northeast', NY: 'Northeast', PA: 'Northeast', RI: 'Northeast',
  VT: 'Northeast', DC: 'Northeast',
  // Southeast
  AL: 'Southeast', AR: 'Southeast', FL: 'Southeast', GA: 'Southeast', KY: 'Southeast',
  LA: 'Southeast', MS: 'Southeast', NC: 'Southeast', SC: 'Southeast', TN: 'Southeast',
  VA: 'Southeast', WV: 'Southeast',
  // Midwest
  IA: 'Midwest', IL: 'Midwest', IN: 'Midwest', KS: 'Midwest', MI: 'Midwest',
  MN: 'Midwest', MO: 'Midwest', NE: 'Midwest', ND: 'Midwest', OH: 'Midwest',
  SD: 'Midwest', WI: 'Midwest',
  // Southwest
  AZ: 'Southwest', NM: 'Southwest', OK: 'Southwest', TX: 'Southwest',
  // West
  AK: 'West', CA: 'West', CO: 'West', HI: 'West', ID: 'West', MT: 'West',
  NV: 'West', OR: 'West', UT: 'West', WA: 'West', WY: 'West',
};

export default function PlayerDiscoverPage() {
  const router = useRouter();
  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [interestedSchools, setInterestedSchools] = useState<Set<string>>(new Set());
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'division' | 'state'>('name');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    let currentPlayerId: string | null = null;
    
    if (isDevMode()) {
      currentPlayerId = DEV_ENTITY_IDS.player;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth/login');
        return;
      }

      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!player) {
        router.push('/onboarding/player');
        return;
      }
      currentPlayerId = player.id;
    }

    setPlayerId(currentPlayerId);

    const collegeData = await getColleges();
    setColleges(collegeData);

    const { data: interests } = await supabase
      .from('recruiting_interests')
      .select('college_id')
      .eq('player_id', currentPlayerId);

    if (interests) {
      setInterestedSchools(new Set(interests.map(i => i.college_id).filter(Boolean)));
    }

    setLoading(false);
  };

  const filteredColleges = useMemo(() => {
    const filtered = colleges.filter(college => {
      if (search) {
        const searchLower = search.toLowerCase();
        const matchesName = college.name.toLowerCase().includes(searchLower);
        const matchesCity = college.city?.toLowerCase().includes(searchLower);
        const matchesState = college.state?.toLowerCase().includes(searchLower);
        const matchesConference = college.conference?.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesCity && !matchesState && !matchesConference) {
          return false;
        }
      }

      if (divisionFilter !== 'All' && college.division !== divisionFilter) {
        return false;
      }

      if (regionFilter !== 'All' && college.state) {
        const region = STATE_TO_REGION[college.state];
        if (region !== regionFilter) {
          return false;
        }
      }

      return true;
    });

    // Sort the filtered colleges
    return filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'division') {
        const divOrder = { 'D1': 1, 'D2': 2, 'D3': 3, 'NAIA': 4, 'JUCO': 5 };
        const aOrder = divOrder[a.division as keyof typeof divOrder] || 99;
        const bOrder = divOrder[b.division as keyof typeof divOrder] || 99;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'state') {
        if (a.state === b.state) return a.name.localeCompare(b.name);
        return (a.state || '').localeCompare(b.state || '');
      }
      return 0;
    });
  }, [colleges, search, divisionFilter, regionFilter, sortBy]);

  const handleAddInterest = async (college: College) => {
    if (!playerId) return;

    const supabase = createClient();
    
    const { error } = await supabase
      .from('recruiting_interests')
      .insert({
        player_id: playerId,
        college_id: college.id,
        school_name: college.name,
        conference: college.conference,
        division: college.division,
        status: 'interested',
        interest_level: 'medium',
      });

    if (error) {
      toast.error('Failed to add school');
      logError(error, { component: 'PlayerDiscover', action: 'addInterest' });
      return;
    }

    setInterestedSchools(prev => new Set([...Array.from(prev), college.id]));
    toast.success(`Added ${college.name} to your interests!`);
  };

  const handleRemoveInterest = async (collegeId: string) => {
    if (!playerId) return;

    const supabase = createClient();
    
    const { error } = await supabase
      .from('recruiting_interests')
      .delete()
      .eq('player_id', playerId)
      .eq('college_id', collegeId);

    if (error) {
      toast.error('Failed to remove school');
      return;
    }

    setInterestedSchools(prev => {
      const next = new Set(prev);
      next.delete(collegeId);
      return next;
    });
    toast.success('Removed from interests');
  };

  const clearFilters = () => {
    setSearch('');
    setDivisionFilter('All');
    setRegionFilter('All');
  };

  const handleViewProgram = (college: College) => {
    // In the future, navigate to /college/[slug] when that page is created
    // For now, show a coming soon message
    toast.info(`${college.name} program details coming soon!`, {
      description: 'Full program pages with rosters, stats, and coach info will be available soon.',
    });
  };

  const hasActiveFilters = search || divisionFilter !== 'All' || regionFilter !== 'All';

  if (loading) {
    return <PlayerDiscoverSkeleton />;
  }

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          DARK HERO ZONE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className={glassDarkZone}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-8 space-y-6">
          
          {/* Hero Header */}
          <section className="relative">
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-transparent to-emerald-900/10" />
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            <div className="relative p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 rounded-xl bg-purple-500/20">
                      <GraduationCap className="w-5 h-5 text-purple-400" />
                    </div>
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Discover
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">Find Your Program</h1>
                  <p className="text-white/60 mt-1">Explore college baseball programs that match your goals</p>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="px-4 py-2 rounded-xl bg-white/[0.08] border border-white/[0.12]">
                    <p className="text-2xl font-bold text-white">
                      <AnimatedNumber value={interestedSchools.size} duration={800} />
                    </p>
                    <p className="text-[10px] text-white/50 uppercase tracking-wide">In Your List</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search schools, cities, states, or conferences..."
              className={cn(
                glassInput,
                'w-full pl-12 pr-4 py-3.5 text-base'
              )}
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-white/50" />
              </button>
            )}
          </div>

          {/* Filter Chips Row */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
                showFilters 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-white/[0.05] border-white/[0.12] text-white/70 hover:bg-white/[0.08]'
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Division Pills */}
            <div className={glassSegmentedControl}>
              {DIVISIONS.map((div) => (
                <button
                  key={div}
                  onClick={() => setDivisionFilter(div)}
                  className={divisionFilter === div ? glassSegmentedPillActive : glassSegmentedPillInactive}
                >
                  {div}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-white/50 hover:text-white/70 flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            )}
          </div>

          {/* Expanded Filters Panel */}
          {showFilters && (
            <div className={cn(glassCard, 'p-4 animate-in slide-in-from-top-2 duration-200')}>
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-medium text-white/60 mb-2 block">Region</label>
                  <div className="flex flex-wrap gap-2">
                    {REGIONS.map((region) => (
                      <button
                        key={region}
                        onClick={() => setRegionFilter(region)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                          regionFilter === region
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                            : 'bg-white/[0.05] border border-white/[0.08] text-white/60 hover:bg-white/[0.08]'
                        )}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="mt-4 pt-3 border-t border-white/[0.08]">
                  <p className="text-xs text-white/50">
                    Showing: {divisionFilter !== 'All' ? divisionFilter : 'All divisions'} 
                    {regionFilter !== 'All' ? ` • ${regionFilter}` : ''}
                    {search ? ` • "${search}"` : ''}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <GlassStatTile 
              icon={<Building2 className="w-4 h-4" />}
              value={colleges.length}
              label="Programs"
            />
            <GlassStatTile 
              icon={<Filter className="w-4 h-4" />}
              value={filteredColleges.length}
              label="Matching"
              accent
            />
            <GlassStatTile 
              icon={<Heart className="w-4 h-4" />}
              value={interestedSchools.size}
              label="Interested"
            />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LIGHT CONTENT ZONE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className={glassLightZone}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Programs</h2>
              <p className="text-sm text-slate-500">{filteredColleges.length} results</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'division' | 'state')}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-colors"
              >
                <option value="name">Name</option>
                <option value="division">Division</option>
                <option value="state">State</option>
              </select>
            </div>
          </div>

          {/* College Grid */}
          {filteredColleges.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredColleges.map(college => (
                <CollegeCard
                  key={college.id}
                  college={college}
                  isInterested={interestedSchools.has(college.id)}
                  onAddInterest={() => handleAddInterest(college)}
                  onRemoveInterest={() => handleRemoveInterest(college.id)}
                  onViewProgram={() => handleViewProgram(college)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-800 font-medium">No programs match your filters</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or filters</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Components
// ═══════════════════════════════════════════════════════════════════════════

function GlassStatTile({ 
  icon, 
  value, 
  label,
  accent,
}: { 
  icon: React.ReactNode;
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(glassStatCard, 'text-center')}>
      <div className={cn(
        'w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2',
        accent ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.1] text-white/60'
      )}>
        {icon}
      </div>
      <p className={cn('text-xl font-bold', accent ? 'text-emerald-400' : 'text-white')}>
        <AnimatedNumber value={value} duration={1000} />
      </p>
      <p className="text-[10px] text-white/50 uppercase tracking-wide">{label}</p>
    </div>
  );
}

function CollegeCard({
  college,
  isInterested,
  onAddInterest,
  onRemoveInterest,
  onViewProgram,
}: {
  college: College;
  isInterested: boolean;
  onAddInterest: () => void;
  onRemoveInterest: () => void;
  onViewProgram: () => void;
}) {
  const getDivisionColor = (division: string | null) => {
    switch (division) {
      case 'D1': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'D2': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'D3': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'NAIA': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'JUCO': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/50 flex items-center justify-center flex-shrink-0">
          {college.logo_url ? (
            <Image src={college.logo_url} alt={college.name} width={36} height={36} className="object-contain" />
          ) : (
            <GraduationCap className="w-6 h-6 text-emerald-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
            {college.name}
          </h3>
          {college.nickname && (
            <p className="text-sm text-slate-500">{college.nickname}</p>
          )}
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {college.division && (
              <Badge variant="outline" className={cn('text-[10px] font-medium', getDivisionColor(college.division))}>
                {college.division}
              </Badge>
            )}
            {college.city && college.state && (
              <span className="text-xs flex items-center gap-1 text-slate-500">
                <MapPin className="w-3 h-3" />
                {college.city}, {college.state}
              </span>
            )}
          </div>
          {college.conference && (
            <p className="text-xs text-slate-400 mt-1.5 truncate">{college.conference}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={onViewProgram}
          className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1 transition-colors"
        >
          View Program <ArrowUpRight className="w-3 h-3" />
        </button>
        <button
          onClick={isInterested ? onRemoveInterest : onAddInterest}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
            isInterested 
              ? 'bg-pink-50 text-pink-600 border border-pink-200 hover:bg-pink-100' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm'
          )}
        >
          <Heart className={cn('w-3.5 h-3.5', isInterested && 'fill-current')} />
          {isInterested ? 'Interested' : 'Add'}
        </button>
      </div>
    </div>
  );
}
