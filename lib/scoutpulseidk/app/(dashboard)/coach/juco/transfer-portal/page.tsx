'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Search,
  ArrowRightLeft,
  Eye,
  Building2,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  GraduationCap,
  School,
  Star,
  AlertTriangle,
  Filter,
  Plus,
  Send,
  Mail,
  Phone,
  Calendar,
  X,
  Check,
  MoreHorizontal,
  ExternalLink,
  Sparkles,
  TrendingUp,
  BookOpen,
  Award,
  CheckSquare,
  Square,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import Link from 'next/link';
import { GlassToggle, SettingsToggle } from '@/components/ui/GlassToggle';
import { GlassProgressBar, CircularProgress } from '@/components/ui/GlassProgressBar';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface TransferPlayer {
  id: string;
  name: string;
  position: string;
  avatarUrl?: string;
  gpa: number;
  creditsCompleted: number;
  creditsRequired: number;
  isAvailable: boolean;
  eligibilityStatus: 'eligible' | 'at_risk' | 'ineligible';
  requirements: TransferRequirement[];
  collegeMatches: CollegeMatch[];
  applications: Application[];
}

interface TransferRequirement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
  category: 'academic' | 'athletic' | 'administrative' | 'compliance';
}

interface CollegeMatch {
  id: string;
  collegeName: string;
  division: string;
  matchScore: number;
  interestLevel: 'high' | 'medium' | 'low' | 'none';
  athleticFit: number;
  academicFit: number;
  location: string;
  conference: string;
  coachContact?: string;
  coachEmail?: string;
  notes?: string;
}

