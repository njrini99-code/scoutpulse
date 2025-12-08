'use client';

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LucideIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// CSS ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════

const sidebarAnimations = `
/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR SLIDE ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes sidebar-slide-in-left {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes sidebar-slide-out-left {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
}

@keyframes sidebar-slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes sidebar-slide-out-right {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   BACKDROP FADE
═══════════════════════════════════════════════════════════════════ */

@keyframes sidebar-backdrop-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
}

@keyframes sidebar-backdrop-out {
  from {
    opacity: 1;
    backdrop-filter: blur(8px);
  }
  to {
    opacity: 0;
    backdrop-filter: blur(0px);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   MENU ITEM ANIMATIONS
═══════════════════════════════════════════════════════════════════ */

@keyframes menu-item-hover {
  0% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(4px);
  }
  100% {
    transform: translateX(2px);
  }
}

@keyframes menu-item-active-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0);
  }
}

/* ═══════════════════════════════════════════════════════════════════
   SPRING PHYSICS FOR ACTIVE STATE
═══════════════════════════════════════════════════════════════════ */

@keyframes spring-scale-in {
  0% {
    transform: scale(0.95);
    opacity: 0;
  }
  60% {
    transform: scale(1.02);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Active indicator slide */
@keyframes active-indicator-slide {
  0% {
    transform: scaleY(0);
    opacity: 0;
  }
  60% {
    transform: scaleY(1.1);
  }
  100% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   UTILITY CLASSES
═══════════════════════════════════════════════════════════════════ */

.sidebar-menu-item {
  position: relative;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.sidebar-menu-item:hover {
  transform: translateX(4px);
}

.sidebar-menu-item:active {
  transform: translateX(2px) scale(0.98);
}

.sidebar-menu-item-active {
  animation: spring-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

.sidebar-active-indicator {
  animation: active-indicator-slide 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}
`;

