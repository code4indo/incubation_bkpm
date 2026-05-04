/**
 * INVESTOR DATA — Backward Compatible Wrapper
 *
 * This file now delegates to the semi-synthetic investor data.
 * All 8 original dummy investors have been replaced with 50+ realistic
 * semi-synthetic investor profiles based on BKPM statistics.
 *
 * Migration guide:
 *   - DEFAULT_INVESTOR → Still works, now maps to GIC (first SWF)
 *   - ALL_INVESTORS → Now returns 50+ semi-synthetic profiles
 *   - DUMMY_INTERACTIONS → Now returns generated interaction events
 *   - Types: Uses unified InvestorProfile from @/types
 */

import type { InvestorProfile, InteractionEvent } from '@/types';
import {
  ALL_SYNTHETIC_INVESTORS,
  SYNTHETIC_INTERACTIONS,
  ALL_INVESTOR_IDS as SYNTHETIC_INVESTOR_IDS,
  INVESTOR_STATS,
} from './semiSyntheticInvestors';

// ── Exports (backward compatible) ──

/** Default investor for demo — GIC Private Limited (largest SWF active in Indonesia) */
export const DEFAULT_INVESTOR: InvestorProfile = ALL_SYNTHETIC_INVESTORS[0];

/** All 50+ semi-synthetic investor profiles */
export const ALL_INVESTORS: InvestorProfile[] = ALL_SYNTHETIC_INVESTORS;

/** All investor IDs */
export const ALL_INVESTOR_IDS: string[] = SYNTHETIC_INVESTOR_IDS;

/** Semi-synthetic interaction events */
export const DUMMY_INTERACTIONS: InteractionEvent[] = SYNTHETIC_INTERACTIONS;

/** Investor statistics for dashboard */
export const INVESTOR_DASHBOARD_STATS = INVESTOR_STATS;

// ── Helper functions (backward compatible) ──

export function getCurrentInvestor(): InvestorProfile {
  return DEFAULT_INVESTOR;
}

export function getAllInvestorIds(): string[] {
  return SYNTHETIC_INVESTOR_IDS;
}

export function getAllInteractions(): InteractionEvent[] {
  return DUMMY_INTERACTIONS;
}
