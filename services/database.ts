import SQLite from "react-native-sqlite-storage";
// import RNFS from "react-native-fs";
import { prepareDB } from "./pack";

SQLite.enablePromise(true);

const dbCache: Record<string, SQLite.SQLiteDatabase> = {};

export const openDB = async (city: string) => {
  if (dbCache[city]) return dbCache[city];

  const dbName = await prepareDB(city);

  if (!dbName) {
    console.warn(`⚠️ Cannot open DB for ${city}. Pack not found.`);
    // Return a dummy object or throw to prevent native crash
    throw new Error(`Database not found for ${city}. Please download data first.`);
  }

  const db = await SQLite.openDatabase({
    name: dbName,
    location: "default",
  });

  console.log("✅ DB opened:", dbName);

  try {
    const [r] = await db.executeSql("SELECT COUNT(*) as c FROM food");
    console.log("🍜 FOOD COUNT:", r.rows.item(0).c);
  } catch (e) {
    console.warn("Could not query food count (maybe empty DB):", e);
  }

  dbCache[city] = db;
  return db;
};

export const debugTableStructure = async (city: string) => {
  try {
    const db = await openDB(city);
    // Lấy thông tin cột
    const [cols] = await db.executeSql("PRAGMA table_info(food);");
    const columns = [];
    for (let i = 0; i < cols.rows.length; i++) {
      columns.push(cols.rows.item(i).name);
    }

    // Lấy 1 dòng dữ liệu mẫu
    const [rows] = await db.executeSql("SELECT * FROM food LIMIT 1;");
    let sample = null;
    if (rows.rows.length > 0) {
      sample = rows.rows.item(0);
    }

    console.log("DB Columns:", columns);
    console.log("Sample Row:", sample);

    return { columns, sample };
  } catch (e) {
    console.error("Debug Error:", e);
    return { error: String(e) };
  }
};