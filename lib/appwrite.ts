
import { Client, Account, Databases, Storage } from 'appwrite';

export const client = new Client();

client
    .setEndpoint('https://ap.mte.vn/v1')
    .setProject('692d2026002840cf224c');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
    DATABASE_ID: '692d3d820004078f4a26',
    COLLECTION_ID_SCHEDULES: 'schedules',
    COLLECTION_ID_NOTIFICATIONS: '692d20e10015b59e5889', 
    BUCKET_ID_DB: 'db_backups', // ID Bucket để lưu file .sqlite
};
