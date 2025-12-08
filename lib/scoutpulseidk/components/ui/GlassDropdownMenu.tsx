'use client';

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  createContext,
  useContext,
  ReactNode,
  KeyboardEvent,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import {
  Check,
  ChevronRight,
  Circle,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

export type MenuVariant = 'default' | 'glass' | 'dark';
export type MenuSize = 'sm' | 'md' | 'lg';
export type MenuAlign = 'start' | 'center' | 'end';
export type MenuSide = 'top' | 'bottom' | 'left' | 'right';

export interface MenuItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick?: () => void;
}

export interface MenuCheckboxItem extends MenuItem {
  type: 'checkbox';
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface MenuRadioItem extends MenuItem {
  type: 'radio';
  value: string;
}

export interface MenuSubMenu extends Omit<MenuItem, 'onClick'> {
  type: 'submenu';
  items: MenuItemType[];
}

export interface MenuSeparator {
  type: 'separator';
  id?: string;
}

export interface MenuLabel {
  type: 'label';
  id?: string;
  label: string;
}

export type MenuItemType =
  | MenuItem
  | MenuCheckboxItem
  | MenuRadioItem
  | MenuSubMenu
  | MenuSeparator
  | MenuLabel;

export interface GlassDropdownMenuProps {
  /** Trigger element */
  trigger: ReactNode;
  /** Menu items */
  items: MenuItemType[];
  /** Glass variant */
  variant?: MenuVariant;
  /** Menu size */
  size?: MenuSize;
  /** Alignment relative to trigger */
  align?: MenuAlign;
  /** Side to open on */
  side?: MenuSide;
  /** Offset from trigger */
  offset?: number;
  /** Min width of menu */
  minWidth?: number;
  /** Radio group value (for radio items) */
  radioValue?: string;
  /** Radio group change handler */
  onRadioValueChange?: (value: string) => void;
  /** Controlled open state */
  open?: boolean;
  /** Open state change handler */
  onOpenChange?: (open: boolean) => void;
  /** Additional class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

// ============================================
// CONTEXT
// ============================================

interface DropdownContextValue {
  variant: MenuVariant;
  size: MenuSize;
  closeMenu: () => void;
  radioValue?: string;
  onRadioValueChange?: (value: string) => void;
}

const DropdownContext = createContext<DropdownContextValue | null>(null);

function useDropdownContext() {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('Dropdown components must be used within a GlassDropdownMenu');
  }
  return context;
}

// ============================================
// CSS ANIMATIONS
// ============================================

const menuAnimations = `
@keyframes glass-menu-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glass-menu-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes glass-menu-slide-down {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glass-menu-slide-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes glass-menu-slide-left {
  from {
    opacity: 0;
    transform: translateX(8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes glass-menu-slide-right {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
`;

let menuStylesInjected = false;
function injectMenuStyles() {
  if (menuStylesInjected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.textContent = menuAnimations;
  document.head.appendChild(style);
  menuStylesInjected = true;
}

// ============================================
// STYLE CONFIGURATIONS
// ============================================

const variantStyles: Record<MenuVariant, {
  menu: string;
  item: string;
  itemActive: string;
  itemDestructive: string;
  itemDisabled: string;
  separator: string;
  label: string;
  shortcut: string;
  icon: string;
  checkbox: string;
  checkboxChecked: string;
}> = {
  default: {
    menu: 'bg-white border border-slate-200 shadow-lg',
    item: 'text-slate-700 hover:bg-slate-100',
    itemActive: 'bg-slate-100',
    itemDestructive: 'text-red-600 hover:bg-red-50',
    itemDisabled: 'text-slate-400 cursor-not-allowed hover:bg-transparent',
    separator: 'bg-slate-200',
    label: 'text-slate-500',
    shortcut: 'text-slate-400',
    icon: 'text-slate-500',
    checkbox: 'border-slate-300',
    checkboxChecked: 'bg-emerald-500 border-emerald-500 text-white',
  },
  glass: {
    menu: 'bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl',
    item: 'text-slate-200 hover:bg-white/10',
    itemActive: 'bg-white/10',
    itemDestructive: 'text-red-400 hover:bg-red-500/20',
    itemDisabled: 'text-slate-500 cursor-not-allowed hover:bg-transparent',
    separator: 'bg-white/10',
    label: 'text-slate-400',
    shortcut: 'text-slate-500',
    icon: 'text-slate-400',
    checkbox: 'border-slate-600',
    checkboxChecked: 'bg-emerald-500 border-emerald-500 text-white',
  },
  dark: {
    menu: 'bg-slate-900 border border-slate-800 shadow-xl',
    item: 'text-slate-300 hover:bg-slate-800',
    itemActive: 'bg-slate-800',
    itemDestructive: 'text-red-400 hover:bg-red-500/20',
    itemDisabled: 'text-slate-600 cursor-not-allowed hover:bg-transparent',
    separator: 'bg-slate-800',
    label: 'text-slate-500',
    shortcut: 'text-slate-600',
    icon: 'text-slate-500',
    checkbox: 'border-slate-700',
    checkboxChecked: 'bg-emerald-500 border-emerald-500 text-white',
  },
};

const sizeStyles: Record<MenuSize, {
  menu: string;
  item: string;
  icon: string;
  label: string;
  shortcut: string;
}> = {
  sm: {
    menu: 'py-1 rounded-lg text-xs',
    item: 'px-2 py-1.5 gap-2',
    icon: 'h-3.5 w-3.5',
    label: 'px-2 py-1 text-[10px]',
    shortcut: 'text-[10px]',
  },
  md: {
    menu: 'py-1.5 rounded-xl text-sm',
    item: 'px-3 py-2 gap-2.5',
    icon: 'h-4 w-4',
    label: 'px-3 py-1.5 text-xs',
    shortcut: 'text-xs',
  },
  lg: {
    menu: 'py-2 rounded-xl text-base',
    item: 'px-4 py-2.5 gap-3',
    icon: 'h-5 w-5',
    label: 'px-4 py-2 text-sm',
    shortcut: 'text-sm',
  },
};

// ============================================
// MENU ITEM COMPONENTS
// ============================================

interface MenuItemComponentProps {
  item: MenuItem;
  isActive: boolean;
  onSelect: () => void;
}

function MenuItemComponent({ item, isActive, onSelect }: MenuItemComponentProps) {
  const { variant, size, closeMenu } = useDropdownContext();
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const handleClick = () => {
    if (item.disabled) return;
    item.onClick?.();
    closeMenu();
    onSelect();
  };

  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={item.disabled}
      className={cn(
        'w-full flex items-center rounded-lg transition-colors',
        sizes.item,
        item.destructive ? styles.itemDestructive : styles.item,
        item.disabled && styles.itemDisabled,
        isActive && !item.disabled && styles.itemActive
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            sizes.icon,
            item.destructive ? '' : styles.icon,
            'shrink-0'
          )}
        />
      )}
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.shortcut && (
        <span className={cn(sizes.shortcut, styles.shortcut, 'ml-auto pl-4')}>
          {item.shortcut}
        </span>
      )}
    </button>
  );
}

interface CheckboxItemComponentProps {
  item: MenuCheckboxItem;
  isActive: boolean;
  onSelect: () => void;
}

function CheckboxItemComponent({ item, isActive, onSelect }: CheckboxItemComponentProps) {
  const { variant, size } = useDropdownContext();
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const handleClick = () => {
    if (item.disabled) return;
    item.onCheckedChange(!item.checked);
    onSelect();
  };

  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={item.disabled}
      className={cn(
        'w-full flex items-center rounded-lg transition-colors',
        sizes.item,
        styles.item,
        item.disabled && styles.itemDisabled,
        isActive && !item.disabled && styles.itemActive
      )}
    >
      <div
        className={cn(
          'h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
          item.checked ? styles.checkboxChecked : styles.checkbox
        )}
      >
        {item.checked && <Check className="h-3 w-3" />}
      </div>
      {Icon && <Icon className={cn(sizes.icon, styles.icon, 'shrink-0')} />}
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.shortcut && (
        <span className={cn(sizes.shortcut, styles.shortcut, 'ml-auto pl-4')}>
          {item.shortcut}
        </span>
      )}
    </button>
  );
}

interface RadioItemComponentProps {
  item: MenuRadioItem;
  isActive: boolean;
  onSelect: () => void;
}

function RadioItemComponent({ item, isActive, onSelect }: RadioItemComponentProps) {
  const { variant, size, radioValue, onRadioValueChange, closeMenu } = useDropdownContext();
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];
  const isChecked = radioValue === item.value;

  const handleClick = () => {
    if (item.disabled) return;
    onRadioValueChange?.(item.value);
    closeMenu();
    onSelect();
  };

  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={item.disabled}
      className={cn(
        'w-full flex items-center rounded-lg transition-colors',
        sizes.item,
        styles.item,
        item.disabled && styles.itemDisabled,
        isActive && !item.disabled && styles.itemActive
      )}
    >
      <div
        className={cn(
          'h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
          isChecked ? styles.checkboxChecked : styles.checkbox
        )}
      >
        {isChecked && <Circle className="h-2 w-2 fill-current" />}
      </div>
      {Icon && <Icon className={cn(sizes.icon, styles.icon, 'shrink-0')} />}
      <span className="flex-1 text-left truncate">{item.label}</span>
    </button>
  );
}

// ============================================
// SUBMENU COMPONENT
// ============================================

interface SubMenuComponentProps {
  item: MenuSubMenu;
  isActive: boolean;
}

function SubMenuComponent({ item, isActive }: SubMenuComponentProps) {
  const { variant, size } = useDropdownContext();
  const [isOpen, setIsOpen] = useState(false);
  const [subMenuPosition, setSubMenuPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const Icon = item.icon;

  useEffect(() => {
    if (isOpen && triggerRef.current && subMenuRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const subMenuRect = subMenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      let left = triggerRect.right + 4;
      let top = triggerRect.top;

      // Flip if not enough space on right
      if (left + subMenuRect.width > viewportWidth - 8) {
        left = triggerRect.left - subMenuRect.width - 4;
      }

      // Adjust vertical position
      if (top + subMenuRect.height > window.innerHeight - 8) {
        top = window.innerHeight - subMenuRect.height - 8;
      }

      setSubMenuPosition({ top, left });
    }
  }, [isOpen]);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), 100);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        ref={triggerRef}
        type="button"
        disabled={item.disabled}
        className={cn(
          'w-full flex items-center rounded-lg transition-colors',
          sizes.item,
          styles.item,
          item.disabled && styles.itemDisabled,
          (isActive || isOpen) && !item.disabled && styles.itemActive
        )}
      >
        {Icon && <Icon className={cn(sizes.icon, styles.icon, 'shrink-0')} />}
        <span className="flex-1 text-left truncate">{item.label}</span>
        <ChevronRight className={cn(sizes.icon, styles.icon, 'shrink-0')} />
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={subMenuRef}
            className={cn(
              'fixed z-[201] min-w-[180px]',
              sizes.menu,
              styles.menu
            )}
            style={{
              top: subMenuPosition.top,
              left: subMenuPosition.left,
              animation: 'glass-menu-slide-right 150ms ease-out',
            }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <MenuContent items={item.items} />
          </div>,
          document.body
        )}
    </div>
  );
}

// ============================================
// MENU CONTENT
// ============================================

interface MenuContentProps {
  items: MenuItemType[];
}

function MenuContent({ items }: MenuContentProps) {
  const { variant, size } = useDropdownContext();
  const [activeIndex, setActiveIndex] = useState(-1);
  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  const selectableItems = items.filter(
    (item) =>
      !('type' in item) ||
      item.type === 'checkbox' ||
      item.type === 'radio' ||
      item.type === 'submenu'
  );

  return (
    <div className="px-1">
      {items.map((item, index) => {
        // Separator
        if ('type' in item && item.type === 'separator') {
          return (
            <div
              key={item.id || `sep-${index}`}
              className={cn('h-px my-1 mx-2', styles.separator)}
            />
          );
        }

        // Label
        if ('type' in item && item.type === 'label') {
          return (
            <div
              key={item.id || `label-${index}`}
              className={cn(
                'font-medium uppercase tracking-wider',
                sizes.label,
                styles.label
              )}
            >
              {item.label}
            </div>
          );
        }

        // Find the index in selectable items
        const selectableIndex = selectableItems.findIndex((si) => si === item);
        const isActive = selectableIndex === activeIndex;

        // Checkbox item
        if ('type' in item && item.type === 'checkbox') {
          return (
            <CheckboxItemComponent
              key={item.id}
              item={item as MenuCheckboxItem}
              isActive={isActive}
              onSelect={() => setActiveIndex(selectableIndex)}
            />
          );
        }

        // Radio item
        if ('type' in item && item.type === 'radio') {
          return (
            <RadioItemComponent
              key={item.id}
              item={item as MenuRadioItem}
              isActive={isActive}
              onSelect={() => setActiveIndex(selectableIndex)}
            />
          );
        }

        // Submenu
        if ('type' in item && item.type === 'submenu') {
          return (
            <SubMenuComponent
              key={item.id}
              item={item as MenuSubMenu}
              isActive={isActive}
            />
          );
        }

        // Regular item
        return (
          <MenuItemComponent
            key={item.id}
            item={item as MenuItem}
            isActive={isActive}
            onSelect={() => setActiveIndex(selectableIndex)}
          />
        );
      })}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function GlassDropdownMenu({
  trigger,
  items,
  variant = 'glass',
  size = 'md',
  align = 'start',
  side = 'bottom',
  offset = 4,
  minWidth = 180,
  radioValue,
  onRadioValueChange,
  open: controlledOpen,
  onOpenChange,
  className,
  disabled = false,
}: GlassDropdownMenuProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const styles = variantStyles[variant];
  const sizes = sizeStyles[size];

  // Inject styles
  useEffect(() => {
    injectMenuStyles();
    setMounted(true);
  }, []);

  // Get selectable items for keyboard navigation
  const selectableItems = items.filter(
    (item) =>
      !('type' in item) ||
      item.type === 'checkbox' ||
      item.type === 'radio' ||
      item.type === 'submenu'
  );

  // Open/close handlers
  const openMenu = useCallback(() => {
    if (disabled) return;
    if (isControlled) {
      onOpenChange?.(true);
    } else {
      setInternalOpen(true);
    }
    setActiveIndex(-1);
  }, [disabled, isControlled, onOpenChange]);

  const closeMenu = useCallback(() => {
    if (isControlled) {
      onOpenChange?.(false);
    } else {
      setInternalOpen(false);
    }
    setActiveIndex(-1);
  }, [isControlled, onOpenChange]);

  const toggleMenu = useCallback(() => {
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  }, [isOpen, openMenu, closeMenu]);

  // Calculate position
  useEffect(() => {
    if (!isOpen || !triggerRef.current || !menuRef.current) return;

    const updatePosition = () => {
      if (!triggerRef.current || !menuRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let top = 0;
      let left = 0;

      // Vertical position
      if (side === 'bottom') {
        top = triggerRect.bottom + scrollY + offset;
        // Flip to top if not enough space
        if (triggerRect.bottom + menuRect.height + offset > viewportHeight) {
          top = triggerRect.top + scrollY - menuRect.height - offset;
        }
      } else if (side === 'top') {
        top = triggerRect.top + scrollY - menuRect.height - offset;
        // Flip to bottom if not enough space
        if (triggerRect.top - menuRect.height - offset < 0) {
          top = triggerRect.bottom + scrollY + offset;
        }
      }

      // Horizontal alignment
      if (align === 'start') {
        left = triggerRect.left + scrollX;
      } else if (align === 'center') {
        left = triggerRect.left + scrollX + (triggerRect.width - menuRect.width) / 2;
      } else if (align === 'end') {
        left = triggerRect.right + scrollX - menuRect.width;
      }

      // Constrain to viewport
      const padding = 8;
      left = Math.max(padding, Math.min(left, viewportWidth - menuRect.width - padding + scrollX));

      setMenuPosition({ top, left });
    };

    requestAnimationFrame(updatePosition);

    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, side, align, offset]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        menuRef.current?.contains(e.target as Node)
      ) {
        return;
      }
      closeMenu();
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeMenu]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeMenu]);

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < selectableItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : selectableItems.length - 1
        );
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < selectableItems.length) {
          const item = selectableItems[activeIndex];
          if ('type' in item && item.type === 'checkbox') {
            (item as MenuCheckboxItem).onCheckedChange(
              !(item as MenuCheckboxItem).checked
            );
          } else if ('type' in item && item.type === 'radio') {
            onRadioValueChange?.((item as MenuRadioItem).value);
            closeMenu();
          } else if (!('type' in item)) {
            (item as MenuItem).onClick?.();
            closeMenu();
          }
        }
        break;
      case 'Tab':
        closeMenu();
        break;
    }
  };

  // Get animation based on side
  const getAnimation = () => {
    if (side === 'bottom') return 'glass-menu-slide-down';
    if (side === 'top') return 'glass-menu-slide-up';
    if (side === 'left') return 'glass-menu-slide-left';
    if (side === 'right') return 'glass-menu-slide-right';
    return 'glass-menu-in';
  };

  const contextValue: DropdownContextValue = {
    variant,
    size,
    closeMenu,
    radioValue,
    onRadioValueChange,
  };

  return (
    <DropdownContext.Provider value={contextValue}>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onClick={toggleMenu}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={cn(
          'inline-flex',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {trigger}
      </div>

      {/* Menu */}
      {isOpen &&
        mounted &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className={cn(
              'fixed z-[200]',
              sizes.menu,
              styles.menu,
              className
            )}
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              minWidth,
              animation: `${getAnimation()} 150ms ease-out`,
            }}
          >
            <MenuContent items={items} />
          </div>,
          document.body
        )}
    </DropdownContext.Provider>
  );
}

