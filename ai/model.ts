import * as ort from "onnxruntime-react-native";
import { Platform } from "react-native";
import RNFS from "react-native-fs";

const MODEL_PATH = `${RNFS.DocumentDirectoryPath}/model/minilm-int8.onnx`;

let session: ort.InferenceSession | null = null;
let loadingPromise: Promise<ort.InferenceSession> | null = null;

export const loadModel = async () => {
  if (session) return session;
  if (loadingPromise) return loadingPromise;

  console.log("⏳ Initializing model loading...");

  loadingPromise = (async () => {
    try {
      const modelDir = `${RNFS.DocumentDirectoryPath}/model`;

      // 1. Ensure directory exists
      if (!(await RNFS.exists(modelDir))) {
        throw new Error(`Model directory not found at ${modelDir}`);
      }

      // 2. Find the ONNX file (recursively or just check root and one level deep)
      let foundPath: string | null = null;

      const files = await RNFS.readDir(modelDir);
      console.log(`📂 Scanning ${modelDir}:`, files.map(f => f.name));

      // Check root
      const rootFile = files.find(f => f.name.endsWith('.onnx'));
      if (rootFile) {
        foundPath = rootFile.path;
      } else {
        // Check subdirectories (1 level deep)
        for (const file of files) {
          if (file.isDirectory()) {
            const subFiles = await RNFS.readDir(file.path);
            console.log(`📂 Scanning subdir ${file.name}:`, subFiles.map(f => f.name));
            const subOnnx = subFiles.find(f => f.name.endsWith('.onnx'));
            if (subOnnx) {
              console.log(`⚠️ Found model in subdir: ${subOnnx.path}. Moving to root...`);
              const newPath = `${modelDir}/${subOnnx.name}`;
              await RNFS.moveFile(subOnnx.path, newPath);
              foundPath = newPath;
              break;
            }
          }
        }
      }

      if (!foundPath) {
        throw new Error("❌ minilm-int8.onnx not found in model directory or subdirectories!");
      }

      console.log(`✅ Found model file at: ${foundPath}`);

      // 3. Helper to verify file size
      const stat = await RNFS.stat(foundPath);
      console.log(`📄 File size: ${(Number(stat.size) / 1024 / 1024).toFixed(2)} MB`);

      // 4. Prepare path for ONNX Runtime
      let loadPath = foundPath;
      if (Platform.OS === 'android' && !loadPath.startsWith('file://')) {
        loadPath = `file://${loadPath}`;
      }

      console.log(`🚀 Loading into ORT with path: ${loadPath}`);

      session = await ort.InferenceSession.create(loadPath);
      console.log("✅ ONNX Session created successfully!");
      return session;

    } catch (e) {
      console.error("❌ loadModel failed:", e);
      session = null;
      throw e;
    }
  })();

  return loadingPromise;
};

export const getSession = async () => {
  return loadModel();
};
