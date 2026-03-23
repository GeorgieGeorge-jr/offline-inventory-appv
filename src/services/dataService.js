import { db } from "../database/Database";
import { v4 as uuidv4 } from "uuid";
import { API_BASE_URL } from "../utils/api";

const now = () => new Date().toISOString();

async function queueChange(entityType, entityId, operation, payload) {
  const ts = now();
  await db.runAsync(
    `INSERT INTO sync_queue (id, entity_type, entity_id, operation, payload, status, retry_count, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, 'pending', 0, NULL, ?, ?)`,
    [uuidv4(), entityType, String(entityId), operation, JSON.stringify(payload), ts, ts]
  );
}

async function createOrRefreshLowStockAlert(product) {
  const qty = Number(product.quantity || 0);
  const min = Number(product.min_stock_level || 0);

  if (qty > min) return;

  const title = qty === 0 ? "Out of stock" : "Low stock";
  const message =
    qty === 0
      ? `${product.name} is out of stock`
      : `${product.name} is low on stock (${qty} left)`;

  const existing = await db.getFirstAsync(
    `SELECT id FROM alerts WHERE product_id = ? AND alert_type = ? AND is_read = 0 LIMIT 1`,
    [product.id, qty === 0 ? "OUT_OF_STOCK" : "LOW_STOCK"]
  );

  if (existing) return;

  await db.runAsync(
    `INSERT INTO alerts (id, product_id, alert_type, title, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      product.id,
      qty === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
      title,
      message,
      now(),
    ]
  );
}

export async function seedUsersFromApi(users) {
  for (const user of users) {
    const existing = await db.getFirstAsync(
      `SELECT id FROM users WHERE username = ? LIMIT 1`,
      [user.username]
    );

    if (!existing) {
      await db.runAsync(
        `INSERT INTO users (id, server_id, full_name, username, role, is_active, created_at, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          `srv-user-${user.id}`,
          user.id,
          user.full_name,
          user.username,
          user.role,
          Number(user.is_active ?? 1),
          user.created_at || now(),
        ]
      );
    }
  }
}

export async function getProducts() {
  return (await db.getAllAsync(
    `SELECT * FROM products WHERE is_deleted = 0 ORDER BY datetime(updated_at) DESC, name ASC`
  )) || [];
}

export async function getProductById(productId) {
  return await db.getFirstAsync(
    `SELECT * FROM products WHERE id = ? AND is_deleted = 0 LIMIT 1`,
    [String(productId)]
  );
}

export async function getProductByBarcodeOrCode(code) {
  return await db.getFirstAsync(
    `SELECT * FROM products
     WHERE is_deleted = 0 AND (barcode = ? OR product_code = ?)
     LIMIT 1`,
    [String(code).trim(), String(code).trim()]
  );
}

export async function addProductLocal(productData) {
  const id = uuidv4();
  const ts = now();

  const product = {
    id,
    server_id: null,
    product_code: String(productData.product_code || "").trim(),
    name: String(productData.name || "").trim(),
    category: productData.category || null,
    quantity: Number(productData.quantity || 0),
    min_stock_level: Number(productData.min_stock_level || 10),
    unit_price: Number(productData.unit_price || 0),
    barcode: productData.barcode ? String(productData.barcode).trim() : null,
    description: productData.description || null,
    created_at: ts,
    updated_at: ts,
    is_deleted: 0,
    is_synced: 0,
    pending_operation: "create",
  };

  await db.runAsync(
    `INSERT INTO products
    (id, server_id, product_code, name, category, quantity, min_stock_level, unit_price, barcode, description, created_at, updated_at, is_deleted, is_synced, pending_operation)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'create')`,
    [
      product.id,
      product.server_id,
      product.product_code,
      product.name,
      product.category,
      product.quantity,
      product.min_stock_level,
      product.unit_price,
      product.barcode,
      product.description,
      product.created_at,
      product.updated_at,
    ]
  );

  await queueChange("product", product.id, "create", product);
  await createOrRefreshLowStockAlert(product);

  return product;
}

export async function deleteProductLocal(productId) {
  const existing = await getProductById(productId);
  if (!existing) throw new Error("Product not found");

  await db.runAsync(
    `UPDATE products
     SET is_deleted = 1, is_synced = 0, pending_operation = 'delete', updated_at = ?
     WHERE id = ?`,
    [now(), String(productId)]
  );

  await queueChange("product", productId, "delete", { id: productId, server_id: existing.server_id });
  return String(productId);
}

