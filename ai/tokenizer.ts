import RNFS from "react-native-fs";

let vocab: Record<string, number> = {};
let loaded = false;

export const loadTokenizer = async () => {
  if (loaded) return;

  try {
    const path = `${RNFS.DocumentDirectoryPath}/model/tokenizer.json`;
    if (!(await RNFS.exists(path))) {
      console.warn("Tokenizer file not found at:", path);
      return;
    }

    const json = await RNFS.readFile(path, "utf8");
    const tk = JSON.parse(json);

    // Cấu trúc tokenizer.json của HuggingFace thường là model.vocab
    if (tk.model && tk.model.vocab) {
      vocab = tk.model.vocab;
    } else {
      // Fallback nếu cấu trúc khác
      vocab = tk.vocab || {};
    }

    loaded = true;
    console.log("✅ Tokenizer loaded:", Object.keys(vocab).length, "tokens");
  } catch (e) {
    console.error("Failed to load tokenizer:", e);
  }
};

const isWhitespace = (char: string) => /\s/.test(char);

// Basic tokenizer: Tách dấu câu và khoảng trắng
const basicTokenize = (text: string): string[] => {
  const cleaned = text
    .normalize("NFC")
    // .replace(/[\u0300-\u036f]/g, "") // GIỮ LẠI DẤU TIẾNG VIỆT
    .toLowerCase();

  const tokens: string[] = [];
  let currentToken = "";

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];

    if (isWhitespace(char)) {
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }
    } else if (/[!?,.;:()"'\[\]\-]/.test(char)) {
      // Tách dấu câu riêng
      if (currentToken) {
        tokens.push(currentToken);
        currentToken = "";
      }
      tokens.push(char);
    } else {
      currentToken += char;
    }
  }

  if (currentToken) {
    tokens.push(currentToken);
  }

  return tokens;
};


import { yieldToEventLoop } from "../utils/async";

// WordPiece Tokenizer
export const tokenize = async (text: string): Promise<number[]> => {
  if (!loaded) await loadTokenizer();

  const words = basicTokenize(text);
  const outputTokens: number[] = [101]; // [CLS] start token

  // Time-based yielding
  const MAX_BLOCKING_TIME_MS = 12;
  let lastYieldTime = Date.now();

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check time every iteration (words are fewer than vectors, so it's okay)
    const now = Date.now();
    if (now - lastYieldTime > MAX_BLOCKING_TIME_MS) {
      await yieldToEventLoop();
      lastYieldTime = Date.now();
    }

    if (word.length > 100) {
      outputTokens.push(100); // [UNK]
      continue;
    }

    let isBad = false;
    let start = 0;
    const subTokens: number[] = [];

    while (start < word.length) {
      let end = word.length;
      let curSubStr = "";
      let found = false;

      // MaxMatch algorithm
      while (start < end) {
        let subStr = word.substring(start, end);
        if (start > 0) {
          subStr = "##" + subStr;
        }

        if (vocab[subStr] !== undefined) {
          curSubStr = subStr;
          found = true;
          break;
        }
        end--;
      }

      if (!found) {
        isBad = true;
        break;
      }

      subTokens.push(vocab[curSubStr]);
      start = end;
    }

    if (isBad) {
      outputTokens.push(100); // [UNK]
    } else {
      outputTokens.push(...subTokens);
    }
  }

  outputTokens.push(102); // [SEP] end token

  // Padding hoặc Truncate về 128 tokens
  const maxLen = 128;
  if (outputTokens.length > maxLen) {
    return outputTokens.slice(0, maxLen);
  }

  // Padding (nếu cần thiết cho model input shape cố định, nhưng ở đây ta trả về mảng dynamic cũng đc)
  // while (outputTokens.length < maxLen) {
  //   outputTokens.push(0); // [PAD]
  // }

  return outputTokens;
};
