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
    <View style={styles.notificationCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.priorityIndicator, getPriorityIndicatorStyle(item.priority)]} />
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <View style={[styles.priorityBadge, getPriorityBadgeStyle(item.priority)]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          </View>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <View style={styles.cardFooter}>
            <View style={styles.userInfo}>
              <Ionicons name="person-outline" size={14} color="#666" />
              <Text style={styles.userText}>{item.user}</Text>
            </View>
            <View style={styles.timeInfo}>
              <Ionicons name="time-outline" size={14} color="#666" />
              <Text style={styles.timeText}>{item.time}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e3f2fd' }]}>
          <Ionicons name="eye-outline" size={18} color="#2196f3" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ffebee' }]}>
          <Ionicons name="trash-outline" size={18} color="#f44336" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getPriorityIndicatorStyle = (priority) => {
    switch (priority) {
      case "High":
        return { backgroundColor: "#f44336" };
      case "Medium":
        return { backgroundColor: "#ff9800" };
      case "Low":
        return { backgroundColor: "#4caf50" };
      case "Normal":
        return { backgroundColor: "#2196f3" };
      default:
        return { backgroundColor: "#666" };
    }
  };

  const getPriorityBadgeStyle = (priority) => {
    switch (priority) {
      case "High":
        return { backgroundColor: "#ffebee" };
      case "Medium":
        return { backgroundColor: "#fff3e0" };
      case "Low":
        return { backgroundColor: "#e8f5e8" };
      case "Normal":
        return { backgroundColor: "#e3f2fd" };
      default:
        return { backgroundColor: "#f5f5f5" };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <View style={[styles.headerIcon, { backgroundColor: '#fff3e0' }]}>
              <Ionicons name="notifications" size={24} color="#ff9800" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Notificaciones</Text>
              <Text style={styles.headerSubtitle}>Mantente al día con las actualizaciones</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summarySection}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#2196f3' }]}>
              <Ionicons name="notifications" size={20} color="#fff" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>6</Text>
              <Text style={styles.summaryLabel}>Total</Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#f44336' }]}>
              <Ionicons name="mail-unread" size={20} color="#fff" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>3</Text>
              <Text style={styles.summaryLabel}>Sin Leer</Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#e8f5e8' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#4caf50' }]}>
              <Ionicons name="today" size={20} color="#fff" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>5</Text>
              <Text style={styles.summaryLabel}>Hoy</Text>
            </View>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#fff3e0' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: '#ff9800' }]}>
              <Ionicons name="warning" size={20} color="#fff" />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryValue}>1</Text>
              <Text style={styles.summaryLabel}>Alta Prioridad</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Notifications List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Todas las Notificaciones</Text>
        <FlatList
          data={notificationsData}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },

  // Header Styles
  header: {
    backgroundColor: "#fff",
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  settingsButton: {
    padding: 8,
  },

  // Summary Section
  summarySection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryCard: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },

  // List Section
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  list: {
    paddingBottom: 20,
  },

  // Notification Cards
  notificationCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
  notificationMessage: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  timeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
});
