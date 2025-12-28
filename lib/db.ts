
import { CalendarData, CalendarEvent, MultiMonthData, ScheduleMetadata } from '../types';

declare var initSqlJs: any;

let db: any = null;
let SQL_Instance: any = null;

const DB_NAME = 'lms_study_db';

/**
 * Initialize SQLite DB with Schema
 */
export const initDB = async (): Promise<boolean> => {
    try {
        if (!SQL_Instance) {
            SQL_Instance = await initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.12.0/${file}`
            });
        }

        // Load existing database from LocalStorage if possible
        const savedDB = localStorage.getItem(DB_NAME);
        if (savedDB) {
            try {
                const u8 = new Uint8Array(JSON.parse(savedDB));
                db = new SQL_Instance.Database(u8);
            } catch (e) {
                console.error("Failed to load saved DB, creating new", e);
                db = new SQL_Instance.Database();
            }
        } else {
            db = new SQL_Instance.Database();
        }

        // Create tables if they don't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS schedules (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS periods (
                schedule_id TEXT,
                period_name TEXT,
                data TEXT,
                PRIMARY KEY (schedule_id, period_name),
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS personal_events (
                id INTEGER PRIMARY KEY,
                schedule_id TEXT,
                data TEXT,
                FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS event_meta (
                event_id INTEGER PRIMARY KEY,
                is_completed INTEGER DEFAULT 0,
                alarm_minutes INTEGER,
                last_notified_at INTEGER
            );
        `);

        return true;
    } catch (e) {
        console.error("SQLite Init Error:", e);
        return false;
    }
};

/**
 * Persist memory DB to LocalStorage (as binary string)
 */
const persist = () => {
    if (!db) return;
    const data = db.export();
    const array = Array.from(data);
    localStorage.setItem(DB_NAME, JSON.stringify(array));
};

/**
 * Lấy dữ liệu nhị phân của DB (Uint8Array)
 */
export const getDBBinary = (): Uint8Array | null => {
    if (!db) return null;
    return db.export();
};

/**
 * Xuất Database dưới dạng File Blob để tải về
 */
export const exportDBFile = (): Blob | null => {
    const data = getDBBinary();
    if (!data) return null;
    return new Blob([data], { type: 'application/x-sqlite3' });
};

/**
 * Nhập dữ liệu từ file SQLite bên ngoài (ArrayBuffer)
 */
export const importDBFile = async (arrayBuffer: ArrayBuffer): Promise<boolean> => {
    try {
        const u8 = new Uint8Array(arrayBuffer);
        // Lưu vào localStorage trước
        const array = Array.from(u8);
        localStorage.setItem(DB_NAME, JSON.stringify(array));
        
        // Khởi tạo lại db instance từ dữ liệu mới
        if (SQL_Instance) {
            db = new SQL_Instance.Database(u8);
            return true;
        }
        return false;
    } catch (e) {
        console.error("Import DB Error:", e);
        return false;
    }
};

export const getSchedulesFromDB = (): ScheduleMetadata[] => {
    if (!db) return [];
    const res = db.exec("SELECT id, name, updated_at FROM schedules ORDER BY updated_at DESC");
    if (res.length === 0) return [];

    const rows = res[0].values;
    const schedules: ScheduleMetadata[] = rows.map((row: any) => {
        const monthRes = db.exec(`SELECT period_name FROM periods WHERE schedule_id = '${row[0]}'`);
        const months = monthRes.length > 0 ? monthRes[0].values.map((v: any) => v[0]) : [];
        
        return {
            id: row[0],
            name: row[1],
            updatedAt: row[2],
            months: months
        };
    });
    return schedules;
};

export const getFullScheduleData = (id: string) => {
    if (!db) return null;
    
    const pRes = db.exec(`SELECT period_name, data FROM periods WHERE schedule_id = ?`, [id]);
    const periods: Record<string, CalendarData> = {};
    if (pRes.length > 0) {
        pRes[0].values.forEach((v: any) => {
            periods[v[0]] = JSON.parse(v[1]);
        });
    }

    const peRes = db.exec(`SELECT data FROM personal_events WHERE schedule_id = ?`, [id]);
    const personalEvents = peRes.length > 0 ? peRes[0].values.map((v: any) => JSON.parse(v[0])) : [];

    const metaRes = db.exec(`SELECT event_id, is_completed, alarm_minutes FROM event_meta`);
    const completed = new Set<number>();
    const alarms: Record<number, number> = {};
    
    if (metaRes.length > 0) {
        metaRes[0].values.forEach((v: any) => {
            if (v[1] === 1) completed.add(v[0]);
            if (v[2] !== null) alarms[v[0]] = v[2];
        });
    }

    return {
        multiMonth: { periods, lastUpdatedPeriod: Object.keys(periods)[0] || '' },
        personalEvents,
        completed: Array.from(completed),
        alarms
    };
};

export const saveScheduleToDB = (id: string, name: string, multiMonth: MultiMonthData | null, personalEvents: CalendarEvent[]) => {
    if (!db) return;
    const now = new Date().toISOString();
    
    db.run("INSERT OR REPLACE INTO schedules (id, name, updated_at) VALUES (?, ?, ?)", [id, name, now]);

    if (multiMonth) {
        Object.entries(multiMonth.periods).forEach(([pName, pData]) => {
            db.run("INSERT OR REPLACE INTO periods (schedule_id, period_name, data) VALUES (?, ?, ?)", 
                [id, pName, JSON.stringify(pData)]);
        });
    }

    db.run("DELETE FROM personal_events WHERE schedule_id = ?", [id]);
    personalEvents.forEach(pe => {
        db.run("INSERT INTO personal_events (id, schedule_id, data) VALUES (?, ?, ?)", 
            [pe.id, id, JSON.stringify(pe)]);
    });

    persist();
};

export const updateEventMetaInDB = (eventId: number, isCompleted: boolean, alarmMinutes: number | null) => {
    if (!db) return;
    
    const res = db.exec("SELECT event_id FROM event_meta WHERE event_id = ?", [eventId]);
    if (res.length > 0) {
        db.run("UPDATE event_meta SET is_completed = ?, alarm_minutes = ? WHERE event_id = ?", 
            [isCompleted ? 1 : 0, alarmMinutes, eventId]);
    } else {
        db.run("INSERT INTO event_meta (event_id, is_completed, alarm_minutes) VALUES (?, ?, ?)", 
            [eventId, isCompleted ? 1 : 0, alarmMinutes]);
    }
    persist();
};

export const deletePersonalEventFromDB = (id: number) => {
    if (!db) return;
    db.run("DELETE FROM personal_events WHERE id = ?", [id]);
    persist();
};

export const deleteScheduleFromDB = (id: string) => {
    if (!db) return;
    db.run("DELETE FROM schedules WHERE id = ?", [id]);
    persist();
};