interface Application {
  id: string;
  collegeName: string;
  division: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'declined' | 'waitlisted';
  submittedDate?: string;
  lastUpdated: string;
  nextStep?: string;
  deadline?: string;
  contactName?: string;
  contactEmail?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// MOCK DATA
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_PLAYERS: TransferPlayer[] = [
  {
    id: 'p1',
    name: 'Marcus Williams',
    position: 'RHP',
    gpa: 3.4,
    creditsCompleted: 45,
    creditsRequired: 60,
    isAvailable: true,
    eligibilityStatus: 'eligible',
    requirements: [
      { id: 'r1', title: 'Academic Transcript', description: 'Official transcript from current institution', completed: true, category: 'academic' },
      { id: 'r2', title: 'NCAA Eligibility Center', description: 'Register and complete certification', completed: true, category: 'compliance' },
      { id: 'r3', title: 'Transfer Release Form', description: 'Obtain release from current program', completed: true, category: 'administrative' },
      { id: 'r4', title: 'Physical Exam', description: 'Updated physical within 12 months', completed: false, dueDate: '2024-12-15', category: 'athletic' },
      { id: 'r5', title: 'Character Reference', description: 'Two letters of recommendation', completed: false, dueDate: '2024-12-20', category: 'administrative' },
      { id: 'r6', title: 'Financial Aid Forms', description: 'FAFSA and CSS Profile', completed: true, category: 'administrative' },
    ],
    collegeMatches: [
      { id: 'cm1', collegeName: 'Georgia Tech', division: 'D1', matchScore: 95, interestLevel: 'high', athleticFit: 92, academicFit: 98, location: 'Atlanta, GA', conference: 'ACC', coachContact: 'Coach Johnson', coachEmail: 'johnson@gatech.edu' },
      { id: 'cm2', collegeName: 'Clemson', division: 'D1', matchScore: 88, interestLevel: 'medium', athleticFit: 90, academicFit: 85, location: 'Clemson, SC', conference: 'ACC', coachContact: 'Coach Smith' },
      { id: 'cm3', collegeName: 'NC State', division: 'D1', matchScore: 82, interestLevel: 'high', athleticFit: 85, academicFit: 80, location: 'Raleigh, NC', conference: 'ACC' },
      { id: 'cm4', collegeName: 'Wake Forest', division: 'D1', matchScore: 79, interestLevel: 'low', athleticFit: 78, academicFit: 82, location: 'Winston-Salem, NC', conference: 'ACC' },
    ],
    applications: [
      { id: 'a1', collegeName: 'Georgia Tech', division: 'D1', status: 'under_review', submittedDate: '2024-10-15', lastUpdated: '2024-11-01', nextStep: 'Campus visit scheduled', contactName: 'Coach Johnson', contactEmail: 'johnson@gatech.edu' },
      { id: 'a2', collegeName: 'Clemson', division: 'D1', status: 'submitted', submittedDate: '2024-10-20', lastUpdated: '2024-10-20', deadline: '2024-12-01', contactName: 'Coach Smith' },
      { id: 'a3', collegeName: 'NC State', division: 'D1', status: 'draft', lastUpdated: '2024-11-05', deadline: '2024-12-15' },
    ],
  },
  {
    id: 'p2',
    name: 'Jake Thompson',
    position: 'SS',
    gpa: 2.8,
    creditsCompleted: 32,
    creditsRequired: 60,
    isAvailable: true,
    eligibilityStatus: 'eligible',
    requirements: [
      { id: 'r1', title: 'Academic Transcript', description: 'Official transcript from current institution', completed: true, category: 'academic' },
      { id: 'r2', title: 'NCAA Eligibility Center', description: 'Register and complete certification', completed: false, dueDate: '2024-12-01', category: 'compliance' },
      { id: 'r3', title: 'Transfer Release Form', description: 'Obtain release from current program', completed: true, category: 'administrative' },
      { id: 'r4', title: 'Physical Exam', description: 'Updated physical within 12 months', completed: true, category: 'athletic' },
      { id: 'r5', title: 'Character Reference', description: 'Two letters of recommendation', completed: false, dueDate: '2024-12-20', category: 'administrative' },
    ],
    collegeMatches: [
      { id: 'cm1', collegeName: 'Wake Forest', division: 'D1', matchScore: 91, interestLevel: 'high', athleticFit: 95, academicFit: 85, location: 'Winston-Salem, NC', conference: 'ACC' },
      { id: 'cm2', collegeName: 'Duke', division: 'D1', matchScore: 85, interestLevel: 'medium', athleticFit: 88, academicFit: 80, location: 'Durham, NC', conference: 'ACC' },
      { id: 'cm3', collegeName: 'UNC', division: 'D1', matchScore: 78, interestLevel: 'low', athleticFit: 82, academicFit: 75, location: 'Chapel Hill, NC', conference: 'ACC' },
    ],
    applications: [
      { id: 'a1', collegeName: 'Wake Forest', division: 'D1', status: 'accepted', submittedDate: '2024-09-15', lastUpdated: '2024-10-30', nextStep: 'Scholarship negotiation', contactName: 'Coach Davis' },
      { id: 'a2', collegeName: 'Duke', division: 'D1', status: 'waitlisted', submittedDate: '2024-10-01', lastUpdated: '2024-11-01' },
    ],
  },
  {
    id: 'p3',
    name: 'Tyler Johnson',
    position: 'OF',
    gpa: 2.1,
    creditsCompleted: 28,
    creditsRequired: 60,
    isAvailable: false,
    eligibilityStatus: 'at_risk',
    requirements: [
      { id: 'r1', title: 'Academic Transcript', description: 'Official transcript from current institution', completed: true, category: 'academic' },
      { id: 'r2', title: 'NCAA Eligibility Center', description: 'Register and complete certification', completed: false, dueDate: '2024-12-01', category: 'compliance' },
      { id: 'r3', title: 'Transfer Release Form', description: 'Obtain release from current program', completed: false, dueDate: '2024-11-30', category: 'administrative' },
      { id: 'r4', title: 'GPA Improvement Plan', description: 'Must raise GPA above 2.3', completed: false, dueDate: '2024-12-15', category: 'academic' },
    ],
    collegeMatches: [
      { id: 'cm1', collegeName: 'East Carolina', division: 'D1', matchScore: 72, interestLevel: 'medium', athleticFit: 80, academicFit: 62, location: 'Greenville, NC', conference: 'AAC' },
      { id: 'cm2', collegeName: 'Coastal Carolina', division: 'D1', matchScore: 68, interestLevel: 'low', athleticFit: 75, academicFit: 60, location: 'Conway, SC', conference: 'Sun Belt' },
    ],
    applications: [],
  },
  {
    id: 'p4',
    name: 'Chris Martinez',
    position: 'C',
    gpa: 3.8,
    creditsCompleted: 52,
    creditsRequired: 60,
    isAvailable: true,
    eligibilityStatus: 'eligible',
    requirements: [
      { id: 'r1', title: 'Academic Transcript', description: 'Official transcript from current institution', completed: true, category: 'academic' },
      { id: 'r2', title: 'NCAA Eligibility Center', description: 'Register and complete certification', completed: true, category: 'compliance' },
      { id: 'r3', title: 'Transfer Release Form', description: 'Obtain release from current program', completed: true, category: 'administrative' },
      { id: 'r4', title: 'Physical Exam', description: 'Updated physical within 12 months', completed: true, category: 'athletic' },
      { id: 'r5', title: 'Character Reference', description: 'Two letters of recommendation', completed: true, category: 'administrative' },
      { id: 'r6', title: 'Financial Aid Forms', description: 'FAFSA and CSS Profile', completed: true, category: 'administrative' },
    ],
    collegeMatches: [
      { id: 'cm1', collegeName: 'Florida State', division: 'D1', matchScore: 93, interestLevel: 'high', athleticFit: 90, academicFit: 96, location: 'Tallahassee, FL', conference: 'ACC', coachContact: 'Coach Wilson', coachEmail: 'wilson@fsu.edu' },
      { id: 'cm2', collegeName: 'Miami', division: 'D1', matchScore: 89, interestLevel: 'high', athleticFit: 88, academicFit: 90, location: 'Coral Gables, FL', conference: 'ACC' },
      { id: 'cm3', collegeName: 'Virginia Tech', division: 'D1', matchScore: 84, interestLevel: 'medium', athleticFit: 82, academicFit: 88, location: 'Blacksburg, VA', conference: 'ACC' },
    ],
    applications: [
      { id: 'a1', collegeName: 'Florida State', division: 'D1', status: 'accepted', submittedDate: '2024-09-01', lastUpdated: '2024-10-15', nextStep: 'Sign NLI by Nov 13', contactName: 'Coach Wilson', contactEmail: 'wilson@fsu.edu' },
      { id: 'a2', collegeName: 'Miami', division: 'D1', status: 'accepted', submittedDate: '2024-09-15', lastUpdated: '2024-10-20', contactName: 'Coach Brown' },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

function StatusBadge({ status }: { status: Application['status'] }) {
  const configs: Record<Application['status'], { bg: string; text: string; icon: React.ElementType }> = {
    draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: FileText },
    submitted: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Send },
    under_review: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: Eye },
    accepted: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: CheckCircle2 },
    declined: { bg: 'bg-red-500/20', text: 'text-red-400', icon: X },
    waitlisted: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: Clock },
  };
  
  const config = configs[status];
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.bg} ${config.text} capitalize text-[10px]`}>
      <Icon className="w-3 h-3 mr-1" />
      {status.replace('_', ' ')}
    </Badge>
  );
}

function RequirementCategoryIcon({ category }: { category: TransferRequirement['category'] }) {
  const icons: Record<TransferRequirement['category'], React.ElementType> = {
    academic: BookOpen,
    athletic: Award,
    administrative: FileText,
    compliance: CheckSquare,
  };
  const Icon = icons[category];
  return <Icon className="w-4 h-4" />;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function JUCOTransferPortalPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  const [players, setPlayers] = useState<TransferPlayer[]>(MOCK_PLAYERS);
  const [selectedPlayer, setSelectedPlayer] = useState<TransferPlayer | null>(MOCK_PLAYERS[0]);
  const [activeTab, setActiveTab] = useState<'requirements' | 'matches' | 'applications'>('requirements');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAvailable, setFilterAvailable] = useState<'all' | 'available' | 'unavailable'>('all');
  const [loading, setLoading] = useState(false);

  // Filter players
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           player.position.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterAvailable === 'all' || 
                          (filterAvailable === 'available' && player.isAvailable) ||
                          (filterAvailable === 'unavailable' && !player.isAvailable);
      return matchesSearch && matchesFilter;
    });
  }, [players, searchQuery, filterAvailable]);

  // Toggle player availability
  const toggleAvailability = (playerId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId ? { ...p, isAvailable: !p.isAvailable } : p
    ));
    if (selectedPlayer?.id === playerId) {
      setSelectedPlayer(prev => prev ? { ...prev, isAvailable: !prev.isAvailable } : null);
    }
  };

  // Toggle requirement completion
  const toggleRequirement = (playerId: string, reqId: string) => {
    setPlayers(prev => prev.map(p => 
      p.id === playerId 
        ? { 
            ...p, 
            requirements: p.requirements.map(r => 
              r.id === reqId ? { ...r, completed: !r.completed } : r
            )
          } 
        : p
    ));
    if (selectedPlayer?.id === playerId) {
      setSelectedPlayer(prev => prev ? {
        ...prev,
        requirements: prev.requirements.map(r => 
          r.id === reqId ? { ...r, completed: !r.completed } : r
        )
      } : null);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const available = players.filter(p => p.isAvailable).length;
    const totalApps = players.reduce((sum, p) => sum + p.applications.length, 0);
    const acceptedApps = players.reduce((sum, p) => sum + p.applications.filter(a => a.status === 'accepted').length, 0);
    const avgMatch = Math.round(players.reduce((sum, p) => 
      sum + (p.collegeMatches.length > 0 ? p.collegeMatches[0].matchScore : 0), 0
    ) / players.length);
    return { available, totalApps, acceptedApps, avgMatch };
  }, [players]);

  return (
    <div className={`min-h-screen transition-colors ${isDark ? 'bg-slate-900' : 'bg-gradient-to-b from-slate-50 via-slate-50 to-cyan-50/20'}`}>
      {/* Header */}
      <div className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/80' : 'border-slate-200 bg-white/80'} backdrop-blur-md sticky top-0 z-10`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link href="/coach/juco">
                <Button variant="ghost" size="sm" className={isDark ? 'text-slate-400 hover:text-white' : ''}>
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              <div className={`w-px h-6 ${isDark ? 'bg-slate-700' : 'bg-slate-300'}`} />
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                  Transfer Portal
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Manage player transfers & college applications
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`${isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>
                {stats.available} Available
              </Badge>
              <Badge className={`${isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>
                {stats.acceptedApps} Accepted
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-cyan-500/10' : 'bg-cyan-100'}`}>
                  <Users className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.available}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Available for Transfer</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
                  <Send className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.totalApps}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Applications Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-100'}`}>
                  <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.acceptedApps}</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Offers Received</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
                  <Sparkles className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>{stats.avgMatch}%</p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Avg Match Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Player List Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            {/* Search and Filter */}
            <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
              <CardContent className="p-4">
                <div className="relative mb-3">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <Input 
                    placeholder="Search players..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-9 ${isDark ? 'bg-slate-700/50 border-slate-600' : ''}`}
                  />
                </div>
                <div className="flex gap-2">
                  {(['all', 'available', 'unavailable'] as const).map(filter => (
                    <Button
                      key={filter}
                      variant={filterAvailable === filter ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterAvailable(filter)}
                      className={`flex-1 capitalize text-xs ${
                        filterAvailable === filter 
                          ? 'bg-cyan-500 hover:bg-cyan-600' 
                          : isDark ? 'bg-slate-700/50 border-slate-600' : ''
                      }`}
                    >
                      {filter}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Player Cards */}
            <div className="space-y-3">
              {filteredPlayers.map(player => {
                const completedReqs = player.requirements.filter(r => r.completed).length;
                const totalReqs = player.requirements.length;
                const reqPercent = Math.round((completedReqs / totalReqs) * 100);
                
                return (
                  <Card 
                    key={player.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlayer?.id === player.id
                        ? isDark 
                          ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/30' 
                          : 'bg-cyan-50 border-cyan-300 ring-1 ring-cyan-200'
                        : isDark 
                          ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800/80' 
                          : 'bg-white/90 border-slate-200/50 hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={player.avatarUrl} />
                            <AvatarFallback className={`text-sm font-medium ${isDark ? 'bg-slate-700 text-white' : 'bg-cyan-100 text-cyan-700'}`}>
                              {player.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {player.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{player.position}</Badge>
                              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                GPA: {player.gpa.toFixed(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div onClick={(e) => { e.stopPropagation(); toggleAvailability(player.id); }}>
                          <GlassToggle
                            checked={player.isAvailable}
                            onChange={() => toggleAvailability(player.id)}
                            size="sm"
                            variant={isDark ? 'dark' : 'default'}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            Requirements: {completedReqs}/{totalReqs}
                          </span>
                          <span className={`font-medium ${reqPercent === 100 ? 'text-emerald-500' : isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {reqPercent}%
                          </span>
                        </div>
                        <GlassProgressBar 
                          value={reqPercent}
                          size="sm"
                          variant={isDark ? 'glass' : 'default'}
                          ratingLevel={reqPercent === 100 ? 'elite' : reqPercent >= 70 ? 'good' : 'developing'}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1">
                          {player.eligibilityStatus === 'at_risk' && (
                            <Badge className="bg-red-500/20 text-red-400 text-[10px]">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              At Risk
                            </Badge>
                          )}
                          {player.applications.filter(a => a.status === 'accepted').length > 0 && (
                            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              {player.applications.filter(a => a.status === 'accepted').length} Offer{player.applications.filter(a => a.status === 'accepted').length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                        <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {player.collegeMatches.length} matches
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="lg:col-span-8">
            {selectedPlayer ? (
              <div className="space-y-6">
                {/* Player Header */}
                <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={selectedPlayer.avatarUrl} />
                          <AvatarFallback className={`text-xl font-bold ${isDark ? 'bg-slate-700 text-white' : 'bg-cyan-100 text-cyan-700'}`}>
                            {selectedPlayer.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                              {selectedPlayer.name}
                            </h2>
                            {selectedPlayer.isAvailable ? (
                              <Badge className="bg-emerald-500/20 text-emerald-400">Available</Badge>
                            ) : (
                              <Badge className="bg-slate-500/20 text-slate-400">Not Available</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline">{selectedPlayer.position}</Badge>
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              GPA: <strong className={isDark ? 'text-white' : 'text-slate-700'}>{selectedPlayer.gpa.toFixed(2)}</strong>
                            </span>
                            <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              Credits: <strong className={isDark ? 'text-white' : 'text-slate-700'}>{selectedPlayer.creditsCompleted}/{selectedPlayer.creditsRequired}</strong>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <SettingsToggle
                          checked={selectedPlayer.isAvailable}
                          onChange={() => toggleAvailability(selectedPlayer.id)}
                          title="Portal Availability"
                          variant={isDark ? 'dark' : 'default'}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                  {(['requirements', 'matches', 'applications'] as const).map(tab => (
                    <Button
                      key={tab}
                      variant="ghost"
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 capitalize ${
                        activeTab === tab
                          ? isDark 
                            ? 'bg-slate-700 text-white' 
                            : 'bg-white text-slate-800 shadow-sm'
                          : isDark
                            ? 'text-slate-400 hover:text-white'
                            : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab === 'requirements' && <CheckSquare className="w-4 h-4 mr-2" />}
                      {tab === 'matches' && <Sparkles className="w-4 h-4 mr-2" />}
                      {tab === 'applications' && <Send className="w-4 h-4 mr-2" />}
                      {tab}
                    </Button>
                  ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'requirements' && (
                  <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                          Transfer Requirements Checklist
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <CircularProgress 
                            value={Math.round((selectedPlayer.requirements.filter(r => r.completed).length / selectedPlayer.requirements.length) * 100)}
                            size={40}
                            strokeWidth={4}
                          />
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            {selectedPlayer.requirements.filter(r => r.completed).length}/{selectedPlayer.requirements.length}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {['academic', 'compliance', 'administrative', 'athletic'].map(category => {
                          const categoryReqs = selectedPlayer.requirements.filter(r => r.category === category);
                          if (categoryReqs.length === 0) return null;
                          
                          return (
                            <div key={category}>
                              <div className={`flex items-center gap-2 mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                <RequirementCategoryIcon category={category as TransferRequirement['category']} />
                                <span className="text-xs font-medium uppercase tracking-wide capitalize">{category}</span>
                              </div>
                              <div className="space-y-2">
                                {categoryReqs.map(req => (
                                  <div
                                    key={req.id}
                                    className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                                      req.completed
                                        ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
                                        : isDark ? 'bg-slate-700/30 hover:bg-slate-700/50' : 'bg-slate-50 hover:bg-slate-100'
                                    }`}
                                    onClick={() => toggleRequirement(selectedPlayer.id, req.id)}
                                  >
                                    <div className={`mt-0.5 ${req.completed ? 'text-emerald-500' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                      {req.completed ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                      ) : (
                                        <Circle className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <p className={`font-medium text-sm ${
                                        req.completed 
                                          ? isDark ? 'text-emerald-400 line-through' : 'text-emerald-700 line-through'
                                          : isDark ? 'text-white' : 'text-slate-800'
                                      }`}>
                                        {req.title}
                                      </p>
                                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {req.description}
                                      </p>
                                    </div>
                                    {req.dueDate && !req.completed && (
                                      <Badge className={`text-[10px] ${
                                        new Date(req.dueDate) < new Date()
                                          ? 'bg-red-500/20 text-red-400'
                                          : 'bg-amber-500/20 text-amber-400'
                                      }`}>
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(req.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </Badge>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'matches' && (
                  <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            College Matching Results
                          </CardTitle>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            AI-powered matches based on athletic ability, academics, and preferences
                          </p>
                        </div>
                        <Badge className={`${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'}`}>
                          <Sparkles className="w-3 h-3 mr-1" />
                          {selectedPlayer.collegeMatches.length} Matches
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {selectedPlayer.collegeMatches.map((match, idx) => (
                          <div
                            key={match.id}
                            className={`p-4 rounded-xl ${
                              idx === 0
                                ? isDark ? 'bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30' : 'bg-gradient-to-r from-cyan-50 to-emerald-50 border border-cyan-200'
                                : isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${
                                  match.matchScore >= 90
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : match.matchScore >= 80
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : match.matchScore >= 70
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-slate-500/20 text-slate-400'
                                }`}>
                                  {match.matchScore}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                      {match.collegeName}
                                    </h3>
                                    {idx === 0 && (
                                      <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                                        <Star className="w-3 h-3 mr-1" />
                                        Top Match
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[10px]">{match.division}</Badge>
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {match.conference} • {match.location}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge className={`${
                                match.interestLevel === 'high'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : match.interestLevel === 'medium'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : match.interestLevel === 'low'
                                  ? 'bg-slate-500/20 text-slate-400'
                                  : 'bg-slate-500/10 text-slate-500'
                              }`}>
                                {match.interestLevel} interest
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Athletic Fit</span>
                                  <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{match.athleticFit}%</span>
                                </div>
                                <GlassProgressBar 
                                  value={match.athleticFit}
                                  size="sm"
                                  variant={isDark ? 'glass' : 'default'}
                                  ratingLevel={match.athleticFit >= 90 ? 'elite' : match.athleticFit >= 80 ? 'excellent' : 'good'}
                                />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Academic Fit</span>
                                  <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{match.academicFit}%</span>
                                </div>
                                <GlassProgressBar 
                                  value={match.academicFit}
                                  size="sm"
                                  variant={isDark ? 'glass' : 'default'}
                                  ratingLevel={match.academicFit >= 90 ? 'elite' : match.academicFit >= 80 ? 'excellent' : 'good'}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-700/30">
                              {match.coachContact ? (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-[10px]">
                                      {match.coachContact.split(' ').slice(-1)[0][0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {match.coachContact}
                                  </span>
                                  {match.coachEmail && (
                                    <Button variant="ghost" size="sm" className="h-6 px-2">
                                      <Mail className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              ) : (
                                <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                  No contact info
                                </span>
                              )}
                              <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" className={`h-7 text-xs ${isDark ? 'border-slate-600' : ''}`}>
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  View Program
                                </Button>
                                <Button size="sm" className="h-7 text-xs bg-cyan-500 hover:bg-cyan-600">
                                  <Plus className="w-3 h-3 mr-1" />
                                  Apply
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {activeTab === 'applications' && (
                  <Card className={`${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className={`text-base ${isDark ? 'text-white' : 'text-slate-800'}`}>
                            Application Tracking
                          </CardTitle>
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Track status of college applications
                          </p>
                        </div>
                        <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                          <Plus className="w-4 h-4 mr-1" />
                          New Application
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedPlayer.applications.length === 0 ? (
                        <div className="text-center py-12">
                          <Send className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                          <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            No applications yet
                          </p>
                          <p className={`text-sm mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                            Start by applying to matched colleges
                          </p>
                          <Button className="mt-4 bg-cyan-500 hover:bg-cyan-600">
                            Browse Matches
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedPlayer.applications.map(app => (
                            <div
                              key={app.id}
                              className={`p-4 rounded-xl ${
                                app.status === 'accepted'
                                  ? isDark ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                                  : app.status === 'declined'
                                  ? isDark ? 'bg-red-500/10 border border-red-500/30' : 'bg-red-50 border border-red-200'
                                  : isDark ? 'bg-slate-700/30' : 'bg-slate-50'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                      {app.collegeName}
                                    </h3>
                                    <StatusBadge status={app.status} />
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px]">{app.division}</Badge>
                                    {app.submittedDate && (
                                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        Submitted {new Date(app.submittedDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>

                              {(app.nextStep || app.deadline) && (
                                <div className={`flex items-center gap-4 p-3 rounded-lg mb-3 ${
                                  isDark ? 'bg-slate-800/50' : 'bg-white'
                                }`}>
                                  {app.nextStep && (
                                    <div className="flex items-center gap-2">
                                      <Target className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                      <div>
                                        <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                          Next Step
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                          {app.nextStep}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {app.deadline && (
                                    <div className="flex items-center gap-2">
                                      <Clock className={`w-4 h-4 ${
                                        new Date(app.deadline) < new Date() ? 'text-red-400' : isDark ? 'text-amber-400' : 'text-amber-600'
                                      }`} />
                                      <div>
                                        <p className={`text-xs font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>
                                          Deadline
                                        </p>
                                        <p className={`text-xs ${
                                          new Date(app.deadline) < new Date() 
                                            ? 'text-red-400' 
                                            : isDark ? 'text-slate-400' : 'text-slate-500'
                                        }`}>
                                          {new Date(app.deadline).toLocaleDateString()}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                {app.contactName ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-[10px]">
                                        {app.contactName.split(' ').slice(-1)[0][0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                      {app.contactName}
                                    </span>
                                    {app.contactEmail && (
                                      <Button variant="ghost" size="sm" className="h-6 px-2">
                                        <Mail className="w-3 h-3" />
                                      </Button>
                                    )}
                                  </div>
                                ) : (
                                  <span className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                                    Updated {new Date(app.lastUpdated).toLocaleDateString()}
                                  </span>
                                )}
                                <div className="flex items-center gap-2">
                                  {app.status === 'draft' && (
                                    <Button size="sm" className="h-7 text-xs bg-cyan-500 hover:bg-cyan-600">
                                      <Send className="w-3 h-3 mr-1" />
                                      Submit
                                    </Button>
                                  )}
                                  {app.status === 'accepted' && (
                                    <Button size="sm" className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600">
                                      <Check className="w-3 h-3 mr-1" />
                                      Accept Offer
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" className={`h-7 text-xs ${isDark ? 'border-slate-600' : ''}`}>
                                    View Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className={`h-96 flex items-center justify-center ${isDark ? 'bg-slate-800/60 border-slate-700/50' : 'bg-white/90 border-slate-200/50'}`}>
                <div className="text-center">
                  <Users className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Select a player to view details
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
