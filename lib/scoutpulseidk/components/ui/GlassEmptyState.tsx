'use client';

import { cn } from '@/lib/utils';
import {
  Search,
  Database,
  Users,
  AlertTriangle,
  FileQuestion,
  Inbox,
  WifiOff,
  Calendar,
  MessageSquare,
  Bell,
  Trophy,
  Video,
  MapPin,
  Heart,
  Star,
  Filter,
  Clock,
  Lock,
  Settings,
  Upload,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'no-connections'
  | 'error'
  | 'offline'
  | 'no-messages'
  | 'no-notifications'
  | 'no-events'
  | 'no-favorites'
  | 'no-videos'
  | 'no-location'
  | 'no-achievements'
  | 'no-filters'
  | 'coming-soon'
  | 'access-denied'
  | 'maintenance'
  | 'upload'
  | 'empty-folder';

type GlassVariant = 'default' | 'glass' | 'dark' | 'gradient';
type Size = 'sm' | 'md' | 'lg';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  icon?: LucideIcon;
}

interface GlassEmptyStateProps {
  variant?: EmptyStateVariant;
  glassVariant?: GlassVariant;
  size?: Size;
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actions?: EmptyStateAction[];
  className?: string;
  showIllustration?: boolean;
}

// ============================================
// VARIANT CONFIGURATIONS
// ============================================

const variantConfig: Record<
  EmptyStateVariant,
  { icon: LucideIcon; title: string; description: string; color: string }
> = {
  'no-data': {
    icon: Database,
    title: 'No Data Yet',
    description: "There's nothing here yet. Data will appear once it's available.",
    color: 'text-slate-400',
  },
  'no-results': {
    icon: Search,
    title: 'No Results Found',
    description: "We couldn't find anything matching your search. Try adjusting your filters or search terms.",
    color: 'text-blue-400',
  },
  'no-connections': {
    icon: Users,
    title: 'No Connections',
    description: "You haven't connected with anyone yet. Start building your network!",
    color: 'text-purple-400',
  },
  error: {
    icon: AlertTriangle,
    title: 'Something Went Wrong',
    description: "We encountered an error loading this content. Please try again.",
    color: 'text-red-400',
  },
  offline: {
    icon: WifiOff,
    title: "You're Offline",
    description: "It looks like you've lost your internet connection. Please check your network and try again.",
    color: 'text-orange-400',
  },
  'no-messages': {
    icon: MessageSquare,
    title: 'No Messages',
    description: "Your inbox is empty. Start a conversation to see messages here.",
    color: 'text-emerald-400',
  },
  'no-notifications': {
    icon: Bell,
    title: 'All Caught Up!',
    description: "You have no new notifications. We'll let you know when something happens.",
    color: 'text-amber-400',
  },
  'no-events': {
    icon: Calendar,
    title: 'No Upcoming Events',
    description: "You don't have any events scheduled. Check back later or create one!",
    color: 'text-cyan-400',
  },
  'no-favorites': {
    icon: Heart,
    title: 'No Favorites Yet',
    description: "Items you favorite will appear here for quick access.",
    color: 'text-pink-400',
  },
  'no-videos': {
    icon: Video,
    title: 'No Videos',
    description: "There are no videos here yet. Upload or record your first video!",
    color: 'text-indigo-400',
  },
  'no-location': {
    icon: MapPin,
    title: 'Location Not Set',
    description: "Add your location to discover nearby opportunities and connections.",
    color: 'text-teal-400',
  },
  'no-achievements': {
    icon: Trophy,
    title: 'No Achievements Yet',
    description: "Complete activities and milestones to earn achievements!",
    color: 'text-yellow-400',
  },
  'no-filters': {
    icon: Filter,
    title: 'No Matching Filters',
    description: "No items match your current filters. Try removing some filters to see more results.",
    color: 'text-violet-400',
  },
  'coming-soon': {
    icon: Clock,
    title: 'Coming Soon',
    description: "We're working hard to bring you this feature. Stay tuned!",
    color: 'text-sky-400',
  },
  'access-denied': {
    icon: Lock,
    title: 'Access Denied',
    description: "You don't have permission to view this content. Contact an administrator if you think this is an error.",
    color: 'text-red-400',
  },
  maintenance: {
    icon: Settings,
    title: 'Under Maintenance',
    description: "We're performing some updates. Please check back in a few minutes.",
    color: 'text-slate-400',
  },
  upload: {
    icon: Upload,
    title: 'Upload Files',
    description: "Drag and drop files here, or click to browse your device.",
    color: 'text-emerald-400',
  },
  'empty-folder': {
    icon: FolderOpen,
    title: 'Empty Folder',
    description: "This folder is empty. Add files or create subfolders to organize your content.",
    color: 'text-slate-400',
  },
};

