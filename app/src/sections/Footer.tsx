import { BarChart3, MapPin, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: 'home' | 'projects' | 'regions' | 'dashboard') => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-[#1C2A33] text-white/80 py-12 px-4 sm:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#1B4D5C] rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-[#C9963B]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI Investment</h3>
                <p className="text-xs">Matching Platform</p>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              AI-powered platform connecting foreign investors with Indonesia's best investment opportunities across 38 provinces.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li className="hover:text-[#C9963B] cursor-pointer transition-colors" onClick={() => onNavigate('projects')}>Investment Projects</li>
              <li className="hover:text-[#C9963B] cursor-pointer transition-colors" onClick={() => onNavigate('regions')}>Regional Potential</li>
              <li className="hover:text-[#C9963B] cursor-pointer transition-colors" onClick={() => onNavigate('dashboard')}>Investor Dashboard</li>
              <li className="hover:text-[#C9963B] cursor-pointer transition-colors">AI Matching</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">About</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-white/60">BKPM AI Incubation</li>
              <li className="text-white/60">AI for Public Sector</li>
              <li className="text-white/60">Investment Guides</li>
              <li className="text-white/60">Contact Support</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C9963B]" />
                <span>Badan Koordinasi Penanaman Modal</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#C9963B]" />
                <span>aiforpublicsector.id</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            © 2026 AI Investment Matching Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm text-white/50">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Data Sources</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
