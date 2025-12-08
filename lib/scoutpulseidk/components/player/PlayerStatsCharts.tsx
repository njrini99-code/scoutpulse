'use client';

import { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Zap,
  Activity,
  BarChart3,
  LineChartIcon,
} from 'lucide-react';
import type { PlayerGameSeriesPoint, PlayerStatsSummary } from '@/lib/api/player/getPlayerStatsSeries';

// ═══════════════════════════════════════════════════════════════════════════
// Position Benchmarks - D1 Average Standards
// ═══════════════════════════════════════════════════════════════════════════

export const POSITION_BENCHMARKS = {
  // Batting averages by position (D1 averages)
  batting: {
    'C': { avg: 0.275, hr: 5, rbi: 25, ops: 0.780 },
    '1B': { avg: 0.290, hr: 8, rbi: 35, ops: 0.850 },
    '2B': { avg: 0.285, hr: 3, rbi: 22, ops: 0.750 },
    'SS': { avg: 0.280, hr: 4, rbi: 24, ops: 0.760 },
    '3B': { avg: 0.285, hr: 6, rbi: 28, ops: 0.800 },
    'LF': { avg: 0.295, hr: 7, rbi: 32, ops: 0.830 },
    'CF': { avg: 0.290, hr: 5, rbi: 28, ops: 0.790 },
    'RF': { avg: 0.295, hr: 8, rbi: 34, ops: 0.840 },
    'DH': { avg: 0.300, hr: 10, rbi: 40, ops: 0.880 },
    'P': { avg: 0.200, hr: 1, rbi: 8, ops: 0.520 },
    'OF': { avg: 0.293, hr: 6, rbi: 31, ops: 0.820 },
    'IF': { avg: 0.283, hr: 5, rbi: 25, ops: 0.780 },
    'default': { avg: 0.280, hr: 5, rbi: 25, ops: 0.770 },
  },
  // Pitching benchmarks
  pitching: {
    'SP': { era: 3.50, kPerGame: 7.5, whip: 1.25, winPct: 0.55 },
    'RP': { era: 3.80, kPerGame: 8.0, whip: 1.30, saves: 8 },
    'CL': { era: 2.80, kPerGame: 9.0, whip: 1.10, saves: 15 },
    'default': { era: 3.60, kPerGame: 7.0, whip: 1.28, winPct: 0.50 },
  },
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface PlayerStatsChartsProps {
  series: PlayerGameSeriesPoint[];
  summary: PlayerStatsSummary | null;
  position?: string;
  dateRange: '7d' | '30d' | 'season';
}

interface StatComparisonProps {
  label: string;
  value: number;
  benchmark: number;
  unit?: string;
  higherIsBetter?: boolean;
  icon?: React.ReactNode;
}

interface ProgressRingProps {
  value: number;
  max: number;
  label: string;
  color?: string;
  size?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

type BattingBenchmark = { avg: number; hr: number; rbi: number; ops: number };

function getPositionBenchmark(position?: string): BattingBenchmark {
  if (!position) return POSITION_BENCHMARKS.batting.default;
  const normalized = position.toUpperCase();
  const benchmark = POSITION_BENCHMARKS.batting[normalized as keyof typeof POSITION_BENCHMARKS.batting];
  return benchmark || POSITION_BENCHMARKS.batting.default;
}

function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 3) return 'stable';
  const recent = data.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const earlier = data.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
  const diff = recent - earlier;
  if (diff > 0.01) return 'up';
  if (diff < -0.01) return 'down';
  return 'stable';
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export function PlayerStatsCharts({ 
  series, 
  summary, 
  position = 'default',
  dateRange,
}: PlayerStatsChartsProps) {
  const benchmark = getPositionBenchmark(position);

  // Process data for charts
  const chartData = useMemo(() => {
    return series.map((point, index) => ({
      name: formatDate(point.date),
      index: index + 1,
      avg: point.battingAvg ? Number((point.battingAvg).toFixed(3)) : 0,
      hits: point.hits || 0,
      atBats: point.atBats || 0,
      benchmark: benchmark.avg,
    }));
  }, [series, benchmark]);

  // Calculate rolling average for trend line
  const trendData = useMemo(() => {
    if (chartData.length < 3) return chartData;
    
    return chartData.map((point, index) => {
      if (index < 2) return { ...point, rollingAvg: point.avg };
      const window = chartData.slice(index - 2, index + 1);
      const rollingAvg = window.reduce((sum, p) => sum + p.avg, 0) / 3;
      return { ...point, rollingAvg: Number(rollingAvg.toFixed(3)) };
    });
  }, [chartData]);

  // Calculate trend direction
  const avgTrend = useMemo(() => {
    const avgs = series.map(s => s.battingAvg || 0);
    return calculateTrend(avgs);
  }, [series]);

  if (!summary || series.length === 0) {
    return (
      <div className="text-center py-12">
        <Activity className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-slate-500">No game data available for charts</p>
        <p className="text-sm text-slate-400 mt-1">Play some games to see your performance trends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Trend Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-100">
            <LineChartIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Performance Trends</h3>
            <p className="text-xs text-slate-500">
              {chartData.length} games • {dateRange === 'season' ? 'Full Season' : `Last ${dateRange}`}
            </p>
          </div>
        </div>
        <TrendBadge trend={avgTrend} />
      </div>

      {/* Batting Average Trend Chart */}
      <GlassChartCard title="Batting Average Over Time" icon={<TrendingUp className="w-4 h-4" />}>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              domain={[0, 0.5]}
              tickFormatter={(v) => v.toFixed(3)}
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine 
              y={benchmark.avg} 
              stroke="#8b5cf6" 
              strokeDasharray="5 5" 
              label={{ value: `D1 Avg (${benchmark.avg})`, position: 'right', fontSize: 10, fill: '#8b5cf6' }}
            />
            <Area 
              type="monotone" 
              dataKey="avg" 
              stroke="#10b981" 
              strokeWidth={2}
              fill="url(#avgGradient)" 
              name="Batting Avg"
            />
            <Line 
              type="monotone" 
              dataKey="rollingAvg" 
              stroke="#0ea5e9" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="3-Game Rolling Avg"
            />
          </AreaChart>
        </ResponsiveContainer>
      </GlassChartCard>

      {/* Hits Per Game Bar Chart */}
      <GlassChartCard title="Hits Per Game" icon={<BarChart3 className="w-4 h-4" />}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              width={30}
            />
            <Tooltip content={<HitsTooltip />} />
            <Bar 
              dataKey="hits" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              name="Hits"
            />
          </BarChart>
        </ResponsiveContainer>
      </GlassChartCard>

      {/* Position Comparison */}
      <PositionComparison 
        summary={summary} 
        benchmark={benchmark} 
        position={position}
      />

      {/* Progress Indicators */}
      <ProgressIndicators summary={summary} benchmark={benchmark} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════════════════════

function GlassChartCard({ 
  children, 
  title, 
  icon 
}: { 
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-emerald-50/30 pointer-events-none" />
      
      <div className="relative p-5">
        <div className="flex items-center gap-2 mb-4">
          {icon && <span className="text-emerald-600">{icon}</span>}
          <h4 className="text-sm font-semibold text-slate-700">{title}</h4>
        </div>
        {children}
      </div>
    </div>
  );
}

function TrendBadge({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
        <TrendingUp className="w-3.5 h-3.5" />
        Trending Up
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
        <TrendingDown className="w-3.5 h-3.5" />
        Needs Work
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
      <Activity className="w-3.5 h-3.5" />
      Stable
    </span>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  
  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-xl border border-slate-200 shadow-xl p-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2 text-xs">
          <span 
            className="w-2 h-2 rounded-full" 
            style={{ backgroundColor: entry.color }} 
          />
          <span className="text-slate-600">{entry.name}:</span>
          <span className="font-semibold text-slate-800">
            {typeof entry.value === 'number' ? entry.value.toFixed(3) : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function HitsTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  
  return (
    <div className="bg-white/95 backdrop-blur-lg rounded-xl border border-slate-200 shadow-xl p-3">
      <p className="text-xs font-semibold text-slate-700 mb-2">{label}</p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Hits:</span>
          <span className="font-semibold text-emerald-600">{data.hits}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">At Bats:</span>
          <span className="font-medium text-slate-700">{data.atBats}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Avg:</span>
          <span className="font-semibold text-slate-800">{data.avg.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

function PositionComparison({ 
  summary, 
  benchmark,
  position,
}: { 
  summary: PlayerStatsSummary;
  benchmark: BattingBenchmark;
  position: string;
}) {
  // Radar chart data
  const radarData = [
    { 
      subject: 'Batting Avg', 
      player: Math.min((summary.battingAvg / benchmark.avg) * 100, 150),
      benchmark: 100,
    },
    { 
      subject: 'Power (HR)', 
      player: Math.min((summary.homeRuns / benchmark.hr) * 100, 150),
      benchmark: 100,
    },
    { 
      subject: 'RBI/Game', 
      player: summary.rbisPerGame > 0 
        ? Math.min((summary.rbisPerGame / (benchmark.rbi / 40)) * 100, 150)
        : 0,
      benchmark: 100,
    },
    { 
      subject: 'Consistency', 
      player: summary.gamesPlayed >= 10 ? 90 : summary.gamesPlayed * 9,
      benchmark: 100,
    },
  ];

  return (
    <GlassChartCard 
      title={`vs D1 ${position || 'Position'} Average`} 
      icon={<Target className="w-4 h-4" />}
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fontSize: 11, fill: '#64748b' }}
              />
              <PolarRadiusAxis 
                angle={30} 
                domain={[0, 150]} 
                tick={{ fontSize: 9, fill: '#94a3b8' }}
              />
              <Radar
                name="D1 Average"
                dataKey="benchmark"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.1}
                strokeDasharray="5 5"
              />
              <Radar
                name="Your Stats"
                dataKey="player"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Legend 
                wrapperStyle={{ fontSize: 11 }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Comparison Stats */}
        <div className="space-y-3">
          <StatComparisonBar
            label="Batting Average"
            value={summary.battingAvg}
            benchmark={benchmark.avg}
            format={(v) => v.toFixed(3)}
            higherIsBetter
          />
          <StatComparisonBar
            label="Home Runs"
            value={summary.homeRuns}
            benchmark={benchmark.hr}
            format={(v) => v.toString()}
            higherIsBetter
          />
          <StatComparisonBar
            label="RBI/Game"
            value={summary.rbisPerGame}
            benchmark={benchmark.rbi / 40}
            format={(v) => v.toFixed(1)}
            higherIsBetter
          />
          {summary.era > 0 && (
            <StatComparisonBar
              label="ERA"
              value={summary.era}
              benchmark={POSITION_BENCHMARKS.pitching.default.era}
              format={(v) => v.toFixed(2)}
              higherIsBetter={false}
            />
          )}
        </div>
      </div>
    </GlassChartCard>
  );
}

function StatComparisonBar({
  label,
  value,
  benchmark,
  format,
  higherIsBetter = true,
}: {
  label: string;
  value: number;
  benchmark: number;
  format: (v: number) => string;
  higherIsBetter?: boolean;
}) {
  const percentage = Math.min((value / benchmark) * 100, 150);
  const isAbove = higherIsBetter ? value >= benchmark : value <= benchmark;

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-slate-600">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isAbove ? 'text-emerald-600' : 'text-slate-700'}`}>
            {format(value)}
          </span>
          <span className="text-slate-400">/</span>
          <span className="text-purple-600 text-[11px]">{format(benchmark)}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden relative">
        {/* Benchmark line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-purple-500 z-10"
          style={{ left: '66.66%' }}
        />
        {/* Player value */}
        <div 
          className={`h-full rounded-full transition-all duration-500 ${
            isAbove 
              ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' 
              : 'bg-gradient-to-r from-amber-400 to-amber-500'
          }`}
          style={{ width: `${Math.min(percentage * 0.6666, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ProgressIndicators({ 
  summary, 
  benchmark 
}: { 
  summary: PlayerStatsSummary;
  benchmark: BattingBenchmark;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <GlassProgressCard
        label="Batting Avg"
        value={summary.battingAvg}
        target={benchmark.avg}
        format={(v) => v.toFixed(3)}
        color="emerald"
        icon={<Zap className="w-4 h-4" />}
      />
      <GlassProgressCard
        label="Home Runs"
        value={summary.homeRuns}
        target={benchmark.hr}
        format={(v) => v.toString()}
        color="purple"
        icon={<Award className="w-4 h-4" />}
      />
      <GlassProgressCard
        label="Games Played"
        value={summary.gamesPlayed}
        target={40}
        format={(v) => v.toString()}
        color="blue"
        icon={<Activity className="w-4 h-4" />}
      />
      <GlassProgressCard
        label="RBI/Game"
        value={summary.rbisPerGame}
        target={benchmark.rbi / 40}
        format={(v) => v.toFixed(1)}
        color="amber"
        icon={<Target className="w-4 h-4" />}
      />
    </div>
  );
}

function GlassProgressCard({
  label,
  value,
  target,
  format,
  color,
  icon,
}: {
  label: string;
  value: number;
  target: number;
  format: (v: number) => string;
  color: 'emerald' | 'purple' | 'blue' | 'amber';
  icon: React.ReactNode;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  const isComplete = value >= target;

  const colorClasses = {
    emerald: {
      bg: 'bg-emerald-50',
      ring: 'stroke-emerald-500',
      icon: 'text-emerald-600 bg-emerald-100',
      text: 'text-emerald-600',
    },
    purple: {
      bg: 'bg-purple-50',
      ring: 'stroke-purple-500',
      icon: 'text-purple-600 bg-purple-100',
      text: 'text-purple-600',
    },
    blue: {
      bg: 'bg-blue-50',
      ring: 'stroke-blue-500',
      icon: 'text-blue-600 bg-blue-100',
      text: 'text-blue-600',
    },
    amber: {
      bg: 'bg-amber-50',
      ring: 'stroke-amber-500',
      icon: 'text-amber-600 bg-amber-100',
      text: 'text-amber-600',
    },
  };

  const classes = colorClasses[color];
  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`relative ${classes.bg} backdrop-blur-xl rounded-2xl border border-white/60 p-4 overflow-hidden`}>
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-transparent pointer-events-none" />
      
      <div className="relative">
        {/* Icon */}
        <div className={`w-8 h-8 rounded-xl ${classes.icon} flex items-center justify-center mb-3`}>
          {icon}
        </div>

        {/* Progress Ring */}
        <div className="relative w-20 h-20 mx-auto mb-3">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-slate-200"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              strokeWidth="6"
              strokeLinecap="round"
              className={classes.ring}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 0.5s ease-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${classes.text}`}>
              {Math.round(percentage)}%
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-xl font-bold text-slate-800">{format(value)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Target: {format(target)}
          </p>
        </div>

        {/* Completion badge */}
        {isComplete && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerStatsCharts;
