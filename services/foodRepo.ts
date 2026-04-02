import { openDB } from "./database";
import { FoodItem } from "./cityApi";

export const getFoodsByIds = async (city: string, ids: number[]) => {
  try {
    if (!ids.length) return [];

    console.log("Fetching foods with IDs:", ids);

    const db = await openDB(city);
    //   console.log("dbmain",db)
    //  const [r] = await db.executeSql("PRAGMA database_list;");
    //  console.log("rrr")
    //  for (let i = 0; i < r.rows.length; i++) {
    //     console.log("DB FILE PATH:", r.rows.item(i));
    //  }
    const placeholders = ids.map(() => "?").join(",");
    console.log("fdfdfhaha", placeholders)
    const [results] = await db.executeSql(
      `SELECT * FROM food WHERE id IN (${placeholders})`,
      ids   // ✅ truyền thẳng mảng
    );

    console.log("row", results.rows)

    // SQLite không đảm bảo thứ tự theo IN → cần sort lại theo relevance
    const map = new Map<number, FoodItem>();
    for (let i = 0; i < results.rows.length; i++) {
      const item = results.rows.item(i);
      map.set(item.id, item);
    }

    console.log(`DB returned ${map.size} items. Requested ${ids.length} IDs.`);

    // Trả về đúng thứ tự topK
    const validFoods = ids.map(id => {
      const item = map.get(id);
      if (!item) console.log(`⚠️ ID ${id} (type: ${typeof id}) not found in map keys (sample key type: ${typeof [...map.keys()][0]})`);
      return item;
    }).filter((item): item is FoodItem => !!item);

    console.log(`Matched ${validFoods.length} foods from DB.`);
    return validFoods;
  } catch (e) {
    console.log("❌ SQL ERROR:", e);
    return [];
  }
};

export const getDistricts = async (city: string): Promise<string[]> => {
  try {
    const db = await openDB(city);
    const [results] = await db.executeSql("SELECT DISTINCT quan FROM food WHERE quan IS NOT NULL AND quan != '' ORDER BY quan");
    const districts: string[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      districts.push(results.rows.item(i).quan);
    }
    return districts;
  } catch (e) {
    console.error("getDistricts error:", e);
    return [];
  }
};

export const getMinId = async (city: string): Promise<number> => {
  try {
    const db = await openDB(city);
    const [results] = await db.executeSql("SELECT MIN(id) as minId FROM food");
    if (results.rows.length > 0) {
      return results.rows.item(0).minId;
    }
    return 1; // Default
  } catch (e) {
    console.error("getMinId error:", e);
    return 1;
  }
};

export const searchByName = async (
  city: string,
  query: string,
): Promise<FoodItem[]> => {
  try {
    if (!query.trim() || query.trim().length < 2) return [];
    const db = await openDB(city);
    const param = `%${query.trim()}%`;

    const sql = `
      SELECT id, ten_quan, ten_mon, dia_chi, quan,
             gia_min, gia_max, description
      FROM food
      WHERE ten_quan LIKE ? OR ten_mon LIKE ?
      LIMIT 20
    `;
    const [results] = await db.executeSql(sql, [param, param]);

    const items: FoodItem[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      items.push(results.rows.item(i));
    }
    return items;
  } catch (e) {
    console.error("searchByName error:", e);
    return [];
  }
};

// Cache for ID mapping: city -> number[]
let idCache: Record<string, number[]> = {};

export const getAllFoodIds = async (city: string): Promise<number[]> => {
  if (idCache[city]) return idCache[city];

  try {
    const db = await openDB(city);
    // Ensure we get IDs in the same order as vectors were generated (ASC)
    const [results] = await db.executeSql("SELECT id FROM food ORDER BY id ASC");

    const ids: number[] = [];
    for (let i = 0; i < results.rows.length; i++) {
      ids.push(results.rows.item(i).id);
    }

    console.log(`Loaded ${ids.length} IDs for vector mapping.`);
    idCache[city] = ids; // Cache it
    return ids;
  } catch (e) {
    console.error("getAllFoodIds error:", e);
    return [];
  }
};
