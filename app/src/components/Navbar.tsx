import { Button } from '@/components/ui/button';
import { MapPin, Search, BarChart3, LayoutDashboard, User } from 'lucide-react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'projects' | 'regions' | 'dashboard' | 'profile') => void;
}

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: null },
    { id: 'projects', label: 'Projects', icon: Search },
    { id: 'regions', label: 'Regions', icon: MapPin },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 bg-[#1B4D5C] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#C9963B]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-[#1B4D5C] leading-tight">AI Investment</h1>
              <p className="text-xs text-[#6B7B8D]">Matching Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                size="sm"
                className={
                  currentPage === item.id
                    ? 'bg-[#1B4D5C] text-white hover:bg-[#163E4A]'
                    : 'text-[#6B7B8D] hover:text-[#1B4D5C] hover:bg-[#1B4D5C]/5'
                }
                onClick={() => onNavigate(item.id as any)}
              >
                {item.icon && <item.icon className="w-4 h-4 mr-1" />}
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
