# FoodTour AI — Mobile Local RAG Architecture (Optimized)

Tài liệu mô tả chi tiết hệ thống RAG chạy trực tiếp trên thiết bị (On-device RAG), sau khi tối ưu về quản lý bộ nhớ, chất lượng tìm kiếm và khả năng phục hồi lỗi.

---

## 1. Triết lý thiết kế

App theo mô hình **Thick Client - Thin Server**: điện thoại tự xử lý tối đa, server chỉ vào cuộc khi thực sự cần. Điều này mang lại:

- **0ms latency** cho 90% trường hợp tìm kiếm thông thường.
- **Hoạt động offline** — không phụ thuộc vào chất lượng mạng.
- **Chi phí server gần bằng 0** cho các query đơn giản.

---

## 2. Kiến trúc tổng thể

```
[User query]
     │
     ▼
[VectorStoreProvider]  ←── Quản lý lifecycle tập trung
     │  ├── vectors loaded? → dùng ngay
     │  └── chưa load → loadVectorsChunked(city) → catch OOM
     │
     ▼
[extractSearchIntent]  ←── Parse district, price, food type
     │
     ▼
[Promise.all]          ←── Chạy song song
     ├── vectorSearch(query, vectors, intent)
     └── sqliteSearch(query, intent, db)
     │
     ▼
[hybridMerge + strictVerify + deduplicate]
     │
     ▼
[generateTemplateResponse]  ←── 0ms, không cần LLM
     │
     ▼
[Render FoodList]
```

---

## 3. Quản lý Vector Store — VectorStoreProvider

### 3.1 Tại sao cần Provider tập trung

Phiên bản cũ để mỗi màn hình tự `loadVectors()` dẫn đến:
- Race condition khi user navigate nhanh giữa các thành phố.
- Load cùng một file nhiều lần vào RAM (double OOM risk).
- Không có cleanup khi unmount.

`VectorStoreProvider` giải quyết tất cả bằng cách làm single source of truth:

```typescript
// vectorStoreContext.tsx
interface VectorStoreContextType {
  vectorsRef: React.MutableRefObject<Float32Array | null>;
  idsRef: React.MutableRefObject<string[]>;
  loadCity: (city: string) => Promise<void>;
  isLoading: boolean;
  error: VectorLoadError | null;
}

const VectorStoreProvider: React.FC = ({ children }) => {
  const vectorsRef = useRef<Float32Array | null>(null);
  const idsRef = useRef<string[]>([]);
  const currentCityRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<VectorLoadError | null>(null);
  const loadLockRef = useRef(false);

  const loadCity = useCallback(async (city: string) => {
    // Guard: đang load rồi hoặc đã load đúng thành phố
    if (loadLockRef.current || currentCityRef.current === city) return;
    loadLockRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Giải phóng bộ nhớ thành phố cũ
      if (vectorsRef.current !== null) {
        vectorsRef.current = null;
        idsRef.current = [];
        currentCityRef.current = null;
        if (typeof global.gc === 'function') global.gc();
        await new Promise(r => setTimeout(r, 150)); // Cho GC một frame
      }

      const { vectors, ids } = await loadVectorsChunked(city);
      vectorsRef.current = vectors;
      idsRef.current = ids;
      currentCityRef.current = city;
    } catch (e) {
      const loadError = new VectorLoadError(
        e instanceof Error ? e.message : 'Unknown error'
      );
      setError(loadError);
      throw loadError; // Caller bắt và fallback online
    } finally {
      setIsLoading(false);
      loadLockRef.current = false;
    }
  }, []);

  return (
    <VectorStoreContext.Provider value={{ vectorsRef, idsRef, loadCity, isLoading, error }}>
      {children}
    </VectorStoreContext.Provider>
  );
};
```

### 3.2 Load vectors theo chunk — `loadVectors.ts`

