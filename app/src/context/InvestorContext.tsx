/**
 * Investor Context — Global investor simulation state
 *
 * Enables the "Simulate as Investor" feature across all pages.
 * When a user selects an investor, that selection persists to
 * localStorage and propagates to every page that uses useInvestor().
 *
 * This is a simulation portal — users can switch between
 * 42 semi-synthetic investor profiles to see personalized
 * CMS-powered recommendations.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { ALL_SYNTHETIC_INVESTORS } from '@/data/semiSyntheticInvestors';
import type { InvestorProfile } from '@/types';

const STORAGE_KEY = 'bkpm-simulated-investor-id';

// Default: GIC (first SWF, most active in Indonesia)
const DEFAULT_INVESTOR_ID = ALL_SYNTHETIC_INVESTORS[0].id;

export interface InvestorContextType {
  /** Currently simulated investor */
  investor: InvestorProfile;
  /** Investor ID string (for Select components) */
  investorId: string;
  /** Switch to a different investor by ID */
  setInvestorById: (id: string) => void;
  /** All available investors for the selector */
  allInvestors: InvestorProfile[];
  /** Whether this investor is in cold-start mode */
  isColdStart: boolean;
}

export const InvestorContext = createContext<InvestorContextType | undefined>(undefined);

function getStoredInvestorId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ALL_SYNTHETIC_INVESTORS.some(i => i.id === stored)) return stored;
  } catch { /* localStorage unavailable */ }
  return DEFAULT_INVESTOR_ID;
}

export function InvestorProvider({ children }: { children: ReactNode }) {
  const [investorId, setInvestorIdState] = useState<string>(getStoredInvestorId);

  // Sync to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, investorId);
    } catch { /* ignore */ }
  }, [investorId]);

  const investor = ALL_SYNTHETIC_INVESTORS.find(i => i.id === investorId) || ALL_SYNTHETIC_INVESTORS[0];

  const setInvestorById = useCallback((id: string) => {
    setInvestorIdState(id);
  }, []);

  const isColdStart = investor.totalInvestments < 3 && investor.profileCompleteness < 50;

  return (
    <InvestorContext.Provider value={{
      investor,
      investorId,
      setInvestorById,
      allInvestors: ALL_SYNTHETIC_INVESTORS,
      isColdStart,
    }}>
      {children}
    </InvestorContext.Provider>
  );
}

export function useInvestor() {
  const context = useContext(InvestorContext);
  if (!context) {
    throw new Error('useInvestor must be used within InvestorProvider');
  }
  return context;
}
