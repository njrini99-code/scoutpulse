# ScoutPulse Routes Documentation

## Authentication Routes

| Route | Description |
|-------|-------------|
| `/auth/login` | Login page |
| `/auth/signup` | Signup page (choose player/coach role) |

## Player Routes

### Onboarding
| Route | Description |
|-------|-------------|
| `/onboarding/player` | Player onboarding flow |
| `/(onboarding)/player/step-basic` | Step 1: Basic info |
| `/(onboarding)/player/step-goals` | Step 2: Goals |
| `/(onboarding)/player/step-links` | Step 3: Social links |

### Dashboard (after onboarding)
| Route | Description |
|-------|-------------|
| `/(dashboard)/player` | Player profile/home |
| `/(dashboard)/player/profile` | Profile settings |
| `/(dashboard)/player/discover` | Discover programs |
| `/(dashboard)/player/team` | Team view |
| `/(dashboard)/player/messages` | Messages |

## Coach Routes

### Onboarding
| Route | Description |
|-------|-------------|
| `/onboarding/coach` | Coach onboarding flow |
| `/(onboarding)/coach/step-identity` | Step 1: Coach identity |
| `/(onboarding)/coach/step-program-basics` | Step 2: Program info |
| `/(onboarding)/coach/step-finish` | Step 3: Complete |

### College Coach Dashboard
| Route | Description |
|-------|-------------|
| `/(dashboard)/coach/college` | College coach home/dashboard |
| `/(dashboard)/coach/college/discover` | Discover recruits (interactive map) |
| `/(dashboard)/coach/college/watchlist` | Watchlist/CRM board |
| `/(dashboard)/coach/college/recruiting-planner` | Recruiting planner (baseball diamond) |
| `/(dashboard)/coach/college/program` | Program profile |
| `/(dashboard)/coach/college/messages` | Messages |
| `/(dashboard)/coach/college/camps` | Camps & Events |
| `/(dashboard)/coach/college/calendar` | Calendar |
| `/(dashboard)/coach/college/teams/[teamId]` | View a specific team |

### High School Coach Dashboard
| Route | Description |
|-------|-------------|
| `/(dashboard)/coach/high-school` | HS coach home |
| `/(dashboard)/coach/high-school/team` | Team management |

### JUCO Coach Dashboard
| Route | Description |
|-------|-------------|
| `/(dashboard)/coach/juco` | JUCO coach home |
| `/(dashboard)/coach/juco/team` | Team management |

### Showcase Coach Dashboard
| Route | Description |
|-------|-------------|
| `/(dashboard)/coach/showcase` | Showcase coach home |
| `/(dashboard)/coach/showcase/team` | Team management |

### Shared Coach Routes
| Route | Description |
|-------|-------------|
| `/coach/layout` | Coach dashboard layout |
| `/coach/player/[id]` | View player profile |
| `/coach/program` | Program page (shared) |
| `/coach/watchlist` | Watchlist page (shared) |
| `/coach/messages` | Messages page (shared) |
| `/coach/camps` | Camps page (shared) |
| `/coach/calendar` | Calendar page (shared) |
| `/coach/discover` | Discover page (shared) |

## URL Parameters

### Discover Page
- `?state=XX` - Pre-select a state (e.g., `?state=TX`)
- `?tab=players|teams|juco` - Pre-select entity type

### Recruiting Planner
- `?status=watchlist|high_priority|offer_extended|committed` - Filter by status

### Camps Page
- `?action=create` - Auto-open camp creation form
- `?camp=ID` - Highlight/focus specific camp
- `?tab=interested` - Show interested players tab

### Messages Page
- `?player=ID` - Open conversation with specific player
- `?camp=ID` - Open bulk message for camp

### Watchlist Page
- `?category=pitchers|infielders|outfielders|catchers` - Filter by position category

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/test-db` | GET | Test database connection |

## Database Tables Used

### Core Tables
- `profiles` - User profiles (player/coach role)
- `players` - Player information
- `coaches` - Coach/program information
- `teams` - Team information
- `team_memberships` - Player-team relationships

### Recruiting Tables
- `recruits` - Legacy watchlist entries
- `recruit_watchlist` - New pipeline entries
- `player_engagement` - Activity tracking
- `program_needs` - AI recommendation criteria

### Events & Scheduling
- `camp_events` - Camp and event information
- `team_schedule` - Team schedule events

### Messaging
- `conversations` - Player-coach conversations
- `messages` - Individual messages

### Media & Metrics
- `player_metrics` - Player statistics
- `player_videos` - Player video links
- `player_achievements` - Player achievements
- `team_media` - Team photos/videos

## Theme System

The app supports light/dark mode toggle:
- Theme state managed in `lib/theme-context.tsx`
- Toggle button in coach layout header (top-left)
- Persisted in localStorage

## Key Components

### Coach Components
- `components/coach/college/discover-map.tsx` - Interactive USA map
- `components/coach/college/discover-state-panel.tsx` - State drilldown panel
- `components/coach/college/recruiting-diamond.tsx` - Baseball diamond visualization
- `components/coach/college/trending-players.tsx` - Trending players list
- `components/coach/college/ai-match-list.tsx` - AI recommendations

### Shared UI Components
- `components/ui/*` - shadcn/ui components
- `lib/theme-context.tsx` - Theme provider

