'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Search,
  Send,
  ChevronLeft,
  MoreVertical,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  CheckCheck,
  Circle,
  Loader2,
} from 'lucide-react';
import { MessagesSkeleton } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';
import { cn } from '@/lib/utils';
import { 
  glassCard, 
  glassInput,
  glassDarkZone,
} from '@/lib/glassmorphism';

interface Conversation {
  id: string;
  program_name: string | null;
  coach_name: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  program_logo: string | null;
}

interface Message {
  id: string;
  sender: 'player' | 'coach';
  message_text: string;
  created_at: string;
  read: boolean;
}

export default function PlayerMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
            read: newMessage.read_by_program || false,
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
                unread_count: updated.player_unread_count || 0,
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
    
    let playerId: string | null = null;
    
    if (isDevMode()) {
      playerId = DEV_ENTITY_IDS.player;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: playerData } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!playerData) {
        setLoading(false);
        return;
      }
      playerId = playerData.id;
    }

    const { data: convData } = await supabase
      .from('conversations')
      .select(`
        id,
        last_message_text,
        last_message_at,
        player_unread_count,
        coaches:program_id (
          school_name,
          program_name,
          full_name,
          logo_url
        )
      `)
      .eq('player_id', playerId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convData) {
      interface ConversationRow {
        id: string;
        last_message_text: string | null;
        last_message_at: string | null;
        player_unread_count?: number;
        coaches?: {
          school_name?: string | null;
          program_name?: string | null;
          full_name: string | null;
          logo_url?: string | null;
        } | Array<{
          school_name?: string | null;
          program_name?: string | null;
          full_name: string | null;
          logo_url?: string | null;
        }> | null;
      }
      const formatted: Conversation[] = convData.map((conv: ConversationRow) => {
        const coach = Array.isArray(conv.coaches) ? conv.coaches[0] : conv.coaches;
        return {
          id: conv.id,
          program_name: coach?.school_name || coach?.program_name || null,
          coach_name: coach?.full_name || null,
          last_message: conv.last_message_text,
          last_message_at: conv.last_message_at,
          unread_count: conv.player_unread_count || 0,
          program_logo: coach?.logo_url || null,
        };
      });
      setConversations(formatted);
      
      if (formatted.length > 0 && !selectedConversation) {
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
      const formatted: Message[] = messagesData.map((msg: { id: string; message_text: string; sender_type: string; created_at: string; read_by_program: boolean | null }) => ({
        id: msg.id,
        sender: msg.sender_type === 'coach' ? 'coach' : 'player',
        message_text: msg.message_text,
        created_at: msg.created_at,
        read: msg.read_by_program || false,
      }));
      setMessages(formatted);
    }

    // Mark messages as read
    await supabase
      .from('conversations')
      .update({ player_unread_count: 0 })
      .eq('id', conversationId);
    
    // Update local state
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, unread_count: 0 } : c
    ));
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    setSending(true);
    const supabase = createClient();
    
    let playerId: string | null = null;
    
    if (isDevMode()) {
      playerId = DEV_ENTITY_IDS.player;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: playerData } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!playerData) return;
      playerId = playerData.id;
    }

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: selectedConversation,
        sender_type: 'player',
        sender_player_id: playerId,
        message_text: messageText.trim(),
        read_by_player: true,
        read_by_program: false,
      });

    if (error) {
      toast.error('Failed to send message');
    } else {
      setMessageText('');
      loadMessages(selectedConversation);
      loadConversations();
    }

    setSending(false);
  };

  const handleSelectConversation = (convId: string) => {
    setSelectedConversation(convId);
    setShowMobileChat(true);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  if (loading) {
    return <MessagesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b1720] to-[#0f172a]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Messages</h1>
              <p className="text-white/60 text-sm mt-1">Connect with coaches and programs</p>
            </div>
            {totalUnread > 0 && (
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {totalUnread} unread
              </Badge>
            )}
          </div>
        </div>

        {/* Chat Container */}
        <div className={cn(glassCard, 'overflow-hidden h-[calc(100vh-180px)] flex')}>
          
          {/* Conversations List (Left) */}
          <div className={cn(
            'w-full md:w-80 lg:w-96 border-r border-white/[0.08] flex flex-col',
            showMobileChat ? 'hidden md:flex' : 'flex'
          )}>
            {/* Search */}
            <div className="p-4 border-b border-white/[0.08]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  className={cn(glassInput, 'w-full pl-10 py-2.5 text-sm')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center mb-3">
                    <MessageSquare className="w-7 h-7 text-white/30" />
                  </div>
                  <p className="text-white/70 font-medium">No conversations yet</p>
                  <p className="text-xs text-white/40 mt-1">Messages from coaches will appear here</p>
                </div>
              ) : (
                <div>
                  {conversations
                    .filter(conv => 
                      !searchQuery || 
                      conv.program_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      conv.coach_name?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv.id)}
                        className={cn(
                          'w-full p-4 text-left transition-all duration-150 border-l-2',
                          selectedConversation === conv.id 
                            ? 'bg-white/[0.06] border-emerald-500' 
                            : 'border-transparent hover:bg-white/[0.03]'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <Avatar className="w-11 h-11 ring-2 ring-white/10">
                              <AvatarImage src={conv.program_logo || undefined} />
                              <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-white text-sm font-medium">
                                {conv.program_name?.[0] || conv.coach_name?.[0] || 'C'}
                              </AvatarFallback>
                            </Avatar>
                            {conv.unread_count > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                {conv.unread_count}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className={cn(
                                'font-medium truncate',
                                conv.unread_count > 0 ? 'text-white' : 'text-white/90'
                              )}>
                                {conv.program_name || conv.coach_name || 'Unknown'}
                              </p>
                              {conv.last_message_at && (
                                <span className="text-[10px] text-white/40 flex-shrink-0 ml-2">
                                  {formatTime(conv.last_message_at)}
                                </span>
                              )}
                            </div>
                            <p className={cn(
                              'text-sm truncate',
                              conv.unread_count > 0 ? 'text-white/70 font-medium' : 'text-white/50'
                            )}>
                              {conv.last_message || 'No messages yet'}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat View (Right) */}
          <div className={cn(
            'flex-1 flex flex-col',
            showMobileChat ? 'flex' : 'hidden md:flex'
          )}>
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
                  <button 
                    onClick={() => setShowMobileChat(false)}
                    className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/[0.05] transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-white/70" />
                  </button>
                  <Avatar className="w-10 h-10 ring-2 ring-white/10">
                    <AvatarImage src={selectedConv.program_logo || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500/20 to-blue-500/20 text-white">
                      {selectedConv.program_name?.[0] || 'C'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">
                      {selectedConv.program_name || selectedConv.coach_name || 'Unknown'}
                    </p>
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                      <Circle className="w-2 h-2 fill-current" />
                      Active now
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-white/60 hover:text-white">
                      <Phone className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-white/60 hover:text-white">
                      <Video className="w-5 h-5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white/[0.05] transition-colors text-white/60 hover:text-white">
                      <Info className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto rounded-full bg-white/[0.06] flex items-center justify-center mb-4">
                          <MessageSquare className="w-8 h-8 text-white/30" />
                        </div>
                        <p className="text-white/70 font-medium">No messages yet</p>
                        <p className="text-xs text-white/40 mt-1">Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg, idx) => {
                        const isPlayer = msg.sender === 'player';
                        const showAvatar = idx === 0 || messages[idx - 1].sender !== msg.sender;
                        
                        return (
                          <div
                            key={msg.id}
                            className={cn('flex', isPlayer ? 'justify-end' : 'justify-start')}
                          >
                            <div className={cn('flex items-end gap-2 max-w-[75%]', isPlayer && 'flex-row-reverse')}>
                              {!isPlayer && showAvatar && (
                                <Avatar className="w-7 h-7 ring-1 ring-white/10 flex-shrink-0">
                                  <AvatarImage src={selectedConv.program_logo || undefined} />
                                  <AvatarFallback className="bg-white/[0.1] text-white text-xs">
                                    {selectedConv.program_name?.[0] || 'C'}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              {!isPlayer && !showAvatar && <div className="w-7" />}
                              
                              <div
                                className={cn(
                                  'rounded-2xl px-4 py-2.5',
                                  isPlayer 
                                    ? 'bg-emerald-500 text-white rounded-br-md' 
                                    : 'bg-white/[0.08] text-white/90 rounded-bl-md'
                                )}
                              >
                                <p className="text-sm leading-relaxed">{msg.message_text}</p>
                                <div className={cn(
                                  'flex items-center gap-1 mt-1',
                                  isPlayer ? 'justify-end' : 'justify-start'
                                )}>
                                  <p className={cn(
                                    'text-[10px]',
                                    isPlayer ? 'text-emerald-100' : 'text-white/40'
                                  )}>
                                    {formatTime(msg.created_at)}
                                  </p>
                                  {isPlayer && (
                                    <CheckCheck className={cn(
                                      'w-3.5 h-3.5',
                                      msg.read ? 'text-emerald-200' : 'text-emerald-100/60'
                                    )} />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <button className="p-2.5 rounded-xl hover:bg-white/[0.05] transition-colors text-white/50 hover:text-white/70">
                      <Paperclip className="w-5 h-5" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className={cn(glassInput, 'w-full py-3 pr-12')}
                      />
                      <button className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors">
                        <Smile className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className={cn(
                        'p-3 rounded-xl transition-all duration-200',
                        messageText.trim() 
                          ? 'bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/25' 
                          : 'bg-white/[0.05] text-white/30 cursor-not-allowed'
                      )}
                    >
                      {sending ? (
                        <div className="w-5 h-5 bg-white/20 rounded animate-pulse" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/[0.04] flex items-center justify-center mb-4">
                    <MessageSquare className="w-10 h-10 text-white/20" />
                  </div>
                  <p className="text-white/70 font-medium">Select a conversation</p>
                  <p className="text-xs text-white/40 mt-1">Choose a coach or program to message</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
