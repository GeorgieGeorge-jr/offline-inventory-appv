import { db } from "../database/Database";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL, assertApiBaseUrl } from "../utils/api";
import { seedUsersFromApi } from "./dataService";

export async function loginUser(username, password) {
  try {
    assertApiBaseUrl();

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      const authError = new Error(data.message || "Invalid login");
      authError.skipOfflineFallback = true;
      throw authError;
    }

    const userData = data.user;
    const localId = `srv-user-${userData.id}`;

    const existing = await db.getFirstAsync(
      `SELECT id FROM users WHERE id = ? LIMIT 1`,
      [localId]
    );

    if (!existing) {
      await seedUsersFromApi([
        {
          id: userData.id,
          full_name: userData.full_name,
          username: userData.username,
          role: userData.role,
          is_active: 1,
        },
      ]);
    }

    await db.runAsync(
      `UPDATE users
       SET password_plain = ?, server_id = ?, full_name = ?, role = ?, is_active = 1, is_synced = 1
       WHERE id = ?`,
      [password, userData.id, userData.full_name, userData.role, localId]
    );

    if (data.token) {
      await SecureStore.setItemAsync("auth_token", data.token);
    }

    return {
      id: localId,
      server_id: userData.id,
      username: userData.username,
      role: userData.role,
      full_name: userData.full_name,
      token: data.token,
      offline_capable: true,
    };
  } catch (error) {
    if (error.skipOfflineFallback) {
      throw error;
    }

    const localUser = await db.getFirstAsync(
      `SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1`,
      [username]
    );

    if (!localUser) {
      throw new Error(error.message || "Network error and no cached user found");
    }

    if (!localUser.password_plain) {
      throw new Error("Online login required before this account can be used offline");
    }

    if (localUser.password_plain !== password) {
      throw new Error("Invalid password");
    }

    await SecureStore.deleteItemAsync("auth_token");

    return {
      id: localUser.id,
      server_id: localUser.server_id,
      username: localUser.username,
      role: localUser.role,
      full_name: localUser.full_name,
      token: null,
      offline_capable: true,
      isOfflineLogin: true,
    };
  }
}
