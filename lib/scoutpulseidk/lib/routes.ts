/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SCOUTPULSE ROUTE CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * This file serves as the central routing configuration for ScoutPulse.
 * In Next.js App Router, routes are file-based, but this file documents
 * all routes with their role requirements for reference and middleware.
 * 
 * Usage:
 * - Import route helpers for type-safe navigation
 * - Reference ROUTES object for route definitions
 * - Use with ProtectedRoute component for client-side protection
 * - Middleware uses this config for edge-level protection
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'player' | 'coach' | 'admin';
export type CoachRole = 'college' | 'high_school' | 'juco' | 'showcase';

export interface RouteConfig {
  path: string;
  name: string;
  allowedRoles: UserRole[];
  allowedCoachTypes?: CoachRole[];
  description?: string;
  alias?: string; // Alternative path that redirects to this route
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export const ROUTES: Record<string, RouteConfig> = {
  // ═══════════════════════════════════════════════════════════════════════
  // PUBLIC ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  HOME: {
    path: '/',
    name: 'Home',
    allowedRoles: ['player', 'coach', 'admin'],
    description: 'Landing page',
  },
  LOGIN: {
    path: '/auth/login',
    name: 'Login',
    allowedRoles: ['player', 'coach', 'admin'],
    description: 'Authentication login page',
  },
  SIGNUP: {
    path: '/auth/signup',
    name: 'Sign Up',
    allowedRoles: ['player', 'coach', 'admin'],
    description: 'User registration page',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // HIGH SCHOOL COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  HS_COACH_DASHBOARD: {
    path: '/coach/high-school',
    name: 'HS Coach Dashboard',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
    description: 'High school coach dashboard with roster overview and recruiting activity',
    alias: '/hs-coach/dashboard',
  },
  HS_COACH_ROSTER: {
    path: '/coach/high-school/roster',
    name: 'HS Coach Roster',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
    description: 'Roster management with player list, CRUD operations, and college interest tracking',
    alias: '/hs-coach/roster',
  },
  HS_COACH_TEAM: {
    path: '/coach/high-school/team',
    name: 'HS Coach Team',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
    description: 'Team management page',
  },
  HS_COACH_MESSAGES: {
    path: '/coach/high-school/messages',
    name: 'HS Coach Messages',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['high_school'],
    description: 'Messaging hub for high school coach',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // JUCO COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  JUCO_DASHBOARD: {
    path: '/coach/juco',
    name: 'JUCO Dashboard',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
    description: 'JUCO coach dashboard with transfer portal, academic tracking, and college matching',
    alias: '/juco/dashboard',
  },
  JUCO_TRANSFER_PORTAL: {
    path: '/coach/juco/transfer-portal',
    name: 'JUCO Transfer Portal',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
    description: 'Transfer portal with player availability, requirements checklist, and application tracking',
    alias: '/juco/portal',
  },
  JUCO_TEAM: {
    path: '/coach/juco/team',
    name: 'JUCO Team',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
    description: 'JUCO team management page',
  },
  JUCO_MESSAGES: {
    path: '/coach/juco/messages',
    name: 'JUCO Messages',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['juco'],
    description: 'Messaging hub for JUCO coach',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // COLLEGE COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  COLLEGE_DASHBOARD: {
    path: '/coach/college',
    name: 'College Dashboard',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'College coach dashboard',
  },
  COLLEGE_DISCOVER: {
    path: '/coach/college/discover',
    name: 'Discover Recruits',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'Search and discover potential recruits',
  },
  COLLEGE_WATCHLIST: {
    path: '/coach/college/watchlist',
    name: 'Watchlist',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'Manage watched recruits with notes and pipeline tracking',
  },
  COLLEGE_RECRUITING_PLANNER: {
    path: '/coach/college/recruiting-planner',
    name: 'Recruiting Planner',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'Plan and track recruiting activities',
  },
  COLLEGE_CALENDAR: {
    path: '/coach/college/calendar',
    name: 'Calendar',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'Scheduling and events calendar',
  },
  COLLEGE_CAMPS: {
    path: '/coach/college/camps',
    name: 'Camps',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'Manage baseball camps and events',
  },
  COLLEGE_MESSAGES: {
    path: '/coach/college/messages',
    name: 'Messages',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'Messaging hub for college coach',
  },
  COLLEGE_PROGRAM: {
    path: '/coach/college/program',
    name: 'Program',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['college'],
    description: 'Program profile and settings',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // SHOWCASE COACH ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  SHOWCASE_DASHBOARD: {
    path: '/coach/showcase',
    name: 'Showcase Dashboard',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['showcase'],
    description: 'Showcase coach dashboard',
  },
  SHOWCASE_TEAM: {
    path: '/coach/showcase/team',
    name: 'Showcase Team',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['showcase'],
    description: 'Showcase team management',
  },
  SHOWCASE_MESSAGES: {
    path: '/coach/showcase/messages',
    name: 'Showcase Messages',
    allowedRoles: ['coach'],
    allowedCoachTypes: ['showcase'],
    description: 'Messaging hub for showcase coach',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ANY COACH ROUTES (accessible by all coach types)
  // ═══════════════════════════════════════════════════════════════════════
  COACH_PLAYER_PROFILE: {
    path: '/coach/player/:id',
    name: 'Player Profile',
    allowedRoles: ['coach'],
    // No allowedCoachTypes = all coach types can access
    description: 'View detailed player profile (accessible by all coach types)',
  },

  // ═══════════════════════════════════════════════════════════════════════
  // PLAYER ROUTES
  // ═══════════════════════════════════════════════════════════════════════
  PLAYER_DASHBOARD: {
    path: '/player',
    name: 'Player Dashboard',
    allowedRoles: ['player'],
    description: 'Player profile and dashboard',
  },
  PLAYER_JOURNEY: {
    path: '/player/dashboard/recruiting',
    name: 'Recruitment Journey',
    allowedRoles: ['player'],
    description: 'Track recruitment progress, college interests, and timeline',
    alias: '/player/journey',
  },
  PLAYER_PERFORMANCE: {
    path: '/player/dashboard/performance',
    name: 'Performance',
    allowedRoles: ['player'],
    description: 'Stats, charts, and performance tracking',
  },
  PLAYER_EVENTS: {
    path: '/player/dashboard/events',
    name: 'Events',
    allowedRoles: ['player'],
    description: 'Upcoming events and calendar',
  },
  PLAYER_PROGRAMS: {
    path: '/player/dashboard/programs',
    name: 'Programs',
    allowedRoles: ['player'],
    description: 'View interested programs',
  },
  PLAYER_SETTINGS: {
    path: '/player/dashboard/settings',
    name: 'Settings',
    allowedRoles: ['player'],
    description: 'Player settings and preferences',
  },
  PLAYER_DISCOVER: {
    path: '/player/discover',
    name: 'Discover',
    allowedRoles: ['player'],
    description: 'Discover colleges and programs',
  },
  PLAYER_TEAM: {
    path: '/player/team',
    name: 'Team',
    allowedRoles: ['player'],
    description: 'Player team page',
  },
  PLAYER_MESSAGES: {
    path: '/player/messages',
    name: 'Messages',
    allowedRoles: ['player'],
    description: 'Messaging hub for player',
  },
  PLAYER_PROFILE: {
    path: '/player/profile',
    name: 'Profile',
    allowedRoles: ['player'],
    description: 'Edit player profile',
  },
  PLAYER_CAMPS: {
    path: '/player/camps',
    name: 'Camps',
    allowedRoles: ['player'],
    description: 'Browse and register for camps',
  },
  PLAYER_NOTIFICATIONS: {
    path: '/player/notifications',
    name: 'Notifications',
    allowedRoles: ['player'],
    description: 'View notifications',
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// ROUTE HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get all routes for a specific role
 */
export function getRoutesForRole(role: UserRole, coachType?: CoachRole): RouteConfig[] {
  return Object.values(ROUTES).filter(route => {
    if (!route.allowedRoles.includes(role)) return false;
    if (role === 'coach' && route.allowedCoachTypes && coachType) {
      return route.allowedCoachTypes.includes(coachType);
    }
    return true;
  });
}

/**
 * Check if a role can access a route
 */
export function canAccessRoute(
  route: RouteConfig,
  role: UserRole,
  coachType?: CoachRole
): boolean {
  if (!route.allowedRoles.includes(role)) return false;
  if (role === 'coach' && route.allowedCoachTypes && coachType) {
    return route.allowedCoachTypes.includes(coachType);
  }
  return true;
}

/**
 * Get route by path
 */
export function getRouteByPath(path: string): RouteConfig | undefined {
  // Check exact match first
  const exactMatch = Object.values(ROUTES).find(r => r.path === path);
  if (exactMatch) return exactMatch;

  // Check aliases
  const aliasMatch = Object.values(ROUTES).find(r => r.alias === path);
  if (aliasMatch) return aliasMatch;

  // Check dynamic routes
  for (const route of Object.values(ROUTES)) {
    if (route.path.includes(':')) {
      const regex = new RegExp(
        '^' + route.path.replace(/:[^/]+/g, '[^/]+') + '$'
      );
      if (regex.test(path)) return route;
    }
  }

  return undefined;
}

/**
 * Build path with dynamic parameters
 */
export function buildPath(route: RouteConfig, params?: Record<string, string>): string {
  let path = route.path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, value);
    }
  }
  return path;
}