// ============================================
// SIZE CONFIGURATIONS
// ============================================

const sizeConfig = {
  sm: {
    container: 'py-8 px-4',
    iconSize: 'h-12 w-12',
    iconContainer: 'h-16 w-16',
    title: 'text-base font-semibold',
    description: 'text-sm',
    button: 'text-sm px-3 py-1.5',
    gap: 'gap-3',
  },
  md: {
    container: 'py-12 px-6',
    iconSize: 'h-16 w-16',
    iconContainer: 'h-24 w-24',
    title: 'text-lg font-semibold',
    description: 'text-base',
    button: 'text-sm px-4 py-2',
    gap: 'gap-4',
  },
  lg: {
    container: 'py-16 px-8',
    iconSize: 'h-20 w-20',
    iconContainer: 'h-32 w-32',
    title: 'text-xl font-bold',
    description: 'text-lg',
    button: 'text-base px-5 py-2.5',
    gap: 'gap-5',
  },
};

// ============================================
// GLASS VARIANT STYLES
// ============================================

const glassVariantStyles = {
  default: {
    container: 'bg-white border border-slate-200',
    text: 'text-slate-600',
    title: 'text-slate-900',
    button: {
      primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
      ghost: 'hover:bg-slate-100 text-slate-600',
    },
  },
  glass: {
    container: 'bg-white/5 backdrop-blur-md border border-white/10',
    text: 'text-slate-300',
    title: 'text-white',
    button: {
      primary: 'bg-emerald-500/90 hover:bg-emerald-500 text-white backdrop-blur-sm',
      secondary: 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm',
      ghost: 'hover:bg-white/10 text-slate-300',
    },
  },
  dark: {
    container: 'bg-slate-800/80 backdrop-blur-md border border-slate-700/50',
    text: 'text-slate-400',
    title: 'text-slate-100',
    button: {
      primary: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200',
      ghost: 'hover:bg-slate-700 text-slate-400',
    },
  },
  gradient: {
    container: 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md border border-white/10',
    text: 'text-slate-300',
    title: 'text-white',
    button: {
      primary: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white',
      secondary: 'bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm',
      ghost: 'hover:bg-white/10 text-slate-300',
    },
  },
};

// ============================================
// DECORATIVE ILLUSTRATION
// ============================================

function EmptyStateIllustration({
  variant,
  glassVariant,
  size,
  Icon,
  color,
}: {
  variant: EmptyStateVariant;
  glassVariant: GlassVariant;
  size: Size;
  Icon: LucideIcon;
  color: string;
}) {
  const sizes = sizeConfig[size];
  const isGlass = glassVariant === 'glass' || glassVariant === 'gradient';

  return (
    <div className="relative">
      {/* Decorative circles */}
      <div
        className={cn(
          'absolute -inset-4 rounded-full opacity-20 blur-xl',
          color.replace('text-', 'bg-')
        )}
      />
      <div
        className={cn(
          'absolute -inset-2 rounded-full opacity-10 blur-md',
          color.replace('text-', 'bg-')
        )}
      />

      {/* Icon container */}
      <div
        className={cn(
          'relative rounded-full flex items-center justify-center',
          sizes.iconContainer,
          isGlass ? 'bg-white/5 border border-white/10' : 'bg-slate-100 border border-slate-200'
        )}
      >
        {/* Animated ring */}
        <div
          className={cn(
            'absolute inset-0 rounded-full animate-ping opacity-20',
            color.replace('text-', 'bg-')
          )}
          style={{ animationDuration: '3s' }}
        />
        
        {/* Inner glow ring */}
        <div
          className={cn(
            'absolute inset-2 rounded-full',
            isGlass ? 'bg-white/5' : 'bg-white',
            'border',
            isGlass ? 'border-white/10' : 'border-slate-100'
          )}
        />

        {/* Icon */}
        <Icon className={cn(sizes.iconSize, color, 'relative z-10')} strokeWidth={1.5} />
      </div>

      {/* Decorative dots */}
      {size !== 'sm' && (
        <>
          <div
            className={cn(
              'absolute -top-2 -right-2 h-3 w-3 rounded-full',
              color.replace('text-', 'bg-'),
              'opacity-60 animate-bounce'
            )}
            style={{ animationDuration: '2s', animationDelay: '0.2s' }}
          />
          <div
            className={cn(
              'absolute -bottom-1 -left-3 h-2 w-2 rounded-full',
              color.replace('text-', 'bg-'),
              'opacity-40 animate-bounce'
            )}
            style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}
          />
        </>
      )}
    </div>
  );
}

// ============================================
// ACTION BUTTON COMPONENT
// ============================================

