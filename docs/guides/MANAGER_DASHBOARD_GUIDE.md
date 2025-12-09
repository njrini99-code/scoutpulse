
---

### 2. Manager Role System

**Setting Manager Status**
```typescript
// Promote user to manager
await supabase
  .from('user_settings')
  .update({ is_manager: true })
  .eq('user_id', userId);

// Check if user is manager
const { data: settings } = await supabase
  .from('user_settings')
  .select('is_manager')
  .eq('user_id', userId)
  .single();

if (settings.is_manager) {
  // Show manager dashboard
}
```

**RLS Policies:**
- Managers automatically see all team member data via team_code
- Team members cannot see manager-only data
- Cross-team data is isolated

---

### 3. Team Leaderboard

**Get Complete Leaderboard**
```typescript
const { data: leaderboard } = await supabase.rpc('get_team_leaderboard', {
  p_team_code: 'TEMPO-A4F7B2E9',
  p_period_start: '2025-01-01',
  p_period_end: '2025-03-31'
});

// Returns array of:
[
  {
    user_id: 'uuid',
    user_email: 'john@example.com',
    osv_count: 45,
    np_count: 12,
    close_count: 4,
    total_revenue: 5200,
    conversion_rate: 26.7,
    close_ratio: 33.3,
    pace_score: 87.5,
    rank: 1
  },
  // ... more reps ranked by pace_score
]
```

**Display Leaderboard in UI:**
```typescript
const LeaderboardView = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('weekly');

  const loadLeaderboard = async () => {
    const dates = getPeriodDates(period); // helper function
    const { data } = await supabase.rpc('get_team_leaderboard', {
      p_team_code: teamCode,
      p_period_start: dates.start,
      p_period_end: dates.end
    });
    setLeaderboard(data);
  };

  return (
    <div>
      <select onChange={(e) => setPeriod(e.target.value)}>
        <option value="weekly">This Week</option>
        <option value="quarterly">This Quarter</option>
        <option value="yearly">This Year</option>
      </select>

      {leaderboard.map((rep, idx) => (
        <div key={rep.user_id}>
          <span>#{rep.rank}</span>
          <span>{rep.user_email}</span>
          <span>{rep.osv_count} OSVs</span>
          <span>{rep.conversion_rate}% conversion</span>
          <span>Score: {rep.pace_score}</span>
        </div>
      ))}
    </div>
  );
};
```

---

### 4. Top & Bottom Performers

**Identify Performers for Coaching**
```typescript
const { data: performers } = await supabase.rpc('get_team_performers', {
  p_team_code: 'TEMPO-A4F7B2E9',
  p_period_start: '2025-01-01',
  p_period_end: '2025-03-31',
  p_limit: 3  // Top 3 and bottom 3
});

const topPerformers = performers.filter(p => p.performer_type === 'top');
const bottomPerformers = performers.filter(p => p.performer_type === 'bottom');

// Display in dashboard
console.log('Top 3 Reps:', topPerformers);
console.log('Need Coaching:', bottomPerformers);
```

**UI Component:**
```typescript
const PerformersWidget = ({ teamCode }) => {
  const [performers, setPerformers] = useState({ top: [], bottom: [] });

  useEffect(() => {
    loadPerformers();
  }, [teamCode]);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-green-50 p-4">
        <h3>Top Performers</h3>
        {performers.top.map(rep => (
          <div key={rep.user_id}>
            {rep.user_email} - Score: {rep.pace_score}
          </div>
        ))}
      </div>

      <div className="bg-orange-50 p-4">
        <h3>Needs Coaching</h3>
        {performers.bottom.map(rep => (
          <div key={rep.user_id}>
            {rep.user_email} - Score: {rep.pace_score}
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

### 5. Team Health Score

**Calculate Team Health (0-100)**

The health score weighs:
- 40%: Percentage of reps on pace (hitting weekly targets)
- 30%: Team OSV-to-NP conversion vs target (25%)
- 30%: Team close ratio vs target (40%)

```typescript
const { data: healthScore } = await supabase.rpc('calculate_team_health_score', {
  p_team_code: 'TEMPO-A4F7B2E9',
  p_period_start: '2025-01-01',
  p_period_end: '2025-03-31'
});

console.log(`Team Health: ${healthScore}/100`);

