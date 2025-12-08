'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, Mic, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ParsedFilters {
  position?: string;
  location?: string;
  state?: string;
  graduationYear?: number;
  handedness?: 'left' | 'right';
  stats?: Record<string, any>;
}

interface NaturalLanguageSearchProps {
  onSearch: (filters: ParsedFilters, query: string) => void;
  placeholder?: string;
}

export function NaturalLanguageSearch({ 
  onSearch, 
  placeholder = "Try: 'left-handed pitchers in California graduating 2025'" 
}: NaturalLanguageSearchProps) {
  const [query, setQuery] = useState('');
  const [parsedFilters, setParsedFilters] = useState<ParsedFilters | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Load recent searches
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('recent_natural_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    }

    // Initialize Web Speech API
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        handleParse(transcript);
        setIsListening(false);
      };
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleParse = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setParsedFilters(null);
      return;
    }

    setIsParsing(true);

    try {
      // Simple rule-based parsing (can be enhanced with AI)
      const filters: ParsedFilters = {};
      const lowerQuery = searchQuery.toLowerCase();

      // Position detection
      const positions = ['pitcher', 'catcher', 'first base', 'second base', 'third base', 'shortstop', 'outfielder', 'infielder'];
      for (const pos of positions) {
        if (lowerQuery.includes(pos)) {
          filters.position = pos;
          break;
        }
      }

      // Handedness
      if (lowerQuery.includes('left-handed') || lowerQuery.includes('left handed') || lowerQuery.includes('lhp')) {
        filters.handedness = 'left';
      } else if (lowerQuery.includes('right-handed') || lowerQuery.includes('right handed') || lowerQuery.includes('rhp')) {
        filters.handedness = 'right';
      }

      // Location/State
      const states = ['california', 'texas', 'florida', 'new york', 'georgia', 'north carolina', 'arizona', 'nevada'];
      for (const state of states) {
        if (lowerQuery.includes(state)) {
          filters.state = state;
          filters.location = state;
          break;
        }
      }

      // Graduation year
      const yearMatch = searchQuery.match(/\b(20\d{2})\b/);
      if (yearMatch) {
        filters.graduationYear = parseInt(yearMatch[1]);
      }

      // Stats (simple patterns)
      const eraMatch = searchQuery.match(/era\s*(?:under|below|<\s*)?\s*(\d+\.?\d*)/i);
      if (eraMatch) {
        filters.stats = { ...filters.stats, maxEra: parseFloat(eraMatch[1]) };
      }

      const velocityMatch = searchQuery.match(/(?:velocity|velo|mph)\s*(?:over|above|>\s*)?\s*(\d+)/i);
      if (velocityMatch) {
        filters.stats = { ...filters.stats, minVelocity: parseInt(velocityMatch[1]) };
      }

      setParsedFilters(filters);
      
      // Save to recent searches
      if (typeof window !== 'undefined') {
        const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recent_natural_searches', JSON.stringify(updated));
      }

      // Trigger search
      onSearch(filters, searchQuery);
    } catch (error) {
      console.error('Error parsing query:', error);
    } finally {
      setIsParsing(false);
    }
  }, [onSearch, recentSearches]);

  const handleVoiceSearch = () => {
    if (!recognitionRef.current) {
      alert('Voice search not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleParse(query);
  };

  const removeFilter = (key: keyof ParsedFilters) => {
    if (!parsedFilters) return;
    const updated = { ...parsedFilters };
    delete updated[key];
    setParsedFilters(Object.keys(updated).length > 0 ? updated : null);
    // Re-run search without this filter
    onSearch(updated, query);
  };

  return (
    <div className="space-y-3">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-9 pr-20"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isParsing && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleVoiceSearch}
            disabled={!recognitionRef.current}
          >
            <Mic className={cn("w-4 h-4", isListening && "text-red-500 animate-pulse")} />
          </Button>
        </div>
      </form>

      {/* Parsed Filters */}
      {parsedFilters && Object.keys(parsedFilters).length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Filters:</span>
          {parsedFilters.position && (
            <Badge variant="secondary" className="gap-1">
              Position: {parsedFilters.position}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('position')} />
            </Badge>
          )}
          {parsedFilters.state && (
            <Badge variant="secondary" className="gap-1">
              Location: {parsedFilters.state}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('state')} />
            </Badge>
          )}
          {parsedFilters.graduationYear && (
            <Badge variant="secondary" className="gap-1">
              Class: {parsedFilters.graduationYear}
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('graduationYear')} />
            </Badge>
          )}
          {parsedFilters.handedness && (
            <Badge variant="secondary" className="gap-1">
              {parsedFilters.handedness === 'left' ? 'Left' : 'Right'}-handed
              <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter('handedness')} />
            </Badge>
          )}
        </div>
      )}

      {/* Recent Searches */}
      {recentSearches.length > 0 && query === '' && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Recent searches:</p>
          <div className="flex flex-wrap gap-1">
            {recentSearches.map((search, idx) => (
              <Button
                key={idx}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setQuery(search);
                  handleParse(search);
                }}
              >
                {search}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
