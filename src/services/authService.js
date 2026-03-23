import { db } from "../database/Database";
import { API_BASE_URL } from "../utils/api";
import { seedUsersFromApi } from "./dataService";

export async function loginUser(username, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Invalid login");
    }

    const localId = `srv-user-${data.id}`;
    const existing = await db.getFirstAsync(
      `SELECT id FROM users WHERE id = ? LIMIT 1`,
      [localId]
    );

    if (!existing) {
      await seedUsersFromApi([
        {
          id: data.id,
          full_name: data.full_name,
          username,
          role: data.role,
          is_active: 1,
        },
      ]);
    }

    return {
      id: localId,
      server_id: data.id,
      username,
      role: data.role,
      full_name: data.full_name,
      token: data.token,
      offline_capable: true,
    };
  } catch (error) {
    const localUser = await db.getFirstAsync(
      `SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1`,
      [username]
    );

    if (!localUser) {
      throw new Error(error.message || "Network error and no cached user found");
    }

    if (localUser.password_plain && localUser.password_plain !== password) {
      throw new Error("Invalid password");
    }

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