```typescript
const CHUNK_SIZE = 256 * 1024; // 256KB mỗi chunk
const VECTOR_DIM = 384;

export async function loadVectorsChunked(
  city: string
): Promise<{ vectors: Float32Array; ids: string[] }> {
  const filePath = `${RNFS.DocumentDirectoryPath}/citypacks/${city}/vectors.bin`;
  const metaPath = `${RNFS.DocumentDirectoryPath}/citypacks/${city}/meta.json`;

  // Đọc file size
  const stat = await RNFS.stat(filePath);
  const fileSize = stat.size;
  const numVectors = fileSize / (VECTOR_DIM * 4); // Float32 = 4 bytes

  const result = new Float32Array(numVectors * VECTOR_DIM);
  let offset = 0;

  // Đọc từng chunk, yield sau mỗi chunk để không block UI
  while (offset < fileSize) {
    const chunkSize = Math.min(CHUNK_SIZE, fileSize - offset);
    const chunk = await RNFS.read(filePath, chunkSize, offset, 'base64');
    const buffer = Buffer.from(chunk, 'base64');
    const floats = new Float32Array(buffer.buffer);
    result.set(floats, offset / 4);
    offset += chunkSize;

    // Yield để giữ FPS 60
    await new Promise(r => setTimeout(r, 0));
  }

  // Đọc IDs từ meta
  const metaRaw = await RNFS.readFile(metaPath, 'utf8');
  const { ids } = JSON.parse(metaRaw);

  return { vectors: result, ids };
}
```

---

## 4. ONNX Embedding — On-demand Download

### 4.1 Không bundle model trong app

Model `bge-small-en-v1.5` (~23MB) tải on-demand lần đầu sử dụng và cache vĩnh viễn trên filesystem:

```typescript
// embed.ts
const MODEL_FILENAME = 'bge-small-en-v1.5.onnx';
const MODEL_LOCAL_PATH = `${RNFS.DocumentDirectoryPath}/${MODEL_FILENAME}`;
const MODEL_REMOTE_URL = `${Config.CDN_BASE}/models/${MODEL_FILENAME}`;

let sessionCache: InferenceSession | null = null;

async function getSession(): Promise<InferenceSession> {
  if (sessionCache) return sessionCache;

  // Download nếu chưa có
  const exists = await RNFS.exists(MODEL_LOCAL_PATH);
  if (!exists) {
    await RNFS.downloadFile({
      fromUrl: MODEL_REMOTE_URL,
      toFile: MODEL_LOCAL_PATH,
      progressDivider: 10,
      progress: res => {
        const pct = Math.round((res.bytesWritten / res.contentLength) * 100);
        modelDownloadProgress.emit(pct);
      }
    }).promise;
  }

  sessionCache = await InferenceSession.create(MODEL_LOCAL_PATH, {
    executionProviders: ['CoreML', 'cpu'] // CoreML trên iOS, CPU fallback
  });

  return sessionCache;
}

export async function embedText(text: string): Promise<Float32Array> {
  const session = await getSession();
  const tokens = tokenize(text); // Truncate tới 128 tokens

  // Chạy inference theo batch nhỏ, yield liên tục
  const inputIds = new BigInt64Array(tokens.ids.map(BigInt));
  const attentionMask = new BigInt64Array(tokens.mask.map(BigInt));

  const feeds = {
    input_ids: new Tensor('int64', inputIds, [1, tokens.ids.length]),
    attention_mask: new Tensor('int64', attentionMask, [1, tokens.mask.length])
  };

  // Yield trước khi run để animation không bị giật
  await new Promise(r => requestAnimationFrame(r));
  const output = await session.run(feeds);

  return meanPooling(output['last_hidden_state'].data as Float32Array, tokens.mask);
}
```

### 4.2 Download progress UI

```tsx
// Hiển thị progress bar khi tải model lần đầu
const [downloadPct, setDownloadPct] = useState<number | null>(null);

useEffect(() => {
  const sub = modelDownloadProgress.addListener(pct => {
    setDownloadPct(pct);
    if (pct === 100) setTimeout(() => setDownloadPct(null), 1000);
  });
  return () => sub.remove();
}, []);

{downloadPct !== null && (
  <View style={styles.downloadBanner}>
    <Text>Đang tải AI model... {downloadPct}%</Text>
    <ProgressBar progress={downloadPct / 100} />
  </View>
)}
```

---

## 5. Hybrid Search — Vector + SQLite

### 5.1 Intent Extraction

