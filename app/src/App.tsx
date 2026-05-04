import { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Hero } from '@/sections/Hero';
import { StatsSection } from '@/sections/StatsSection';
import { FeaturedProjects } from '@/sections/FeaturedProjects';
import { ProjectsPage } from '@/sections/ProjectsPage';
import { ProjectDetail } from '@/sections/ProjectDetail';
import { RegionsPage } from '@/sections/RegionsPage';
import { Dashboard } from '@/sections/Dashboard';
import { InvestorProfilePage } from '@/sections/InvestorProfilePage';
import { AnalysisPage } from '@/sections/AnalysisPage';
import { AdminPage } from '@/sections/AdminPage';
import { AdminInvestorPage } from '@/sections/AdminInvestorPage';
import { CMSMatchingPage } from '@/sections/CMSMatchingPage';
import { Footer } from '@/sections/Footer';
import { LanguageProvider } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projects, sectors, provinces } from '@/data/mockData';
import type { Project } from '@/types';
import type { AnalystReport } from '@/lib/analystAgent';
import type { EnhancedAnalystReport } from '@/lib/analystLLM';
import { getHarmonizedResult } from '@/lib/harmonizationStore';
import { Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function App() {
  const [page, setPage] = useState<'home' | 'projects' | 'project' | 'regions' | 'dashboard' | 'analysis' | 'profile' | 'admin' | 'admin-investors' | 'cms-matching'>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [filteredProjects, setFilteredProjects] = useState(projects);
  const [analysisReport, setAnalysisReport] = useState<AnalystReport | null>(null);
  const [enhancedAnalysisReport, setEnhancedAnalysisReport] = useState<EnhancedAnalystReport | null>(null);

  useEffect(() => {
    let filtered = projects;
    if (searchQuery) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.province.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedSector !== 'All Sectors') {
      filtered = filtered.filter(p => p.sector === selectedSector);
    }
    if (selectedProvince !== 'All Provinces') {
      filtered = filtered.filter(p => p.province === selectedProvince);
    }
    setFilteredProjects(filtered);
  }, [searchQuery, selectedSector, selectedProvince]);

  const handleProjectClick = (project: Project) => {
    // Merge harmonized translations from AdminPage if available
    const harmonized = getHarmonizedResult(project.id);
    const merged = harmonized ? {
      ...project,
      nameEn: harmonized.nameEn || project.nameEn,
      descriptionEn: harmonized.descriptionEn || project.descriptionEn,
      hasTranslation: true,
    } : project;
    setSelectedProject(merged);
    setPage('project');
    window.scrollTo(0, 0);
  };

  const handleNavigate = (target: typeof page) => {
    setPage(target);
    if (target !== 'project') {
      setSelectedProject(null);
      setAnalysisReport(null);
      setEnhancedAnalysisReport(null);
    }
    window.scrollTo(0, 0);
  };
  const handleNavigateFromNav = (target: 'home' | 'projects' | 'regions' | 'dashboard' | 'analysis' | 'profile' | 'admin' | 'admin-investors' | 'cms-matching') => {
    handleNavigate(target);
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#F5F3EF] text-[#1C2A33] font-sans">
        <Navbar currentPage={page} onNavigate={handleNavigateFromNav} />

        <AnimatePresence mode="wait">
          {page === 'home' && (
          <motion.main
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Hero onNavigate={handleNavigate} />
            <StatsSection />
            <FeaturedProjects onProjectClick={handleProjectClick} />
            <section className="py-20 px-4 sm:px-8 lg:px-16 bg-[#1B4D5C]">
              <div className="max-w-7xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Discover Indonesia's Investment Opportunities?
                </h2>
                <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
                  Join 50+ investors already using AI-powered matching to find the best projects in Indonesia's 38 provinces.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    size="lg"
                    className="bg-[#C9963B] hover:bg-[#B0802F] text-white px-8 py-6 text-lg font-semibold"
                    onClick={() => handleNavigate('projects')}
                  >
                    Browse All Projects <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
                    onClick={() => handleNavigate('regions')}
                  >
                    Explore Regional Potential
                  </Button>
                </div>
              </div>
            </section>
          </motion.main>
        )}

        {page === 'projects' && (
          <motion.main
            key="projects"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="pt-20 pb-8 md:pt-24 md:pb-12 px-4 sm:px-8 lg:px-16 bg-[#1B4D5C]">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">
                  Investment Projects
                </h1>
                <p className="text-white/70 text-sm md:text-lg">
                  Discover 181+ verified investment-ready projects across Indonesia
                </p>
              </div>
            </div>
            <div className="sticky top-14 md:top-16 z-30 py-4 md:py-8 px-4 sm:px-8 lg:px-16 bg-white/90 backdrop-blur-md border-b shadow-sm">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search projects..."
                      className="pl-9 py-5 md:py-6 text-sm md:text-lg h-10 md:h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select value={selectedSector} onValueChange={setSelectedSector}>
                      <SelectTrigger className="flex-1 md:w-48 py-5 md:py-6 h-10 md:h-12 text-xs md:text-base">
                        <SelectValue placeholder="Sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                      <SelectTrigger className="flex-1 md:w-48 py-5 md:py-6 h-10 md:h-12 text-xs md:text-base">
                        <SelectValue placeholder="Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <ProjectsPage
              projects={filteredProjects}
              onProjectClick={handleProjectClick}
            />
          </motion.main>
        )}

        {page === 'project' && selectedProject && (
          <motion.main
            key="project"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ProjectDetail
              project={selectedProject}
              onBack={() => handleNavigate('projects')}
              analystReport={analysisReport}
              enhancedAnalystReport={enhancedAnalysisReport}
            />
          </motion.main>
        )}

        {page === 'regions' && (
          <motion.main
            key="regions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <RegionsPage />
          </motion.main>
        )}

        {page === 'dashboard' && (
          <motion.main
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard />
          </motion.main>
        )}

        {page === 'analysis' && (
          <motion.main
            key="analysis"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AnalysisPage
              onProjectClick={handleProjectClick}
              onAnalysisComplete={(report, enhanced) => {
                setAnalysisReport(report);
                setEnhancedAnalysisReport(enhanced);
              }}
            />
          </motion.main>
        )}

        {page === 'profile' && (
          <motion.main
            key="profile"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <InvestorProfilePage />
          </motion.main>
        )}

        {page === 'admin' && (
          <motion.main
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminPage onProjectClick={handleProjectClick} />
          </motion.main>
        )}

        {page === 'admin-investors' && (
          <motion.main
            key="admin-investors"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <AdminInvestorPage />
          </motion.main>
        )}

        {page === 'cms-matching' && (
          <motion.main
            key="cms-matching"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CMSMatchingPage />
          </motion.main>
        )}
      </AnimatePresence>

      <Footer onNavigate={handleNavigate} />
    </div>
    </LanguageProvider>
  );
}
