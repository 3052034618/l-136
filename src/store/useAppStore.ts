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

  addMatchResult: (result: MatchResult) => void;
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

      addMatchResult: (result) =>
        set((state) => ({ matchResults: [...state.matchResults, result] })),

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
