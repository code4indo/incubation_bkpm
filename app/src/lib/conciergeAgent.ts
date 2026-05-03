/**
 * CONCIERGE AGENT — Investor Profile Builder
 * 
 * Implementasi mas-concierge-skill ke dalam sistem BKPM Investment Portal.
 * 
 * Arsitektur:
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │                    CONCIERGE AGENT                          │
 *   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
 *   │  │ Question     │  │ Preference   │  │ Profile      │      │
 *   │  │ Generator    │→ │ Extractor    │→ │ Persistence  │      │
 *   │  └──────────────┘  └──────────────┘  └──────────────┘      │
 *   │         ↑                    ↓              ↓               │
 *   │         └──────── Chat UI ←──┘   localStorage + Context     │
 *   └─────────────────────────────────────────────────────────────┘
 *                              ↓
 *                    ┌─────────────────┐
 *                    │  useRecommendations  │
 *                    │  (feeds Scout & Analyst)
 *                    └─────────────────┘
 */

import { useState, useCallback, useEffect } from 'react';
import type { Project } from '@/types';

// ═══════════════════════════════════════════════════════════════════════════
// 1. TYPES — Investor Profile Schema
// ═══════════════════════════════════════════════════════════════════════════

export type RiskAppetite = 'Conservative' | 'Moderate' | 'Aggressive';
export type CapexRange = 'Micro' | 'Small' | 'Medium' | 'Large' | 'Mega';
export type ExperienceLevel = 'Novice' | 'Intermediate' | 'Expert';
export type ProjectTypePreference = 'Greenfield' | 'Brownfield' | 'Expansion' | 'Divestment';

export interface InvestorProfile {
  id: string;
  name: string;
  email?: string;
  company?: string;
  nationality?: string;
  
  // Core preferences (drive matching algorithm)
  riskAppetite: RiskAppetite;
  capexRange: CapexRange;
  sectorPreferences: string[];
  regionPreferences: string[];
  timelineMonths: number;
  
  // Advanced preferences
  esgRequirements: string[];
  experienceLevel: ExperienceLevel;
  preferredProjectTypes: ProjectTypePreference[];
  
