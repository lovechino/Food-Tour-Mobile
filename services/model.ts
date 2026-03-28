import RNFS from "react-native-fs";
import { unzip } from "react-native-zip-archive";

const MODEL_ZIP_URL =
  "https://github.com/lovechino/food-ai-city-packs/releases/download/v1.0.1/model.zip";

const MODEL_DIR = `${RNFS.DocumentDirectoryPath}/model`;
const ZIP_PATH = `${RNFS.DocumentDirectoryPath}/model.zip`;

const MODEL_PATH = `${MODEL_DIR}/minilm-int8.onnx`;
const TOKENIZER_PATH = `${MODEL_DIR}/tokenizer.json`;


// ✅ Check model + tokenizer đủ chưa
export const isModelDownloaded = async () => {
  try {
    const modelExists = await RNFS.exists(MODEL_PATH);
    const tokenizerExists = await RNFS.exists(TOKENIZER_PATH);
    return modelExists && tokenizerExists;
  } catch (e) {
    console.log("Check model error:", e);
    return false;
  }
};


// ⬇️ Download + unzip model pack
export const downloadModel = async (
  onProgress?: (p: number) => void
) => {
  try {
    // tạo thư mục model nếu chưa có
    if (!(await RNFS.exists(MODEL_DIR))) {
      await RNFS.mkdir(MODEL_DIR);
    }

    console.log("Downloading model zip...");

    const download = RNFS.downloadFile({
      fromUrl: MODEL_ZIP_URL,
      toFile: ZIP_PATH,
      progress: (res) => {
        const progress = res.bytesWritten / res.contentLength;
        onProgress?.(progress);
      },
      progressDivider: 1,
    });

    const res = await download.promise;
    if (res.statusCode !== 200) throw new Error("Download failed");

    console.log("Unzipping model...");
    await unzip(ZIP_PATH, MODEL_DIR);

    // xóa file zip sau khi giải nén
    await RNFS.unlink(ZIP_PATH);

    console.log("Model + tokenizer ready");
    return true;
  } catch (e) {
    console.log("Download model error:", e);
    return false;
  }
};
