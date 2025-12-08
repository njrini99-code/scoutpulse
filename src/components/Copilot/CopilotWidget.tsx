import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2, TrendingUp, BarChart3, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  data?: any;
  query?: string;
}

interface SuggestedQuery {
  icon: typeof TrendingUp;
  text: string;
  query: string;
}

const SUGGESTED_QUERIES: SuggestedQuery[] = [
  {
    icon: TrendingUp,
    text: 'How many NPs this week?',
    query: 'How many NPs did I set this week?'
  },
  {
    icon: BarChart3,
    text: 'Best performing ZIP',
    query: 'Which ZIP code gives me the best close rate?'
  },
  {
    icon: Sparkles,
    text: 'Today\'s performance',
    query: 'Show me my performance summary for today'
  }
];

export function CopilotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (prompt: string) => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('tempo-copilot', {
        body: { prompt }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        data: data.data,
        query: data.query
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Oops! Something went wrong: ${error.message}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestedQuery = (query: string) => {
    sendMessage(query);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-110 z-50 group"
      >
        <MessageCircle className="w-6 h-6" />
        <div className="absolute -top-2 -right-2 bg-green-500 w-3 h-3 rounded-full border-2 border-white animate-pulse"></div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Ask Tempo Copilot
        </div>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h3 className="font-bold text-lg">Tempo Copilot</h3>
            <p className="text-xs text-blue-100">Your AI Sales Analyst</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-blue-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-full p-6 mb-4">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">Hey there!</h4>
            <p className="text-sm text-gray-600 mb-6 max-w-xs">
              I'm your AI sales analyst. Ask me anything about your KPIs, routes, or performance!
            </p>
            <div className="w-full space-y-2">
              {SUGGESTED_QUERIES.map((suggestion, idx) => {
                const Icon = suggestion.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuery(suggestion.query)}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left border border-gray-200 hover:border-blue-300"
                  >
                    <Icon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700">{suggestion.text}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.data && Array.isArray(message.data) && message.data.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="space-y-2">
                      {message.data.slice(0, 5).map((row: any, idx: number) => (
                        <div key={idx} className="text-xs bg-white p-2 rounded-lg">
                          {Object.entries(row).map(([key, value]) => (
                            <div key={key} className="flex justify-between gap-2">
                              <span className="font-medium text-gray-600">{key}:</span>
                              <span className="text-gray-900">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      ))}
                      {message.data.length > 5 && (
                        <p className="text-xs text-gray-500 italic">
                          +{message.data.length - 5} more rows
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your performance..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
