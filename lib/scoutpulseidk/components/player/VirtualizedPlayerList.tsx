'use client';

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
  memo,
  CSSProperties,
  ReactNode,
} from 'react';
import { FixedSizeList, ListChildComponentProps, areEqual } from 'react-window';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  Loader2,
  ArrowUp,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface VirtualPlayerData {
  id: string;
  full_name: string;
  grad_year: number;
  primary_position: string;
  secondary_position?: string | null;
  high_school_state?: string;
  avatar_url?: string | null;
  pitch_velo?: number | null;
  exit_velo?: number | null;
  sixty_time?: number | null;
  gpa?: number | null;
  height?: string | null;
  weight?: number | null;
  commitment_status?: 'uncommitted' | 'committed' | 'signed';
  college_name?: string | null;
}

export type SortField = 'full_name' | 'grad_year' | 'primary_position' | 'pitch_velo' | 'exit_velo' | 'sixty_time' | 'gpa';
export type SortOrder = 'asc' | 'desc';

export interface VirtualizedPlayerListProps {
  players: VirtualPlayerData[];
  height?: number;
  itemSize?: number;
  overscanCount?: number;
  onPlayerClick?: (player: VirtualPlayerData) => void;
  onPlayerSelect?: (playerId: string, selected: boolean) => void;
  selectedPlayerIds?: Set<string>;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableSort?: boolean;
  enableSelection?: boolean;
  renderActions?: (player: VirtualPlayerData) => ReactNode;
  emptyMessage?: string;
  className?: string;
}

