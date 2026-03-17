import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { API_BASE_URL } from "../utils/api";

export default function UsersListScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users`);
      const data = await response.json();
      if (response.ok) setUsers(data);
    } catch (error) {
      console.error("Users load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadUsers);
    return unsubscribe;
  }, [navigation]);

  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate("UserDetails", { userId: item.id })}
    >
      <Text style={styles.name}>{item.full_name}</Text>
      <Text style={styles.meta}>@{item.username}</Text>
      <Text style={styles.meta}>Role: {item.role}</Text>
      <Text style={[styles.status, { color: item.is_active ? "#2E7D32" : "#C62828" }]}>
        {item.is_active ? "Active" : "Inactive"}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate("AddUser")}>
          <Text style={styles.addButtonText}>+ Add User</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderUser}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadUsers} />}
        contentContainerStyle={users.length === 0 ? styles.emptyState : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    backgroundColor: "white",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 24, fontWeight: "bold" },
  addButton: {
    backgroundColor: "#6200ee",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: { color: "white", fontWeight: "bold" },
  list: { padding: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  name: { fontSize: 17, fontWeight: "bold" },
  meta: { color: "#666", marginTop: 4 },
  status: { marginTop: 6, fontWeight: "bold" },
  emptyState: { flexGrow: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { color: "#666" },
});