let stylesInjected = false;
function injectSidebarStyles() {
  if (stylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.id = 'glass-sidebar-styles';
  style.textContent = sidebarAnimations;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface SidebarMenuItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
  children?: SidebarMenuItem[];
}

export interface SidebarSection {
  id: string;
  title?: string;
  items: SidebarMenuItem[];
}

export type SidebarPosition = 'left' | 'right';
export type SidebarVariant = 'glass' | 'solid' | 'minimal';

export interface GlassSidebarProps {
  /** Sidebar sections with menu items */
  sections: SidebarSection[];
  /** Sidebar position */
  position?: SidebarPosition;
  /** Visual variant */
  variant?: SidebarVariant;
  /** Logo/brand element */
  logo?: ReactNode;
  /** Footer content */
  footer?: ReactNode;
  /** Collapsible sidebar */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
  /** Width when expanded */
  expandedWidth?: number;
  /** Width when collapsed */
  collapsedWidth?: number;
  /** Show on mobile (controlled) */
  mobileOpen?: boolean;
  /** Mobile open change handler */
  onMobileOpenChange?: (open: boolean) => void;
  /** Custom active check function */
  isActive?: (href: string, pathname: string) => boolean;
  /** Additional class names */
  className?: string;
  /** Header slot */
  header?: ReactNode;
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: false,
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

// ═══════════════════════════════════════════════════════════════════════════
// STYLE CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

const VARIANT_STYLES: Record<SidebarVariant, {
  container: string;
  border: string;
  menuItem: string;
  menuItemHover: string;
  menuItemActive: string;
  sectionTitle: string;
}> = {
  glass: {
    container: 'bg-white/[0.03] backdrop-blur-xl',
    border: 'border-white/10',
    menuItem: 'text-slate-300',
    menuItemHover: 'bg-white/[0.08] text-white',
    menuItemActive: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    sectionTitle: 'text-slate-500',
  },
  solid: {
    container: 'bg-slate-900',
    border: 'border-slate-800',
    menuItem: 'text-slate-400',
    menuItemHover: 'bg-slate-800 text-white',
    menuItemActive: 'bg-emerald-500/20 text-emerald-400',
    sectionTitle: 'text-slate-600',
  },
  minimal: {
    container: 'bg-transparent',
    border: 'border-transparent',
    menuItem: 'text-slate-400',
    menuItemHover: 'bg-white/5 text-white',
    menuItemActive: 'text-emerald-400',
    sectionTitle: 'text-slate-600',
  },
};

// Spring easing for CSS transitions
const SPRING_EASING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

// ═══════════════════════════════════════════════════════════════════════════
// MENU ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

interface MenuItemProps {
  item: SidebarMenuItem;
  collapsed: boolean;
  variant: SidebarVariant;
  isItemActive: boolean;
  onNavigate?: () => void;
}

function MenuItem({
  item,
  collapsed,
  variant,
  isItemActive,
  onNavigate,
}: MenuItemProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = item.icon;

  return (
    <Link
      href={item.disabled ? '#' : item.href}
      onClick={(e) => {
        if (item.disabled) {
          e.preventDefault();
          return;
        }
        onNavigate?.();
      }}
      className={cn(
        'sidebar-menu-item',
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'transition-all duration-200',
        'group',
        item.disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        styles.menuItem,
        !isItemActive && `hover:${styles.menuItemHover}`,
        isItemActive && [
          styles.menuItemActive,
          'sidebar-menu-item-active',
          'border',
        ],
        collapsed && 'justify-center px-2'
      )}
      style={{
        transitionTimingFunction: SPRING_EASING,
      }}
    >
      {/* Active indicator bar */}
      {isItemActive && variant === 'glass' && (
        <div
          className="sidebar-active-indicator absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-500 rounded-r-full"
          style={{ marginLeft: '-12px' }}
        />
      )}

      {/* Icon */}
      <div
        className={cn(
          'shrink-0 transition-transform duration-200',
          isItemActive && 'scale-110'
        )}
        style={{ transitionTimingFunction: SPRING_EASING }}
      >
        <Icon
          className={cn(
            'w-5 h-5 transition-colors duration-200',
            isItemActive ? 'text-emerald-400' : 'text-inherit group-hover:text-emerald-400'
          )}
        />
      </div>

      {/* Label */}
      {!collapsed && (
        <span
          className={cn(
            'flex-1 text-sm font-medium truncate transition-all duration-200',
            isItemActive && 'font-semibold'
          )}
        >
          {item.label}
        </span>
      )}

      {/* Badge */}
      {!collapsed && item.badge && (
        <span
          className={cn(
            'px-2 py-0.5 text-[10px] font-semibold rounded-full',
            'transition-transform duration-200',
            item.badgeColor || 'bg-emerald-500/20 text-emerald-400'
          )}
        >
          {item.badge}
        </span>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div
          className={cn(
            'absolute left-full ml-2 px-2 py-1 rounded-md',
            'bg-slate-800 text-white text-sm whitespace-nowrap',
            'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
            'transition-all duration-200 z-50',
            'pointer-events-none'
          )}
        >
          {item.label}
          {item.badge && (
            <span className="ml-2 text-emerald-400">({item.badge})</span>
          )}
        </div>
      )}
    </Link>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MOBILE SIDEBAR OVERLAY
// ═══════════════════════════════════════════════════════════════════════════

interface MobileSidebarProps extends GlassSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileSidebar({
  isOpen,
  onClose,
  sections,
  position = 'left',
  variant = 'glass',
  logo,
  footer,
  header,
  isActive,
  className,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const [isClosing, setIsClosing] = useState(false);
  const styles = VARIANT_STYLES[variant];

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 250);
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const checkActive = (href: string) => {
    if (isActive) return isActive(href, pathname);
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (!isOpen && !isClosing) return null;

  const slideAnimation = position === 'left'
    ? isClosing ? 'sidebar-slide-out-left' : 'sidebar-slide-in-left'
    : isClosing ? 'sidebar-slide-out-right' : 'sidebar-slide-in-right';

  return (
    <div className="fixed inset-0 z-[100] lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        style={{
          animation: isClosing
            ? 'sidebar-backdrop-out 250ms ease-out forwards'
            : 'sidebar-backdrop-in 250ms ease-out forwards',
        }}
        onClick={handleClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          'absolute top-0 bottom-0 w-72 flex flex-col',
          styles.container,
          position === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          styles.border,
          className
        )}
        style={{
          animation: `${slideAnimation} 300ms ${SPRING_EASING} forwards`,
        }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className={cn(
            'absolute top-4 right-4 p-2 rounded-lg',
            'text-slate-400 hover:text-white hover:bg-white/10',
            'transition-colors duration-200'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo */}
        {logo && (
          <div className="p-6 border-b border-white/10">
            {logo}
          </div>
        )}

        {/* Header */}
        {header && (
          <div className="px-4 py-3 border-b border-white/10">
            {header}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              {section.title && (
                <h3
                  className={cn(
                    'px-3 mb-2 text-xs font-semibold uppercase tracking-wider',
                    styles.sectionTitle
                  )}
                >
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    collapsed={false}
                    variant={variant}
                    isItemActive={checkActive(item.href)}
                    onNavigate={handleClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-white/10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN GLASS SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function GlassSidebar({
  sections,
  position = 'left',
  variant = 'glass',
  logo,
  footer,
  collapsible = true,
  defaultCollapsed = false,
  expandedWidth = 256,
  collapsedWidth = 72,
  mobileOpen,
  onMobileOpenChange,
  isActive,
  className,
  header,
}: GlassSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);

  const isMobileOpen = mobileOpen ?? internalMobileOpen;
  const setMobileOpen = onMobileOpenChange ?? setInternalMobileOpen;

  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    injectSidebarStyles();
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const checkActive = (href: string) => {
    if (isActive) return isActive(href, pathname);
    // Check exact match or if current path starts with href (for nested routes)
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  const sidebarWidth = collapsed ? collapsedWidth : expandedWidth;

  return (
    <SidebarContext.Provider
      value={{
        collapsed,
        setCollapsed,
        mobileOpen: isMobileOpen,
        setMobileOpen,
      }}
    >
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          'lg:hidden fixed top-4 z-50 p-2 rounded-xl',
          'bg-white/10 backdrop-blur-xl border border-white/20',
          'text-white hover:bg-white/20',
          'transition-all duration-200',
          position === 'left' ? 'left-4' : 'right-4'
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileOpen}
        onClose={() => setMobileOpen(false)}
        sections={sections}
        position={position}
        variant={variant}
        logo={logo}
        footer={footer}
        header={header}
        isActive={isActive}
      />

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 bottom-0 z-40',
          styles.container,
          position === 'left' ? 'left-0 border-r' : 'right-0 border-l',
          styles.border,
          'transition-all duration-300',
          className
        )}
        style={{
          width: sidebarWidth,
          transitionTimingFunction: SPRING_EASING,
        }}
      >
        {/* Logo Section */}
        {logo && (
          <div
            className={cn(
              'flex items-center border-b border-white/10',
              collapsed ? 'justify-center p-4' : 'px-6 py-5'
            )}
          >
            {logo}
          </div>
        )}

        {/* Header */}
        {header && !collapsed && (
          <div className="px-4 py-3 border-b border-white/10">
            {header}
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-6">
          {sections.map((section) => (
            <div key={section.id}>
              {section.title && !collapsed && (
                <h3
                  className={cn(
                    'px-3 mb-2 text-xs font-semibold uppercase tracking-wider',
                    'transition-opacity duration-200',
                    styles.sectionTitle
                  )}
                >
                  {section.title}
                </h3>
              )}
              {section.title && collapsed && (
                <div className="w-8 h-px bg-white/10 mx-auto mb-2" />
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <MenuItem
                    key={item.id}
                    item={item}
                    collapsed={collapsed}
                    variant={variant}
                    isItemActive={checkActive(item.href)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              'border-t border-white/10',
              collapsed ? 'p-2' : 'p-4'
            )}
          >
            {footer}
          </div>
        )}

        {/* Collapse Toggle */}
        {collapsible && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 p-1.5 rounded-full',
              'bg-slate-800 border border-white/20',
              'text-slate-400 hover:text-white hover:bg-slate-700',
              'transition-all duration-200 z-50',
              position === 'left' ? '-right-3' : '-left-3'
            )}
            style={{ transitionTimingFunction: SPRING_EASING }}
          >
            {position === 'left' ? (
              collapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )
            ) : collapsed ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}
      </aside>

      {/* Spacer for main content */}
      <div
        className="hidden lg:block shrink-0 transition-all duration-300"
        style={{
          width: sidebarWidth,
          transitionTimingFunction: SPRING_EASING,
        }}
      />
    </SidebarContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SIDEBAR TRIGGER BUTTON (for external control)
// ═══════════════════════════════════════════════════════════════════════════

export interface SidebarTriggerProps {
  className?: string;
}

export function SidebarTrigger({ className }: SidebarTriggerProps) {
  const { setMobileOpen, collapsed, setCollapsed } = useSidebar();

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className={cn(
          'lg:hidden p-2 rounded-lg',
          'text-slate-400 hover:text-white hover:bg-white/10',
          'transition-colors duration-200',
          className
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Desktop collapse trigger */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'hidden lg:flex p-2 rounded-lg',
          'text-slate-400 hover:text-white hover:bg-white/10',
          'transition-colors duration-200',
          className
        )}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export default GlassSidebar;
