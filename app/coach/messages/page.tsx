'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Inbox, 
  Search,
  Send,
  Paperclip,
  Video,
  BarChart3,
  User,
  Loader2,
  Users,
  FileText,
  Plus,
  Star,
  Archive,
  Trash2,
  MoreVertical,
  Eye,
  UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/lib/theme-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

interface Conversation {
  id: string;
  player_id: string;
  player_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  player_photo: string | null;
  is_starred?: boolean;
}

interface Message {
  id: string;
  sender: 'coach' | 'player';
  message_text: string;
  created_at: string;
}

export default function CoachMessagesPage() {
  const { isDark } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');

  // Button styles that work in both modes
  const buttonStyles = {
    primary: isDark 
      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
      : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25',
    secondary: isDark 
      ? 'bg-slate-700 hover:bg-slate-600 text-white border-slate-600' 
      : 'bg-white hover:bg-emerald-50 text-emerald-700 border-emerald-300 shadow-sm',
    outline: isDark 
      ? 'border-slate-500 text-slate-200 hover:bg-slate-700 hover:text-white' 
      : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
    ghost: isDark 
      ? 'hover:bg-slate-700 text-slate-300' 
      : 'hover:bg-emerald-50 text-emerald-700',
    active: isDark 
      ? 'bg-emerald-600 text-white' 
      : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25',
    inactive: isDark 
      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
      : 'bg-white text-slate-600 hover:bg-emerald-50 border border-emerald-200',
  };

  // Theme classes
  const theme = {
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDark ? 'bg-slate-800/90 border-slate-700/50' : 'bg-white/90 border-emerald-200/60 shadow-lg shadow-emerald-500/5',
    inputBg: isDark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-500' : 'bg-white border-emerald-200 text-slate-800',
    conversationHover: isDark ? 'hover:bg-slate-700' : 'hover:bg-emerald-50',
    conversationActive: isDark ? 'bg-slate-700 border-l-4 border-emerald-500' : 'bg-emerald-50 border-l-4 border-emerald-500',
    messageBubbleCoach: isDark ? 'bg-emerald-600' : 'bg-emerald-500',
    messageBubblePlayer: isDark ? 'bg-slate-700 text-white' : 'bg-emerald-100 text-slate-800',
    divider: isDark ? 'border-slate-700' : 'border-emerald-100',
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  // Real-time subscription for messages in the selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`messages:${selectedConversation}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          const formatted: Message = {
            id: newMessage.id,
            sender: newMessage.sender_type === 'coach' ? 'coach' : 'player',
            message_text: newMessage.message_text,
            created_at: newMessage.created_at,
          };
          setMessages(prev => [...prev, formatted]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  // Real-time subscription for conversation updates (last message, unread count)
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          const updated = payload.new as any;
          setConversations(prev => prev.map(conv => {
            if (conv.id === updated.id) {
              return {
                ...conv,
                last_message: updated.last_message_text,
                last_message_at: updated.last_message_at,
                unread_count: updated.program_unread_count || 0,
              };
            }
            return conv;
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadConversations = async () => {
    const supabase = createClient();
    
    let coachId: string | null = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) {
        setLoading(false);
        return;
      }
      coachId = coachData.id;
    }

    const { data: convData } = await supabase
      .from('conversations')
      .select(`
        id,
        player_id,
        last_message_text,
        last_message_at,
        program_unread_count,
        players:player_id (
          first_name,
          last_name
        )
      `)
      .eq('program_id', coachId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convData) {
      const formatted: Conversation[] = convData.map(conv => ({
        id: conv.id,
        player_id: conv.player_id,
        player_name: (conv.players as any) ? `${(conv.players as any).first_name || ''} ${(conv.players as any).last_name || ''}`.trim() : null,
        last_message: conv.last_message_text,
        last_message_at: conv.last_message_at,
        unread_count: conv.program_unread_count || 0,
        player_photo: null,
        is_starred: false,
      }));
      setConversations(formatted);
      
      // Check if we should open a specific player's conversation
      const playerId = searchParams.get('player');
      if (playerId) {
        const conv = formatted.find(c => c.player_id === playerId);
        if (conv) {
          setSelectedConversation(conv.id);
        }
      } else if (formatted.length > 0 && !selectedConversation) {
        setSelectedConversation(formatted[0].id);
      }
    }

    setLoading(false);
  };

  const loadMessages = async (conversationId: string) => {
    const supabase = createClient();
    
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesData) {
      const formatted: Message[] = messagesData.map(msg => ({
        id: msg.id,
        sender: msg.sender_type === 'coach' ? 'coach' : 'player',
        message_text: msg.message_text,
        created_at: msg.created_at,
      }));
      setMessages(formatted);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    const supabase = createClient();
    
    let coachId: string | null = null;
    
    if (isDevMode()) {
      coachId = DEV_ENTITY_IDS.coach;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!coachData) {
        setSending(false);
        return;
      }
      coachId = coachData.id;
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_type: 'coach',
        sender_program_id: coachId,
        message_text: messageText.trim(),
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      toast.success('Message sent!');
      setMessageText('');
      loadMessages(selectedConversation);
      loadConversations();
    }

    setSending(false);
  };

  const handleViewProfile = (playerId: string) => {
    router.push(`/coach/player/${playerId}`);
  };

  const handleAddToWatchlist = async (playerId: string, playerName: string) => {
    toast.success(`${playerName} added to watchlist!`, {
      action: {
        label: 'View Watchlist',
        onClick: () => router.push('/coach/college/watchlist'),
      },
    });
  };

  const handleToggleStar = (convId: string) => {
    setConversations(conversations.map(c => 
      c.id === convId ? { ...c, is_starred: !c.is_starred } : c
    ));
    toast.success('Conversation starred');
  };

  const filteredConversations = conversations.filter(conv => {
    if (filter === 'unread' && conv.unread_count === 0) return false;
    if (filter === 'starred' && !conv.is_starred) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return conv.player_name?.toLowerCase().includes(query) || 
           conv.last_message?.toLowerCase().includes(query);
  });

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${theme.text}`}>Messages</h1>
            <p className={theme.textMuted}>
              Communicate with recruits • {conversations.length} conversations
            </p>
          </div>
          <Link href="/coach/college/discover">
            <Button className={buttonStyles.primary}>
              <Plus className="w-4 h-4 mr-2" />
              New Message
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
          {/* Left Pane - Conversations List */}
          <Card className={`lg:col-span-1 flex flex-col ${theme.cardBg}`}>
            <CardContent className="p-0 flex flex-col h-full">
              {/* Search */}
              <div className={`p-4 border-b ${theme.divider}`}>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                  <Input
                    placeholder="Search conversations..."
                    className={`pl-9 ${theme.inputBg}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters */}
              <div className={`p-3 border-b flex gap-2 ${theme.divider}`}>
                <Button
                  size="sm"
                  className={`flex-1 ${filter === 'all' ? buttonStyles.active : buttonStyles.inactive}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 ${filter === 'unread' ? buttonStyles.active : buttonStyles.inactive}`}
                  onClick={() => setFilter('unread')}
                >
                  Unread
                </Button>
                <Button
                  size="sm"
                  className={`flex-1 ${filter === 'starred' ? buttonStyles.active : buttonStyles.inactive}`}
                  onClick={() => setFilter('starred')}
                >
                  <Star className="w-3 h-3 mr-1" />
                  Starred
                </Button>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className={`p-8 text-center ${theme.textMuted}`}>
                    <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No conversations yet</p>
                    <Link href="/coach/college/discover">
                      <Button className={buttonStyles.primary}>
                        <Plus className="w-4 h-4 mr-2" />
                        Start Recruiting
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className={`divide-y ${theme.divider}`}>
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv.id)}
                        className={`w-full p-4 text-left transition-colors ${theme.conversationHover} ${
                          selectedConversation === conv.id ? theme.conversationActive : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={conv.player_photo || undefined} />
                            <AvatarFallback className={isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'}>
                              {conv.player_name?.[0] || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className={`font-semibold truncate ${theme.text}`}>
                                {conv.player_name || 'Player'}
                              </h3>
                              <div className="flex items-center gap-2">
                                {conv.is_starred && (
                                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                                )}
                                {conv.unread_count > 0 && (
                                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full font-semibold">
                                    {conv.unread_count}
                                  </span>
                                )}
                              </div>
                            </div>
                            {conv.last_message && (
                              <p className={`text-sm truncate ${theme.textMuted}`}>{conv.last_message}</p>
                            )}
                            {conv.last_message_at && (
                              <p className={`text-xs mt-1 ${theme.textMuted}`}>
                                {new Date(conv.last_message_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Pane - Chat View */}
          <Card className={`lg:col-span-2 flex flex-col ${theme.cardBg}`}>
            {selectedConversation && currentConversation ? (
              <>
                {/* Chat Header */}
                <CardContent className={`p-4 border-b ${theme.divider}`}>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={currentConversation.player_photo || undefined} />
                      <AvatarFallback className={isDark ? 'bg-emerald-600 text-white' : 'bg-emerald-500 text-white'}>
                        {currentConversation.player_name?.[0] || 'P'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${theme.text}`}>{currentConversation.player_name || 'Player'}</h3>
                      <p className={`text-sm ${theme.textMuted}`}>Recruit</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        className={buttonStyles.secondary}
                        onClick={() => handleViewProfile(currentConversation.player_id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        className={buttonStyles.secondary}
                        onClick={() => handleAddToWatchlist(currentConversation.player_id, currentConversation.player_name || 'Player')}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Watchlist
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className={buttonStyles.ghost}
                        onClick={() => handleToggleStar(currentConversation.id)}
                      >
                        <Star className={`w-4 h-4 ${currentConversation.is_starred ? 'text-amber-500 fill-amber-500' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </CardContent>

                {/* Messages */}
                <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className={`flex items-center justify-center h-full ${theme.textMuted}`}>
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-2 mb-4">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.sender === 'coach' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            message.sender === 'coach'
                              ? `${theme.messageBubbleCoach} text-white`
                              : theme.messageBubblePlayer
                          }`}
                        >
                          <p className="text-sm">{message.message_text}</p>
                          <p className={`text-xs mt-1 ${
                            message.sender === 'coach' ? 'text-emerald-100' : (isDark ? 'text-slate-400' : 'text-slate-500')
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>

                {/* Message Input */}
                <CardContent className={`p-4 border-t ${theme.divider}`}>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className={buttonStyles.ghost}>
                      <Paperclip className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className={buttonStyles.ghost}>
                      <Video className="w-4 h-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      className={`flex-1 ${theme.inputBg}`}
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className={buttonStyles.primary}
                    >
                      {sending ? (
                        <div className="w-4 h-4 bg-white/20 rounded animate-pulse" />
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex items-center justify-center h-full">
                <div className={`text-center ${theme.textMuted}`}>
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>No conversation selected</h3>
                  <p className="mb-4">Select a conversation from the list or start a new one</p>
                  <Link href="/coach/college/discover">
                    <Button className={buttonStyles.primary}>
                      <Plus className="w-4 h-4 mr-2" />
                      Find Recruits
                    </Button>
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
