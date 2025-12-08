'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  getPlayerTeam,
  getTeamRoster,
  getTeamSchedule,
  getTeamMedia,
  type Team,
  type TeamMember,
  type ScheduleEvent,
  type TeamMedia as TeamMediaType,
} from '@/lib/queries/team';
import { 
  Loader2, 
  Users, 
  Calendar, 
  Image as ImageIcon, 
  Trophy,
  MapPin,
  Mail,
  Phone,
  ChevronRight,
  Play,
  Clock,
  User,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { cn } from '@/lib/utils';
import { 
  glassCard, 
  glassCardHover,
  glassDarkZone,
  glassLightZone,
  glassSegmentedControl,
  glassSegmentedPillActive,
  glassSegmentedPillInactive,
} from '@/lib/glassmorphism';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';

type TabType = 'overview' | 'roster' | 'schedule' | 'media';

export default function PlayerTeamPage() {
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [media, setMedia] = useState<TeamMediaType[]>([]);
  const [coachName, setCoachName] = useState<string | null>(null);
  const [coachEmail, setCoachEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const supabase = createClient();
    
    let playerId: string | null = null;
    
    if (isDevMode()) {
      playerId = DEV_ENTITY_IDS.player;
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
      playerId = player.id;
    }

    if (!playerId) {
      setLoading(false);
      return;
    }
    
    const teamData = await getPlayerTeam(playerId);
    if (!teamData) {
      setLoading(false);
      return;
    }

    setTeam(teamData);

    // Get coach info
    const { data: teamCoach } = await supabase
      .from('coaches')
      .select('full_name, email')
      .eq('id', teamData.coach_id)
      .single();

    setCoachName(teamCoach?.full_name || null);
    setCoachEmail(teamCoach?.email || null);

    const [rosterData, scheduleData, mediaData] = await Promise.all([
      getTeamRoster(teamData.id),
      getTeamSchedule(teamData.id),
      getTeamMedia(teamData.id),
    ]);

    setMembers(rosterData);
    setEvents(scheduleData);
    setMedia(mediaData);
    setLoading(false);
  };

  const upcomingEvents = events
    .filter(e => new Date(e.start_time) >= new Date())
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
    .slice(0, 5);

  const teamTypeLabels: Record<string, string> = {
    high_school: 'High School',
    showcase: 'Showcase Team',
    juco: 'JUCO',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1720] via-[#0f172a] to-[#f4f7fb] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 bg-blue-400/20 rounded animate-pulse" />
          <p className="text-white/60 text-sm">Loading team...</p>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b1720] via-[#0f172a] to-[#f4f7fb]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
          <div className={cn(glassCard, 'p-12 text-center')}>
            <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-white/30" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Team Found</h2>
            <p className="text-white/60 max-w-md mx-auto">
              You haven't been added to a team yet. Contact your coach to get added to your team's roster.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const teamInitials = team.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════════
          DARK HERO ZONE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className={glassDarkZone}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 pb-8 space-y-6">
          
          {/* Team Hero Banner */}
          <section className="relative overflow-hidden rounded-3xl">
            {/* Background */}
            <div className="absolute inset-0">
              {team.banner_url ? (
                <img
                  src={team.banner_url}
                  alt={`${team.name} banner`}
                  className="w-full h-full object-cover opacity-40"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-emerald-900/20" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1720] via-[#0b1720]/80 to-transparent" />
              <div 
                className="absolute inset-0 opacity-[0.03]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Content */}
            <div className="relative p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
                {/* Team Logo */}
                <Avatar className="w-20 h-20 md:w-24 md:w-24 ring-4 ring-white/20 shadow-2xl shadow-blue-500/20">
                  <AvatarImage src={team.logo_url || undefined} alt={team.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white text-2xl font-bold">
                    {teamInitials}
                  </AvatarFallback>
                </Avatar>

                {/* Team Info */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Team Hub
                    </Badge>
                    <Badge variant="outline" className="bg-white/[0.05] border-white/20 text-white/70">
                      {teamTypeLabels[team.team_type] || team.team_type}
                    </Badge>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">{team.name}</h1>
                  {(team.city || team.state) && (
                    <p className="text-white/60 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {[team.city, team.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4">
                  <div className="text-center px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1]">
                    <p className="text-2xl font-bold text-white">
                      <AnimatedNumber value={members.length} duration={800} />
                    </p>
                    <p className="text-[10px] text-white/50 uppercase tracking-wide">Players</p>
                  </div>
                  <div className="text-center px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1]">
                    <p className="text-2xl font-bold text-blue-400">
                      <AnimatedNumber value={upcomingEvents.length} duration={800} />
                    </p>
                    <p className="text-[10px] text-white/50 uppercase tracking-wide">Upcoming</p>
                  </div>
                </div>
              </div>

              {/* Coach Info */}
              {coachName && (
                <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
                    <User className="w-5 h-5 text-white/60" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{coachName}</p>
                    <p className="text-xs text-white/50">Head Coach</p>
                  </div>
                  {coachEmail && (
                    <a 
                      href={`mailto:${coachEmail}`}
                      className="ml-auto px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-xs text-white/70 hover:bg-white/[0.1] transition-colors flex items-center gap-1"
                    >
                      <Mail className="w-3 h-3" />
                      Contact
                    </a>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Tab Navigation */}
          <div className={glassSegmentedControl}>
            {(['overview', 'roster', 'schedule', 'media'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={activeTab === tab ? glassSegmentedPillActive : glassSegmentedPillInactive}
              >
                {tab === 'overview' && <Trophy className="w-3.5 h-3.5 mr-1.5" />}
                {tab === 'roster' && <Users className="w-3.5 h-3.5 mr-1.5" />}
                {tab === 'schedule' && <Calendar className="w-3.5 h-3.5 mr-1.5" />}
                {tab === 'media' && <ImageIcon className="w-3.5 h-3.5 mr-1.5" />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          LIGHT CONTENT ZONE
      ═══════════════════════════════════════════════════════════════════ */}
      <div className={glassLightZone}>
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8">
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upcoming Events */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-slate-800">Upcoming Events</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('schedule')}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {upcomingEvents.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No upcoming events</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {upcomingEvents.map((event) => (
                        <div 
                          key={event.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100"
                        >
                          <div className="w-12 h-12 rounded-lg bg-blue-100 border border-blue-200 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-medium text-blue-600 uppercase">
                              {new Date(event.start_time).toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-lg font-bold text-blue-700">
                              {new Date(event.start_time).getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">{event.event_name || 'Untitled Event'}</p>
                            <p className="text-xs text-slate-500">
                              {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              {event.location_name && ` • ${event.location_name}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Team Roster Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-600" />
                      <h3 className="font-semibold text-slate-800">Roster</h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('roster')}
                      className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  {members.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                      <p className="text-sm text-slate-500">No roster members</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {members.slice(0, 5).map((member) => (
                        <div
                          key={member.player_id}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={member.player.avatar_url || undefined} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                              {member.player.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 text-sm truncate">{member.player.full_name}</p>
                            <p className="text-xs text-slate-500">
                              {member.player.primary_position} {member.jersey_number && `• #${member.jersey_number}`}
                            </p>
                          </div>
                        </div>
                      ))}
                      {members.length > 5 && (
                        <p className="text-xs text-slate-400 text-center pt-2">
                          +{members.length - 5} more players
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Roster Tab */}
          {activeTab === 'roster' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Team Roster</h3>
                <p className="text-sm text-slate-500">{members.length} players</p>
              </div>
              <div className="p-4">
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium">No roster members yet</p>
                    <p className="text-sm text-slate-400 mt-1">Players will appear here once added by the coach</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {members.map((member) => (
                      <div
                        key={member.player_id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={member.player.avatar_url || undefined} />
                          <AvatarFallback className="bg-emerald-100 text-emerald-700">
                            {member.player.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800 truncate">{member.player.full_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {member.player.primary_position && (
                              <Badge variant="outline" className="text-[10px] bg-slate-50">
                                {member.player.primary_position}
                              </Badge>
                            )}
                            {member.jersey_number && (
                              <span className="text-xs text-slate-400">#{member.jersey_number}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'schedule' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Team Schedule</h3>
                <p className="text-sm text-slate-500">{events.length} events</p>
              </div>
              <div className="p-4">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium">No scheduled events</p>
                    <p className="text-sm text-slate-400 mt-1">Events will appear here once added by the coach</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => {
                      const eventDate = new Date(event.start_time);
                      const isPast = eventDate < new Date();

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'flex items-center gap-4 p-4 rounded-xl border transition-all',
                            isPast
                              ? 'bg-slate-50/50 border-slate-100 opacity-60'
                              : 'bg-white border-slate-200 hover:border-blue-200 hover:shadow-sm'
                          )}
                        >
                          <div className={cn(
                            'w-14 h-14 rounded-xl flex flex-col items-center justify-center',
                            isPast ? 'bg-slate-100' : 'bg-blue-100 border border-blue-200'
                          )}>
                            <span className={cn(
                              'text-[10px] font-medium uppercase',
                              isPast ? 'text-slate-500' : 'text-blue-600'
                            )}>
                              {eventDate.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className={cn(
                              'text-xl font-bold',
                              isPast ? 'text-slate-600' : 'text-blue-700'
                            )}>
                              {eventDate.getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800">{event.event_name || 'Untitled Event'}</p>
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                              <Badge variant="outline" className="text-[10px]">
                                {event.event_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </Badge>
                              {event.start_time && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(event.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                                </span>
                              )}
                              {event.location_name && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {event.location_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-semibold text-slate-800">Team Media</h3>
                <p className="text-sm text-slate-500">{media.length} items</p>
              </div>
              <div className="p-4">
                {media.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-600 font-medium">No media uploaded</p>
                    <p className="text-sm text-slate-400 mt-1">Photos and videos will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {media.map((item) => (
                      <div 
                        key={item.id}
                        className="aspect-square rounded-xl overflow-hidden bg-slate-100 relative group"
                      >
                        {item.media_type === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900">
                            <Play className="w-10 h-10 text-white/70" />
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.title || 'Team media'}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                          >
                            <ArrowUpRight className="w-5 h-5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