// Interpret score
const getHealthStatus = (score) => {
  if (score >= 80) return { status: 'Excellent', color: 'green' };
  if (score >= 60) return { status: 'Good', color: 'blue' };
  if (score >= 40) return { status: 'Fair', color: 'yellow' };
  return { status: 'Needs Attention', color: 'red' };
};
```

**Health Score Dashboard Widget:**
```typescript
const TeamHealthWidget = ({ teamCode }) => {
  const [health, setHealth] = useState(0);
  const status = getHealthStatus(health);

  return (
    <div className={`p-6 bg-${status.color}-50`}>
      <h2>Team Health Score</h2>
      <div className="text-5xl font-bold">{health}/100</div>
      <div className={`text-${status.color}-700`}>{status.status}</div>
      <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
        <div
          className={`bg-${status.color}-500 h-4 rounded-full`}
          style={{ width: `${health}%` }}
        />
      </div>
    </div>
  );
};
```

---

### 6. AI Team Summary

**Generate Team Performance Summary**

The Edge Function `ai-team-summary` analyzes:
- Team metrics vs goals
- Top and bottom performers
- Conversion patterns
- Coaching priorities
- Action items for manager

```typescript
const generateTeamSummary = async () => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/ai-team-summary`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        period_type: 'weekly',
        // Optional: year, quarter for specific periods
      })
    }
  );

  const { summary, leaderboard, team_metrics, health_score } = await response.json();

  return summary;
};
```

**Example AI Response:**
```json
{
  "summary": {
    "summary_text": "Your team of 8 reps completed 96 OSVs this week with a 22% conversion to NPs. Top performers are maintaining excellent activity levels, but 3 reps are falling behind pace. Team health score is 67/100, indicating room for improvement in conversion rates.",
    "team_health_score": 67,
    "team_strengths": [
      "High overall activity - 96 OSVs completed",
      "Top 3 reps exceeding goals by 20%+",
      "Strong close ratio at 38% (above target)"
    ],
    "team_improvements": [
      "3 reps below 50% of weekly OSV target",
      "Team conversion rate at 22% vs 25% target",
      "Bottom performers need activity coaching"
    ],
    "coaching_priorities": [
      "Schedule 1-on-1s with bottom 3 reps to address activity gaps",
      "Team training on qualification to improve OSV-to-NP conversion",
      "Recognize top performers publicly to motivate team"
    ],
    "action_items": [
      "Review bottom performers' territory and route planning",
      "Implement daily check-ins for reps below pace",
      "Share best practices from top performers in team meeting"
    ],
    "kpi_insights": {
      "osv_trend": "stable",
      "conversion_bottleneck": "qualification",
      "top_performer_pattern": "high activity + better qualification"
    }
  },
  "leaderboard": [...],
  "team_metrics": {
    "total_osvs": 96,
    "total_nps": 21,
    "total_closes": 8,
    "total_revenue": 10800,
    "rep_count": 8
  },
  "health_score": 67
}
```

---

### 7. Manager Dashboard Components

#### Team Overview Panel
```typescript
const TeamOverview = ({ teamCode }) => {
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('weekly');

  const loadTeamMetrics = async () => {
    const { data: leaderboard } = await supabase.rpc('get_team_leaderboard', {
      p_team_code: teamCode,
      p_period_start: startDate,
      p_period_end: endDate
    });

    const aggregated = leaderboard.reduce((acc, rep) => ({
      total_osvs: acc.total_osvs + rep.osv_count,
      total_nps: acc.total_nps + rep.np_count,
      total_closes: acc.total_closes + rep.close_count,
      total_revenue: acc.total_revenue + rep.total_revenue,
      rep_count: acc.rep_count + 1,
    }), { total_osvs: 0, total_nps: 0, total_closes: 0, total_revenue: 0, rep_count: 0 });

    const avgPerRep = {
      osvs: (aggregated.total_osvs / aggregated.rep_count).toFixed(1),
      nps: (aggregated.total_nps / aggregated.rep_count).toFixed(1),
      closes: (aggregated.total_closes / aggregated.rep_count).toFixed(1),
      revenue: (aggregated.total_revenue / aggregated.rep_count).toFixed(2),
    };

    setMetrics({ aggregated, avgPerRep });
  };

  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        label="Total OSVs"
        value={metrics?.aggregated.total_osvs}
        subtitle={`Avg: ${metrics?.avgPerRep.osvs} per rep`}
      />
      <MetricCard
        label="Total NPs"
        value={metrics?.aggregated.total_nps}
        subtitle={`Avg: ${metrics?.avgPerRep.nps} per rep`}
      />
      <MetricCard
        label="Total Closes"
        value={metrics?.aggregated.total_closes}
        subtitle={`Avg: ${metrics?.avgPerRep.closes} per rep`}
      />
      <MetricCard
        label="Total Revenue"
        value={`$${metrics?.aggregated.total_revenue.toLocaleString()}`}
        subtitle={`Avg: $${metrics?.avgPerRep.revenue} per rep`}
      />
    </div>
  );
};
```

