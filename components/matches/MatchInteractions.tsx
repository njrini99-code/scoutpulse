'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronUp,
  Filter,
  SortAsc,
  SortDesc,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Copy,
  MoreHorizontal,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Star,
  ArrowUpDown,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const matchStyles = `
/* Expand/collapse animation */
@keyframes expand-content {
  0% { opacity: 0; max-height: 0; }
  100% { opacity: 1; max-height: 1000px; }
}

@keyframes collapse-content {
  0% { opacity: 1; max-height: 1000px; }
  100% { opacity: 0; max-height: 0; }
}

.match-expand {
  animation: expand-content 0.3s ease-out forwards;
  overflow: hidden;
}

.match-collapse {
  animation: collapse-content 0.2s ease-in forwards;
  overflow: hidden;
}

/* Status update pulse */
@keyframes status-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 currentColor; }
  50% { transform: scale(1.05); box-shadow: 0 0 0 8px transparent; }
  100% { transform: scale(1); box-shadow: 0 0 0 0 transparent; }
}

.status-updating {
  animation: status-pulse 0.5s ease-out;
}

/* Row highlight on selection */
@keyframes row-select {
  0% { background-color: rgba(16, 185, 129, 0.3); }
  100% { background-color: rgba(16, 185, 129, 0.1); }
}

.row-selected {
  animation: row-select 0.3s ease-out forwards;
}

/* Action button hover */
@keyframes action-pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

.action-btn:active {
  animation: action-pop 0.15s ease-out;
}

/* Dropdown slide */
@keyframes dropdown-slide {
  0% { opacity: 0; transform: translateY(-8px); }
  100% { opacity: 1; transform: translateY(0); }
}

.dropdown-enter {
  animation: dropdown-slide 0.2s ease-out forwards;
}

/* Modal animations */
@keyframes modal-backdrop-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes modal-content-in {
  0% { opacity: 0; transform: scale(0.95) translateY(10px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-backdrop {
  animation: modal-backdrop-in 0.2s ease-out forwards;
}

.modal-content {
  animation: modal-content-in 0.25s ease-out forwards;
}

/* Optimistic UI fade */
@keyframes optimistic-fade {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.optimistic-pending {
  animation: optimistic-fade 1s ease-in-out infinite;
}

/* Checkbox animation */
@keyframes checkbox-check {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.checkbox-checked .check-icon {
  animation: checkbox-check 0.2s ease-out forwards;
}

/* Bulk action bar slide */
@keyframes bulk-bar-in {
  0% { opacity: 0; transform: translateY(20px); }
  100% { opacity: 1; transform: translateY(0); }
}

.bulk-bar {
  animation: bulk-bar-in 0.3s ease-out forwards;
}

/* Sort indicator */
@keyframes sort-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.sort-active {
  animation: sort-bounce 0.3s ease-out;
}
`;

let stylesInjected = false;
function injectMatchStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'match-interactions-styles';
  style.textContent = matchStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

type MatchStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'postponed';

interface Match {
  id: string;
  title: string;
  status: MatchStatus;
  date: string;
  time?: string;
  location?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  description?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

interface FilterOption {
  id: string;
  label: string;
  value: string;
  count?: number;
}

interface SortOption {
  id: string;
  label: string;
  field: keyof Match;
  direction: 'asc' | 'desc';
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCH CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface MatchContextValue {
  selectedIds: Set<string>;
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  expandedId: string | null;
  toggleExpanded: (id: string) => void;
  pendingUpdates: Set<string>;
}

const MatchContext = createContext<MatchContextValue | null>(null);

function useMatchContext() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatchContext must be used within MatchProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCH PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface MatchProviderProps {
  children: ReactNode;
  matches: Match[];
}

export function MatchProvider({ children, matches }: MatchProviderProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());

  useEffect(() => {
    injectMatchStyles();
  }, []);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(matches.map((m) => m.id)));
  }, [matches]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const toggleExpanded = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const value = useMemo(
    () => ({
      selectedIds,
      toggleSelection,
      selectAll,
      clearSelection,
      isSelected,
      expandedId,
      toggleExpanded,
      pendingUpdates,
    }),
    [selectedIds, toggleSelection, selectAll, clearSelection, isSelected, expandedId, toggleExpanded, pendingUpdates]
  );

  return <MatchContext.Provider value={value}>{children}</MatchContext.Provider>;
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════════════