```typescript
// searchLogic.ts
interface SearchIntent {
  keywords: string[];           // Từ khóa chính
  foodType?: string;            // "bún bò", "phở", "cà phê"...
  district?: string;            // "quận 1", "hoàn kiếm"...
  maxPrice?: number;            // Đơn vị: VND
  minRating?: number;
}

const FOOD_TYPES = [
  'bún bò', 'phở', 'bánh mì', 'cơm tấm', 'bún chả',
  'cà phê', 'trà sữa', 'lẩu', 'bbq', 'sushi', 'pizza'
];

export function extractSearchIntent(query: string): SearchIntent {
  const q = query.toLowerCase().normalize('NFC');

  const districtMatch = q.match(
    /(?:quận|quan|q\.?)\s*(\d+|[a-zàáâãèéêìíòóôõùúăđĩũơưạ]+)/i
  );
  const priceMatch = q.match(/dưới\s*([\d.,]+)\s*k?/i);
  const ratingMatch = q.match(/(ngon|chất|đỉnh)/i);

  const foodType = FOOD_TYPES.find(f => q.includes(f));
  const keywords = q.split(/\s+/).filter(w => w.length > 2 && !STOPWORDS.has(w));

  return {
    keywords,
    foodType,
    district: districtMatch?.[1]?.trim(),
    maxPrice: priceMatch
      ? parseFloat(priceMatch[1].replace(',', '.')) * 1000
      : undefined,
    minRating: ratingMatch ? 4.0 : undefined
  };
}
```

### 5.2 Vector Search (Cosine Similarity)

```typescript
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

export function vectorSearch(
  queryVec: Float32Array,
  vectors: Float32Array,
  ids: string[],
  intent: SearchIntent,
  topK = 20
): Array<{ id: string; score: number }> {
  const numVectors = ids.length;
  const scores: Array<{ id: string; score: number }> = [];

  for (let i = 0; i < numVectors; i++) {
    const vec = vectors.subarray(i * 384, (i + 1) * 384);
    const score = cosineSimilarity(queryVec, vec);
    if (score > 0.35) { // Threshold tối thiểu, lọc rác
      scores.push({ id: ids[i], score });
    }
  }

  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}
```

### 5.3 SQLite Search + Strict Verification

```typescript
// foodRepo.ts
export async function sqliteSearch(
  intent: SearchIntent,
  city: string,
  limit = 20
): Promise<FoodItem[]> {
  let query = `
    SELECT id, ten_quan, dia_chi, quan, gia_trung_binh, tags, lat, lng, click_count
    FROM food
    WHERE thanh_pho = ?
  `;
  const params: (string | number)[] = [city];

  if (intent.district) {
    query += ' AND LOWER(quan) LIKE ?';
    params.push(`%${intent.district}%`);
  }
  if (intent.maxPrice) {
    query += ' AND gia_trung_binh <= ?';
    params.push(intent.maxPrice);
  }
  if (intent.foodType) {
    query += ' AND (LOWER(ten_quan) LIKE ? OR LOWER(tags) LIKE ?)';
    params.push(`%${intent.foodType}%`, `%${intent.foodType}%`);
  }

  query += ' ORDER BY click_count DESC LIMIT ?';
  params.push(limit);

  return db.getAllAsync<FoodItem>(query, params);
}

// Strict verification: vector candidate phải pass keyword check
function strictVerify(item: FoodItem, intent: SearchIntent): boolean {
  if (!intent.foodType) return true;
  const text = `${item.ten_quan} ${item.tags}`.toLowerCase();
  return text.includes(intent.foodType);
  // "bún bò" query → "bún chả" result → fail → loại khỏi kết quả
}
```

### 5.4 Merge + Deduplicate

```typescript
export async function hybridSearch(
  query: string,
  city: string,
  vectorStore: VectorStoreContextType
): Promise<FoodItem[]> {
  // Chạy song song
  const [queryVec, sqliteResults] = await Promise.all([
    embedText(query),
    sqliteSearch(extractSearchIntent(query), city)
  ]);

  const intent = extractSearchIntent(query);

  // Vector search trên in-memory Float32Array
  const vectorHits = vectorSearch(
    queryVec,
    vectorStore.vectorsRef.current!,
    vectorStore.idsRef.current,
    intent
  );

  // Fetch details cho vector hits từ SQLite
  const vectorIds = vectorHits.map(h => h.id);
  const vectorItems = await foodRepo.getByIds(vectorIds);

  // Strict verification
  const verifiedVector = vectorItems.filter(item => strictVerify(item, intent));
  const verifiedSqlite = sqliteResults.filter(item => strictVerify(item, intent));

  // Merge + deduplicate bằng Set
  const seen = new Set<string>();
  const merged: FoodItem[] = [];

  // Xen kẽ vector và sqlite để đảm bảo diversity
  const maxLen = Math.max(verifiedVector.length, verifiedSqlite.length);
  for (let i = 0; i < maxLen; i++) {
    for (const item of [verifiedVector[i], verifiedSqlite[i]]) {
      if (item && !seen.has(item.id)) {
        seen.add(item.id);
        merged.push(item);
      }
    }
  }

  return merged.slice(0, 15); // Trả tối đa 15 kết quả
}
```

