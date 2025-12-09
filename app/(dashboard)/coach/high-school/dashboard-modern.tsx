'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  Calendar,
  Eye,
  TrendingUp,
  ChevronRight,
  Trophy,
  Target,
  Activity,
  BarChart3,
} from 'lucide-react';

/**
 * Modern Glassmorphism Dashboard
 * Based on ElectroDash design from Dribbble
 *
 * Features:
 * - Heavy glassmorphism effects
 * - Dark gradient background
 * - Modern data visualizations
 * - Smooth animations
 */

export default function ModernDashboard() {
  // Mock data - replace with real queries
  const stats = {
    totalPlayers: 28,
    seniors: 8,
    collegeViews: 156,
    upcomingGames: 5,
  };

  const recentGames = [
    { id: 1, opponent: 'Central HS', date: '08/27/2025', result: 'W 5-3', type: 'Home' },
    { id: 2, opponent: 'East Valley', date: '08/25/2025', result: 'W 8-2', type: 'Away' },
    { id: 3, opponent: 'North Star', date: '08/22/2025', result: 'L 3-4', type: 'Home' },
  ];

  const topPlayers = [
    { name: 'Marcus Johnson', position: 'SS', stat: '.425 BA', gradYear: 2025 },
    { name: 'Jake Williams', position: 'RHP', stat: '1.89 ERA', gradYear: 2025 },
    { name: 'Tyler Smith', position: 'C', stat: '8 HR', gradYear: 2026 },
  ];

  const collegeInterest = [
    { school: 'Georgia Tech', players: 3, level: 'D1' },
    { school: 'Clemson', players: 2, level: 'D1' },
    { school: 'Wake Forest', players: 2, level: 'D1' },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 -z-10" />

      {/* Animated Background Orbs */}
      <div className="fixed top-1/4 -left-48 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse -z-10" />
      <div className="fixed bottom-1/4 -right-48 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000 -z-10" />

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Dashboard</h1>
              <p className="text-emerald-200/70">Lincoln High School Baseball</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-xl"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Check Schedule
              </Button>
              <Button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/30">
                <Target className="w-4 h-4 mr-2" />
                View Roster
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

          {/* Stat Card 1 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <Card className="relative bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Users className="w-6 h-6 text-emerald-400" />
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +5
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-white mb-1">{stats.totalPlayers}</div>
                <div className="text-sm text-white/60 uppercase tracking-wider">Total Players</div>
              </CardContent>
            </Card>
          </div>

          {/* Stat Card 2 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <Card className="relative bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Trophy className="w-6 h-6 text-blue-400" />
                  </div>
                  <Badge className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                    Class of 2025
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-white mb-1">{stats.seniors}</div>
                <div className="text-sm text-white/60 uppercase tracking-wider">Seniors</div>
              </CardContent>
            </Card>
          </div>

          {/* Stat Card 3 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <Card className="relative bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <Eye className="w-6 h-6 text-orange-400" />
                  </div>
                  <Badge className="bg-orange-500/20 text-orange-300 border-orange-400/30">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +23%
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-white mb-1">{stats.collegeViews}</div>
                <div className="text-sm text-white/60 uppercase tracking-wider">College Views</div>
              </CardContent>
            </Card>
          </div>

          {/* Stat Card 4 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <Card className="relative bg-white/10 backdrop-blur-2xl border-white/20 hover:bg-white/15 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Calendar className="w-6 h-6 text-purple-400" />
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30">
                    Next 7 days
                  </Badge>
                </div>
                <div className="text-4xl font-bold text-white mb-1">{stats.upcomingGames}</div>
                <div className="text-sm text-white/60 uppercase tracking-wider">Upcoming Games</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column - 2 sections */}
          <div className="lg:col-span-2 space-y-6">

            {/* Recent Games */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl blur-xl" />
              <Card className="relative bg-white/10 backdrop-blur-2xl border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">Recent Games</h3>
                      <p className="text-sm text-white/60">Last 3 matches</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-300 hover:text-emerald-200 hover:bg-white/10"
                    >
                      View All
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {recentGames.map((game, index) => (
                      <div
                        key={game.id}
                        className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10"
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-white/60 font-mono text-sm">{index + 1}</div>
                          <div>
                            <div className="text-white font-semibold">{game.opponent}</div>
                            <div className="text-white/50 text-sm">{game.date}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${
                            game.result.startsWith('W')
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                              : 'bg-red-500/20 text-red-300 border-red-400/30'
                          }`}>
                            {game.result}
                          </Badge>
                          <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20">
                            {game.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* College Interest Chart */}
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl" />
              <Card className="relative bg-white/10 backdrop-blur-2xl border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">College Interest</h3>
                      <p className="text-sm text-white/60">Top recruiting programs</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-300 hover:text-blue-200 hover:bg-white/10"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Full Report
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {collegeInterest.map((school, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-blue-500/20 flex items-center justify-center">
                              <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{school.school}</div>
                              <div className="text-white/50 text-sm">{school.level}</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-white font-semibold">{school.players}</div>
                            <div className="text-white/50 text-xs">players</div>
                          </div>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full"
                            style={{ width: `${(school.players / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Top Players */}
          <div className="space-y-6">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl blur-xl" />
              <Card className="relative bg-white/10 backdrop-blur-2xl border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-1">Top Performers</h3>
                      <p className="text-sm text-white/60">Season leaders</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {topPlayers.map((player, index) => (
                      <div
                        key={index}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all duration-200 border border-white/10 cursor-pointer group/card"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                            index === 1 ? 'bg-slate-400/20 text-slate-300' :
                            'bg-orange-500/20 text-orange-300'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="text-white font-semibold group-hover/card:text-emerald-300 transition-colors">
                              {player.name}
                            </div>
                            <div className="text-white/50 text-sm">{player.position}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                            {player.stat}
                          </Badge>
                          <Badge variant="outline" className="bg-white/5 text-white/70 border-white/20 text-xs">
                            Class of {player.gradYear}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    className="w-full mt-6 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/30"
                  >
                    View All Players
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