// ============================================
// PRESET: USER MENU
// ============================================

export interface UserMenuProps {
  user: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onProfile?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
  onLogout?: () => void;
  variant?: MenuVariant;
  children: ReactNode;
}

export function UserMenu({
  user,
  onProfile,
  onSettings,
  onHelp,
  onLogout,
  variant = 'glass',
  children,
}: UserMenuProps) {
  const items: MenuItemType[] = [
    { type: 'label', label: user.email },
    { type: 'separator' },
    { id: 'profile', label: 'Profile', onClick: onProfile },
    { id: 'settings', label: 'Settings', shortcut: '⌘,', onClick: onSettings },
    { id: 'help', label: 'Help & Support', onClick: onHelp },
    { type: 'separator' },
    { id: 'logout', label: 'Log out', destructive: true, onClick: onLogout },
  ];

  return (
    <GlassDropdownMenu trigger={children} items={items} variant={variant} />
  );
}

// ============================================
// PRESET: NOTIFICATION SETTINGS MENU
// ============================================

export interface NotificationSettingsMenuProps {
  settings: {
    email: boolean;
    push: boolean;
    sms: boolean;
    marketing: boolean;
  };
  onSettingsChange: (key: keyof NotificationSettingsMenuProps['settings'], value: boolean) => void;
  variant?: MenuVariant;
  children: ReactNode;
}