function ActionButton({
  action,
  glassVariant,
  size,
}: {
  action: EmptyStateAction;
  glassVariant: GlassVariant;
  size: Size;
}) {
  const styles = glassVariantStyles[glassVariant];
  const sizes = sizeConfig[size];
  const ButtonIcon = action.icon;

  return (
    <button
      onClick={action.onClick}
      className={cn(
        'rounded-lg font-medium transition-all duration-200',
        'flex items-center gap-2',
        sizes.button,
        styles.button[action.variant || 'primary']
      )}
    >
      {ButtonIcon && <ButtonIcon className="h-4 w-4" />}
      {action.label}
    </button>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GlassEmptyState({
  variant = 'no-data',
  glassVariant = 'glass',
  size = 'md',
  title,
  description,
  icon,
  actions,
  className,
  showIllustration = true,
}: GlassEmptyStateProps) {
  const config = variantConfig[variant];
  const styles = glassVariantStyles[glassVariant];
  const sizes = sizeConfig[size];

  const Icon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  return (
    <div
      className={cn(
        'rounded-2xl flex flex-col items-center text-center',
        sizes.container,
        sizes.gap,
        styles.container,
        className
      )}
    >
      {showIllustration && (
        <EmptyStateIllustration
          variant={variant}
          glassVariant={glassVariant}
          size={size}
          Icon={Icon}
          color={config.color}
        />
      )}

      <div className={cn('space-y-2 max-w-md', !showIllustration && 'mt-0')}>
        <h3 className={cn(sizes.title, styles.title)}>{displayTitle}</h3>
        <p className={cn(sizes.description, styles.text)}>{displayDescription}</p>
      </div>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {actions.map((action, index) => (
            <ActionButton
              key={index}
              action={action}
              glassVariant={glassVariant}
              size={size}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// PRESET COMPONENTS FOR CONVENIENCE
// ============================================

export function NoDataState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="no-data" {...props} />;
}

export function NoResultsState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="no-results" {...props} />;
}

export function NoConnectionsState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="no-connections" {...props} />;
}

export function ErrorState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="error" {...props} />;
}

export function OfflineState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="offline" {...props} />;
}

export function NoMessagesState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="no-messages" {...props} />;
}

export function NoNotificationsState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="no-notifications" {...props} />;
}

export function NoEventsState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="no-events" {...props} />;
}

export function ComingSoonState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="coming-soon" {...props} />;
}

export function AccessDeniedState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="access-denied" {...props} />;
}

export function UploadState(props: Omit<GlassEmptyStateProps, 'variant'>) {
  return <GlassEmptyState variant="upload" {...props} />;
}

// ============================================
// INLINE EMPTY STATE (COMPACT VERSION)
// ============================================

interface InlineEmptyStateProps {
  message: string;
  icon?: LucideIcon;
  action?: {
    label: string;
    onClick: () => void;
  };
  glassVariant?: GlassVariant;
  className?: string;
}

export function InlineEmptyState({
  message,
  icon: Icon = FileQuestion,
  action,
  glassVariant = 'glass',
  className,
}: InlineEmptyStateProps) {
  const styles = glassVariantStyles[glassVariant];

  return (
    <div
      className={cn(
        'rounded-lg px-4 py-3 flex items-center gap-3',
        styles.container,
        className
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', styles.text)} />
      <span className={cn('text-sm flex-1', styles.text)}>{message}</span>
      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'text-sm font-medium px-3 py-1 rounded-md transition-colors',
            styles.button.ghost
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// ============================================
// EMPTY STATE WITH CUSTOM ILLUSTRATION SLOT
// ============================================

interface CustomEmptyStateProps {
  illustration: React.ReactNode;
  title: string;
  description: string;
  actions?: EmptyStateAction[];
  glassVariant?: GlassVariant;
  size?: Size;
  className?: string;
}

export function CustomEmptyState({
  illustration,
  title,
  description,
  actions,
  glassVariant = 'glass',
  size = 'md',
  className,
}: CustomEmptyStateProps) {
  const styles = glassVariantStyles[glassVariant];
  const sizes = sizeConfig[size];

  return (
    <div
      className={cn(
        'rounded-2xl flex flex-col items-center text-center',
        sizes.container,
        sizes.gap,
        styles.container,
        className
      )}
    >
      {illustration}

      <div className="space-y-2 max-w-md">
        <h3 className={cn(sizes.title, styles.title)}>{title}</h3>
        <p className={cn(sizes.description, styles.text)}>{description}</p>
      </div>

      {actions && actions.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          {actions.map((action, index) => (
            <ActionButton
              key={index}
              action={action}
              glassVariant={glassVariant}
              size={size}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default GlassEmptyState;