interface RowData {
  players: VirtualPlayerData[];
  onPlayerClick?: (player: VirtualPlayerData) => void;
  onPlayerSelect?: (playerId: string, selected: boolean) => void;
  selectedPlayerIds?: Set<string>;
  enableSelection?: boolean;
  renderActions?: (player: VirtualPlayerData) => ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// CSS STYLES
// ═══════════════════════════════════════════════════════════════════════════

const virtualListStyles = `
/* Row hover effect */
@keyframes row-hover-glow {
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3); }
}

.virtual-row:hover {
  animation: row-hover-glow 0.2s ease-out forwards;
}

/* Selection animation */
@keyframes row-select {
  0% { background-color: rgba(16, 185, 129, 0); }
  50% { background-color: rgba(16, 185, 129, 0.2); }
  100% { background-color: rgba(16, 185, 129, 0.1); }
}

.virtual-row-selected {
  animation: row-select 0.3s ease-out forwards;
}

/* Checkbox animation */
@keyframes checkbox-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.checkbox-animated:checked {
  animation: checkbox-pop 0.2s ease-out;
}

/* Scroll to top button */
@keyframes scroll-top-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

.scroll-top-btn:hover {
  animation: scroll-top-bounce 0.5s ease-in-out infinite;
}

/* Filter dropdown */
@keyframes filter-dropdown {
  0% { opacity: 0; transform: translateY(-10px); }
  100% { opacity: 1; transform: translateY(0); }
}

.filter-dropdown {
  animation: filter-dropdown 0.2s ease-out forwards;
}
`;

let stylesInjected = false;
function injectStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'virtual-list-styles';
  style.textContent = virtualListStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// ROW COMPONENT (Memoized for performance)
// ═══════════════════════════════════════════════════════════════════════════

const PlayerRow = memo(function PlayerRow({
  index,
  style,
  data,
}: ListChildComponentProps<RowData>) {
  const {
    players,
    onPlayerClick,
    onPlayerSelect,
    selectedPlayerIds,
    enableSelection,
    renderActions,
  } = data;
  
  const player = players[index];
  if (!player) return null;

  const isSelected = selectedPlayerIds?.has(player.id) ?? false;

  const initials = player.full_name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formatMetric = (value: number | null | undefined, unit: string) => {
    if (!value || value === 0) return null;
    return `${value}${unit}`;
  };

  const metrics = [
    { label: 'Pitch', value: formatMetric(player.pitch_velo, ' mph') },
    { label: 'Exit', value: formatMetric(player.exit_velo, ' mph') },
    { label: '60yd', value: formatMetric(player.sixty_time, 's') },
  ].filter((m) => m.value);

  const handleClick = () => {
    onPlayerClick?.(player);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    onPlayerSelect?.(player.id, e.target.checked);
  };

  // Adjust style to add padding between items
  const rowStyle: CSSProperties = {
    ...style,
    top: `${parseFloat(style.top as string) + 4}px`,
    height: `${parseFloat(style.height as string) - 8}px`,
    paddingLeft: '8px',
    paddingRight: '8px',
  };

  return (
    <div style={rowStyle}>
      <div
        className={cn(
          'virtual-row flex items-center gap-3 h-full px-4 rounded-xl bg-[#111315] border border-white/5 hover:border-blue-500/30 transition-all duration-200 cursor-pointer',
          isSelected && 'virtual-row-selected border-emerald-500/30'
        )}
        onClick={handleClick}
      >
        {/* Selection checkbox */}
        {enableSelection && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={handleSelect}
              className="checkbox-animated w-4 h-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/20 focus:ring-offset-0"
            />
          </div>
        )}

        {/* Avatar */}
        <Avatar className="h-12 w-12 shrink-0 border-2 border-blue-500/30">
          <AvatarImage src={player.avatar_url || undefined} alt={player.full_name} />
          <AvatarFallback className="bg-blue-500/10 text-blue-300 font-semibold text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>

        {/* Player Info */}
        <div className="flex-1 min-w-0 py-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-white truncate">{player.full_name}</p>
            <Badge variant="outline" className="text-xs shrink-0">
              {player.grad_year}
            </Badge>
            {player.high_school_state && (
              <span className="text-xs text-slate-400 shrink-0">{player.high_school_state}</span>
            )}
            {player.commitment_status === 'committed' && player.college_name && (
              <Badge className="text-xs bg-emerald-500/20 text-emerald-300 border-emerald-500/30 shrink-0">
                {player.college_name}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {player.primary_position}
            </Badge>
            {player.secondary_position && (
              <Badge variant="outline" className="text-xs">
                {player.secondary_position}
              </Badge>
            )}
            {metrics.length > 0 && (
              <div className="flex gap-3 text-xs text-slate-400">
                {metrics.map((metric, i) => (
                  <span key={i} className="whitespace-nowrap">
                    <span className="text-slate-500">{metric.label}:</span>{' '}
                    <span className="text-white/80">{metric.value}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {renderActions && (
          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
            {renderActions(player)}
          </div>
        )}
      </div>
    </div>
  );
}, areEqual);

// ═══════════════════════════════════════════════════════════════════════════
// SEARCH BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function SearchBar({ value, onChange, placeholder = 'Search players...' }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER BAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface FilterBarProps {
  positions: string[];
  selectedPositions: Set<string>;
  onPositionToggle: (position: string) => void;
  gradYears: number[];
  selectedGradYears: Set<number>;
  onGradYearToggle: (year: number) => void;
  sortField: SortField;
  sortOrder: SortOrder;
  onSortChange: (field: SortField) => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

function FilterBar({
  positions,
  selectedPositions,
  onPositionToggle,
  gradYears,
  selectedGradYears,
  onGradYearToggle,
  sortField,
  sortOrder,
  onSortChange,
  onClearFilters,
  hasActiveFilters,
}: FilterBarProps) {
  const [showPositions, setShowPositions] = useState(false);
  const [showYears, setShowYears] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const sortOptions: { field: SortField; label: string }[] = [
    { field: 'full_name', label: 'Name' },
    { field: 'grad_year', label: 'Class' },
    { field: 'primary_position', label: 'Position' },
    { field: 'pitch_velo', label: 'Pitch Velo' },
    { field: 'exit_velo', label: 'Exit Velo' },
    { field: 'sixty_time', label: '60yd Time' },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Position Filter */}
      <div className="relative">
        <button
          onClick={() => {
            setShowPositions(!showPositions);
            setShowYears(false);
            setShowSort(false);
          }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
            selectedPositions.size > 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/20'
          )}
        >
          <Filter className="w-4 h-4" />
          Position
          {selectedPositions.size > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-xs">
              {selectedPositions.size}
            </span>
          )}
          <ChevronDown className={cn('w-3 h-3 transition-transform', showPositions && 'rotate-180')} />
        </button>

        {showPositions && (
          <div className="filter-dropdown absolute top-full left-0 mt-2 p-2 rounded-xl bg-slate-900 border border-white/10 shadow-xl z-50 min-w-[160px]">
            {positions.map((pos) => (
              <label
                key={pos}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedPositions.has(pos)}
                  onChange={() => onPositionToggle(pos)}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-emerald-500"
                />
                <span className="text-sm text-slate-300">{pos}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Grad Year Filter */}
      <div className="relative">
        <button
          onClick={() => {
            setShowYears(!showYears);
            setShowPositions(false);
            setShowSort(false);
          }}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
            selectedGradYears.size > 0
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-white/5 text-slate-300 border border-white/10 hover:border-white/20'
          )}
        >
          Class
          {selectedGradYears.size > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/30 text-xs">
              {selectedGradYears.size}
            </span>
          )}
          <ChevronDown className={cn('w-3 h-3 transition-transform', showYears && 'rotate-180')} />
        </button>

        {showYears && (
          <div className="filter-dropdown absolute top-full left-0 mt-2 p-2 rounded-xl bg-slate-900 border border-white/10 shadow-xl z-50 min-w-[120px]">
            {gradYears.map((year) => (
              <label
                key={year}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedGradYears.has(year)}
                  onChange={() => onGradYearToggle(year)}
                  className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 text-emerald-500"
                />
                <span className="text-sm text-slate-300">{year}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Sort */}
      <div className="relative">
        <button
          onClick={() => {
            setShowSort(!showSort);
            setShowPositions(false);
            setShowYears(false);
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-slate-300 border border-white/10 hover:border-white/20 text-sm transition-all"
        >
          {sortOrder === 'asc' ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
          Sort: {sortOptions.find((o) => o.field === sortField)?.label}
        </button>

        {showSort && (
          <div className="filter-dropdown absolute top-full left-0 mt-2 p-2 rounded-xl bg-slate-900 border border-white/10 shadow-xl z-50 min-w-[140px]">
            {sortOptions.map((option) => (
              <button
                key={option.field}
                onClick={() => {
                  onSortChange(option.field);
                  setShowSort(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left transition-colors',
                  sortField === option.field
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-slate-300 hover:bg-white/5'
                )}
              >
                {option.label}
                {sortField === option.field && (
                  sortOrder === 'asc' ? (
                    <ChevronUp className="w-3 h-3 ml-auto" />
                  ) : (
                    <ChevronDown className="w-3 h-3 ml-auto" />
                  )
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN VIRTUALIZED PLAYER LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function VirtualizedPlayerList({
  players,
  height = 600,
  itemSize = 120,
  overscanCount = 5,
  onPlayerClick,
  onPlayerSelect,
  selectedPlayerIds = new Set(),
  enableSearch = true,
  enableFilters = true,
  enableSort = true,
  enableSelection = false,
  renderActions,
  emptyMessage = 'No players found',
  className,
}: VirtualizedPlayerListProps) {
  // Refs
  const listRef = useRef<FixedSizeList>(null);

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPositions, setSelectedPositions] = useState<Set<string>>(new Set());
  const [selectedGradYears, setSelectedGradYears] = useState<Set<number>>(new Set());
  const [sortField, setSortField] = useState<SortField>('full_name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Inject styles
  useEffect(() => {
    injectStyles();
  }, []);

  // Extract unique positions and grad years for filters
  const { positions, gradYears } = useMemo(() => {
    const posSet = new Set<string>();
    const yearSet = new Set<number>();

    players.forEach((p) => {
      posSet.add(p.primary_position);
      if (p.secondary_position) posSet.add(p.secondary_position);
      yearSet.add(p.grad_year);
    });

    return {
      positions: Array.from(posSet).sort(),
      gradYears: Array.from(yearSet).sort((a, b) => a - b),
    };
  }, [players]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    let result = [...players];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.full_name.toLowerCase().includes(query) ||
          p.primary_position.toLowerCase().includes(query) ||
          p.secondary_position?.toLowerCase().includes(query) ||
          p.high_school_state?.toLowerCase().includes(query) ||
          p.college_name?.toLowerCase().includes(query)
      );
    }

    // Position filter
    if (selectedPositions.size > 0) {
      result = result.filter(
        (p) =>
          selectedPositions.has(p.primary_position) ||
          (p.secondary_position && selectedPositions.has(p.secondary_position))
      );
    }

    // Grad year filter
    if (selectedGradYears.size > 0) {
      result = result.filter((p) => selectedGradYears.has(p.grad_year));
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortField) {
        case 'full_name':
          aVal = a.full_name;
          bVal = b.full_name;
          break;
        case 'grad_year':
          aVal = a.grad_year;
          bVal = b.grad_year;
          break;
        case 'primary_position':
          aVal = a.primary_position;
          bVal = b.primary_position;
          break;
        case 'pitch_velo':
          aVal = a.pitch_velo ?? 0;
          bVal = b.pitch_velo ?? 0;
          break;
        case 'exit_velo':
          aVal = a.exit_velo ?? 0;
          bVal = b.exit_velo ?? 0;
          break;
        case 'sixty_time':
          aVal = a.sixty_time ?? 999;
          bVal = b.sixty_time ?? 999;
          break;
        case 'gpa':
          aVal = a.gpa ?? 0;
          bVal = b.gpa ?? 0;
          break;
      }

      if (aVal === null || bVal === null) return 0;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = (aVal as number) - (bVal as number);
      }

      // For 60yd time, lower is better, so reverse for desc
      if (sortField === 'sixty_time') {
        comparison = -comparison;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [players, searchQuery, selectedPositions, selectedGradYears, sortField, sortOrder]);

  // Handlers
  const handlePositionToggle = useCallback((position: string) => {
    setSelectedPositions((prev) => {
      const next = new Set(prev);
      if (next.has(position)) {
        next.delete(position);
      } else {
        next.add(position);
      }
      return next;
    });
  }, []);

  const handleGradYearToggle = useCallback((year: number) => {
    setSelectedGradYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  }, []);

  const handleSortChange = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedPositions(new Set());
    setSelectedGradYears(new Set());
    setSortField('full_name');
    setSortOrder('asc');
  }, []);

  const handleScroll = useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    setShowScrollTop(scrollOffset > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollTo(0);
  }, []);

  const hasActiveFilters =
    searchQuery !== '' || selectedPositions.size > 0 || selectedGradYears.size > 0;

  // Row data for virtualized list
  const rowData: RowData = useMemo(
    () => ({
      players: filteredPlayers,
      onPlayerClick,
      onPlayerSelect,
      selectedPlayerIds,
      enableSelection,
      renderActions,
    }),
    [filteredPlayers, onPlayerClick, onPlayerSelect, selectedPlayerIds, enableSelection, renderActions]
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with search and stats */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {enableSearch && (
          <div className="flex-1 min-w-[200px] max-w-md">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        )}

        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Users className="w-4 h-4" />
          <span>
            {filteredPlayers.length.toLocaleString()} of {players.length.toLocaleString()} players
          </span>
          {enableSelection && selectedPlayerIds.size > 0 && (
            <span className="text-emerald-400">
              • {selectedPlayerIds.size} selected
            </span>
          )}
        </div>
      </div>

      {/* Filters */}
      {(enableFilters || enableSort) && (
        <FilterBar
          positions={positions}
          selectedPositions={selectedPositions}
          onPositionToggle={handlePositionToggle}
          gradYears={gradYears}
          selectedGradYears={selectedGradYears}
          onGradYearToggle={handleGradYearToggle}
          sortField={sortField}
          sortOrder={sortOrder}
          onSortChange={handleSortChange}
          onClearFilters={handleClearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      {/* Virtualized List */}
      <div className="relative rounded-xl overflow-hidden bg-white/[0.02] border border-white/5">
        {filteredPlayers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <Users className="w-12 h-12 text-slate-600 mb-4" />
            <p className="text-slate-400">{emptyMessage}</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-3 px-4 py-2 text-sm text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <FixedSizeList
            ref={listRef}
            height={height}
            width="100%"
            itemCount={filteredPlayers.length}
            itemSize={itemSize}
            itemData={rowData}
            overscanCount={overscanCount}
            onScroll={handleScroll}
            className="scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent"
          >
            {PlayerRow}
          </FixedSizeList>
        )}

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="scroll-top-btn absolute bottom-4 right-4 p-3 rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600 transition-colors"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Performance stats (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-slate-600 text-center">
          Rendering {Math.min(Math.ceil(height / itemSize) + overscanCount * 2, filteredPlayers.length)} of{' '}
          {filteredPlayers.length} items (virtualized)
        </p>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default VirtualizedPlayerList;