/**
 * Get dashboard path for a role/coach type
 */
export function getDashboardPath(role: UserRole, coachType?: CoachRole): string {
  if (role === 'player') {
    return ROUTES.PLAYER_DASHBOARD.path;
  }
  
  if (role === 'coach') {
    switch (coachType) {
      case 'high_school':
        return ROUTES.HS_COACH_DASHBOARD.path;
      case 'juco':
        return ROUTES.JUCO_DASHBOARD.path;
      case 'showcase':
        return ROUTES.SHOWCASE_DASHBOARD.path;
      case 'college':
      default:
        return ROUTES.COLLEGE_DASHBOARD.path;
    }
  }

  return '/';
}

// ═══════════════════════════════════════════════════════════════════════════
// NAVIGATION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export const NAV_ITEMS = {
  HS_COACH: [
    ROUTES.HS_COACH_DASHBOARD,
    ROUTES.HS_COACH_ROSTER,
    ROUTES.HS_COACH_TEAM,
    ROUTES.HS_COACH_MESSAGES,
  ],
  JUCO_COACH: [
    ROUTES.JUCO_DASHBOARD,
    ROUTES.JUCO_TRANSFER_PORTAL,
    ROUTES.JUCO_TEAM,
    ROUTES.JUCO_MESSAGES,
  ],
  COLLEGE_COACH: [
    ROUTES.COLLEGE_DASHBOARD,
    ROUTES.COLLEGE_DISCOVER,
    ROUTES.COLLEGE_WATCHLIST,
    ROUTES.COLLEGE_RECRUITING_PLANNER,
    ROUTES.COLLEGE_CALENDAR,
    ROUTES.COLLEGE_CAMPS,
    ROUTES.COLLEGE_MESSAGES,
  ],
  SHOWCASE_COACH: [
    ROUTES.SHOWCASE_DASHBOARD,
    ROUTES.SHOWCASE_TEAM,
    ROUTES.SHOWCASE_MESSAGES,
  ],
  PLAYER: [
    ROUTES.PLAYER_DASHBOARD,
    ROUTES.PLAYER_DISCOVER,
    ROUTES.PLAYER_TEAM,
    ROUTES.PLAYER_MESSAGES,
  ],
};

export default ROUTES;