export async function updateStockLocal({ productId, quantity, type, user_id, note }) {
  const product = await getProductById(productId);
  if (!product) throw new Error("Product not found");

  const qty = Number(quantity);
  if (!qty || qty <= 0) throw new Error("Quantity must be greater than 0");

  const currentQty = Number(product.quantity || 0);
  const nextQty = type === "IN" ? currentQty + qty : currentQty - qty;

  if (nextQty < 0) throw new Error(`Only ${currentQty} unit(s) available`);

  const ts = now();
  const movementId = uuidv4();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE products
       SET quantity = ?, updated_at = ?, is_synced = 0, pending_operation = 'update'
       WHERE id = ?`,
      [nextQty, ts, String(productId)]
    );

    await db.runAsync(
      `INSERT INTO stock_movements
      (id, server_id, product_id, user_id, movement_type, quantity, note, created_at, is_synced)
      VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0)`,
      [
        movementId,
        String(productId),
        user_id ? String(user_id) : null,
        type === "IN" ? "IN" : "OUT",
        qty,
        note || null,
        ts,
      ]
    );
  });

  const updated = await getProductById(productId);

  await queueChange("product", productId, "update", updated);
  await queueChange("stock_movement", movementId, "create", {
    id: movementId,
    product_id: String(productId),
    user_id: user_id ? String(user_id) : null,
    movement_type: type === "IN" ? "IN" : "OUT",
    quantity: qty,
    note: note || null,
    created_at: ts,
  });

  await createOrRefreshLowStockAlert(updated);
  return updated;
}

export async function getRecentStockActivity(limit = 8) {
  return (
    await db.getAllAsync(
      `SELECT
         sm.id,
         sm.movement_type,
         sm.quantity,
         sm.note,
         sm.created_at,
         p.id AS product_id,
         p.name AS product_name,
         p.product_code,
         u.id AS user_id,
         u.full_name,
         u.username
       FROM stock_movements sm
       JOIN products p ON p.id = sm.product_id
       LEFT JOIN users u ON u.id = sm.user_id
       ORDER BY datetime(sm.created_at) DESC
       LIMIT ?`,
      [limit]
    )
  ) || [];
}

export async function createSaleLocal({ staff_user_id, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }

  const saleId = uuidv4();
  const ts = now();
  let totalAmount = 0;

  const normalizedItems = [];

  for (const item of items) {
    const product = await getProductById(item.product_id);
    if (!product) throw new Error(`Product ${item.product_id} not found`);

    const qty = Number(item.quantity || 0);
    if (!qty || qty <= 0) throw new Error(`Invalid quantity for ${product.name}`);
    if (qty > Number(product.quantity || 0)) {
      throw new Error(`Insufficient stock for ${product.name}`);
    }

    const unitPrice = Number(product.unit_price || 0);
    const subtotal = unitPrice * qty;

    normalizedItems.push({
      id: uuidv4(),
      sale_id: saleId,
      product_id: product.id,
      quantity: qty,
      unit_price: unitPrice,
      subtotal,
      created_at: ts,
    });

    totalAmount += subtotal;
  }

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO sales (id, server_id, staff_user_id, total_amount, created_at, is_synced)
       VALUES (?, NULL, ?, ?, ?, 0)`,
      [saleId, String(staff_user_id), totalAmount, ts]
    );

    for (const item of normalizedItems) {
      await db.runAsync(
        `INSERT INTO sale_items
         (id, sale_id, product_id, quantity, unit_price, subtotal, created_at, is_synced)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          item.id,
          item.sale_id,
          item.product_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.created_at,
        ]
      );

      const product = await getProductById(item.product_id);
      const nextQty = Number(product.quantity) - Number(item.quantity);

      await db.runAsync(
        `UPDATE products
         SET quantity = ?, updated_at = ?, is_synced = 0, pending_operation = 'update'
         WHERE id = ?`,
        [nextQty, ts, item.product_id]
      );

      await db.runAsync(
        `INSERT INTO stock_movements
         (id, server_id, product_id, user_id, movement_type, quantity, note, created_at, is_synced)
         VALUES (?, NULL, ?, ?, 'SALE', ?, ?, ?, 0)`,
        [
          uuidv4(),
          item.product_id,
          String(staff_user_id),
          item.quantity,
          "Sold through sales terminal",
          ts,
        ]
      );
    }
  });

  await queueChange("sale", saleId, "create", {
    id: saleId,
    staff_user_id: String(staff_user_id),
    total_amount: totalAmount,
    created_at: ts,
    items: normalizedItems.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    })),
  });

  for (const item of normalizedItems) {
    const updated = await getProductById(item.product_id);
    await queueChange("product", updated.id, "update", updated);
    await createOrRefreshLowStockAlert(updated);
  }

  return { success: true, sale_id: saleId, total_amount: totalAmount };
}

export async function getSalesHistoryByStaffLocal(staffUserId, limit = 20) {
  return (
    await db.getAllAsync(
      `SELECT
         s.id AS sale_id,
         s.total_amount,
         s.created_at,
         COUNT(si.id) AS line_count,
         IFNULL(SUM(si.quantity), 0) AS total_items,
         GROUP_CONCAT(p.name || ' x' || si.quantity, ' • ') AS items_summary
       FROM sales s
       JOIN sale_items si ON si.sale_id = s.id
       JOIN products p ON p.id = si.product_id
       WHERE s.staff_user_id = ?
       GROUP BY s.id, s.total_amount, s.created_at
       ORDER BY datetime(s.created_at) DESC
       LIMIT ?`,
      [String(staffUserId), Number(limit)]
    )
  ) || [];
}

export async function getReportSummaryLocal() {
  const products = await getProducts();

  return {
    total_products: products.length,
    total_inventory_value: products.reduce(
      (sum, p) => sum + Number(p.quantity || 0) * Number(p.unit_price || 0),
      0
    ),
    low_stock_count: products.filter(
      (p) => Number(p.quantity || 0) <= Number(p.min_stock_level || 0)
    ).length,
    out_of_stock_count: products.filter((p) => Number(p.quantity || 0) === 0).length,
  };
}

export async function getTopSoldTodayLocal() {
  return (
    await db.getAllAsync(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.product_code,
         SUM(si.quantity) AS total_sold
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN products p ON p.id = si.product_id
       WHERE date(s.created_at) = date('now')
       GROUP BY p.id, p.name, p.product_code
       ORDER BY total_sold DESC
       LIMIT 5`
    )
  ) || [];
}

