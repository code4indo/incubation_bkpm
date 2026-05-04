import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { useInvestor } from '@/context/InvestorContext';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Search, BarChart3, LayoutDashboard, Activity, User, Globe, Menu, Shield, Database, Target } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: 'home' | 'projects' | 'regions' | 'dashboard' | 'analysis' | 'profile' | 'admin' | 'admin-investors' | 'cms-matching') => void;
}

// Investor type badge colors
const TYPE_COLORS: Record<string, string> = {
  SWF: 'bg-amber-100 text-amber-800',
  DFI: 'bg-teal-100 text-teal-800',
  PE: 'bg-rose-100 text-rose-800',
  VC: 'bg-purple-100 text-purple-800',
  Corporate: 'bg-sky-100 text-sky-800',
  FamilyOffice: 'bg-orange-100 text-orange-800',
  Institutional: 'bg-emerald-100 text-emerald-800',
  HNWI: 'bg-pink-100 text-pink-800',
};

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const { language, toggleLanguage } = useLanguage();
  const { investor, investorId, setInvestorById, allInvestors } = useInvestor();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Home', labelId: 'Beranda', icon: BarChart3 },
    { id: 'projects', label: 'Projects', labelId: 'Proyek', icon: Search },
    { id: 'regions', label: 'Regions', labelId: 'Wilayah', icon: MapPin },
    { id: 'dashboard', label: 'Dashboard', labelId: 'Dasbor', icon: LayoutDashboard },
    { id: 'analysis', label: 'Analysis', labelId: 'Analisis', icon: Activity },
    { id: 'profile', label: 'My Profile', labelId: 'Profil', icon: User },
    { id: 'admin', label: 'Admin', labelId: 'Admin', icon: Shield },
    { id: 'admin-investors', label: 'Data Investor', labelId: 'Data Investor', icon: Database },
    { id: 'cms-matching', label: 'CMS Match', labelId: 'CMS Matching', icon: Target },
  ];

  const handleNav = (page: string) => {
    onNavigate(page as any);
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#1B4D5C] rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9963B]" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base sm:text-lg font-bold text-[#1B4D5C] leading-tight">AI Investment</h1>
              <p className="text-[10px] sm:text-xs text-[#6B7B8D]">Matching Platform</p>
            </div>
          </div>

          {/* Desktop Nav + Investor Selector + Language Toggle */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? 'default' : 'ghost'}
                size="sm"
                className={
                  currentPage === item.id
                    ? 'bg-[#1B4D5C] text-white hover:bg-[#163E4A] text-xs'
                    : 'text-[#6B7B8D] hover:text-[#1B4D5C] hover:bg-[#1B4D5C]/5 text-xs'
                }
                onClick={() => onNavigate(item.id as any)}
              >
                <item.icon className="w-3.5 h-3.5 mr-1" />
                {item.label}
              </Button>
            ))}

            {/* Investor Selector (Desktop) */}
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-gray-200">
              <User className="w-3.5 h-3.5 text-[#1B4D5C]" />
              <Select value={investorId} onValueChange={setInvestorById}>
                <SelectTrigger className="w-[160px] h-8 text-xs border-[#1B4D5C]/30 bg-[#1B4D5C]/5 hover:bg-[#1B4D5C]/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allInvestors.map(inv => (
                    <SelectItem key={inv.id} value={inv.id}>
                      <span className="flex items-center gap-1.5 text-xs">
                        <Badge variant="outline" className={`text-[9px] px-1 py-0 ${TYPE_COLORS[inv.investorType] || 'bg-gray-100 text-gray-700'}`}>
                          {inv.investorType}
                        </Badge>
                        {inv.company}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              className="ml-1 border-[#C9963B]/50 text-[#1B4D5C] hover:bg-[#C9963B]/10 text-xs font-bold"
              onClick={toggleLanguage}
            >
              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
              {language === 'id' ? 'EN' : 'ID'}
            </Button>
          </div>

          {/* Mobile: Investor + Language + Hamburger */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Investor Selector (compact) */}
            <Select value={investorId} onValueChange={setInvestorById}>
              <SelectTrigger className="w-[110px] h-8 text-xs border-[#1B4D5C]/30 bg-[#1B4D5C]/5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allInvestors.map(inv => (
                  <SelectItem key={inv.id} value={inv.id}>
                    <span className="flex items-center gap-1 text-xs">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${TYPE_COLORS[inv.investorType] || 'bg-gray-100 text-gray-700'}`}>
                        {inv.investorType}
                      </Badge>
                      {inv.company}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="border-[#C9963B]/50 text-[#1B4D5C] hover:bg-[#C9963B]/10 text-xs font-bold h-8 px-2"
              onClick={toggleLanguage}
            >
              <Globe className="w-3 h-3 mr-1" />
              {language === 'id' ? 'EN' : 'ID'}
            </Button>

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Menu className="w-5 h-5 text-[#1B4D5C]" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] bg-white p-0">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex flex-col h-full">
                  {/* Mobile Menu Header */}
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#1B4D5C] rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-[#C9963B]" />
                      </div>
                      <div>
                        <h1 className="text-sm font-bold text-[#1B4D5C]">AI Investment</h1>
                        <p className="text-[10px] text-[#6B7B8D]">Matching Platform</p>
                      </div>
                    </div>
                  </div>

                  {/* Current Investor Display */}
                  <div className="p-3 bg-[#1B4D5C]/5 border-b">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-[#1B4D5C]" />
                      <div>
                        <div className="text-xs text-[#6B7B8D]">
                          {language === 'id' ? 'Simulasi sebagai' : 'Simulating as'}
                        </div>
                        <div className="text-sm font-semibold text-[#1B4D5C]">{investor.company}</div>
                      </div>
                      <Badge className={`text-[9px] ml-auto ${TYPE_COLORS[investor.investorType] || 'bg-gray-100 text-gray-700'}`}>
                        {investor.investorType}
                      </Badge>
                    </div>
                  </div>

                  {/* Mobile Nav Items */}
                  <div className="flex-1 py-2">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          currentPage === item.id
                            ? 'bg-[#1B4D5C] text-white'
                            : 'text-[#1C2A33] hover:bg-[#F5F3EF]'
                        }`}
                        onClick={() => handleNav(item.id)}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-sm">{language === 'id' ? item.labelId : item.label}</p>
                          <p className="text-[10px] opacity-70">{language === 'id' ? item.label : item.labelId}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Mobile Menu Footer */}
                  <div className="p-4 border-t bg-[#F5F3EF]">
                    <p className="text-[10px] text-[#6B7B8D] text-center">
                      {language === 'id' ? 'Ditenagai oleh AI' : 'Powered by AI'} — BKPM AI Incubation
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
