'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
  useMemo,
} from 'react';
import { cn } from '@/lib/utils';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
  GripVertical,
  Maximize2,
  Minimize2,
  X,
  Settings,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  Wifi,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const dashboardStyles = `
/* Metric card hover lift */
@keyframes metric-lift {
  0% { transform: translateY(0); }
  100% { transform: translateY(-4px); }
}

.metric-card-hover:hover {
  animation: metric-lift 0.2s ease-out forwards;
  box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.3);
}

/* Tooltip fade in */
@keyframes tooltip-appear {
  0% { opacity: 0; transform: translateY(4px) scale(0.95); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

.tooltip-animated {
  animation: tooltip-appear 0.15s ease-out forwards;
}

/* Refresh spin */
@keyframes refresh-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-spinning {
  animation: refresh-spin 1s linear infinite;
}

/* Pulse for real-time indicator */
@keyframes realtime-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.2); }
}

.realtime-pulse {
  animation: realtime-pulse 2s ease-in-out infinite;
}

/* Connection status fade */
@keyframes connection-fade {
  0% { opacity: 0; transform: translateX(10px); }
  100% { opacity: 1; transform: translateX(0); }
}

.connection-status {
  animation: connection-fade 0.3s ease-out forwards;
}

/* Chart tooltip */
@keyframes chart-tooltip-in {
  0% { opacity: 0; transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

.chart-tooltip {
  animation: chart-tooltip-in 0.15s ease-out forwards;
}

/* Value counter */
@keyframes value-update {
  0% { color: rgb(52, 211, 153); transform: scale(1.05); }
  100% { color: inherit; transform: scale(1); }
}

.value-updated {
  animation: value-update 0.5s ease-out forwards;
}

/* Layout transition */
.layout-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Drag handle hover */
.drag-handle:hover {
  cursor: grab;
  opacity: 1 !important;
}

.drag-handle:active {
  cursor: grabbing;
}

/* Dropdown animations */
@keyframes dropdown-in {
  0% { opacity: 0; transform: translateY(-8px); }
  100% { opacity: 1; transform: translateY(0); }
}

.dropdown-animated {
  animation: dropdown-in 0.2s ease-out forwards;
}
`;

let stylesInjected = false;
function injectDashboardStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'dashboard-interactive-styles';
  style.textContent = dashboardStyles;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface MetricData {
  id: string;
  label: string;
  value: number | string;
  previousValue?: number | string;
  change?: number;
  changeLabel?: string;
  unit?: string;
  prefix?: string;
  description?: string;
  details?: { label: string; value: string | number }[];
  icon?: LucideIcon;
  color?: 'emerald' | 'blue' | 'purple' | 'amber' | 'red' | 'slate';
}

interface ChartDataPoint {
  x: string | number;
  y: number;
  label?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

interface LayoutConfig {
  id: string;
  columns: number;
  rows: number;
  widgets: WidgetConfig[];
}

interface WidgetConfig {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'custom';
  title: string;
  visible: boolean;
  position: { col: number; row: number; colSpan?: number; rowSpan?: number };
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardContextValue {
  isRefreshing: boolean;
  lastUpdated: Date | null;
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  layout: 'grid' | 'list';
  setLayout: (layout: 'grid' | 'list') => void;
  refresh: () => Promise<void>;
  subscribe: (event: string, callback: (data: unknown) => void) => () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PROVIDER
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardProviderProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
  websocketUrl?: string;
  refreshInterval?: number; // Auto refresh interval in ms
  enableRealtime?: boolean;
}

export function DashboardProvider({
  children,
  onRefresh,
  websocketUrl,
  refreshInterval,
  enableRealtime = false,
}: DashboardProviderProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  
  const wsRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    injectDashboardStyles();
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!enableRealtime || !websocketUrl) return;

