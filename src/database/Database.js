import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("inventory.db");

export async function initDatabase() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      product_code TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 10,
      unit_price REAL DEFAULT 0,
      barcode TEXT,
      description TEXT,
      created_at TEXT,
      updated_at TEXT,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 0,
      pending_operation TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_products_server_id ON products(server_id);

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      product_id TEXT NOT NULL,
      user_id TEXT,
      movement_type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      created_at TEXT,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      staff_user_id TEXT NOT NULL,
      total_amount REAL DEFAULT 0,
      created_at TEXT,
      is_synced INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY NOT NULL,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at TEXT,
      is_synced INTEGER DEFAULT 0,
      FOREIGN KEY (sale_id) REFERENCES sales(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY NOT NULL,
      server_id INTEGER,
      full_name TEXT NOT NULL,
      username TEXT NOT NULL,
      password_hash TEXT,
      password_plain TEXT,
      role TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      is_synced INTEGER DEFAULT 0
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_server_id ON users(server_id);

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY NOT NULL,
      product_id TEXT,
      alert_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  await runLightweightMigrations();
}

async function addColumnIfMissing(tableName, columnName, definition) {
  const columns = await db.getAllAsync(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await db.execAsync(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

async function runLightweightMigrations() {
  await addColumnIfMissing("products", "server_id", "INTEGER");
  await addColumnIfMissing("products", "is_deleted", "INTEGER DEFAULT 0");
  await addColumnIfMissing("products", "is_synced", "INTEGER DEFAULT 0");
  await addColumnIfMissing("products", "pending_operation", "TEXT");

  await addColumnIfMissing("stock_movements", "server_id", "INTEGER");
  await addColumnIfMissing("stock_movements", "is_synced", "INTEGER DEFAULT 0");

  await addColumnIfMissing("sales", "server_id", "INTEGER");
  await addColumnIfMissing("sales", "is_synced", "INTEGER DEFAULT 0");

  await addColumnIfMissing("sale_items", "is_synced", "INTEGER DEFAULT 0");

  await addColumnIfMissing("users", "server_id", "INTEGER");
  await addColumnIfMissing("users", "password_plain", "TEXT");
  await addColumnIfMissing("users", "is_synced", "INTEGER DEFAULT 0");
}
