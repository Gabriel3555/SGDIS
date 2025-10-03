// src/Screens/Notifications.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

const notificationsData = [
  {
    id: "1",
    title: "New item added to inventory",
    priority: "Normal",
    message: "The item 'Dell OptiPlex 7090 Computer' was added to Main Office inventory",
    user: "Maria Garcia",
    time: "1h ago",
  },
  {
    id: "2",
    title: "Item removed",
    priority: "High",
    message: "The item 'Epson Projector (SENA-003-2024)' was removed due to irreparable damage",
    user: "Carlos Lopez",
    time: "1h ago",
  },
  {
    id: "3",
    title: "Scheduled maintenance",
    priority: "Normal",
    message: "Preventive maintenance scheduled for 'HP LaserJet Pro' on 18/01/2024",
    user: "Ana Rodriguez",
    time: "1h ago",
  },
  {
    id: "4",
    title: "New user created",
    priority: "Low",
    message: "A new account was created for Pedro Martinez with User role",
    user: "Juan Perez",
    time: "1h ago",
  },
  {
    id: "5",
    title: "Backup completed",
    priority: "Low",
    message: "System automatic backup completed successfully",
    user: "System",
    time: "1h ago",
  },
  {
    id: "6",
    title: "Item requires maintenance",
    priority: "Medium",
    message: "The item 'Air Conditioner (SENA-005-2024)' requires preventive maintenance",
    user: "System",
    time: "1h ago",
  },
];

export default function Notifications() {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={[styles.priority, getPriorityStyle(item.priority)]}>
          {item.priority}
        </Text>
      </View>
      <Text style={styles.message}>{item.message}</Text>
      <View style={styles.footer}>
        <Ionicons name="person-outline" size={14} color="#666" />
        <Text style={styles.meta}>{item.user}</Text>
        <Text style={styles.meta}> · {item.time}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye-outline" size={18} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="delete-outline" size={18} color="red" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return { color: "red" };
      case "Medium":
        return { color: "#eab308" }; // yellow
      case "Low":
        return { color: "green" };
      default:
        return { color: "#555" };
    }
  };

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>6</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>3</Text>
          <Text style={[styles.summaryLabel, { color: "red" }]}>Unread</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>5</Text>
          <Text style={styles.summaryLabel}>Today</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>1</Text>
          <Text style={[styles.summaryLabel, { color: "red" }]}>High Priority</Text>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notificationsData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc", padding: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 4,
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    elevation: 2,
  },
  summaryValue: { fontSize: 18, fontWeight: "bold" },
  summaryLabel: { fontSize: 12, color: "#555" },

  list: { paddingBottom: 100 },
  card: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 14, fontWeight: "600", color: "#000" },
  priority: { fontSize: 12, fontWeight: "bold" },
  message: { marginTop: 6, fontSize: 13, color: "#333" },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  meta: { fontSize: 11, color: "#666", marginLeft: 4 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 6,
  },
  actionButton: {
    marginLeft: 10,
  },
});
