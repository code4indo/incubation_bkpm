/**
 * React Hook: useRecommendations
 * 
 * Integrates the hybrid recommendation engine with React components.
 * Provides real-time match scores based on investor profile + interaction data.
 * 
 * SWAP GUIDE: Replace getCurrentInvestor() and getAllInteractions() 
 * with API calls when backend is ready.
 */

import { useMemo, useCallback } from 'react';
import { getTopRecommendations, getRecommendationScore } from '@/lib/recommendationEngine';
import { getCurrentInvestor, getAllInvestorIds, getAllInteractions } from '@/data/investorMockData';
import type { InteractionEvent } from '@/lib/recommendationEngine';
import type { Project } from '@/types';

export function useRecommendations() {
  const investor = useMemo(() => getCurrentInvestor(), []);
  const allInvestorIds = useMemo(() => getAllInvestorIds(), []);
  const interactions = useMemo(() => getAllInteractions(), []);
  
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
    getRecommendations,
    getMatchScore,
    trackInteraction: (projectId: number, eventType: InteractionEvent['eventType']) => {
      // In production: await api.post('/interactions', { ... });
      console.log(`[Analytics] ${eventType} on project ${projectId} by ${investor.id}`);
    },
  };
}