export function NotificationSettingsMenu({
  settings,
  onSettingsChange,
  variant = 'glass',
  children,
}: NotificationSettingsMenuProps) {
  const items: MenuItemType[] = [
    { type: 'label', label: 'Notifications' },
    {
      type: 'checkbox',
      id: 'email',
      label: 'Email notifications',
      checked: settings.email,
      onCheckedChange: (checked) => onSettingsChange('email', checked),
    },
    {
      type: 'checkbox',
      id: 'push',
      label: 'Push notifications',
      checked: settings.push,
      onCheckedChange: (checked) => onSettingsChange('push', checked),
    },
    {
      type: 'checkbox',
      id: 'sms',
      label: 'SMS notifications',
      checked: settings.sms,
      onCheckedChange: (checked) => onSettingsChange('sms', checked),
    },
    { type: 'separator' },
    { type: 'label', label: 'Marketing' },
    {
      type: 'checkbox',
      id: 'marketing',
      label: 'Promotional emails',
      checked: settings.marketing,
      onCheckedChange: (checked) => onSettingsChange('marketing', checked),
    },
  ];

  return (
    <GlassDropdownMenu trigger={children} items={items} variant={variant} />
  );
}

// ============================================
// PRESET: BULK ACTIONS MENU
// ============================================

export interface BulkActionsMenuProps {
  selectedCount: number;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onExport?: () => void;
  onMove?: () => void;
  customActions?: MenuItem[];
  variant?: MenuVariant;
  children: ReactNode;
}

