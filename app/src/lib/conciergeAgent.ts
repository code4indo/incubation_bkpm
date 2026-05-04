/**
 * CONCIERGE AGENT — Investor Profile Builder
 *
 * Implementasi mas-concierge-skill ke dalam sistem BKPM Investment Portal.
 * Now uses the unified InvestorProfile from @/types.
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
 *                    │  (feeds CMS Engine)   │
 *                    └─────────────────┘
 */

import { useState, useCallback } from 'react';
import type { InvestorProfile, Project, RiskAppetite, CapexRange, ExperienceLevel, ProjectTypePreference, InvestmentHorizon, InvestorType } from '@/types';

// Re-export types for backward compatibility
export type { RiskAppetite, CapexRange, ExperienceLevel, ProjectTypePreference, InvestorType };

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
    field: 'preferredRegions',
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
    options: ['Greenfield (new)', 'Brownfield (existing)', 'Expansion', 'JV (Joint Venture)'],
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
      if (lower.includes('conservative') || lower.includes('safe')) return { riskAppetite: 'Conservative', riskToleranceScore: 0.2 };
      if (lower.includes('aggressive') || lower.includes('high')) return { riskAppetite: 'Aggressive', riskToleranceScore: 0.8 };
      return { riskAppetite: 'Moderate', riskToleranceScore: 0.5 };

    case 'capexRange':
      if (lower.includes('micro') || lower.includes('<$1')) return { capexRange: 'Micro', minTicketSize: 0.1, maxTicketSize: 1 };
      if (lower.includes('small') || lower.includes('$1-10')) return { capexRange: 'Small', minTicketSize: 1, maxTicketSize: 10 };
      if (lower.includes('medium') || lower.includes('$10-50')) return { capexRange: 'Medium', minTicketSize: 5, maxTicketSize: 30 };
      if (lower.includes('large') || lower.includes('$50-200')) return { capexRange: 'Large', minTicketSize: 15, maxTicketSize: 80 };
      if (lower.includes('mega') || lower.includes('>$200')) return { capexRange: 'Mega', minTicketSize: 50, maxTicketSize: 300 };
      return {};

    case 'sectorPreferences':
      const sectors = ['manufacturing', 'tourism', 'digital', 'energy', 'agroindustry',
        'infrastructure', 'mining', 'fisheries', 'health', 'education', 'industri', 'pariwisata', 'energi', 'pertanian', 'infrastruktur'];
      const matched = sectors.filter(s => lower.includes(s));
      return matched.length > 0 ? { sectorPreferences: matched.map(s => s.charAt(0).toUpperCase() + s.slice(1)) } : {};

    case 'preferredRegions':
      const regions = ['java', 'sumatra', 'kalimantan', 'sulawesi', 'papua', 'bali', 'maluku'];
      const matchedRegions = regions.filter(r => lower.includes(r));
      return matchedRegions.length > 0 ? { preferredRegions: matchedRegions.map(r => r.charAt(0).toUpperCase() + r.slice(1)) } : {};

    case 'timelineMonths':
      if (lower.includes('6')) return { timelineMonths: 6, investmentHorizon: 'Short' };
      if (lower.includes('1-2') || lower.includes('year')) return { timelineMonths: 18, investmentHorizon: 'Medium' };
      if (lower.includes('3-5')) return { timelineMonths: 48, investmentHorizon: 'Long' };
      if (lower.includes('5+')) return { timelineMonths: 60, investmentHorizon: 'Long' };
      return {};

    case 'experienceLevel':
      if (lower.includes('novice') || lower.includes('first')) return { experienceLevel: 'Novice', investorType: 'HNWI' };
      if (lower.includes('expert') || lower.includes('extensive')) return { experienceLevel: 'Expert' };
      return { experienceLevel: 'Intermediate' };

    case 'preferredProjectTypes':
      const types: ProjectTypePreference[] = [];
      if (lower.includes('greenfield') || lower.includes('new')) types.push('Greenfield');
      if (lower.includes('brownfield') || lower.includes('existing')) types.push('Brownfield');
      if (lower.includes('expansion')) types.push('Expansion');
      if (lower.includes('jv') || lower.includes('joint')) types.push('JV');
      return types.length > 0 ? { preferredProjectTypes: types } : {};

    default:
      return {};
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SMART DEFAULTS — Fill missing fields with CMS-compatible values
// ═══════════════════════════════════════════════════════════════════════════

