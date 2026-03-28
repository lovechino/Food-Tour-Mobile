import RNFS from "react-native-fs";

// Cache ONLY the currently loaded city to save RAM
let currentCity: string | null = null;
let currentVectors: Float32Array | null = null;
const dim = 384;

import { toByteArray } from "base64-js";

export const loadVectors = async (city: string) => {
  if (currentCity === city && currentVectors) {
    return currentVectors;
  }

  // Clear previous cache to free memory
  if (currentVectors) {
    console.log(`[Memory] Clearing vectors for ${currentCity}`);
    currentVectors = null;
    // @ts-ignore
    if (global.gc) global.gc();
  }

  const path = `${RNFS.DocumentDirectoryPath}/citypacks/${city}/vectors.bin`;

  try {
    console.log(`Loading vectors from ${path}...`);

    // Check file existence
    if (!(await RNFS.exists(path))) {
      throw new Error(`Vector file not found at ${path}`);
    }

    // Get file size
    const stats = await RNFS.stat(path);
    const fileSize = Number(stats.size);

    if (fileSize === 0) throw new Error("Vector file is empty");
    if (fileSize % 4 !== 0) throw new Error("File size must be multiple of 4");

    // Allocate memory upfront
    const floatCount = fileSize / 4;
    const vectors = new Float32Array(floatCount);
    // Create a Uint8Array view on the same buffer to write bytes
    const uint8View = new Uint8Array(vectors.buffer);

    // Chunk size: 256KB for better responsiveness (was 1MB)
    const CHUNK_SIZE = 256 * 1024;
    let offset = 0;

    // Time-based yielding configuration
    const MAX_BLOCKING_TIME_MS = 8; // Aim for very low latency
    let lastYieldTime = Date.now();

    while (offset < fileSize) {
      const remaining = fileSize - offset;
      const length = Math.min(remaining, CHUNK_SIZE);

      // Read chunk as base64
      const chunkBase64 = await RNFS.read(path, length, offset, 'base64');

      // Decode base64 to byte array
      const chunkBytes = toByteArray(chunkBase64);

      // Set bytes into the main buffer
      uint8View.set(chunkBytes, offset);

      offset += length;

      // Check time every chunk
      const now = Date.now();
      if (now - lastYieldTime > MAX_BLOCKING_TIME_MS) {
        await new Promise<void>(r => setTimeout(() => r(), 0)); // Yield to UI
        lastYieldTime = Date.now();
      }
    }

    if (vectors.length % dim !== 0) {
      throw new Error(`Vector file size invalid: ${vectors.length} floats (not divisible by ${dim})`);
    }

    console.log(`Vectors loaded for ${city}: ${vectors.length / dim} items`);

    currentCity = city;
    currentVectors = vectors;
    return vectors;
  } catch (e) {
    console.error(`Failed to load vectors for ${city}:`, e);
    throw e;
  }
};