export async function getStockoutsLocal() {
  return (
    await db.getAllAsync(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.product_code,
         p.quantity AS current_quantity,
         s.id AS sale_id,
         s.created_at AS sold_at,
         u.id AS staff_user_id,
         u.full_name,
         u.username,
         si.quantity AS sold_quantity
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       JOIN products p ON p.id = si.product_id
       LEFT JOIN users u ON u.id = s.staff_user_id
       WHERE p.quantity = 0
       ORDER BY datetime(s.created_at) DESC`
    )
  ) || [];
}

export async function getPendingSyncCount() {
  const row = await db.getFirstAsync(
    `SELECT COUNT(*) AS count FROM sync_queue WHERE status IN ('pending', 'failed')`
  );
  return Number(row?.count || 0);
}

export async function markQueueItemSynced(queueId) {
  await db.runAsync(
    `UPDATE sync_queue SET status = 'synced', updated_at = ? WHERE id = ?`,
    [now(), queueId]
  );
}

export async function markQueueItemFailed(queueId, errorText) {
  await db.runAsync(
    `UPDATE sync_queue
     SET status = 'failed', retry_count = retry_count + 1, last_error = ?, updated_at = ?
     WHERE id = ?`,
    [String(errorText || "Unknown sync error"), now(), queueId]
  );
}

export async function getPendingQueueItems() {
  return (
    await db.getAllAsync(
      `SELECT * FROM sync_queue
       WHERE status IN ('pending', 'failed')
       ORDER BY datetime(created_at) ASC`
    )
  ) || [];
}

export async function setLastSyncValue(value) {
  const existing = await db.getFirstAsync(`SELECT key FROM sync_meta WHERE key = 'last_sync_at'`);
  if (existing) {
    await db.runAsync(`UPDATE sync_meta SET value = ? WHERE key = 'last_sync_at'`, [value]);
  } else {
    await db.runAsync(`INSERT INTO sync_meta (key, value) VALUES ('last_sync_at', ?)`, [value]);
  }
}

export async function getLastSyncValue() {
  const row = await db.getFirstAsync(`SELECT value FROM sync_meta WHERE key = 'last_sync_at'`);
  return row?.value || null;
}

export async function pullServerProductsToLocal(products) {
  for (const p of products) {
    const existing = await db.getFirstAsync(
      `SELECT id, pending_operation FROM products WHERE server_id = ? LIMIT 1`,
      [p.id]
    );

    if (existing && existing.pending_operation) continue;

    if (existing) {
      await db.runAsync(
        `UPDATE products
         SET product_code = ?, name = ?, category = ?, quantity = ?, min_stock_level = ?, unit_price = ?, barcode = ?, description = ?, updated_at = ?, is_deleted = 0, is_synced = 1, pending_operation = NULL
         WHERE id = ?`,
        [
          p.product_code,
          p.name,
          p.category,
          Number(p.quantity || 0),
          Number(p.min_stock_level || 0),
          Number(p.unit_price || 0),
          p.barcode || null,
          p.description || null,
          p.updated_at || now(),
          existing.id,
        ]
      );
    } else {
      await db.runAsync(
        `INSERT INTO products
         (id, server_id, product_code, name, category, quantity, min_stock_level, unit_price, barcode, description, created_at, updated_at, is_deleted, is_synced, pending_operation)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, NULL)`,
        [
          `srv-product-${p.id}`,
          p.id,
          p.product_code,
          p.name,
          p.category,
          Number(p.quantity || 0),
          Number(p.min_stock_level || 0),
          Number(p.unit_price || 0),
          p.barcode || null,
          p.description || null,
          p.created_at || now(),
          p.updated_at || now(),
        ]
      );
    }
  }
}

export async function getUnreadAlerts(limit = 10) {
  return (
    await db.getAllAsync(
      `SELECT * FROM alerts
       WHERE is_read = 0
       ORDER BY datetime(created_at) DESC
       LIMIT ?`,
      [limit]
    )
  ) || [];
}

export async function markAlertAsRead(alertId) {
  await db.runAsync(
    `UPDATE alerts SET is_read = 1 WHERE id = ?`,
    [alertId]
  );
}

export async function syncQueueToServer() {
  const queueItems = await getPendingQueueItems();
  let pushed = 0;

  for (const item of queueItems) {
    try {
      const payload = JSON.parse(item.payload);

      if (item.entity_type === "product" && item.operation === "create") {
        const response = await fetch(`${API_BASE_URL}/products`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_code: payload.product_code,
            name: payload.name,
            category: payload.category,
            quantity: payload.quantity,
            min_stock_level: payload.min_stock_level,
            unit_price: payload.unit_price,
            barcode: payload.barcode,
            description: payload.description,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Product create sync failed");

        await db.runAsync(
          `UPDATE products
           SET server_id = ?, is_synced = 1, pending_operation = NULL, updated_at = ?
           WHERE id = ?`,
          [data.id, data.updated_at || now(), item.entity_id]
        );

        await markQueueItemSynced(item.id);
        pushed += 1;
      } else if (item.entity_type === "product" && item.operation === "update") {
        const localProduct = await getProductById(item.entity_id);
        if (!localProduct?.server_id) {
          await markQueueItemFailed(item.id, "Missing server_id for product update");
          continue;
        }

        const response = await fetch(`${API_BASE_URL}/products/${localProduct.server_id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product_code: localProduct.product_code,
            name: localProduct.name,
            category: localProduct.category,
            quantity: Number(localProduct.quantity || 0),
            min_stock_level: Number(localProduct.min_stock_level || 0),
            unit_price: Number(localProduct.unit_price || 0),
            barcode: localProduct.barcode,
            description: localProduct.description,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Product update sync failed");

        await db.runAsync(
          `UPDATE products
           SET is_synced = 1, pending_operation = NULL, updated_at = ?
           WHERE id = ?`,
          [data.updated_at || now(), item.entity_id]
        );

        await markQueueItemSynced(item.id);
        pushed += 1;
      } else if (item.entity_type === "product" && item.operation === "delete") {
        const localProduct = await getProductById(item.entity_id);
        if (localProduct?.server_id) {
          const response = await fetch(`${API_BASE_URL}/products/${localProduct.server_id}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || "Product delete sync failed");
          }
        }

        await db.runAsync(`DELETE FROM products WHERE id = ?`, [item.entity_id]);
        await markQueueItemSynced(item.id);
        pushed += 1;
      } else if (item.entity_type === "sale" && item.operation === "create") {
        const salePayload = JSON.parse(item.payload);

        const productRows = await db.getAllAsync(
          `SELECT id, server_id FROM products WHERE is_deleted = 0`
        );
        const productMap = new Map(productRows.map((p) => [String(p.id), p.server_id]));

        const serverItems = salePayload.items.map((x) => ({
          product_id: productMap.get(String(x.product_id)),
          quantity: x.quantity,
        }));

        if (serverItems.some((x) => !x.product_id)) {
          throw new Error("Some sale products are not yet linked to server");
        }

        const staffRow = await db.getFirstAsync(
          `SELECT server_id FROM users WHERE id = ? LIMIT 1`,
          [String(salePayload.staff_user_id)]
        );

        const response = await fetch(`${API_BASE_URL}/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            staff_user_id: staffRow?.server_id || salePayload.staff_user_id,
            items: serverItems,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Sale sync failed");

        await db.runAsync(`UPDATE sales SET is_synced = 1 WHERE id = ?`, [item.entity_id]);
        await db.runAsync(`UPDATE sale_items SET is_synced = 1 WHERE sale_id = ?`, [item.entity_id]);
        await markQueueItemSynced(item.id);
        pushed += 1;
      } else {
        await markQueueItemSynced(item.id);
      }
    } catch (error) {
      await markQueueItemFailed(item.id, error.message);
    }
  }

  let pulled = 0;

  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    const products = await response.json();

    if (response.ok && Array.isArray(products)) {
      await pullServerProductsToLocal(products);
      pulled = products.length;
    }
  } catch (_) {}

  await setLastSyncValue(now());
  return { pushed, pulled };
}