export function BulkActionsMenu({
  selectedCount,
  onSelectAll,
  onDeselectAll,
  onDelete,
  onArchive,
  onExport,
  onMove,
  customActions = [],
  variant = 'glass',
  children,
}: BulkActionsMenuProps) {
  const items: MenuItemType[] = [
    { type: 'label', label: `${selectedCount} selected` },
    { type: 'separator' },
    ...(onSelectAll ? [{ id: 'select-all', label: 'Select all', onClick: onSelectAll }] : []),
    ...(onDeselectAll ? [{ id: 'deselect', label: 'Deselect all', onClick: onDeselectAll }] : []),
    { type: 'separator' },
    ...(onExport ? [{ id: 'export', label: 'Export selected', shortcut: '⌘E', onClick: onExport }] : []),
    ...(onMove ? [{ id: 'move', label: 'Move to...', onClick: onMove }] : []),
    ...(onArchive ? [{ id: 'archive', label: 'Archive', onClick: onArchive }] : []),
    ...customActions,
    ...(onDelete
      ? [
          { type: 'separator' } as MenuSeparator,
          { id: 'delete', label: 'Delete selected', destructive: true, onClick: onDelete },
        ]
      : []),
  ];

  return (
    <GlassDropdownMenu
      trigger={children}
      items={items}
      variant={variant}
      disabled={selectedCount === 0}
    />
  );
}

// ============================================
// PRESET: SORT MENU
// ============================================

export interface SortMenuProps {
  value: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
  variant?: MenuVariant;
  children: ReactNode;
}

export function SortMenu({
  value,
  options,
  onValueChange,
  variant = 'glass',
  children,
}: SortMenuProps) {
  const items: MenuItemType[] = [
    { type: 'label', label: 'Sort by' },
    ...options.map((option) => ({
      type: 'radio' as const,
      id: option.value,
      value: option.value,
      label: option.label,
    })),
  ];

  return (
    <GlassDropdownMenu
      trigger={children}
      items={items}
      variant={variant}
      radioValue={value}
      onRadioValueChange={onValueChange}
    />
  );
}

export default GlassDropdownMenu;
