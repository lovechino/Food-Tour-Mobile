import RNFS from 'react-native-fs';
import { unzip } from 'react-native-zip-archive'

export const isCityPackDownloaded = async (city: string) => {
  try {
    const path = `${RNFS.DocumentDirectoryPath}/citypacks/${city}`;
    const exists = await RNFS.exists(path);
    return exists;
  } catch (e) {
    console.log('Check pack error:', e);
    return false;
  }
};

export const getDownloadedPacks = async () => {
  try {
    const baseFolder = `${RNFS.DocumentDirectoryPath}/citypacks`;
    if (!(await RNFS.exists(baseFolder))) return [];

    const items = await RNFS.readDir(baseFolder);
    const packs = items
      .filter(item => item.isDirectory())
      .map(item => item.name);

    return packs;
  } catch (e) {
    return [];
  }
};



import { getCityConfig } from "./cityConfig";

export const downloadCityPack = async (
  city: string,
  onProgress?: (p: number) => void
) => {
  try {
    const config = getCityConfig(city);
    if (!config) {
      console.error(`City pack config not found for: ${city}`);
      return false;
    }

    const url = config.url; // Lấy URL chính xác từ config

    const zipPath = `${RNFS.DocumentDirectoryPath}/${city}.zip`;
    const targetFolder = `${RNFS.DocumentDirectoryPath}/citypacks/${city}`;
    const baseFolder = `${RNFS.DocumentDirectoryPath}/citypacks`;

    if (!(await RNFS.exists(baseFolder))) {
      await RNFS.mkdir(baseFolder);
    }

    console.log(`Downloading pack for ${config.name} (v${config.version})...`);
    console.log("URL:", url);

    const download = RNFS.downloadFile({
      fromUrl: url,
      toFile: zipPath,

      // 👇 progress callback
      progress: (res) => {
        const progress = res.bytesWritten / res.contentLength;
        onProgress?.(progress); // trả về 0 → 1
      },
      progressDivider: 1, // gọi liên tục
    });

    const res = await download.promise;

    if (res.statusCode !== 200) throw new Error('Download failed with status: ' + res.statusCode);

    console.log('Unzipping...');
    await unzip(zipPath, targetFolder);

    // Chuẩn bị DB (copy ra ngoài để SQLite kết nối)
    await prepareDB(city);

    // Lưu thông tin version vào thư mục pack để check update sau này
    const versionInfo = {
      version: config.version,
      updatedAt: new Date().toISOString()
    };
    await RNFS.writeFile(`${targetFolder}/version.json`, JSON.stringify(versionInfo), 'utf8');

    await RNFS.unlink(zipPath);

    console.log(`City pack ${city} ready!`);
    return true;
  } catch (e) {
    console.log('Download pack error:', e);
    return false;
  }
};



export const deleteCityPack = async (city: string) => {
  try {
    const path = `${RNFS.DocumentDirectoryPath}/citypacks/${city}`;
    const exists = await RNFS.exists(path);

    if (exists) {
      await RNFS.unlink(path);
      console.log('Pack deleted');
    }

    return true;
  } catch (e) {
    console.log('Delete pack error:', e);
    return false;
  }
};


export const prepareDB = async (city: string) => {
  const destDbName = `${city}_foods.db`;
  const destDir = `${RNFS.DocumentDirectoryPath}/../databases`;
  const dest = `${destDir}/${destDbName}`;

  if (await RNFS.exists(dest)) {
    return destDbName;
  }

  const cityDir = `${RNFS.DocumentDirectoryPath}/citypacks/${city}`;
  console.log(`📦 Preparing DB for ${city} from ${cityDir}`);

  try {
    if (!(await RNFS.exists(cityDir))) {
      throw new Error(`City directory not found: ${cityDir}`);
    }

    let foundDbPath: string | null = null;

    // Recursive function to find .db file
    const findDb = async (dir: string): Promise<string | null> => {
      const items = await RNFS.readDir(dir);
      // Prioritize food.db, then any .db
      const exact = items.find(i => i.name === 'food.db');
      if (exact) return exact.path;

      const anyDb = items.find(i => i.name.endsWith('.db') && !i.isDirectory());
      if (anyDb) return anyDb.path;

      // Check subdirs
      for (const item of items) {
        if (item.isDirectory()) {
          const found = await findDb(item.path);
          if (found) return found;
        }
      }
      return null;
    };

    foundDbPath = await findDb(cityDir);

    if (!foundDbPath) {
      console.error(`❌ No .db file found in ${cityDir} or subdirectories`);
      // List root files for debug
      const files = await RNFS.readDir(cityDir);
      console.log("📂 Root files:", files.map(f => f.name));
      return null;
    }

    console.log(`✅ Found DB at: ${foundDbPath}. Copying to ${dest}...`);

    await RNFS.mkdir(destDir);
    await RNFS.copyFile(foundDbPath, dest);
    console.log("📦 DB setup complete.");

    return destDbName;

  } catch (e) {
    console.error("prepareDB failed:", e);
    return null;
  }
};