---

## 6. Template Response Generator

Thay thế hoàn toàn LLM call cho các response thông thường — 0ms, không tốn API cost.

```typescript
// responseGenerator.ts
type ResponseScenario =
  | 'found_many'    // > 5 kết quả
  | 'found_few'     // 1-5 kết quả
  | 'not_found'     // 0 kết quả
  | 'cheap_find'    // Có quán giá rẻ nổi bật
  | 'surprise';     // Có quán rating cao ít người biết

const TEMPLATES: Record<ResponseScenario, string[]> = {
  found_many: [
    'Ở {district} có {count} quán {foodType} ngon lắm! Thử mấy quán này xem:',
    'Trời ơi {district} là thánh địa {foodType} luôn nè! Có đến {count} quán:',
    'Nhiều lựa chọn ghê! {count} quán {foodType} ở {district}, đây này:'
  ],
  found_few: [
    'Tìm được {count} quán {foodType} gần đây nè:',
    '{district} có {count} quán {foodType} đáng thử:',
  ],
  not_found: [
    'Hm, chưa tìm thấy quán {foodType} ở {district} trong dữ liệu của mình.',
    'Khu {district} chưa có quán {foodType} nào trong app. Thử tìm món khác không?',
  ],
  cheap_find: [
    'Có quán {foodType} giá siêu rẻ ở {district} nè, chỉ {price}k thôi:',
  ],
  surprise: [
    'Tìm được một viên ngọc ẩn ở {district}! Quán này ít người biết nhưng ngon lắm:'
  ]
};

export function generateTemplateResponse(
  results: FoodItem[],
  intent: SearchIntent
): string {
  const scenario = detectScenario(results, intent);
  const templates = TEMPLATES[scenario];
  const template = templates[Math.floor(Math.random() * templates.length)];

  return template
    .replace('{count}', String(results.length))
    .replace('{foodType}', intent.foodType ?? 'quán ăn')
    .replace('{district}', intent.district ? `Quận ${intent.district}` : 'khu này')
    .replace('{price}', String(Math.round((results[0]?.gia_trung_binh ?? 0) / 1000)));
}

function detectScenario(results: FoodItem[], intent: SearchIntent): ResponseScenario {
  if (results.length === 0) return 'not_found';

  const cheapItem = results.find(r => r.gia_trung_binh < 30000);
  if (cheapItem && intent.maxPrice) return 'cheap_find';

  const hiddenGem = results.find(r => r.click_count < 50);
  if (hiddenGem && results.length <= 3) return 'surprise';

  return results.length > 5 ? 'found_many' : 'found_few';
}
```

---

## 7. Khi nào fallback về Online?

| Tình huống | Hành động |
|---|---|
| User vào tab "Quanh đây" | Luôn dùng Online (`POST /ai/nearby`) — cần GPS + Gemini |
| OOM khi load vectors | Silent fallback về `GET /search?q=...` |
| ONNX model download thất bại | Fallback về SQLite-only search (không có vector) |
| SQLite DB chưa có citypack | Gọi `GET /city/:city/pack` để tải về |
| Query quá phức tạp (câu dài > 100 ký tự) | Cân nhắc route sang Online Chat |

---

## 8. Cấu trúc file Citypack

Mỗi thành phố là một folder được tải về lần đầu và cập nhật định kỳ:

```
citypacks/
  ha_noi/
    meta.json          ← { ids: string[], version: string, count: number }
    vectors.bin        ← Float32Array nhị phân (numVectors × 384 × 4 bytes)
    food.db            ← SQLite database với bảng food + FTS virtual table
  ho_chi_minh/
    ...
```

**Cập nhật citypack:** Khi `version` trong meta không khớp với server → tải lại toàn bộ folder.
