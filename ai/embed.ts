import * as ort from "onnxruntime-react-native";
import { getSession } from "./model";
import { tokenize } from "./tokenizer";
import { meanPooling, normalize } from "./math";

const HIDDEN_SIZE = 384;

export const embedText = async (text: string) => {
  const session = await getSession();

  const rawIds = await tokenize(text);

  const inputIds = rawIds.map((v: any) => {
    const n = Math.floor(Number(v));
    return Number.isFinite(n) ? n : 0;
  });

  const attentionMask = new Array(inputIds.length).fill(1);
  const tokenTypeIds = new Array(inputIds.length).fill(0); // 🔥 FIX Ở ĐÂY

  const feeds: Record<string, ort.Tensor> = {
    input_ids: new ort.Tensor(
      "int64",
      BigInt64Array.from(inputIds.map(n => BigInt(n))),
      [1, inputIds.length]
    ),
    attention_mask: new ort.Tensor(
      "int64",
      BigInt64Array.from(attentionMask.map(n => BigInt(n))),
      [1, attentionMask.length]
    ),
    token_type_ids: new ort.Tensor(
      "int64",
      BigInt64Array.from(tokenTypeIds.map(n => BigInt(n))),
      [1, tokenTypeIds.length]
    ),
  };

  try {
    // Yield before heavy inference
    await new Promise<void>(r => setTimeout(() => r(), 0));

    // console.log("Running inference...");
    const results = await session.run(feeds);

    // Yield after inference
    await new Promise<void>(r => setTimeout(() => r(), 0));

    const outputName = Object.keys(results)[0]; // auto lấy output đầu tiên
    const hidden = results[outputName].data as Float32Array;

    const pooled = meanPooling(hidden, attentionMask, inputIds.length, HIDDEN_SIZE);

    return normalize(pooled);
  } catch (e) {
    console.error("ONNX Inference Error:", e);
    // Trả về vector 0 nếu lỗi để app không crash
    return new Float32Array(HIDDEN_SIZE);
  }
};
