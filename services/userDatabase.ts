import SQLite from "react-native-sqlite-storage";

SQLite.enablePromise(true);

const DB_NAME = "user_data.db";

export interface ChatSession {
    id: string;
    title: string;
    city: string;
    created_at: number;
    updated_at: number;
}

export interface ChatMessage {
    id: string;
    session_id: string;
    sender: 'user' | 'bot';
    text: string;
    meta?: string; // JSON string for extra data like food items
    timestamp: number;
}

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const initUserDB = async () => {
    if (dbInstance) return dbInstance;

    try {
        const db = await SQLite.openDatabase({
            name: DB_NAME,
            location: "default",
        });

        // Create tables
        await db.executeSql(`
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                title TEXT,
                city TEXT,
                created_at INTEGER,
                updated_at INTEGER
            );
        `);

        await db.executeSql(`
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                session_id TEXT,
                sender TEXT,
                text TEXT,
                meta TEXT,
                timestamp INTEGER,
                FOREIGN KEY(session_id) REFERENCES sessions(id)
            );
        `);

        console.log("✅ User DB Initialized");
        dbInstance = db;
        return db;
    } catch (e) {
        console.error("❌ Failed to init User DB:", e);
        throw e;
    }
};

export const createSession = async (city: string, title: string = "New Chat"): Promise<ChatSession> => {
    const db = await initUserDB();
    const id = Date.now().toString();
    const now = Date.now();

    await db.executeSql(
        `INSERT INTO sessions (id, title, city, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
        [id, title, city, now, now]
    );

    return { id, title, city, created_at: now, updated_at: now };
};

export const getSessions = async (): Promise<ChatSession[]> => {
    const db = await initUserDB();
    const [results] = await db.executeSql(`SELECT * FROM sessions ORDER BY updated_at DESC`);

    const sessions: ChatSession[] = [];
    for (let i = 0; i < results.rows.length; i++) {
        sessions.push(results.rows.item(i));
    }
    return sessions;
};

export const saveMessage = async (msg: ChatMessage) => {
    const db = await initUserDB();
    await db.executeSql(
        `INSERT INTO messages (id, session_id, sender, text, meta, timestamp) VALUES (?, ?, ?, ?, ?, ?)`,
        [msg.id, msg.session_id, msg.sender, msg.text, msg.meta || null, msg.timestamp]
    );

    // Update session timestamp and optionally title if it's the first user message
    await db.executeSql(
        `UPDATE sessions SET updated_at = ? WHERE id = ?`,
        [msg.timestamp, msg.session_id]
    );
};

export const getMessages = async (sessionId: string): Promise<ChatMessage[]> => {
    const db = await initUserDB();
    const [results] = await db.executeSql(
        `SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC`,
        [sessionId]
    );

    const messages: ChatMessage[] = [];
    for (let i = 0; i < results.rows.length; i++) {
        messages.push(results.rows.item(i));
    }
    return messages;
};

export const updateSessionTitle = async (sessionId: string, title: string) => {
    const db = await initUserDB();
    await db.executeSql(`UPDATE sessions SET title = ? WHERE id = ?`, [title, sessionId]);
};

export const updateSessionCity = async (sessionId: string, city: string) => {
    const db = await initUserDB();
    await db.executeSql(`UPDATE sessions SET city = ? WHERE id = ?`, [city, sessionId]);
};

export const deleteSession = async (sessionId: string) => {
    const db = await initUserDB();
    await db.executeSql(`DELETE FROM messages WHERE session_id = ?`, [sessionId]);
    await db.executeSql(`DELETE FROM sessions WHERE id = ?`, [sessionId]);
};
