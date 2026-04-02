import RNFS from "react-native-fs";

export const loadVectors = async (city: string): Promise<Float32Array> => {
  const path = `${RNFS.DocumentDirectoryPath}/citypacks/${city}/vectors.bin`;
  const dim = 384;

  try {
    console.log(`Loading vectors directly into ArrayBuffer from ${path}...`);
    if (!(await RNFS.exists(path))) throw new Error(`Vector file not found at ${path}`);
    
    // Using fetch with file:// scheme is natively accelerated and avoids Base64 Bridge overhead
    const response = await fetch('file://' + path);
    const arrayBuffer = await response.arrayBuffer();
    
    const fileSize = arrayBuffer.byteLength;
    if (fileSize === 0) throw new Error("Vector file is empty");
    if (fileSize % 4 !== 0) throw new Error("File size must be multiple of 4");

    const vectors = new Float32Array(arrayBuffer);

    if (vectors.length % dim !== 0) {
      throw new Error(`Vector file size invalid: ${vectors.length} floats (not divisible by ${dim})`);
    }

    console.log(`Vectors loaded for ${city}: ${vectors.length / dim} items without base64 penalty!`);
    return vectors;
  } catch (e) {
    console.error(`Failed to load vectors for ${city}:`, e);
    throw e;
  }
};
