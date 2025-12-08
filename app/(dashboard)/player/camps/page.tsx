'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar,
  MapPin,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Heart,
  Star,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getUpcomingCamps,
  getPlayerCampRegistrations,
  registerForCamp,
  cancelCampRegistration,
  type CampEvent,
  type CampRegistration,
} from '@/lib/queries/camp-registration';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { EmptyState } from '@/components/ui/EmptyState';

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function PlayerCampsPage() {
  const [loading, setLoading] = useState(true);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [camps, setCamps] = useState<CampEvent[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<CampRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'discover' | 'registered'>('discover');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const supabase = createClient();
    
    let currentPlayerId: string | null = null;
    
    if (isDevMode()) {
      currentPlayerId = DEV_ENTITY_IDS.player;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      
      const { data: playerData } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (playerData) {
        currentPlayerId = playerData.id;
      }
    }
    
    setPlayerId(currentPlayerId);
    
    // Load camps and registrations in parallel
    const [campsData, registrationsData] = await Promise.all([
      getUpcomingCamps(50),
      currentPlayerId ? getPlayerCampRegistrations(currentPlayerId) : Promise.resolve([]),
    ]);
    
    setCamps(campsData);
    setMyRegistrations(registrationsData);
    setLoading(false);
  };

  // Filter camps based on search
  const filteredCamps = useMemo(() => {
    if (!searchQuery) return camps;
    const query = searchQuery.toLowerCase();
    return camps.filter(camp => 
      camp.name.toLowerCase().includes(query) ||
      camp.location?.toLowerCase().includes(query) ||
      camp.coach?.program_name?.toLowerCase().includes(query)
    );
  }, [camps, searchQuery]);

  // Get registered camp IDs for quick lookup
  const registeredCampIds = useMemo(() => {
    return new Set(myRegistrations.filter(r => r.status !== 'cancelled').map(r => r.camp_event_id));
  }, [myRegistrations]);

  const handleRegister = async (campId: string) => {
    if (!playerId) {
      toast.error('Please log in to register for camps');
      return;
    }
    
    setActionLoading(campId);
    const success = await registerForCamp(playerId, campId, 'interested');
    
    if (success) {
      toast.success('Registered interest! The coach will be notified.');
      // Refresh registrations
      const updated = await getPlayerCampRegistrations(playerId);
      setMyRegistrations(updated);
    } else {
      toast.error('Failed to register. Please try again.');
    }
    setActionLoading(null);
  };

  const handleCancel = async (campId: string) => {
    if (!playerId) return;
    
    setActionLoading(campId);
    const success = await cancelCampRegistration(playerId, campId);
    
    if (success) {
      toast.success('Registration cancelled');
      const updated = await getPlayerCampRegistrations(playerId);
      setMyRegistrations(updated);
    } else {
      toast.error('Failed to cancel. Please try again.');
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Camps & Events</h1>
            <p className="text-sm text-slate-500 mt-1">
              Discover camps, showcase events, and training opportunities
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search camps..."
                className="pl-9 h-9 bg-white border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="h-10 p-1 bg-white border border-slate-200">
            <TabsTrigger value="discover" className="h-8 px-4 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <Calendar className="w-4 h-4 mr-2" />
              Discover Camps
            </TabsTrigger>
            <TabsTrigger value="registered" className="h-8 px-4 data-[state=active]:bg-emerald-500 data-[state=active]:text-white">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              My Registrations
              {myRegistrations.filter(r => r.status !== 'cancelled').length > 0 && (
                <Badge className="ml-2 bg-emerald-100 text-emerald-700 px-1.5 py-0.5 text-[10px]">
                  {myRegistrations.filter(r => r.status !== 'cancelled').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Discover Tab */}
          <TabsContent value="discover" className="mt-6">
            {filteredCamps.length === 0 ? (
              <EmptyState
                iconPreset="events"
                title="No camps available"
                description="Check back soon for new camp and event opportunities."
              />
            ) : (
              <div className="grid gap-4">
                {filteredCamps.map((camp) => (
                  <CampCard
                    key={camp.id}
                    camp={camp}
                    isRegistered={registeredCampIds.has(camp.id)}
                    onRegister={() => handleRegister(camp.id)}
                    onCancel={() => handleCancel(camp.id)}
                    loading={actionLoading === camp.id}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Registered Tab */}
          <TabsContent value="registered" className="mt-6">
            {myRegistrations.filter(r => r.status !== 'cancelled').length === 0 ? (
              <EmptyState
                iconPreset="events"
                title="No registrations yet"
                description="Browse available camps and register your interest."
                actionText="Discover Camps"
                onAction={() => setActiveTab('discover')}
              />
            ) : (
              <div className="grid gap-4">
                {myRegistrations
                  .filter(r => r.status !== 'cancelled')
                  .map((registration) => (
                    <RegistrationCard
                      key={registration.id}
                      registration={registration}
                      onCancel={() => handleCancel(registration.camp_event_id)}
                      loading={actionLoading === registration.camp_event_id}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Camp Card Component
// ═══════════════════════════════════════════════════════════════════════════

interface CampCardProps {
  camp: CampEvent;
  isRegistered: boolean;
  onRegister: () => void;
  onCancel: () => void;
  loading: boolean;
}

function CampCard({ camp, isRegistered, onRegister, onCancel, loading }: CampCardProps) {
  const startDate = new Date(camp.start_date);
  const endDate = camp.end_date ? new Date(camp.end_date) : null;
  
  const dateString = endDate 
    ? `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const initials = camp.coach?.program_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'CP';

  return (
    <Card className="bg-white border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Program Logo */}
          <Avatar className="h-14 w-14 rounded-xl flex-shrink-0">
            <AvatarImage src={camp.coach?.logo_url ?? undefined} className="rounded-xl" />
            <AvatarFallback className="rounded-xl bg-emerald-100 text-emerald-700 font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-800 text-lg">{camp.name}</h3>
                <p className="text-sm text-emerald-600 font-medium">{camp.coach?.program_name}</p>
              </div>
              <Badge 
                className={`flex-shrink-0 ${
                  camp.status === 'open' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {camp.status === 'open' ? 'Open' : 'Limited'}
              </Badge>
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-500" />
                {dateString}
              </div>
              {camp.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {camp.location}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-500" />
                {(camp.registration_count || 0) + (camp.interested_count || 0)} interested
              </div>
            </div>

            {/* Description */}
            {camp.description && (
              <p className="mt-3 text-sm text-slate-600 line-clamp-2">{camp.description}</p>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 mt-4">
              {isRegistered ? (
                <>
                  <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                    Registered
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-slate-500 hover:text-red-600"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {loading ? <div className="w-4 h-4 bg-white/20 rounded animate-pulse" /> : 'Cancel'}
                  </Button>
                </>
              ) : (
                <Button 
                  size="sm" 
                  className="bg-emerald-500 hover:bg-emerald-600 text-white"
                  onClick={onRegister}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="w-4 h-4 bg-white/20 rounded animate-pulse mr-2" />
                  ) : (
                    <Heart className="w-4 h-4 mr-2" />
                  )}
                  Register Interest
                </Button>
              )}
              <Button variant="ghost" size="sm" className="text-slate-500 ml-auto">
                Learn More
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Registration Card Component
// ═══════════════════════════════════════════════════════════════════════════

interface RegistrationCardProps {
  registration: CampRegistration;
  onCancel: () => void;
  loading: boolean;
}

function RegistrationCard({ registration, onCancel, loading }: RegistrationCardProps) {
  const camp = registration.camp_event;
  if (!camp) return null;

  const startDate = new Date(camp.start_date);
  const dateString = startDate.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const statusColors = {
    interested: 'bg-blue-100 text-blue-700',
    registered: 'bg-emerald-100 text-emerald-700',
    confirmed: 'bg-green-100 text-green-700',
    attended: 'bg-purple-100 text-purple-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };

  const statusLabels = {
    interested: 'Interest Registered',
    registered: 'Registered',
    confirmed: 'Confirmed',
    attended: 'Attended',
    cancelled: 'Cancelled',
  };

  return (
    <Card className="bg-white border-slate-200">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{camp.name}</h3>
              <p className="text-sm text-slate-500">{camp.coach?.program_name}</p>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                <span>{dateString}</span>
                {camp.location && <span>• {camp.location}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={statusColors[registration.status]}>
              {statusLabels[registration.status]}
            </Badge>
            {registration.status !== 'cancelled' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-500 hover:text-red-600"
                onClick={onCancel}
                disabled={loading}
              >
                {loading ? <div className="w-4 h-4 bg-white/20 rounded animate-pulse" /> : 'Cancel'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