#### Rep Detail View
```typescript
const RepDetailView = ({ repId, teamCode }) => {
  const [repData, setRepData] = useState(null);
  const [aiSummary, setAiSummary] = useState(null);

  const loadRepDetails = async () => {
    // Get rep's metrics
    const { data: leaderboard } = await supabase.rpc('get_team_leaderboard', {
      p_team_code: teamCode,
      p_period_start: startDate,
      p_period_end: endDate
    });

    const rep = leaderboard.find(r => r.user_id === repId);
    setRepData(rep);

    // Get rep's AI summary
    const { data: summary } = await supabase
      .from('ai_performance_summaries')
      .select('*')
      .eq('user_id', repId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setAiSummary(summary);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2>{repData?.user_email}</h2>
        <div className="text-2xl font-bold">Rank #{repData?.rank}</div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <div className="text-sm text-gray-600">OSVs</div>
            <div className="text-xl font-semibold">{repData?.osv_count}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Conversion</div>
            <div className="text-xl font-semibold">{repData?.conversion_rate}%</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Closes</div>
            <div className="text-xl font-semibold">{repData?.close_count}</div>
          </div>
        </div>
      </div>

      {aiSummary && (
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold mb-2">AI Performance Insights</h3>
          <p className="mb-4">{aiSummary.summary_text}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700">Strengths</h4>
              <ul className="list-disc list-inside">
                {aiSummary.top_strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-orange-700">Areas to Improve</h4>
              <ul className="list-disc list-inside">
                {aiSummary.top_improvements.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

#### AI Insights Feed
```typescript
const AIInsightsFeed = ({ managerId, teamCode }) => {
  const [summaries, setSummaries] = useState([]);

  const loadInsights = async () => {
    const { data } = await supabase
      .from('ai_team_summaries')
      .select('*')
      .eq('manager_id', managerId)
      .eq('team_code', teamCode)
      .order('created_at', { ascending: false })
      .limit(5);

    setSummaries(data);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Recent AI Insights</h2>

      {summaries.map(summary => (
        <div key={summary.id} className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-start mb-2">
            <span className="text-sm text-gray-600">
              {summary.period_type} | {summary.period_start}
            </span>
            <span className={`px-2 py-1 rounded text-sm ${
              summary.team_health_score >= 80 ? 'bg-green-100 text-green-700' :
              summary.team_health_score >= 60 ? 'bg-blue-100 text-blue-700' :
              'bg-orange-100 text-orange-700'
            }`}>
              Health: {summary.team_health_score}/100
            </span>
          </div>

          <p className="mb-3">{summary.summary_text}</p>

          <div className="border-t pt-3">
            <h4 className="font-medium mb-2">Coaching Priorities:</h4>
            <ol className="list-decimal list-inside space-y-1">
              {summary.coaching_priorities.map((priority, i) => (
                <li key={i} className="text-sm">{priority}</li>
              ))}
            </ol>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Database Functions Reference

### `generate_team_code()`
- **Returns:** Unique team code (e.g., "TEMPO-A4F7B2E9")
- **Usage:** Called when manager creates a team

### `calculate_team_health_score(team_code, start_date, end_date)`
- **Returns:** Numeric score 0-100
- **Calculates:** Activity pace + conversion rates + close ratios

### `get_team_leaderboard(team_code, start_date, end_date)`
- **Returns:** Array of rep performance records, ranked
- **Includes:** OSVs, NPs, closes, revenue, conversion rates, pace score

### `get_team_performers(team_code, start_date, end_date, limit)`
- **Returns:** Top N and bottom N performers
- **Usage:** Identify reps who need recognition or coaching

---

## Integration Examples

### Complete Manager Dashboard Flow
```typescript
const ManagerDashboard = () => {
  const { user } = useAuth();
  const [teamCode, setTeamCode] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [period]);

  const loadDashboard = async () => {
    // Get user's team code
    const { data: settings } = await supabase
      .from('user_settings')
      .select('team_code, is_manager')
      .eq('user_id', user.id)
      .single();

    if (!settings.is_manager) {
      // Redirect to rep view
      return;
    }

    setTeamCode(settings.team_code);

    const dates = getPeriodDates(period);

    // Load all dashboard data in parallel
    const [leaderboard, healthScore, performers, aiSummary] = await Promise.all([
      supabase.rpc('get_team_leaderboard', {
        p_team_code: settings.team_code,
        p_period_start: dates.start,
        p_period_end: dates.end
      }),
      supabase.rpc('calculate_team_health_score', {
        p_team_code: settings.team_code,
        p_period_start: dates.start,
        p_period_end: dates.end
      }),
      supabase.rpc('get_team_performers', {
        p_team_code: settings.team_code,
        p_period_start: dates.start,
        p_period_end: dates.end,
        p_limit: 3
      }),
      supabase
        .from('ai_team_summaries')
        .select('*')
        .eq('team_code', settings.team_code)
        .eq('period_type', period)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    ]);

    setDashboardData({
      leaderboard: leaderboard.data,
      healthScore: healthScore.data,
      topPerformers: performers.data?.filter(p => p.performer_type === 'top'),
      bottomPerformers: performers.data?.filter(p => p.performer_type === 'bottom'),
      aiSummary: aiSummary.data
    });
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1>Team Dashboard</h1>
        <p>Team Code: {teamCode}</p>
        <PeriodSelector value={period} onChange={setPeriod} />
      </header>

      <TeamHealthWidget score={dashboardData?.healthScore} />

      <TeamOverview metrics={dashboardData?.leaderboard} />

      <div className="grid grid-cols-2 gap-6">
        <PerformersWidget
          top={dashboardData?.topPerformers}
          bottom={dashboardData?.bottomPerformers}
        />

        <AIInsightsWidget summary={dashboardData?.aiSummary} />
      </div>

      <LeaderboardTable data={dashboardData?.leaderboard} />
    </div>
  );
};
```

### Export Reports (Future Enhancement)
```typescript
const exportTeamReport = async (teamCode, period) => {
  const dates = getPeriodDates(period);

  // Get all data
  const { data: leaderboard } = await supabase.rpc('get_team_leaderboard', {
    p_team_code: teamCode,
    p_period_start: dates.start,
    p_period_end: dates.end
  });

  const { data: summary } = await supabase
    .from('ai_team_summaries')
    .select('*')
    .eq('team_code', teamCode)
    .eq('period_type', period)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Generate CSV
  const csv = generateCSV(leaderboard, summary);
  downloadFile(csv, `team-report-${period}.csv`);

  // Or generate PDF
  const pdf = generatePDF(leaderboard, summary);
  downloadFile(pdf, `team-report-${period}.pdf`);
};
```

---

## Security & RLS

All manager features respect RLS policies:

✅ Managers can only view their team's data (via team_code match)
✅ Reps cannot see other teams' data
✅ Team codes provide secure team boundaries
✅ is_manager flag controls access to manager functions
✅ Service role used for system functions only

---

## Testing Checklist

- [ ] Generate team code and create team
- [ ] Set user as manager
- [ ] Add reps to team via team code
- [ ] View team leaderboard
- [ ] Calculate team health score
- [ ] Identify top/bottom performers
- [ ] Generate AI team summary
- [ ] Verify manager can see all team data
- [ ] Verify rep cannot see manager data
- [ ] Test period toggles (weekly/quarterly/yearly)
- [ ] Verify cross-team data isolation

---

## Summary

All Manager Dashboard features are implemented:

✅ Unique team code generation and management
✅ Manager role detection and access control
✅ Real-time team leaderboard with rankings
✅ Team health score calculation (0-100)
✅ Top/bottom performer identification
✅ AI-powered team summaries and coaching insights
✅ Period toggles (weekly/quarterly/yearly)
✅ Comprehensive RLS for data security

The infrastructure is complete and ready for frontend implementation!
