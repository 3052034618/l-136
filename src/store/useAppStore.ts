import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Demand, Product, MatchResult, Communication } from '@/types';
import { mockProducts, allTags } from '@/data/mockProducts';

interface AppStore {
  demands: Demand[];
  products: Product[];
  matchResults: MatchResult[];
  communications: Communication[];
  selectedDemandId: string | null;
  selectedTags: string[];

  addDemand: (demand: Demand) => void;
  updateDemand: (id: string, updates: Partial<Demand>) => void;
  deleteDemand: (id: string) => void;
  setSelectedDemandId: (id: string | null) => void;

  setSelectedTags: (tags: string[]) => void;

  addMatchResult: (result: MatchResult) => MatchResult | null;
  updateMatchResult: (id: string, updates: Partial<MatchResult>) => void;
  deleteMatchResult: (id: string) => void;

  addCommunication: (comm: Communication) => void;
  updateCommunication: (id: string, updates: Partial<Communication>) => void;
  deleteCommunication: (id: string) => void;

  getProductById: (id: string) => Product | undefined;
  getDemandById: (id: string) => Demand | undefined;
  getMatchResultsByDemand: (demandId: string) => MatchResult[];
  getCommunicationsByDemand: (demandId: string) => Communication[];
  getCommunicationsByMatch: (matchResultId: string) => Communication[];
  findMatchResult: (demandId: string, productId: string) => MatchResult | undefined;
  calculateMatchScore: (demand: Demand, product: Product) => MatchResult;
  addBulkMatchResults: (results: MatchResult[]) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      demands: [],
      products: mockProducts,
      matchResults: [],
      communications: [],
      selectedDemandId: null,
      selectedTags: [],

      addDemand: (demand) =>
        set((state) => ({ demands: [...state.demands, demand] })),

      updateDemand: (id, updates) =>
        set((state) => ({
          demands: state.demands.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        })),

      deleteDemand: (id) =>
        set((state) => ({
          demands: state.demands.filter((d) => d.id !== id),
          matchResults: state.matchResults.filter((m) => m.demandId !== id),
          communications: state.communications.filter((c) => c.demandId !== id),
        })),

      setSelectedDemandId: (id) => set({ selectedDemandId: id }),

      setSelectedTags: (tags) => set({ selectedTags: tags }),

      addMatchResult: (result) => {
        const existing = get().matchResults.find(
          (m) => m.demandId === result.demandId && m.productId === result.productId
        );
        if (existing) {
          return existing;
        }
        set((state) => ({ matchResults: [...state.matchResults, result] }));
        return result;
      },

      findMatchResult: (demandId, productId) =>
        get().matchResults.find(
          (m) => m.demandId === demandId && m.productId === productId
        ),

      calculateMatchScore: (demand, product) => {
        let scoreDataScope = 0;
        let scoreFrequency = 0;
        let scorePrice = 0;
        let scoreCompliance = 0;

        const demandKeywords = demand.dataScope
          .toLowerCase()
          .split(/[，,。；;\s]+/)
          .filter(Boolean);
        const productText = (product.dataScope + ' ' + product.description + ' ' + product.tags.join(' ')).toLowerCase();
        let matchCount = 0;
        for (const kw of demandKeywords) {
          if (productText.includes(kw)) matchCount++;
        }
        if (demandKeywords.length > 0) {
          scoreDataScope = Math.min(100, Math.round((matchCount / demandKeywords.length) * 100));
        }
        if (product.tags.includes(demand.industry)) {
          scoreDataScope = Math.min(100, scoreDataScope + 20);
        }

        const freqMap: Record<string, number> = {
          '实时': 100,
          '每日': 80,
          '每周': 60,
          '每月': 40,
          '季度': 20,
        };
        const demandFreq = freqMap[demand.updateFrequency] ?? 50;
        const productFreq = freqMap[product.updateFrequency] ?? 50;
        const diff = Math.abs(demandFreq - productFreq);
        scoreFrequency = Math.max(0, 100 - diff);

        const priceInWan = product.price / 10000;
        if (priceInWan >= demand.budgetMin && priceInWan <= demand.budgetMax) {
          scorePrice = 100;
        } else if (priceInWan < demand.budgetMin) {
          scorePrice = 85;
        } else {
          const overRatio = (priceInWan - demand.budgetMax) / Math.max(demand.budgetMax, 1);
          scorePrice = Math.max(0, Math.round(100 - overRatio * 100));
        }

        const complianceKeywords = demand.complianceReqs
          .toLowerCase()
          .split(/[，,。；;\s]+/)
          .filter(Boolean);
        let certMatch = 0;
        for (const cert of product.complianceCerts) {
          for (const kw of complianceKeywords) {
            if (cert.toLowerCase().includes(kw)) certMatch++;
          }
        }
        if (complianceKeywords.length > 0) {
          scoreCompliance = Math.min(100, Math.round((certMatch / complianceKeywords.length) * 100));
        } else {
          scoreCompliance = product.complianceCerts.length > 0 ? 70 : 50;
        }

        const totalScore = Math.round(
          (scoreDataScope + scoreFrequency + scorePrice + scoreCompliance) / 4
        );

        return {
          id: crypto.randomUUID(),
          demandId: demand.id,
          productId: product.id,
          scoreDataScope,
          scoreFrequency,
          scorePrice,
          scoreCompliance,
          totalScore,
          markedPrice: '',
          markedDelivery: '',
          markedRestrictions: '',
          status: 'candidate',
        };
      },

      addBulkMatchResults: (results) => {
        const existingKeys = new Set(
          get().matchResults.map((m) => `${m.demandId}|${m.productId}`)
        );
        const newResults = results.filter(
          (r) => !existingKeys.has(`${r.demandId}|${r.productId}`)
        );
        set((state) => ({
          matchResults: [...state.matchResults, ...newResults],
        }));
      },

      updateMatchResult: (id, updates) =>
        set((state) => ({
          matchResults: state.matchResults.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),

      deleteMatchResult: (id) =>
        set((state) => ({
          matchResults: state.matchResults.filter((m) => m.id !== id),
          communications: state.communications.filter(
            (c) => c.matchResultId !== id
          ),
        })),

      addCommunication: (comm) =>
        set((state) => ({
          communications: [...state.communications, comm],
        })),

      updateCommunication: (id, updates) =>
        set((state) => ({
          communications: state.communications.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      deleteCommunication: (id) =>
        set((state) => ({
          communications: state.communications.filter((c) => c.id !== id),
        })),

      getProductById: (id) => get().products.find((p) => p.id === id),
      getDemandById: (id) => get().demands.find((d) => d.id === id),
      getMatchResultsByDemand: (demandId) =>
        get().matchResults.filter((m) => m.demandId === demandId),
      getCommunicationsByDemand: (demandId) =>
        get().communications.filter((c) => c.demandId === demandId),
      getCommunicationsByMatch: (matchResultId) =>
        get().communications.filter((c) => c.matchResultId === matchResultId),
    }),
    {
      name: 'data-matchmaking-storage',
    }
  )
);

export { allTags };
