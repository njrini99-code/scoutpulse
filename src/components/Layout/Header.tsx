import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, Calendar, Phone, TrendingUp, PhoneCall, Mail, LayoutDashboard, Menu, X, Play, BarChart3, Clock, Target, Users, Building2 } from 'lucide-react';

interface HeaderProps {
  activeView: string;
  onViewChange: (view: string) => void;
  userRole?: string | null;
}

export function Header({ activeView, onViewChange, userRole }: HeaderProps) {
  const { signOut, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    ...(userRole !== 'manager' ? [{ id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
    ...(userRole === 'manager' ? [{ id: 'manager', label: 'Team Manager', icon: Users }] : []),
    ...(userRole !== 'manager' ? [
      { id: 'start-day', label: 'Start Day', icon: Play },
      { id: 'day-builder', label: 'Day Builder', icon: Calendar },
      { id: 'phone-block', label: 'Phone Block', icon: Phone },
    ] : []),
    { id: 'follow-ups', label: 'Follow-ups', icon: PhoneCall },
    { id: 'email', label: 'Email', icon: Mail },
    ...(userRole !== 'manager' ? [{ id: 'new-biz', label: 'New Biz', icon: Building2 }] : []),
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: '52-weeks', label: '52 Weeks', icon: Calendar },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  ];

  const handleNavClick = (id: string) => {
    onViewChange(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 md:gap-8">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">TEMPO</h1>
                  <p className="text-xs text-gray-500 hidden md:block">Sales Planning System</p>
                </div>
              </div>

              <nav className="hidden lg:flex gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onViewChange(item.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        activeView === item.id
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <span className="hidden md:block text-sm text-gray-600 truncate max-w-[150px]">{user?.email}</span>
              <button
                onClick={signOut}
                className="hidden md:flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 bg-white">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      activeView === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
              <button
                onClick={signOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors mt-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </nav>
          </div>
        )}
      </header>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors ${
                  activeView === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
