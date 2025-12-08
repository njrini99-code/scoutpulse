'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Search, 
  MessageSquare, 
  BookmarkPlus, 
  X, 
  ChevronLeft,
  Command,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { addPlayerToWatchlist } from '@/lib/queries/recruits';

interface QuickActionToolbarProps {
  position?: 'left' | 'right' | 'bottom';
  userRole?: 'coach' | 'player';
}

export function QuickActionToolbar({ 
  position = 'right',
  userRole = 'coach'
}: QuickActionToolbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (userRole === 'coach') {
          const { data: conversations } = await supabase
            .from('conversations')
            .select('program_unread_count')
            .not('program_unread_count', 'eq', 0);
          
          const total = conversations?.reduce((sum, conv) => sum + (conv.program_unread_count || 0), 0) || 0;
          setUnreadCount(total);
        } else {
          const { data: conversations } = await supabase
            .from('conversations')
            .select('player_unread_count')
            .not('player_unread_count', 'eq', 0);
          
          const total = conversations?.reduce((sum, conv) => sum + (conv.player_unread_count || 0), 0) || 0;
          setUnreadCount(total);
        }
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('quick-toolbar-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userRole]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setIsCollapsed(false);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      // Cmd+M or Ctrl+M for messages
      if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
        e.preventDefault();
        const messagesPath = userRole === 'coach' ? '/coach/messages' : '/player/messages';
        router.push(messagesPath);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, router, userRole]);

  // Search functionality
  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      if (userRole === 'coach') {
        // Search for players
        const { data: players } = await supabase
          .from('players')
          .select('id, first_name, last_name, position, graduation_year, city, state')
          .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
          .limit(10);

        setSearchResults(players || []);
      } else {
        // Search for coaches/colleges
        const { data: coaches } = await supabase
          .from('coaches')
          .select('id, program_name, city, state')
          .or(`program_name.ilike.%${query}%,city.ilike.%${query}%,state.ilike.%${query}%`)
          .limit(10);

        setSearchResults(coaches || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  }, [supabase, userRole]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, handleSearch]);

  // Handle search result selection
  const handleResultClick = (result: any) => {
    if (userRole === 'coach') {
      router.push(`/coach/player/${result.id}`);
    } else {
      router.push(`/coach/${result.id}`);
    }
    setIsOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle quick add to watchlist (coach only)
  const handleQuickAddToWatchlist = async (playerId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in');
        return;
      }

      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) {
        toast.error('Coach profile not found');
        return;
      }

      await addPlayerToWatchlist(coachData.id, playerId);
      toast.success('Added to watchlist');
    } catch (error) {
      console.error('Error adding to watchlist:', error);
      toast.error('Failed to add to watchlist');
    }
  };

  // Navigate to messages
  const handleMessagesClick = () => {
    const messagesPath = userRole === 'coach' ? '/coach/messages' : '/player/messages';
    router.push(messagesPath);
  };

  if (!mounted) return null;

  const toolbarContent = (
    <div
      ref={containerRef}
      className={cn(
        'fixed z-50 transition-all duration-300 ease-in-out',
        position === 'right' && 'right-4 top-1/2 -translate-y-1/2',
        position === 'left' && 'left-4 top-1/2 -translate-y-1/2',
        position === 'bottom' && 'bottom-4 left-1/2 -translate-x-1/2',
        isCollapsed && 'translate-x-0',
        !isOpen && !isCollapsed && (position === 'right' ? 'translate-x-full' : position === 'left' ? '-translate-x-full' : 'translate-y-full')
      )}
    >
      {isCollapsed ? (
        // Collapsed state - floating button
        <Button
          onClick={() => {
            setIsCollapsed(false);
            setIsOpen(true);
          }}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all"
          variant="gradient"
        >
          <Search className="w-6 h-6" />
        </Button>
      ) : (
        // Expanded state - toolbar panel
        <div className="bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl p-4 w-80 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-8 w-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground flex items-center gap-1">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            )}
          </div>

          {/* Search Results */}
          {searchQuery && (
            <div className="mb-4 max-h-48 overflow-y-auto border border-border rounded-lg">
              {isSearching ? (
                <div className="p-4 text-center">
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-3 hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="font-medium">
                        {userRole === 'coach'
                          ? `${result.first_name} ${result.last_name}`
                          : result.program_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {userRole === 'coach'
                          ? `${result.position} • ${result.city}, ${result.state} • ${result.graduation_year}`
                          : `${result.city}, ${result.state}`}
                      </div>
                      {userRole === 'coach' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleQuickAddToWatchlist(result.id);
                          }}
                        >
                          <BookmarkPlus className="w-3 h-3 mr-1" />
                          Add to Watchlist
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleMessagesClick}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Messages
              {unreadCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs font-semibold">
                  {unreadCount}
                </span>
              )}
            </Button>

            {userRole === 'coach' && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/coach/discover')}
              >
                <Search className="w-4 h-4 mr-2" />
                Discover Players
              </Button>
            )}

            {userRole === 'player' && (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/player/discover')}
              >
                <Search className="w-4 h-4 mr-2" />
                Discover Colleges
              </Button>
            )}
          </div>

          {/* Keyboard Shortcuts Hint */}
          <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
            <div className="flex items-center justify-between">
              <span>Search</span>
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs">
                <Command className="w-3 h-3 inline" /> K
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Messages</span>
              <kbd className="px-2 py-0.5 bg-muted rounded text-xs">
                <Command className="w-3 h-3 inline" /> M
              </kbd>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(toolbarContent, document.body);
}