  // Metadata
  profileCompleteness: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface ConciergeState {
  profile: InvestorProfile;
  missingFields: string[];
  currentQuestion: string | null;
  conversationHistory: Array<{ role: 'agent' | 'investor'; message: string }>;
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. QUESTION BANK — Never ask >3 questions per interaction
// ═══════════════════════════════════════════════════════════════════════════

interface QuestionTemplate {
  field: keyof InvestorProfile;
  question: string;
  options?: string[];
  type: 'single' | 'multiple' | 'text' | 'number';
}

const QUESTION_BANK: QuestionTemplate[] = [
  {
    field: 'sectorPreferences',
    question: 'Sectors that interest you? (pick up to 3)',
    options: ['Manufacturing', 'Tourism', 'Digital', 'Energy', 'Agroindustry', 'Infrastructure', 'Mining', 'Fisheries', 'Health', 'Education'],
    type: 'multiple',
  },
  {
    field: 'capexRange',
    question: 'Your investment scale?',
    options: ['Micro (<$1M)', 'Small ($1-10M)', 'Medium ($10-50M)', 'Large ($50-200M)', 'Mega (>$200M)'],
    type: 'single',
  },
  {
    field: 'riskAppetite',
    question: 'How do you view investment risk?',
    options: ['Conservative — safe, steady returns', 'Moderate — balanced growth', 'Aggressive — high growth potential'],
    type: 'single',
  },
  {
    field: 'regionPreferences',
    question: 'Preferred regions in Indonesia?',
    options: ['Java', 'Sumatra', 'Kalimantan', 'Sulawesi', 'Papua', 'Bali/Nusa Tenggara', 'Maluku'],
    type: 'multiple',
  },
  {
    field: 'timelineMonths',
    question: 'Expected investment timeline?',
    options: ['6 months', '1-2 years', '3-5 years', '5+ years'],
    type: 'single',
  },
  {
    field: 'esgRequirements',
    question: 'Any ESG priorities?',
    options: ['Carbon Neutral', 'Social Impact', 'Biodiversity', 'Governance', 'None'],
    type: 'multiple',
  },
  {
    field: 'experienceLevel',
    question: 'Your experience with Indonesian market?',
    options: ['Novice — first time', 'Intermediate — some projects', 'Expert — extensive experience'],
    type: 'single',
  },
  {
    field: 'preferredProjectTypes',
    question: 'Project type preference?',
    options: ['Greenfield (new)', 'Brownfield (existing)', 'Expansion', 'Divestment'],
    type: 'multiple',
  },
];

// ═══════════════════════════════════════════════════════════════════════════
// 3. PREFERENCE EXTRACTOR — Parse investor responses
// ═══════════════════════════════════════════════════════════════════════════

export function extractPreferences(
  message: string,
  field: keyof InvestorProfile
): Partial<InvestorProfile> {
  const lower = message.toLowerCase();
  
  switch (field) {
    case 'riskAppetite':
      if (lower.includes('conservative') || lower.includes('safe')) return { riskAppetite: 'Conservative' };
      if (lower.includes('aggressive') || lower.includes('high')) return { riskAppetite: 'Aggressive' };
      return { riskAppetite: 'Moderate' };
      
    case 'capexRange':
      if (lower.includes('micro') || lower.includes('<$1')) return { capexRange: 'Micro' };
      if (lower.includes('small') || lower.includes('$1-10')) return { capexRange: 'Small' };
      if (lower.includes('medium') || lower.includes('$10-50')) return { capexRange: 'Medium' };
      if (lower.includes('large') || lower.includes('$50-200')) return { capexRange: 'Large' };
      if (lower.includes('mega') || lower.includes('>$200')) return { capexRange: 'Mega' };
      return {};
      
    case 'sectorPreferences':
      const sectors = ['manufacturing', 'tourism', 'digital', 'energy', 'agroindustry', 
                       'infrastructure', 'mining', 'fisheries', 'health', 'education'];
      const matched = sectors.filter(s => lower.includes(s));
      return matched.length > 0 ? { sectorPreferences: matched.map(s => s.charAt(0).toUpperCase() + s.slice(1)) } : {};
      
    case 'regionPreferences':
      const regions = ['java', 'sumatra', 'kalimantan', 'sulawesi', 'papua', 'bali', 'maluku'];
      const matchedRegions = regions.filter(r => lower.includes(r));
      return matchedRegions.length > 0 ? { regionPreferences: matchedRegions.map(r => r.charAt(0).toUpperCase() + r.slice(1)) } : {};
      
    case 'timelineMonths':
      if (lower.includes('6')) return { timelineMonths: 6 };
      if (lower.includes('1-2') || lower.includes('year')) return { timelineMonths: 18 };
      if (lower.includes('3-5')) return { timelineMonths: 48 };
      if (lower.includes('5+')) return { timelineMonths: 60 };
      return {};
      
    default:
      return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SMART DEFAULTS — Fill missing fields intelligently
// ═══════════════════════════════════════════════════════════════════════════

export function fillDefaults(profile: Partial<InvestorProfile>): InvestorProfile {
  const now = new Date().toISOString();
  return {
    id: profile.id || `inv_${Date.now()}`,
    name: profile.name || 'Guest Investor',
    riskAppetite: profile.riskAppetite || 'Moderate',
    capexRange: profile.capexRange || 'Medium',
    sectorPreferences: profile.sectorPreferences || [],
    regionPreferences: profile.regionPreferences || [],
    timelineMonths: profile.timelineMonths || 24,
    esgRequirements: profile.esgRequirements || [],
    experienceLevel: profile.experienceLevel || 'Intermediate',
    preferredProjectTypes: profile.preferredProjectTypes || ['Greenfield'],
    profileCompleteness: calculateCompleteness(profile),
    createdAt: profile.createdAt || now,
    updatedAt: now,
  };
}

function calculateCompleteness(profile: Partial<InvestorProfile>): number {
  const fields = [
    'riskAppetite', 'capexRange', 'sectorPreferences', 'regionPreferences',
    'timelineMonths', 'esgRequirements', 'experienceLevel', 'preferredProjectTypes',
  ] as const;
  
  const filled = fields.filter(f => {
    const val = profile[f];
    return val !== undefined && val !== null && 
           (typeof val !== 'object' || (Array.isArray(val) && val.length > 0));
  }).length;
  
  return Math.round((filled / fields.length) * 100);
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. NEXT QUESTION GENERATOR — Rotate max 3 questions
// ═══════════════════════════════════════════════════════════════════════════

export function getNextQuestions(profile: InvestorProfile, count: number = 3): QuestionTemplate[] {
  const missing = QUESTION_BANK.filter(q => {
    const val = profile[q.field as keyof InvestorProfile];
    return val === undefined || val === null || 
           (Array.isArray(val) && val.length === 0);
  });
  
  // Priority: core fields first (risk, capex, sector)
  const priority = ['capexRange', 'riskAppetite', 'sectorPreferences', 'regionPreferences'];
  const sorted = missing.sort((a, b) => {
    const pa = priority.indexOf(a.field as string);
    const pb = priority.indexOf(b.field as string);
    return (pa === -1 ? 999 : pa) - (pb === -1 ? 999 : pb);
  });
  
  return sorted.slice(0, count);
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. PROFILE PERSISTENCE — localStorage + Context
// ═══════════════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'bkpm-investor-profile';

export function saveProfile(profile: InvestorProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  // Sync to backend (when available)
  // api.post('/investor/profile', profile);
}

export function loadProfile(): InvestorProfile | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as InvestorProfile;
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. REACT HOOK — useConcierge
// ═══════════════════════════════════════════════════════════════════════════

export function useConcierge() {
  const [profile, setProfile] = useState<InvestorProfile>(() => {
    return loadProfile() || fillDefaults({});
  });
  
  const [conversation, setConversation] = useState<Array<{ role: 'agent' | 'investor'; message: string }>>([]);
  
  // Update profile and persist
  const updateProfile = useCallback((updates: Partial<InvestorProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      next.profileCompleteness = calculateCompleteness(next);
      saveProfile(next);
      return next;
    });
  }, []);
  
  // Generate next questions based on profile completeness
  const getQuestions = useCallback(() => {
    return getNextQuestions(profile, 3);
  }, [profile]);
  
  // Process investor message (extract preferences)
  const processMessage = useCallback((message: string) => {
    // Add to conversation
    setConversation(prev => [...prev, { role: 'investor', message }]);
    
    // Extract preferences from all possible fields
    const updates: Partial<InvestorProfile> = {};
    QUESTION_BANK.forEach(q => {
      const extracted = extractPreferences(message, q.field as keyof InvestorProfile);
      Object.assign(updates, extracted);
    });
    
    if (Object.keys(updates).length > 0) {
      updateProfile(updates);
    }
    
    return updates;
  }, [updateProfile]);
  
  // Get agent response
  const getAgentResponse = useCallback(() => {
    const questions = getNextQuestions(profile, 1);
    if (questions.length === 0) {
      return "Your profile is complete! You can now view personalized recommendations.";
    }
    return questions[0].question;
  }, [profile, getNextQuestions]);
  
  return {
    profile,
    conversation,
    updateProfile,
    processMessage,
    getAgentResponse,
    getQuestions,
    completeness: profile.profileCompleteness,
    isComplete: profile.profileCompleteness >= 80,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. INTEGRATION — Feeds into useRecommendations
// ═══════════════════════════════════════════════════════════════════════════

/**
 * useRecommendations MODIFIED to use Concierge profile:
 * 
 * Before:
 *   const investor = useMemo(() => getCurrentInvestor(), []);
 * 
 * After:
 *   const { profile: investor } = useConcierge();
 * 
 * The rest of useRecommendations stays the same — match scores automatically
 * use the enriched profile from Concierge Agent.
 */
