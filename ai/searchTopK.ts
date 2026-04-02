import { useVectorStore } from "../hooks/useVectorStore";
import { yieldToEventLoop } from "../utils/async";

// Inlined dot product to avoid function call overhead and subarray allocation
// queryVec: Float32Array (dim)
// vectors: Float32Array (total * dim)
// index: starting index in vectors for the current item
// dim: dimension (384)
function dotProduct(queryVec: Float32Array, vectors: Float32Array, index: number, dim: number) {
  let sum = 0;
  // Manual loop unrolling could be faster but let's trust V8 for now
  for (let i = 0; i < dim; i++) {
    sum += queryVec[i] * vectors[index + i];
  }
  return sum;
}

export const searchTopK = async (queryVec: Float32Array, city: string, k = 5) => {
  let vectors = useVectorStore.getState().vectors;
  if (!vectors || useVectorStore.getState().currentCity !== city) {
    await useVectorStore.getState().loadCity(city);
    vectors = useVectorStore.getState().vectors;
  }
  if (!vectors) throw new Error("Vectors not loaded");
  const dim = 384;
  const total = vectors.length / dim;

  const scores: { index: number; score: number }[] = [];

  // Time-based yielding configuration
  const MAX_BLOCKING_TIME_MS = 8; // Reduce to half a frame (8ms)
  let lastYieldTime = Date.now();

  for (let i = 0; i < total; i++) {
    // Check time every 50 items (more frequent checks)
    if (i % 50 === 0) {
      const now = Date.now();
      if (now - lastYieldTime > MAX_BLOCKING_TIME_MS) {
        await yieldToEventLoop();
        lastYieldTime = Date.now();
      }
    }

    const score = dotProduct(queryVec, vectors, i * dim, dim);
    scores.push({ index: i, score });
  }

  scores.sort((a, b) => b.score - a.score);
  return scores.slice(0, k);
};
