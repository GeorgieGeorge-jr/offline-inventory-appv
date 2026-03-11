import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('inventory.db');

export const initDatabase = async () => {
  try {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        sku TEXT UNIQUE,
        category TEXT,
        quantity INTEGER DEFAULT 0,
        min_stock_level INTEGER DEFAULT 10,
        unit_price REAL,
        description TEXT,
        barcode TEXT,
        created_at TEXT,
        updated_at TEXT,
        is_synced INTEGER DEFAULT 0,
        pending_operation TEXT
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY NOT NULL,
        product_id TEXT,
        type TEXT,
        quantity INTEGER,
        timestamp TEXT,
        notes TEXT,
        synced INTEGER DEFAULT 0,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT,
        is_active INTEGER DEFAULT 1
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};

export { db };