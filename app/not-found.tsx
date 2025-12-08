'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Home,
  ArrowLeft,
  ChevronRight,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  BarChart3,
  Trophy,
  BookOpen,
  HelpCircle,
  Star,
  TrendingUp,
  FileText,
  MapPin,
  X,
  Compass,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS STYLES
// ═══════════════════════════════════════════════════════════════════════════

const notFoundStyles = `
/* Animations */
@keyframes not-found-fade-in {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes float-404 {
  0%, 100% { transform: translateY(0) rotate(-2deg); }
  50% { transform: translateY(-15px) rotate(2deg); }
}

@keyframes gradient-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 40px rgba(99, 102, 241, 0.5); }
}

@keyframes search-focus {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

@keyframes suggestion-appear {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes link-hover {
  0% { transform: translateX(0); }
  100% { transform: translateX(4px); }
}

.not-found-container {
  animation: not-found-fade-in 0.6s ease-out forwards;
}

.float-404 {
  animation: float-404 4s ease-in-out infinite;
}

.gradient-text {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
  background-size: 200% 200%;
  animation: gradient-flow 5s ease infinite;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}

.search-container:focus-within {
  animation: search-focus 0.3s ease-out;
}

.suggestion-item {
  animation: suggestion-appear 0.2s ease-out forwards;
}

.link-item:hover .link-arrow {
  animation: link-hover 0.2s ease-out forwards;
}

/* Glass effects */
.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-darker {
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* Gradient background */
.gradient-bg {
  background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
  background-size: 400% 400%;
  animation: gradient-flow 15s ease infinite;
}

/* Search dropdown */
.search-dropdown {
  animation: suggestion-appear 0.2s ease-out forwards;
}
`;

// ═══════════════════════════════════════════════════════════════════════════
// POPULAR PAGES DATA
// ═══════════════════════════════════════════════════════════════════════════

const popularPages = [
  { href: '/player/dashboard', label: 'Player Dashboard', icon: BarChart3, description: 'View your stats and progress' },
  { href: '/coach/dashboard', label: 'Coach Dashboard', icon: Users, description: 'Manage your recruits' },
  { href: '/player/discover', label: 'Discover Colleges', icon: Compass, description: 'Find matching programs' },
  { href: '/coach/watchlist', label: 'Watchlist', icon: Star, description: 'Track potential recruits' },
  { href: '/player/schedule', label: 'Schedule', icon: Calendar, description: 'View upcoming events' },
  { href: '/messages', label: 'Messages', icon: MessageSquare, description: 'Check your inbox' },
];

const searchSuggestions = [
  { query: 'player profile', href: '/player/profile' },
  { query: 'college search', href: '/player/discover' },
  { query: 'recruiting tips', href: '/resources/recruiting' },
  { query: 'coach messaging', href: '/messages' },
  { query: 'event calendar', href: '/player/schedule' },
  { query: 'settings', href: '/settings' },
];

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Inject styles
    if (typeof document === 'undefined') return;
    if (document.getElementById('not-found-styles')) return;

    const style = document.createElement('style');
    style.id = 'not-found-styles';
    style.textContent = notFoundStyles;
    document.head.appendChild(style);
  }, []);

  // Generate breadcrumbs from pathname
  const breadcrumbs = useMemo(() => {
    if (!pathname) return [];
    
    const segments = pathname.split('/').filter(Boolean);
    return segments.map((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');
      const label = segment
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      return { href, label };
    });
  }, [pathname]);

  // Filter suggestions based on search
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return searchSuggestions.slice(0, 4);
    
    const query = searchQuery.toLowerCase();
    return searchSuggestions.filter(
      (s) => s.query.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or first suggestion
      const match = filteredSuggestions[0];
      if (match) {
        router.push(match.href);
      }
    }
  };

  const handleGoBack = () => {
    if (typeof window !== 'undefined') {
      window.history.back();
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-500/5 rounded-full blur-3xl" />
      </div>

      <div className="not-found-container relative z-10 w-full max-w-2xl">
        {/* Breadcrumb Navigation */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-6">
            <ol className="flex items-center gap-2 text-sm flex-wrap">
              <li>
                <Link
                  href="/"
                  className="flex items-center gap-1 text-white/50 hover:text-white transition-colors"
                >
                  <Home className="w-4 h-4" />
                  <span>Home</span>
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-white/30" />
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-red-400 line-through">{crumb.label}</span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Main Card */}
        <div className="glass rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with 404 */}
          <div className="p-8 md:p-12 text-center border-b border-white/10">
            <div className="float-404 inline-block mb-6">
              <span className="text-8xl md:text-9xl font-black gradient-text">
                404
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Page Not Found
            </h1>
            <p className="text-white/60 max-w-md mx-auto text-lg">
              Looks like you&apos;ve ventured into uncharted territory. 
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>

            {/* Current path display */}
            {pathname && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-darker text-sm">
                <MapPin className="w-4 h-4 text-red-400" />
                <code className="text-white/60">{pathname}</code>
              </div>
            )}
          </div>

          {/* Search Section */}
          <div className="p-6 border-b border-white/10">
            <p className="text-sm text-white/50 mb-3 text-center">
              Try searching for what you need
            </p>
            
            <form onSubmit={handleSearch} className="relative">
              <div className="search-container relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search pages, features, help..."
                  className="w-full pl-12 pr-12 py-4 rounded-2xl glass-darker text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white/40" />
                  </button>
                )}
              </div>

              {/* Search Suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 z-20 search-dropdown">
                  <div className="glass rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2">
                      {filteredSuggestions.map((suggestion, index) => (
                        <Link
                          key={suggestion.href}
                          href={suggestion.href}
                          className="suggestion-item flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <Search className="w-4 h-4 text-white/40" />
                          <span className="text-white/80">{suggestion.query}</span>
                          <ChevronRight className="w-4 h-4 text-white/30 ml-auto" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Popular Pages */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Popular Pages
            </h2>

            <div className="grid sm:grid-cols-2 gap-3">
              {popularPages.map((page) => {
                const Icon = page.icon;
                return (
                  <Link
                    key={page.href}
                    href={page.href}
                    className="link-item group flex items-center gap-4 p-4 rounded-xl glass-darker hover:bg-white/10 transition-all"
                  >
                    <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/30 transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white group-hover:text-indigo-300 transition-colors">
                        {page.label}
                      </p>
                      <p className="text-sm text-white/50 truncate">
                        {page.description}
                      </p>
                    </div>
                    <ChevronRight className="link-arrow w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-0">
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold transition-all pulse-glow"
              >
                <Home className="w-5 h-5" />
                Back to Home
              </Link>
              <button
                onClick={handleGoBack}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl glass hover:bg-white/10 text-white/80 hover:text-white font-semibold transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Go Back
              </button>
            </div>
          </div>

          {/* Help Footer */}
          <div className="px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
              <p className="text-white/40">
                Still can&apos;t find what you need?
              </p>
              <div className="flex items-center gap-4">
                <Link
                  href="/help"
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {[
            { href: '/resources', label: 'Resources', icon: BookOpen },
            { href: '/faq', label: 'FAQ', icon: HelpCircle },
            { href: '/sitemap', label: 'Sitemap', icon: FileText },
          ].map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
