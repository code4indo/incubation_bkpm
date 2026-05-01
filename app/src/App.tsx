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
import { Footer } from '@/sections/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { projects, sectors, provinces } from '@/data/mockData';
import type { Project } from '@/types';
import { Search, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function App() {
  const [page, setPage] = useState<'home' | 'projects' | 'project' | 'regions' | 'dashboard' | 'profile'>('home');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState('All Sectors');
  const [selectedProvince, setSelectedProvince] = useState('All Provinces');
  const [filteredProjects, setFilteredProjects] = useState(projects);

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
    setSelectedProject(project);
    setPage('project');
    window.scrollTo(0, 0);
  };

  const handleNavigate = (target: typeof page) => {
    setPage(target);
    if (target !== 'project') setSelectedProject(null);
    window.scrollTo(0, 0);
  };
  const handleNavigateFromNav = (target: 'home' | 'projects' | 'regions' | 'dashboard' | 'profile') => {
    handleNavigate(target);
  };

  return (
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
            <div className="pt-24 pb-12 px-4 sm:px-8 lg:px-16 bg-[#1B4D5C]">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                  Investment Projects
                </h1>
                <p className="text-white/80 text-lg">
                  Discover 181+ verified investment-ready projects across Indonesia
                </p>
              </div>
            </div>
            <div className="py-8 px-4 sm:px-8 lg:px-16 bg-white border-b">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      placeholder="Search projects, sectors, or provinces..."
                      className="pl-10 py-6 text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={selectedSector} onValueChange={setSelectedSector}>
                    <SelectTrigger className="w-full md:w-48 py-6">
                      <SelectValue placeholder="Sector" />
                    </SelectTrigger>
                    <SelectContent>
                      {sectors.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                    <SelectTrigger className="w-full md:w-48 py-6">
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
      </AnimatePresence>

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