    const connect = () => {
      setConnectionStatus('connecting');
      
      try {
        wsRef.current = new WebSocket(websocketUrl);

        wsRef.current.onopen = () => {
          setConnectionStatus('connected');
          console.log('WebSocket connected');
        };

        wsRef.current.onmessage = (event) => {
          try {
            const { type, data } = JSON.parse(event.data);
            const callbacks = subscribersRef.current.get(type);
            if (callbacks) {
              callbacks.forEach((cb) => cb(data));
            }
            setLastUpdated(new Date());
          } catch (err) {
            console.error('Failed to parse WebSocket message:', err);
          }
        };

        wsRef.current.onclose = () => {
          setConnectionStatus('disconnected');
          // Reconnect after 3 seconds
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        };

        wsRef.current.onerror = () => {
          setConnectionStatus('disconnected');
        };
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setConnectionStatus('disconnected');
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [enableRealtime, websocketUrl]);

  // Auto refresh
  useEffect(() => {
    if (!refreshInterval || refreshInterval < 1000) return;

    const interval = setInterval(() => {
      if (!isRefreshing && onRefresh) {
        refresh();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval, isRefreshing, onRefresh]);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh?.();
      setLastUpdated(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  const subscribe = useCallback((event: string, callback: (data: unknown) => void) => {
    if (!subscribersRef.current.has(event)) {
      subscribersRef.current.set(event, new Set());
    }
    subscribersRef.current.get(event)!.add(callback);

    return () => {
      subscribersRef.current.get(event)?.delete(callback);
    };
  }, []);

  const value = useMemo(
    () => ({
      isRefreshing,
      lastUpdated,
      isConnected: connectionStatus === 'connected',
      connectionStatus,
      layout,
      setLayout,
      refresh,
      subscribe,
    }),
    [isRefreshing, lastUpdated, connectionStatus, layout, refresh, subscribe]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CARD WITH HOVER DETAILS
// ═══════════════════════════════════════════════════════════════════════════

interface MetricCardProps {
  metric: MetricData;
  showTrend?: boolean;
  showDetails?: boolean;
  onClick?: () => void;
  className?: string;
}

export function MetricCard({
  metric,
  showTrend = true,
  showDetails = true,
  onClick,
  className,
}: MetricCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [valueUpdated, setValueUpdated] = useState(false);
  const previousValueRef = useRef(metric.value);

  useEffect(() => {
    if (previousValueRef.current !== metric.value) {
      setValueUpdated(true);
      previousValueRef.current = metric.value;
      const timeout = setTimeout(() => setValueUpdated(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [metric.value]);

  const colorClasses = {
    emerald: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20',
    blue: 'from-blue-500/20 to-blue-600/5 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 border-purple-500/20',
    amber: 'from-amber-500/20 to-amber-600/5 border-amber-500/20',
    red: 'from-red-500/20 to-red-600/5 border-red-500/20',
    slate: 'from-slate-500/20 to-slate-600/5 border-slate-500/20',
  };

  const iconColorClasses = {
    emerald: 'text-emerald-400 bg-emerald-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    purple: 'text-purple-400 bg-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    red: 'text-red-400 bg-red-500/20',
    slate: 'text-slate-400 bg-slate-500/20',
  };

  const Icon = metric.icon;
  const color = metric.color || 'emerald';
  const change = metric.change ?? 0;
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <div
      className={cn(
        'relative p-5 rounded-2xl border backdrop-blur-xl bg-gradient-to-br transition-all duration-300',
        colorClasses[color],
        onClick && 'cursor-pointer',
        'metric-card-hover',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className={cn('p-2 rounded-xl', iconColorClasses[color])}>
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div>
            <p className="text-sm text-white/60">{metric.label}</p>
            {metric.description && (
              <p className="text-xs text-white/40 mt-0.5">{metric.description}</p>
            )}
          </div>
        </div>
        {showDetails && metric.details && (
          <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <Info className="w-4 h-4 text-white/40" />
          </button>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className={cn(
            'text-3xl font-bold text-white',
            valueUpdated && 'value-updated'
          )}>
            {metric.prefix}
            {typeof metric.value === 'number' 
              ? metric.value.toLocaleString() 
              : metric.value}
            {metric.unit && <span className="text-lg ml-1 text-white/60">{metric.unit}</span>}
          </p>
        </div>

        {showTrend && metric.change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium',
            isPositive && 'text-emerald-400 bg-emerald-500/20',
            isNegative && 'text-red-400 bg-red-500/20',
            !isPositive && !isNegative && 'text-slate-400 bg-slate-500/20'
          )}>
            {isPositive && <TrendingUp className="w-3.5 h-3.5" />}
            {isNegative && <TrendingDown className="w-3.5 h-3.5" />}
            {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5" />}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>

      {/* Hover Details Tooltip */}
      {showDetails && isHovered && metric.details && metric.details.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50">
          <div className="mx-4 p-4 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl tooltip-animated">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-3">Details</p>
            <div className="space-y-2">
              {metric.details.map((detail, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-white/70">{detail.label}</span>
                  <span className="text-sm font-medium text-white">{detail.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHART WITH TOOLTIPS
// ═══════════════════════════════════════════════════════════════════════════

interface ChartTooltipProps {
  data: ChartDataPoint;
  position: { x: number; y: number };
  visible: boolean;
  formatter?: (data: ChartDataPoint) => ReactNode;
}

export function ChartTooltip({ data, position, visible, formatter }: ChartTooltipProps) {
  if (!visible) return null;

  return (
    <div
      className="fixed z-50 pointer-events-none chart-tooltip"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="px-3 py-2 rounded-lg bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-xl">
        {formatter ? (
          formatter(data)
        ) : (
          <>
            <p className="text-xs text-white/50">{data.label || data.x}</p>
            <p className="text-sm font-semibold text-white">{data.y.toLocaleString()}</p>
          </>
        )}
      </div>
    </div>
  );
}

interface InteractiveChartProps {
  data: ChartDataPoint[];
  type?: 'line' | 'bar' | 'area';
  height?: number;
  color?: string;
  showGrid?: boolean;
  showLabels?: boolean;
  tooltipFormatter?: (data: ChartDataPoint) => ReactNode;
  onPointClick?: (data: ChartDataPoint) => void;
  className?: string;
}

export function InteractiveChart({
  data,
  type = 'line',
  height = 200,
  color = '#10B981',
  showGrid = true,
  showLabels = true,
  tooltipFormatter,
  onPointClick,
  className,
}: InteractiveChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    data: ChartDataPoint | null;
    position: { x: number; y: number };
  }>({ visible: false, data: null, position: { x: 0, y: 0 } });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.y));
  const minValue = Math.min(...data.map((d) => d.y));
  const range = maxValue - minValue || 1;

  const padding = 40;
  const chartWidth = 100;
  const chartHeight = height - padding * 2;

  const getY = (value: number) => {
    return chartHeight - ((value - minValue) / range) * chartHeight + padding;
  };

  const getX = (index: number) => {
    return (index / (data.length - 1)) * (chartWidth - 10) + 5;
  };

  const handleMouseMove = (e: React.MouseEvent, point: ChartDataPoint, index: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        visible: true,
        data: point,
        position: { x: e.clientX, y: e.clientY },
      });
      setActiveIndex(index);
    }
  };

  const handleMouseLeave = () => {
    setTooltip({ visible: false, data: null, position: { x: 0, y: 0 } });
    setActiveIndex(null);
  };

  // Generate path for line/area chart
  const linePath = data
    .map((point, i) => {
      const x = getX(i);
      const y = getY(point.y);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  const areaPath = `${linePath} L ${getX(data.length - 1)} ${height - padding} L ${getX(0)} ${height - padding} Z`;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <svg width="100%" height={height} viewBox={`0 0 ${chartWidth} ${height}`} preserveAspectRatio="none">
        {/* Grid */}
        {showGrid && (
          <g className="text-white/10">
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1="0"
                y1={padding + chartHeight * ratio}
                x2={chartWidth}
                y2={padding + chartHeight * ratio}
                stroke="currentColor"
                strokeDasharray="2 2"
              />
            ))}
          </g>
        )}

        {/* Area fill */}
        {type === 'area' && (
          <path
            d={areaPath}
            fill={`url(#gradient-${color.replace('#', '')})`}
            opacity={0.3}
          />
        )}

        {/* Line */}
        {(type === 'line' || type === 'area') && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Bars */}
        {type === 'bar' && data.map((point, i) => {
          const barWidth = (chartWidth - 10) / data.length - 2;
          const x = getX(i) - barWidth / 2;
          const barHeight = ((point.y - minValue) / range) * chartHeight;
          
          return (
            <rect
              key={i}
              x={x}
              y={height - padding - barHeight}
              width={barWidth}
              height={barHeight}
              fill={activeIndex === i ? color : `${color}80`}
              rx={2}
              className="transition-all duration-200 cursor-pointer"
              onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent, point, i)}
              onMouseLeave={handleMouseLeave}
              onClick={() => onPointClick?.(point)}
            />
          );
        })}

        {/* Data points (for line/area) */}
        {(type === 'line' || type === 'area') && data.map((point, i) => (
          <circle
            key={i}
            cx={getX(i)}
            cy={getY(point.y)}
            r={activeIndex === i ? 6 : 4}
            fill={color}
            stroke="white"
            strokeWidth={2}
            className="transition-all duration-200 cursor-pointer"
            onMouseMove={(e) => handleMouseMove(e as unknown as React.MouseEvent, point, i)}
            onMouseLeave={handleMouseLeave}
            onClick={() => onPointClick?.(point)}
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id={`gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>

      {/* X-axis labels */}
      {showLabels && (
        <div className="flex justify-between px-1 mt-2">
          {data.filter((_, i) => i === 0 || i === data.length - 1 || i === Math.floor(data.length / 2)).map((point, i) => (
            <span key={i} className="text-xs text-white/40">
              {point.label || point.x}
            </span>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip.data && (
        <ChartTooltip
          data={tooltip.data}
          position={tooltip.position}
          visible={tooltip.visible}
          formatter={tooltipFormatter}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REFRESH BUTTON WITH LOADING
// ═══════════════════════════════════════════════════════════════════════════

interface RefreshButtonProps {
  onRefresh?: () => Promise<void>;
  showLastUpdated?: boolean;
  className?: string;
}

export function RefreshButton({ onRefresh, showLastUpdated = true, className }: RefreshButtonProps) {
  const { isRefreshing, lastUpdated, refresh } = useDashboard();

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await refresh();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showLastUpdated && lastUpdated && (
        <span className="text-sm text-white/50">
          Updated {formatTime(lastUpdated)}
        </span>
      )}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={cn(
          'p-2 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm',
          'hover:bg-white/10 transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed'
        )}
        title="Refresh data"
      >
        <RefreshCw className={cn('w-4 h-4 text-white/70', isRefreshing && 'refresh-spinning')} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REALTIME CONNECTION STATUS
// ═══════════════════════════════════════════════════════════════════════════

export function ConnectionStatus({ className }: { className?: string }) {
  const { connectionStatus, isConnected } = useDashboard();

  const statusConfig = {
    connected: { icon: Wifi, label: 'Live', color: 'text-emerald-400 bg-emerald-500/20' },
    connecting: { icon: Wifi, label: 'Connecting...', color: 'text-amber-400 bg-amber-500/20' },
    disconnected: { icon: WifiOff, label: 'Offline', color: 'text-red-400 bg-red-500/20' },
  };

  const config = statusConfig[connectionStatus];
  const Icon = config.icon;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium connection-status',
      config.color,
      className
    )}>
      <Icon className={cn('w-4 h-4', isConnected && 'realtime-pulse')} />
      <span>{config.label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LAYOUT CUSTOMIZATION
// ═══════════════════════════════════════════════════════════════════════════

interface LayoutSelectorProps {
  className?: string;
}

export function LayoutSelector({ className }: LayoutSelectorProps) {
  const { layout, setLayout } = useDashboard();

  return (
    <div className={cn('flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10', className)}>
      <button
        onClick={() => setLayout('grid')}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          layout === 'grid' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
        )}
        title="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setLayout('list')}
        className={cn(
          'p-2 rounded-lg transition-all duration-200',
          layout === 'list' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'
        )}
        title="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}

interface WidgetCustomizerProps {
  widgets: WidgetConfig[];
  onToggleWidget: (id: string) => void;
  onReorder?: (widgets: WidgetConfig[]) => void;
  className?: string;
}

export function WidgetCustomizer({ widgets, onToggleWidget, className }: WidgetCustomizerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200',
          isOpen 
            ? 'bg-white/10 border-white/20 text-white' 
            : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        <Settings className="w-4 h-4" />
        <span className="text-sm font-medium">Customize</span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 z-50 dropdown-animated">
            <div className="p-2 rounded-xl bg-slate-800/95 backdrop-blur-xl border border-white/10 shadow-2xl">
              <p className="px-3 py-2 text-xs text-white/50 uppercase tracking-wider">Widgets</p>
              <div className="space-y-1">
                {widgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => onToggleWidget(widget.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className={cn(
                      'w-5 h-5 rounded flex items-center justify-center border transition-colors',
                      widget.visible 
                        ? 'bg-emerald-500 border-emerald-500' 
                        : 'border-white/20'
                    )}>
                      {widget.visible && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-white/80 flex-1 text-left">{widget.title}</span>
                    {widget.visible ? (
                      <Eye className="w-4 h-4 text-white/40" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAGGABLE WIDGET WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

interface DraggableWidgetProps {
  children: ReactNode;
  title?: string;
  onMaximize?: () => void;
  onClose?: () => void;
  isDraggable?: boolean;
  isMaximized?: boolean;
  className?: string;
}

export function DraggableWidget({
  children,
  title,
  onMaximize,
  onClose,
  isDraggable = true,
  isMaximized = false,
  className,
}: DraggableWidgetProps) {
  return (
    <div className={cn(
      'rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden layout-transition',
      isMaximized && 'fixed inset-4 z-50',
      className
    )}>
      {(title || isDraggable || onMaximize || onClose) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            {isDraggable && (
              <div className="drag-handle p-1 rounded hover:bg-white/10 opacity-40 transition-opacity">
                <GripVertical className="w-4 h-4 text-white/60" />
              </div>
            )}
            {title && <h3 className="font-medium text-white">{title}</h3>}
          </div>
          <div className="flex items-center gap-1">
            {onMaximize && (
              <button
                onClick={onMaximize}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                {isMaximized ? (
                  <Minimize2 className="w-4 h-4 text-white/60" />
                ) : (
                  <Maximize2 className="w-4 h-4 text-white/60" />
                )}
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD HEADER
// ═══════════════════════════════════════════════════════════════════════════

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  widgets?: WidgetConfig[];
  onToggleWidget?: (id: string) => void;
  showRefresh?: boolean;
  showLayout?: boolean;
  showConnection?: boolean;
  actions?: ReactNode;
  className?: string;
}

export function DashboardHeader({
  title,
  subtitle,
  widgets,
  onToggleWidget,
  showRefresh = true,
  showLayout = true,
  showConnection = false,
  actions,
  className,
}: DashboardHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4', className)}>
      <div>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && <p className="text-white/60 mt-1">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-3 flex-wrap">
        {showConnection && <ConnectionStatus />}
        {showLayout && <LayoutSelector />}
        {widgets && onToggleWidget && (
          <WidgetCustomizer widgets={widgets} onToggleWidget={onToggleWidget} />
        )}
        {showRefresh && <RefreshButton />}
        {actions}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// METRIC GRID
// ═══════════════════════════════════════════════════════════════════════════

interface MetricGridProps {
  metrics: MetricData[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function MetricGrid({ metrics, columns = 4, className }: MetricGridProps) {
  const { layout } = useDashboard();

  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  if (layout === 'list') {
    return (
      <div className={cn('space-y-3', className)}>
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', gridClasses[columns], className)}>
      {metrics.map((metric) => (
        <MetricCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// REALTIME HOOK
// ═══════════════════════════════════════════════════════════════════════════

export function useRealtimeData<T>(event: string, initialData: T): T {
  const { subscribe } = useDashboard();
  const [data, setData] = useState<T>(initialData);

  useEffect(() => {
    const unsubscribe = subscribe(event, (newData) => {
      setData(newData as T);
    });

    return unsubscribe;
  }, [event, subscribe]);

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export type { MetricData, ChartDataPoint, LayoutConfig, WidgetConfig };
