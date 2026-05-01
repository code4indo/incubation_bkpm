import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, TrendingUp, Globe, Zap } from 'lucide-react';

interface HeroProps {
  onNavigate: (page: 'home' | 'projects' | 'regions' | 'dashboard') => void;
}

export function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/hero-bg.jpg)' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4D5C]/90 via-[#1B4D5C]/75 to-[#245E6E]/80" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge className="bg-[#C9963B]/20 text-[#C9963B] border-[#C9963B]/30 px-4 py-1 text-sm font-medium">
            <Zap className="w-3.5 h-3.5 mr-1" />
            BKPM AI Incubation for Public Sector
          </Badge>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
          AI-Powered Investment
          <br />
          <span className="text-[#C9963B]">Matching Platform</span>
        </h1>

        <p className="text-lg sm:text-xl text-white/85 mb-10 max-w-3xl mx-auto leading-relaxed">
          Bridging the information gap between foreign investors and Indonesia's best investment opportunities across 38 provinces using AI-powered NLP, recommendation systems, and geospatial intelligence.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button
            size="lg"
            className="bg-[#C9963B] hover:bg-[#B0802F] text-white px-8 py-6 text-lg font-semibold"
            onClick={() => onNavigate('projects')}
          >
            Explore Projects <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/40 text-white hover:bg-white/10 px-8 py-6 text-lg"
            onClick={() => onNavigate('dashboard')}
          >
            <TrendingUp className="mr-2 w-5 h-5" />
            AI Dashboard
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#C9963B]" />
            <span>38 Provinces</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#C9963B]" />
            <span>181+ Verified Projects</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#C9963B]" />
            <span>AI-Powered Matching</span>
          </div>
        </div>
      </div>
    </section>
  );
}