export function fillDefaults(profile: Partial<InvestorProfile>): InvestorProfile {
  const now = new Date().toISOString();
  const riskTolerance = profile.riskToleranceScore ?? (
    profile.riskAppetite === 'Conservative' ? 0.2 :
    profile.riskAppetite === 'Aggressive' ? 0.8 : 0.5
  );

  return {
    id: profile.id || `inv_${Date.now()}`,
    name: profile.name || 'Guest Investor',
    company: profile.company || '',
    email: profile.email,
    nationality: profile.nationality,

    investorType: profile.investorType || 'HNWI',
    experienceLevel: profile.experienceLevel || 'Intermediate',

    riskAppetite: profile.riskAppetite || 'Moderate',
    riskToleranceScore: riskTolerance,
    capexRange: profile.capexRange || 'Medium',
    minTicketSize: profile.minTicketSize ?? 5,
    maxTicketSize: profile.maxTicketSize ?? 30,
    sectorPreferences: profile.sectorPreferences || [],
    preferredRegions: profile.preferredRegions || [],
    preferredProvinces: profile.preferredProvinces || [],
    investmentHorizon: profile.investmentHorizon || 'Medium',

    focusAreas: profile.focusAreas || [],
    pastSectors: profile.pastSectors || [],
    preferredProjectTypes: profile.preferredProjectTypes || ['Greenfield'],
    preferredKbliCodes: profile.preferredKbliCodes || [],
    esgRequirements: profile.esgRequirements || [],

    timelineMonths: profile.timelineMonths || 24,

    totalInvestments: profile.totalInvestments || 0,
    investmentHistory: profile.investmentHistory || [],

    profileCompleteness: calculateCompleteness(profile),
    isSynthetic: false,
    createdAt: profile.createdAt || now,
    updatedAt: now,
  };
}

function calculateCompleteness(profile: Partial<InvestorProfile>): number {
  const coreFields = [
    'riskAppetite', 'capexRange', 'sectorPreferences', 'preferredRegions',
    'timelineMonths', 'esgRequirements', 'experienceLevel', 'preferredProjectTypes',
  ] as const;

  const filled = coreFields.filter(f => {
    const val = profile[f];
    return val !== undefined && val !== null &&
      (typeof val !== 'object' || (Array.isArray(val) && val.length > 0));
  }).length;

  return Math.round((filled / coreFields.length) * 100);
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

  const priority = ['capexRange', 'riskAppetite', 'sectorPreferences', 'preferredRegions'];
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

  const updateProfile = useCallback((updates: Partial<InvestorProfile>) => {
    setProfile(prev => {
      const next = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      next.profileCompleteness = calculateCompleteness(next);
      saveProfile(next);
      return next;
    });
  }, []);

  const getQuestions = useCallback(() => {
    return getNextQuestions(profile, 3);
  }, [profile]);

  const processMessage = useCallback((message: string) => {
    setConversation(prev => [...prev, { role: 'investor', message }]);

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

  const getAgentResponse = useCallback(() => {
    const questions = getNextQuestions(profile, 1);
    if (questions.length === 0) {
      return "Your profile is complete! You can now view personalized CMS-powered recommendations.";
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
// 8. INTEGRATION — Feeds into useRecommendations via CMS Engine
// ═══════════════════════════════════════════════════════════════════════════

/**
 * useRecommendations MODIFIED to use Concierge profile:
 *
 *   const { profile: investor } = useConcierge();
 *
 * The CMS engine automatically uses the enriched profile.
 * Cold-start handling: new investors get α_adj=0.60 (content-only).
 */