const statusConfig: Record<MatchStatus, { icon: LucideIcon; label: string; color: string }> = {
  scheduled: { icon: Clock, label: 'Scheduled', color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' },
  in_progress: { icon: Loader2, label: 'In Progress', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' },
  completed: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-400 bg-red-500/20 border-red-500/30' },
  postponed: { icon: Clock, label: 'Postponed', color: 'text-purple-400 bg-purple-500/20 border-purple-500/30' },
};

interface StatusBadgeProps {
  status: MatchStatus;
  isUpdating?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, isUpdating, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-3 py-1 text-sm gap-1.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border transition-all',
        config.color,
        sizeClasses[size],
        isUpdating && 'status-updating',
        className
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', status === 'in_progress' && 'animate-spin')} />
      {config.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATUS SELECTOR (Optimistic UI)
// ═══════════════════════════════════════════════════════════════════════════

interface StatusSelectorProps {
  currentStatus: MatchStatus;
  onStatusChange: (status: MatchStatus) => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function StatusSelector({ currentStatus, onStatusChange, disabled, className }: StatusSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState<MatchStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const displayStatus = optimisticStatus ?? currentStatus;

  const handleStatusChange = async (newStatus: MatchStatus) => {
    if (newStatus === currentStatus || disabled) return;

    setIsOpen(false);
    setOptimisticStatus(newStatus);
    setIsUpdating(true);

    try {
      await onStatusChange(newStatus);
    } catch {
      // Revert on error
      setOptimisticStatus(null);
    } finally {
      setIsUpdating(false);
      setOptimisticStatus(null);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || isUpdating}
        className={cn(
          'flex items-center gap-2 transition-all',
          isUpdating && 'optimistic-pending',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <StatusBadge status={displayStatus} isUpdating={isUpdating} />
        {!disabled && <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full mt-2 z-50 dropdown-enter">
            <div className="p-2 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[160px]">
              {(Object.keys(statusConfig) as MatchStatus[]).map((status) => {
                const config = statusConfig[status];
                const Icon = config.icon;
                const isActive = status === displayStatus;

                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1 text-left">{config.label}</span>
                    {isActive && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHECKBOX
// ═══════════════════════════════════════════════════════════════════════════

interface CheckboxProps {
  checked: boolean;
  onChange: () => void;
  indeterminate?: boolean;
  disabled?: boolean;
  className?: string;
}

function Checkbox({ checked, onChange, indeterminate, disabled, className }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      disabled={disabled}
      className={cn(
        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
        checked || indeterminate
          ? 'bg-emerald-500 border-emerald-500 checkbox-checked'
          : 'border-white/30 hover:border-white/50',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {checked && <Check className="w-3 h-3 text-white check-icon" />}
      {indeterminate && !checked && <div className="w-2 h-0.5 bg-white rounded" />}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACTION BUTTONS
// ═══════════════════════════════════════════════════════════════════════════

interface ActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
  loading?: boolean;
}

function ActionButton({ icon: Icon, label, onClick, variant = 'default', disabled, loading }: ActionButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled && !loading) onClick();
      }}
      disabled={disabled || loading}
      aria-label={label}
      title={label}
      className={cn(
        'p-2 rounded-lg transition-all action-btn',
        variant === 'default' && 'hover:bg-white/10 text-white/60 hover:text-white',
        variant === 'danger' && 'hover:bg-red-500/20 text-white/60 hover:text-red-400',
        (disabled || loading) && 'opacity-50 cursor-not-allowed'
      )}
    >
      {loading ? <div className="h-4 w-4 bg-white/20 rounded animate-pulse" /> : <Icon className="w-4 h-4" />}
    </button>
  );
}

interface MatchActionsProps {
  match: Match;
  onEdit?: (match: Match) => void;
  onDelete?: (match: Match) => Promise<void>;
  onDuplicate?: (match: Match) => void;
  showMenu?: boolean;
  className?: string;
}

export function MatchActions({ match, onEdit, onDelete, onDuplicate, showMenu = true, className }: MatchActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete(match);
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  if (!showMenu) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        {onEdit && <ActionButton icon={Edit2} label="Edit" onClick={() => onEdit(match)} />}
        {onDuplicate && <ActionButton icon={Copy} label="Duplicate" onClick={() => onDuplicate(match)} />}
        {onDelete && <ActionButton icon={Trash2} label="Delete" onClick={handleDelete} variant="danger" loading={isDeleting} />}
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsMenuOpen(!isMenuOpen);
        }}
        className="p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 dropdown-enter">
            <div className="p-1 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[140px]">
              {onEdit && (
                <button
                  onClick={() => {
                    onEdit(match);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
              {onDuplicate && (
                <button
                  onClick={() => {
                    onDuplicate(match);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              {onDelete && (
                <>
                  <div className="my-1 border-t border-white/10" />
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <div className="h-4 w-4 bg-red-400/20 rounded animate-pulse" /> : <Trash2 className="w-4 h-4" />}
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPANDABLE MATCH ROW
// ═══════════════════════════════════════════════════════════════════════════

interface MatchRowProps {
  match: Match;
  onStatusChange?: (match: Match, status: MatchStatus) => Promise<void>;
  onEdit?: (match: Match) => void;
  onDelete?: (match: Match) => Promise<void>;
  onDuplicate?: (match: Match) => void;
  showCheckbox?: boolean;
  className?: string;
}

export function MatchRow({
  match,
  onStatusChange,
  onEdit,
  onDelete,
  onDuplicate,
  showCheckbox = true,
  className,
}: MatchRowProps) {
  const { isSelected, toggleSelection, expandedId, toggleExpanded } = useMatchContext();
  const isExpanded = expandedId === match.id;
  const selected = isSelected(match.id);

  return (
    <div
      className={cn(
        'border border-white/10 rounded-xl overflow-hidden transition-all',
        selected && 'border-emerald-500/50 row-selected',
        className
      )}
    >
      {/* Main Row */}
      <div
        onClick={() => toggleExpanded(match.id)}
        className={cn(
          'flex items-center gap-4 p-4 cursor-pointer transition-colors',
          'hover:bg-white/5',
          selected && 'bg-emerald-500/10'
        )}
      >
        {showCheckbox && (
          <Checkbox checked={selected} onChange={() => toggleSelection(match.id)} />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-semibold text-white truncate">{match.title}</h3>
            <StatusSelector
              currentStatus={match.status}
              onStatusChange={(status) => onStatusChange?.(match, status) ?? Promise.resolve()}
              disabled={!onStatusChange}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-white/50">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {match.date}
              {match.time && ` at ${match.time}`}
            </span>
            {match.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {match.location}
              </span>
            )}
          </div>
        </div>

        {/* Score (if completed) */}
        {match.status === 'completed' && match.homeScore !== undefined && match.awayScore !== undefined && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">{match.homeScore}</span>
            <span className="text-white/40">-</span>
            <span className="font-bold text-white">{match.awayScore}</span>
          </div>
        )}

        <MatchActions
          match={match}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
        />

        <button className="p-1 text-white/40">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className={cn('border-t border-white/10 bg-white/5', isExpanded ? 'match-expand' : 'match-collapse')}>
          <div className="p-4 space-y-4">
            {/* Teams */}
            {(match.homeTeam || match.awayTeam) && (
              <div className="flex items-center gap-4">
                <div className="flex-1 text-center">
                  <p className="text-sm text-white/50 mb-1">Home</p>
                  <p className="font-semibold text-white">{match.homeTeam || 'TBD'}</p>
                  {match.status === 'completed' && (
                    <p className="text-2xl font-bold text-white mt-1">{match.homeScore ?? '-'}</p>
                  )}
                </div>
                <div className="px-4 py-2 rounded-lg bg-white/10">
                  <span className="text-white/60 font-medium">VS</span>
                </div>
                <div className="flex-1 text-center">
                  <p className="text-sm text-white/50 mb-1">Away</p>
                  <p className="font-semibold text-white">{match.awayTeam || 'TBD'}</p>
                  {match.status === 'completed' && (
                    <p className="text-2xl font-bold text-white mt-1">{match.awayScore ?? '-'}</p>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            {match.description && (
              <div>
                <p className="text-sm text-white/50 mb-1">Description</p>
                <p className="text-white/80">{match.description}</p>
              </div>
            )}

            {/* Metadata */}
            {match.metadata && Object.keys(match.metadata).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(match.metadata).map(([key, value]) => (
                  <div key={key} className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-white/50 capitalize mb-1">{key.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-medium text-white">{String(value)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-6 text-xs text-white/40">
              {match.createdAt && <span>Created: {new Date(match.createdAt).toLocaleDateString()}</span>}
              {match.updatedAt && <span>Updated: {new Date(match.updatedAt).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FILTER & SORT BAR
// ═══════════════════════════════════════════════════════════════════════════

interface FilterSortBarProps {
  filters: FilterOption[];
  activeFilters: string[];
  onFilterChange: (filters: string[]) => void;
  sortOptions: SortOption[];
  activeSort: SortOption | null;
  onSortChange: (sort: SortOption | null) => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  className?: string;
}

export function FilterSortBar({
  filters,
  activeFilters,
  onFilterChange,
  sortOptions,
  activeSort,
  onSortChange,
  searchValue = '',
  onSearchChange,
  className,
}: FilterSortBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const toggleFilter = (value: string) => {
    if (activeFilters.includes(value)) {
      onFilterChange(activeFilters.filter((f) => f !== value));
    } else {
      onFilterChange([...activeFilters, value]);
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Search */}
      {onSearchChange && (
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search matches..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-emerald-500/20"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10"
            >
              <X className="w-3 h-3 text-white/40" />
            </button>
          )}
        </div>
      )}

      {/* Filter Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
            activeFilters.length > 0
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filter</span>
          {activeFilters.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs rounded-full bg-emerald-500 text-white">
              {activeFilters.length}
            </span>
          )}
        </button>

        {isFilterOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
            <div className="absolute left-0 top-full mt-2 z-50 dropdown-enter">
              <div className="p-2 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[200px]">
                <p className="px-3 py-2 text-xs text-white/50 uppercase tracking-wider">Status</p>
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => toggleFilter(filter.value)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    <Checkbox
                      checked={activeFilters.includes(filter.value)}
                      onChange={() => toggleFilter(filter.value)}
                    />
                    <span className="flex-1 text-left">{filter.label}</span>
                    {filter.count !== undefined && (
                      <span className="text-white/40">{filter.count}</span>
                    )}
                  </button>
                ))}
                {activeFilters.length > 0 && (
                  <>
                    <div className="my-1 border-t border-white/10" />
                    <button
                      onClick={() => {
                        onFilterChange([]);
                        setIsFilterOpen(false);
                      }}
                      className="w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      Clear all filters
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsSortOpen(!isSortOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl border transition-all',
            activeSort
              ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          <ArrowUpDown className="w-4 h-4" />
          <span className="text-sm font-medium">
            {activeSort ? activeSort.label : 'Sort'}
          </span>
          {activeSort && (
            activeSort.direction === 'asc' ? (
              <SortAsc className="w-4 h-4 sort-active" />
            ) : (
              <SortDesc className="w-4 h-4 sort-active" />
            )
          )}
        </button>

        {isSortOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)} />
            <div className="absolute left-0 top-full mt-2 z-50 dropdown-enter">
              <div className="p-2 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[180px]">
                <p className="px-3 py-2 text-xs text-white/50 uppercase tracking-wider">Sort by</p>
                {sortOptions.map((option) => {
                  const isActive = activeSort?.id === option.id;
                  return (
                    <button
                      key={option.id}
                      onClick={() => {
                        if (isActive) {
                          // Toggle direction or clear
                          if (activeSort.direction === 'asc') {
                            onSortChange({ ...option, direction: 'desc' });
                          } else {
                            onSortChange(null);
                          }
                        } else {
                          onSortChange(option);
                        }
                        setIsSortOpen(false);
                      }}
                      className={cn(
                        'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                        isActive
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span className="flex-1 text-left">{option.label}</span>
                      {isActive && (
                        option.direction === 'asc' ? (
                          <SortAsc className="w-4 h-4" />
                        ) : (
                          <SortDesc className="w-4 h-4" />
                        )
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIRMATION MODAL
// ═══════════════════════════════════════════════════════════════════════════

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isProcessing = loading || isLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm modal-backdrop" onClick={onClose} />
      <div className="relative w-full max-w-md modal-content">
        <div className="rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className={cn(
                'p-3 rounded-xl',
                confirmVariant === 'danger' ? 'bg-red-500/20' : 'bg-blue-500/20'
              )}>
                <AlertTriangle className={cn(
                  'w-6 h-6',
                  confirmVariant === 'danger' ? 'text-red-400' : 'text-blue-400'
                )} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
                <p className="text-white/60">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className={cn(
                'flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all disabled:opacity-50',
                confirmVariant === 'danger'
                  ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
              )}
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 bg-white/20 rounded animate-pulse" />
                  Processing...
                </span>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK ACTIONS BAR
// ═══════════════════════════════════════════════════════════════════════════

interface BulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkStatusChange?: (status: MatchStatus) => Promise<void>;
  onBulkDelete?: () => Promise<void>;
  onBulkDuplicate?: () => void;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  onClearSelection,
  onBulkStatusChange,
  onBulkDelete,
  onBulkDuplicate,
  className,
}: BulkActionsBarProps) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedCount === 0) return null;

  const handleBulkStatusChange = async (status: MatchStatus) => {
    if (!onBulkStatusChange) return;
    setIsProcessing(true);
    try {
      await onBulkStatusChange(status);
    } finally {
      setIsProcessing(false);
      setShowStatusMenu(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!onBulkDelete) return;
    setIsProcessing(true);
    try {
      await onBulkDelete();
    } finally {
      setIsProcessing(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <div className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bulk-bar',
        className
      )}>
        <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
              {selectedCount}
            </span>
            <span className="text-white/60">selected</span>
          </div>

          <div className="w-px h-6 bg-white/10" />

          {/* Status Change */}
          {onBulkStatusChange && (
            <div className="relative">
              <button
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={isProcessing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm">Status</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showStatusMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                  <div className="absolute left-0 bottom-full mb-2 z-50 dropdown-enter">
                    <div className="p-2 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl min-w-[160px]">
                      {(Object.keys(statusConfig) as MatchStatus[]).map((status) => {
                        const config = statusConfig[status];
                        const Icon = config.icon;
                        return (
                          <button
                            key={status}
                            onClick={() => handleBulkStatusChange(status)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                          >
                            <Icon className="w-4 h-4" />
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Duplicate */}
          {onBulkDuplicate && (
            <button
              onClick={onBulkDuplicate}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              <span className="text-sm">Duplicate</span>
            </button>
          )}

          {/* Delete */}
          {onBulkDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-all disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Delete</span>
            </button>
          )}

          <div className="w-px h-6 bg-white/10" />

          <button
            onClick={onClearSelection}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title={`Delete ${selectedCount} match${selectedCount > 1 ? 'es' : ''}?`}
        message="This action cannot be undone. All selected matches will be permanently deleted."
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={isProcessing}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MATCH LIST COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface MatchListProps {
  matches: Match[];
  filters?: FilterOption[];
  sortOptions?: SortOption[];
  onStatusChange?: (match: Match, status: MatchStatus) => Promise<void>;
  onEdit?: (match: Match) => void;
  onDelete?: (match: Match) => Promise<void>;
  onDuplicate?: (match: Match) => void;
  onBulkStatusChange?: (ids: string[], status: MatchStatus) => Promise<void>;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkDuplicate?: (ids: string[]) => void;
  showBulkActions?: boolean;
  className?: string;
}

export function MatchList({
  matches,
  filters: customFilters,
  sortOptions: customSortOptions,
  onStatusChange,
  onEdit,
  onDelete,
  onDuplicate,
  onBulkStatusChange,
  onBulkDelete,
  onBulkDuplicate,
  showBulkActions = true,
  className,
}: MatchListProps) {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [activeSort, setActiveSort] = useState<SortOption | null>(null);

  // Default filters
  const defaultFilters: FilterOption[] = useMemo(() => {
    return (Object.keys(statusConfig) as MatchStatus[]).map((status) => ({
      id: status,
      label: statusConfig[status].label,
      value: status,
      count: matches.filter((m) => m.status === status).length,
    }));
  }, [matches]);

  // Default sort options
  const defaultSortOptions: SortOption[] = [
    { id: 'date-asc', label: 'Date (Oldest)', field: 'date', direction: 'asc' },
    { id: 'date-desc', label: 'Date (Newest)', field: 'date', direction: 'desc' },
    { id: 'title-asc', label: 'Title (A-Z)', field: 'title', direction: 'asc' },
    { id: 'title-desc', label: 'Title (Z-A)', field: 'title', direction: 'desc' },
  ];

  const filters = customFilters ?? defaultFilters;
  const sortOptions = customSortOptions ?? defaultSortOptions;

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Search filter
    if (searchValue) {
      const search = searchValue.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(search) ||
          m.location?.toLowerCase().includes(search) ||
          m.homeTeam?.toLowerCase().includes(search) ||
          m.awayTeam?.toLowerCase().includes(search)
      );
    }

    // Status filters
    if (activeFilters.length > 0) {
      result = result.filter((m) => activeFilters.includes(m.status));
    }

    // Sorting
    if (activeSort) {
      result.sort((a, b) => {
        const aVal = a[activeSort.field];
        const bVal = b[activeSort.field];
        
        if (aVal === undefined || bVal === undefined) return 0;
        
        const comparison = String(aVal).localeCompare(String(bVal));
        return activeSort.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [matches, searchValue, activeFilters, activeSort]);

  return (
    <MatchProvider matches={filteredMatches}>
      <MatchListContent
        matches={filteredMatches}
        filters={filters}
        sortOptions={sortOptions}
        activeFilters={activeFilters}
        setActiveFilters={setActiveFilters}
        activeSort={activeSort}
        setActiveSort={setActiveSort}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        onStatusChange={onStatusChange}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onBulkStatusChange={onBulkStatusChange}
        onBulkDelete={onBulkDelete}
        onBulkDuplicate={onBulkDuplicate}
        showBulkActions={showBulkActions}
        className={className}
      />
    </MatchProvider>
  );
}

interface MatchListContentProps extends Omit<MatchListProps, 'filters' | 'sortOptions'> {
  filters: FilterOption[];
  sortOptions: SortOption[];
  activeFilters: string[];
  setActiveFilters: (filters: string[]) => void;
  activeSort: SortOption | null;
  setActiveSort: (sort: SortOption | null) => void;
  searchValue: string;
  setSearchValue: (value: string) => void;
}

function MatchListContent({
  matches,
  filters,
  sortOptions,
  activeFilters,
  setActiveFilters,
  activeSort,
  setActiveSort,
  searchValue,
  setSearchValue,
  onStatusChange,
  onEdit,
  onDelete,
  onDuplicate,
  onBulkStatusChange,
  onBulkDelete,
  onBulkDuplicate,
  showBulkActions,
  className,
}: MatchListContentProps) {
  const { selectedIds, selectAll, clearSelection } = useMatchContext();
  const selectedCount = selectedIds.size;
  const allSelected = selectedCount === matches.length && matches.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < matches.length;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <FilterSortBar
          filters={filters}
          activeFilters={activeFilters}
          onFilterChange={setActiveFilters}
          sortOptions={sortOptions}
          activeSort={activeSort}
          onSortChange={setActiveSort}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
        />

        {showBulkActions && matches.length > 0 && (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              indeterminate={someSelected}
              onChange={() => {
                if (allSelected || someSelected) {
                  clearSelection();
                } else {
                  selectAll();
                }
              }}
            />
            <span className="text-sm text-white/60">
              {allSelected ? 'Deselect all' : 'Select all'}
            </span>
          </div>
        )}
      </div>

      {/* Match list */}
      {matches.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No matches found</h3>
          <p className="text-white/60">
            {searchValue || activeFilters.length > 0
              ? 'Try adjusting your search or filters.'
              : 'Create your first match to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              showCheckbox={showBulkActions}
            />
          ))}
        </div>
      )}

      {/* Bulk actions bar */}
      {showBulkActions && (
        <BulkActionsBar
          selectedCount={selectedCount}
          onClearSelection={clearSelection}
          onBulkStatusChange={
            onBulkStatusChange
              ? (status) => onBulkStatusChange(Array.from(selectedIds), status)
              : undefined
          }
          onBulkDelete={
            onBulkDelete
              ? () => onBulkDelete(Array.from(selectedIds))
              : undefined
          }
          onBulkDuplicate={
            onBulkDuplicate
              ? () => onBulkDuplicate(Array.from(selectedIds))
              : undefined
          }
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type { Match, MatchStatus, FilterOption, SortOption };
