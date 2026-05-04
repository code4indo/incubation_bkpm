/**
 * React Hook: useRecommendations
 *
 * Integrates the CMS-powered hybrid recommendation engine with React components.
 * Provides real-time match scores based on investor profile + interaction data.
 *
 * Data Sources:
 *   - Semi-synthetic investors (50+ profiles) from semiSyntheticInvestors.ts
 *   - Real BKPM projects (181) from realData.ts
 *   - CMS formula: α·S_content + β·S_behavior + γ·S_policy + δ·S_risk
 */

import { useMemo, useCallback } from 'react';
import { getTopRecommendations, getRecommendationScore } from '@/lib/recommendationEngine';
import { ALL_SYNTHETIC_INVESTORS, SYNTHETIC_INTERACTIONS, ALL_INVESTOR_IDS } from '@/data/semiSyntheticInvestors';
import type { InteractionEvent, InvestorProfile, Project } from '@/types';

// Default investor for demo — GIC (largest SWF active in Indonesia)
const DEFAULT_INVESTOR = ALL_SYNTHETIC_INVESTORS[0];

export function useRecommendations(investorOverride?: InvestorProfile) {
  const investor = useMemo(() => investorOverride || DEFAULT_INVESTOR, [investorOverride]);
  const allInvestorIds = useMemo(() => ALL_INVESTOR_IDS, []);
  const interactions = useMemo(() => SYNTHETIC_INTERACTIONS, []);

  // Get top N recommendations for the current investor
  const getRecommendations = useCallback((topN: number = 6) => {
    return getTopRecommendations(investor, interactions, allInvestorIds, topN);
  }, [investor, interactions, allInvestorIds]);

  // Get match score for a specific project
  const getMatchScore = useCallback((project: Project) => {
    return getRecommendationScore(investor, project, interactions, allInvestorIds);
  }, [investor, interactions, allInvestorIds]);

  return {
    investor,
    allInvestors: ALL_SYNTHETIC_INVESTORS,
    getRecommendations,
    getMatchScore,
    trackInteraction: (projectId: number, eventType: InteractionEvent['eventType']) => {
      // In production: await api.post('/interactions', { ... });
      console.log(`[Analytics] ${eventType} on project ${projectId} by ${investor.id}`);
    },
  };
}
