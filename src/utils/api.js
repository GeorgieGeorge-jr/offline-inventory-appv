import * as SecureStore from "expo-secure-store";

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://172.20.10.2:5001";
console.log("API_BASE_URL =", API_BASE_URL);
export async function getAuthHeaders(extraHeaders = {}) {
  const token = await SecureStore.getItemAsync("auth_token");

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error("EXPO_PUBLIC_API_URL is not configured");
  }
}
// Example:
// export const API_BASE_URL = "http://192.168.1.5:5001";
