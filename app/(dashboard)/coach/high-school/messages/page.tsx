'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  MessageSquare, 
  Search,
  Send,
  Users,
  User,
  Plus,
  ChevronRight,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import { isDevMode, DEV_ENTITY_IDS } from '@/lib/dev-mode';

interface TeamPlayer {
  id: string;
  player_id: string;
  player_name: string;
  avatar_url: string | null;
  position: string | null;
  grad_year: number | null;
  jersey_number: number | null;
}

interface Conversation {
  id: string;
  player_id: string;
  player_name: string;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  avatar_url: string | null;
}

interface Message {
  id: string;
  sender_type: 'coach' | 'player';
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function HSCoachMessagesPage() {
  const { isDark } = useTheme();
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'roster' | 'conversations'>('conversations');

  const theme = {
    bg: isDark ? 'bg-[#050711]' : 'bg-gradient-to-br from-emerald-50 via-white to-teal-50',
    cardBg: isDark ? 'bg-[#0B1020] border-white/5' : 'bg-white/90 border-emerald-200/60 shadow-lg',
    text: isDark ? 'text-white' : 'text-slate-800',
    textMuted: isDark ? 'text-white/50' : 'text-slate-500',
    inputBg: isDark ? 'bg-[#050711] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-emerald-200 text-slate-800',
    hover: isDark ? 'hover:bg-white/5' : 'hover:bg-emerald-50',
    active: isDark ? 'bg-emerald-500/10 border-l-2 border-emerald-500' : 'bg-emerald-50 border-l-2 border-emerald-500',
    bubbleCoach: isDark ? 'bg-emerald-600' : 'bg-emerald-500',
    bubblePlayer: isDark ? 'bg-white/10' : 'bg-emerald-100',
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedPlayerId) {
      loadMessages(selectedPlayerId);
    }
  }, [selectedPlayerId]);

  const loadData = async () => {
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

    // Get team players via team_memberships
    const { data: teams } = await supabase
      .from('teams')
      .select('id')
      .eq('coach_id', coachId);

    const teamIds = (teams || []).map(t => t.id);

    if (teamIds.length > 0) {
      const { data: memberships } = await supabase
        .from('team_memberships')
        .select(`
          player_id,
          jersey_number,
          players:player_id (
            id,
            first_name,
            last_name,
            avatar_url,
            primary_position,
            grad_year
          )
        `)
        .in('team_id', teamIds)
        .or('status.is.null,status.eq.active');

      if (memberships) {
        const players: TeamPlayer[] = memberships
          .filter((m: any) => m.players)
          .map((m: any) => ({
            id: m.player_id,
            player_id: m.player_id,
            player_name: `${m.players?.first_name || ''} ${m.players?.last_name || ''}`.trim(),
            avatar_url: m.players?.avatar_url || null,
            position: m.players?.primary_position || null,
            grad_year: m.players?.grad_year || null,
            jersey_number: m.jersey_number,
          }));
        setTeamPlayers(players);
      }
    }

    // Get existing conversations
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
          last_name,
          avatar_url
        )
      `)
      .eq('program_id', coachId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (convData) {
      const convs: Conversation[] = convData.map((c: any) => ({
        id: c.id,
        player_id: c.player_id,
        player_name: c.players ? `${c.players.first_name || ''} ${c.players.last_name || ''}`.trim() : 'Player',
        last_message: c.last_message_text,
        last_message_at: c.last_message_at,
        unread_count: c.program_unread_count || 0,
        avatar_url: c.players?.avatar_url || null,
      }));
      setConversations(convs);
      
      if (convs.length > 0 && !selectedPlayerId) {
        setSelectedPlayerId(convs[0].player_id);
      }
    }

    setLoading(false);
  };

  const loadMessages = async (playerId: string) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: coachData } = await supabase
      .from('coaches')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!coachData) return;

    // Find or get conversation
    const { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('player_id', playerId)
      .eq('program_id', coachData.id)
      .maybeSingle();

    if (!conv) {
      setMessages([]);
      return;
    }

    const { data: msgData } = await supabase
      .from('messages')
      .select('id, sender_type, message_text, content, created_at, read_by_program')
      .eq('conversation_id', conv.id)
      .order('created_at', { ascending: true });

    if (msgData) {
      setMessages(msgData.map((m: any) => ({
        id: m.id,
        sender_type: m.sender_type,
        content: m.content || m.message_text,
        created_at: m.created_at,
        is_read: m.read_by_program,
      })));
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPlayerId) return;

    setSending(true);
    const supabase = createClient();
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

    // Find or create conversation
    let { data: conv } = await supabase
      .from('conversations')
      .select('id')
      .eq('player_id', selectedPlayerId)
      .eq('program_id', coachData.id)
      .maybeSingle();

    if (!conv) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          player_id: selectedPlayerId,
          program_id: coachData.id,
          type: 'direct',
        })
        .select('id')
        .single();
      conv = newConv;
    }

    if (!conv) {
      setSending(false);
      return;
    }

    // Send message
    await supabase
      .from('messages')
      .insert({
        conversation_id: conv.id,
        sender_type: 'coach',
        sender_program_id: coachData.id,
        message_text: messageText.trim(),
        content: messageText.trim(),
        read_by_program: true,
        read_by_player: false,
      });

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message_text: messageText.trim().substring(0, 100),
        last_message_at: new Date().toISOString(),
        last_sender: 'coach',
      })
      .eq('id', conv.id);

    setMessageText('');
    loadMessages(selectedPlayerId);
    loadData();
    setSending(false);
  };

  const filteredPlayers = teamPlayers.filter(p => 
    p.player_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPlayer = teamPlayers.find(p => p.player_id === selectedPlayerId) ||
    conversations.find(c => c.player_id === selectedPlayerId);

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className="w-8 h-8 bg-emerald-500/20 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg}`}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl font-bold ${theme.text}`}>Team Messages</h1>
          <p className={theme.textMuted}>Communicate with your players</p>
        </div>

        {/* 3-Column Layout */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
          {/* Column 1: Player List */}
          <div className={`col-span-3 rounded-xl border ${theme.cardBg} flex flex-col`}>
            {/* Tabs */}
            <div className="flex border-b border-white/5">
              <button
                onClick={() => setView('conversations')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  view === 'conversations' 
                    ? 'text-emerald-400 border-b-2 border-emerald-400' 
                    : theme.textMuted
                }`}
              >
                <MessageSquare className="w-4 h-4 mx-auto mb-1" />
                Chats
              </button>
              <button
                onClick={() => setView('roster')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  view === 'roster' 
                    ? 'text-emerald-400 border-b-2 border-emerald-400' 
                    : theme.textMuted
                }`}
              >
                <Users className="w-4 h-4 mx-auto mb-1" />
                Roster
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${theme.textMuted}`} />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {view === 'conversations' ? (
                conversations.length === 0 ? (
                  <div className={`p-6 text-center ${theme.textMuted}`}>
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                    <button
                      onClick={() => setView('roster')}
                      className="mt-2 text-emerald-400 text-sm hover:underline"
                    >
                      Message a player →
                    </button>
                  </div>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedPlayerId(conv.player_id)}
                      className={`w-full p-3 flex items-center gap-3 transition-colors ${
                        selectedPlayerId === conv.player_id ? theme.active : theme.hover
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-medium">
                        {conv.player_name[0]}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between">
                          <p className={`font-medium truncate ${theme.text}`}>{conv.player_name}</p>
                          {conv.unread_count > 0 && (
                            <span className="px-1.5 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className={`text-sm truncate ${theme.textMuted}`}>{conv.last_message}</p>
                        )}
                      </div>
                    </button>
                  ))
                )
              ) : (
                filteredPlayers.length === 0 ? (
                  <div className={`p-6 text-center ${theme.textMuted}`}>
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No players found</p>
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedPlayerId(player.player_id);
                        setView('conversations');
                      }}
                      className={`w-full p-3 flex items-center gap-3 transition-colors ${
                        selectedPlayerId === player.player_id ? theme.active : theme.hover
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 font-medium">
                        {player.jersey_number || player.player_name[0]}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <p className={`font-medium truncate ${theme.text}`}>{player.player_name}</p>
                        <p className={`text-sm ${theme.textMuted}`}>
                          {player.position} • {player.grad_year}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${theme.textMuted}`} />
                    </button>
                  ))
                )
              )}
            </div>
          </div>

          {/* Column 2 & 3: Chat View */}
          <div className={`col-span-9 rounded-xl border ${theme.cardBg} flex flex-col`}>
            {selectedPlayer ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-medium">
                    {selectedPlayer.player_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className={`font-medium ${theme.text}`}>
                      {selectedPlayer.player_name || 'Unknown'}
                    </p>
                    <p className={`text-sm ${theme.textMuted}`}>
                      {'position' in selectedPlayer && (selectedPlayer as TeamPlayer).position ? `${(selectedPlayer as TeamPlayer).position} • ` : ''}
                      {'grad_year' in selectedPlayer && (selectedPlayer as TeamPlayer).grad_year ? `Class of ${(selectedPlayer as TeamPlayer).grad_year}` : 'Player'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className={`flex items-center justify-center h-full ${theme.textMuted}`}>
                      <div className="text-center">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-1">Send a message to start the conversation</p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_type === 'coach' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.sender_type === 'coach'
                              ? `${theme.bubbleCoach} text-white`
                              : `${theme.bubblePlayer} ${theme.text}`
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${
                            msg.sender_type === 'coach' ? 'text-white/60' : theme.textMuted
                          }`}>
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.sender_type === 'coach' && (
                              msg.is_read ? <CheckCheck className="w-3 h-3 ml-1" /> : <Check className="w-3 h-3 ml-1" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className={`flex-1 px-4 py-2 rounded-xl ${theme.inputBg} focus:outline-none focus:ring-2 focus:ring-emerald-500/50`}
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sending}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl flex items-center gap-2 transition-colors"
                    >
                      {sending ? (
                        <div className="w-4 h-4 bg-white/20 rounded animate-pulse" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className={`flex items-center justify-center h-full ${theme.textMuted}`}>
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Select a conversation</p>
                  <p className="text-sm">Choose a player from the list to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

