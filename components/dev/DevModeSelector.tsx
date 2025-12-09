'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, User, Users, GraduationCap, School, Trophy } from 'lucide-react';
import { isDevMode, getDevRole } from '@/lib/dev-mode';

const DASHBOARD_OPTIONS = [
  { value: 'player', label: 'Player Dashboard', icon: User, path: '/player/dashboard' },
  { value: 'college', label: 'College Coach', icon: GraduationCap, path: '/coach/college' },
  { value: 'high-school', label: 'High School Coach', icon: School, path: '/coach/high-school' },
  { value: 'juco', label: 'JUCO Coach', icon: Users, path: '/coach/juco' },
  { value: 'showcase', label: 'Showcase Coach', icon: Trophy, path: '/coach/showcase' },
];

export function DevModeSelector() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const enabled = isDevMode();
    setIsEnabled(enabled);
    if (enabled) setCurrentRole(getDevRole());
  }, []);

  const handleEnableDevMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_mode', 'true');
      // Clear any existing role to force user to choose
      localStorage.removeItem('dev_role');
      window.location.reload();
    }
  };

  const handleSelect = (value: string, path: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_mode', 'true');
      localStorage.setItem('dev_role', value);
      setCurrentRole(value);
      setIsOpen(false);
      router.push(path);
    }
  };

  if (typeof window === 'undefined') return null;

  if (!isEnabled) {
    // Show a button to enable dev mode
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={handleEnableDevMode}
          className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 text-sm font-medium backdrop-blur-xl transition-all"
        >
          <Settings className="w-4 h-4" />
          Enable Dev Mode
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-sm font-medium backdrop-blur-xl transition-all"
        >
          <Settings className="w-4 h-4" />
          <span>Dev: {currentRole || 'Select'}</span>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-white/50 uppercase tracking-wider border-b border-white/10 mb-1">
                  Switch Dashboard
                </div>
                {DASHBOARD_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const isActive = currentRole === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value, option.path)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{option.label}</span>
                      {isActive && (
                        <div className="ml-auto w-2 h-2 rounded-full bg-emerald-400" />
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
