import { create } from 'zustand';
import { loadVectors } from '../ai/loadVectors';

export class VectorLoadError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'VectorLoadError';
  }
}

interface VectorStoreState {
  vectors: Float32Array | null;
  currentCity: string | null;
  isLoading: boolean;
  error: VectorLoadError | null;
  loadCity: (city: string) => Promise<void>;
  clearVectors: () => void;
}

export const useVectorStore = create<VectorStoreState>((set, get) => ({
  vectors: null,
  currentCity: null,
  isLoading: false,
  error: null,
  loadCity: async (city: string) => {
    const state = get();
    // Guard: already loaded or loading
    if (state.currentCity === city && state.vectors) return;
    if (state.isLoading) return;

    set({ isLoading: true, error: null });

    // Clear old city to free memory
    if (state.vectors) {
      set({ vectors: null, currentCity: null });
      if (typeof (globalThis as any).gc === 'function') (globalThis as any).gc();
      await new Promise<void>(r => setTimeout(() => r(), 100)); // Give GC a frame to run
    }

    try {
      const vectors = await loadVectors(city);
      set({ vectors, currentCity: city, isLoading: false });
    } catch (e) {
      const loadError = new VectorLoadError(
        e instanceof Error ? e.message : 'Unknown error',
        e
      );
      set({ error: loadError, isLoading: false, vectors: null, currentCity: null });
      throw loadError; // Let Caller handle fallback
    }
  },
  clearVectors: () => {
    set({ vectors: null, currentCity: null, error: null, isLoading: false });
    if (typeof (globalThis as any).gc === 'function') (globalThis as any).gc();
  }
}));
