#!/usr/bin/env node

/**
 * Route Verification Script
 * Verifies that all routes defined in lib/routes.ts have corresponding page files
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

// Routes from lib/routes.ts
const routesToCheck = [
  // Public
  { path: '/', file: 'app/page.tsx' },
  { path: '/auth/login', file: 'app/auth/login/page.tsx' },
  { path: '/auth/signup', file: 'app/auth/signup/page.tsx' },
  
  // HS Coach
  { path: '/coach/high-school', file: 'app/(dashboard)/coach/high-school/page.tsx' },
  { path: '/coach/high-school/roster', file: 'app/(dashboard)/coach/high-school/roster/page.tsx' },
  { path: '/coach/high-school/team', file: 'app/(dashboard)/coach/high-school/team/page.tsx' },
  { path: '/coach/high-school/messages', file: 'app/(dashboard)/coach/high-school/messages/page.tsx' },
  
  // JUCO Coach
  { path: '/coach/juco', file: 'app/(dashboard)/coach/juco/page.tsx' },
  { path: '/coach/juco/transfer-portal', file: 'app/(dashboard)/coach/juco/transfer-portal/page.tsx' },
  { path: '/coach/juco/team', file: 'app/(dashboard)/coach/juco/team/page.tsx' },
  { path: '/coach/juco/messages', file: 'app/(dashboard)/coach/juco/messages/page.tsx' },
  
  // College Coach
  { path: '/coach/college', file: 'app/(dashboard)/coach/college/page.tsx' },
  { path: '/coach/college/discover', file: 'app/(dashboard)/coach/college/discover/page.tsx' },
  { path: '/coach/college/watchlist', file: 'app/(dashboard)/coach/college/watchlist/page.tsx' },
  { path: '/coach/college/recruiting-planner', file: 'app/(dashboard)/coach/college/recruiting-planner/page.tsx' },
  { path: '/coach/college/calendar', file: 'app/(dashboard)/coach/college/calendar/page.tsx' },
  { path: '/coach/college/camps', file: 'app/(dashboard)/coach/college/camps/page.tsx' },
  { path: '/coach/college/messages', file: 'app/(dashboard)/coach/college/messages/page.tsx' },
  { path: '/coach/college/program', file: 'app/(dashboard)/coach/college/program/page.tsx' },
  { path: '/coach/college/teams/:teamId', file: 'app/(dashboard)/coach/college/teams/[teamId]/page.tsx' },
  
  // Showcase Coach
  { path: '/coach/showcase', file: 'app/(dashboard)/coach/showcase/page.tsx' },
  { path: '/coach/showcase/team', file: 'app/(dashboard)/coach/showcase/team/page.tsx' },
  { path: '/coach/showcase/messages', file: 'app/(dashboard)/coach/showcase/messages/page.tsx' },
  
  // Coach Player Profile (dynamic)
  { path: '/coach/player/:id', file: 'app/coach/player/[id]/page.tsx' },
  
  // Player Routes
  { path: '/player', file: 'app/(dashboard)/player/page.tsx' },
  { path: '/player/discover', file: 'app/(dashboard)/player/discover/page.tsx' },
  { path: '/player/team', file: 'app/(dashboard)/player/team/page.tsx' },
  { path: '/player/messages', file: 'app/(dashboard)/player/messages/page.tsx' },
  { path: '/player/profile', file: 'app/(dashboard)/player/profile/page.tsx' },
  { path: '/player/camps', file: 'app/(dashboard)/player/camps/page.tsx' },
  { path: '/player/notifications', file: 'app/(dashboard)/player/notifications/page.tsx' },
  { path: '/player/journey', file: 'app/(dashboard)/player/journey/page.tsx' },
  
  // Player Dashboard Routes
  { path: '/player/dashboard/recruiting', file: 'app/player/dashboard/recruiting/page.tsx' },
  { path: '/player/dashboard/performance', file: 'app/player/dashboard/performance/page.tsx' },
  { path: '/player/dashboard/events', file: 'app/player/dashboard/events/page.tsx' },
  { path: '/player/dashboard/programs', file: 'app/player/dashboard/programs/page.tsx' },
  { path: '/player/dashboard/settings', file: 'app/player/dashboard/settings/page.tsx' },
];

const missingRoutes = [];
const foundRoutes = [];

routesToCheck.forEach(({ path: routePath, file }) => {
  const fullPath = path.join(repoRoot, file);
  if (fs.existsSync(fullPath)) {
    foundRoutes.push({ path: routePath, file });
  } else {
    missingRoutes.push({ path: routePath, file, expected: fullPath });
  }
});

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('ROUTE VERIFICATION REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`✅ Found: ${foundRoutes.length}/${routesToCheck.length} routes\n`);

if (missingRoutes.length > 0) {
  console.log(`❌ Missing: ${missingRoutes.length} routes\n`);
  console.log('MISSING ROUTES:');
  console.log('─────────────────────────────────────────────────────────────');
  missingRoutes.forEach(({ path: routePath, file, expected }) => {
    console.log(`  ❌ ${routePath}`);
    console.log(`     Expected: ${file}`);
    console.log(`     Full path: ${expected}\n`);
  });
} else {
  console.log('✅ ALL ROUTES VERIFIED - All paths lead somewhere!\n');
}

// Check for aliases that might need redirects
console.log('═══════════════════════════════════════════════════════════════');
console.log('ALIAS ROUTES (may need middleware redirects):');
console.log('═══════════════════════════════════════════════════════════════\n');

const aliases = [
  { alias: '/hs-coach/dashboard', target: '/coach/high-school' },
  { alias: '/hs-coach/roster', target: '/coach/high-school/roster' },
  { alias: '/juco/dashboard', target: '/coach/juco' },
  { alias: '/juco/portal', target: '/coach/juco/transfer-portal' },
  { alias: '/player/journey', target: '/player/dashboard/recruiting' },
];

aliases.forEach(({ alias, target }) => {
  const targetFile = routesToCheck.find(r => r.path === target);
  if (targetFile && fs.existsSync(path.join(repoRoot, targetFile.file))) {
    console.log(`  ✅ ${alias} → ${target} (target exists)`);
  } else {
    console.log(`  ⚠️  ${alias} → ${target} (target may not exist)`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════\n');

process.exit(missingRoutes.length > 0 ? 1 : 0);

