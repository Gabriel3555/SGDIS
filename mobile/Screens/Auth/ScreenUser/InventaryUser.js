// src/Screens/Inventary.js
import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const data = [
  {
    id: "1",
    title: "Oficina Principal",
    location: "Edificio A - Piso 1",
    description: "Inventario de la oficina administrativa principal",
    responsable: "SENA Centro de Servicios Financieros",
    totalItems: 45,
    activos: 42,
    mantenimiento: 2,
    valor: "$125.000.000",
    actualizado: "15/1/2024",
  },
  {
    id: "2",
    title: "Laboratorio de Sistemas",
    location: "Edificio B - Piso 2",
    description: "Equipos del laboratorio de sistemas y programación",
    responsable: "SENA Centro de Servicios Financieros",
    totalItems: 78,
    activos: 75,
    mantenimiento: 3,
    valor: "$245.000.000",
    actualizado: "15/1/2024",
  },
  {
    id: "3",
    title: "Biblioteca",
    location: "Edificio C - Piso 1",
    description: "Inventario de equipos y mobiliario de la biblioteca",
    responsable: "SENA Centro de Servicios Financieros",
    totalItems: 32,
    activos: 30,
    mantenimiento: 2,
    valor: "$85.000.000",
    actualizado: "14/1/2024",
  },
  {
    id: "4",
    title: "Oficina Coordinación",
    location: "Edificio A - Piso 2 - Oficina 201",
    description: "Inventario personal del coordinador académico",
    responsable: "Dr. Juan Carlos Pérez",
    totalItems: 15,
    activos: 14,
    mantenimiento: 1,
    valor: "$35.000.000",
    actualizado: "13/1/2024",
  },
];

export default function Inventary() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = data.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.inventoryCard}>
      <View style={styles.cardHeader}>
        <View style={styles.titleSection}>
          <View style={[styles.categoryIcon, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="business" size={20} color="#2196f3" />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardLocation}>{item.location}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: '#e8f5e8' }]}>
          <Ionicons name="checkmark-circle" size={14} color="#4caf50" />
          <Text style={styles.statusText}>Activo</Text>
        </View>
      </View>

      <Text style={styles.cardDescription}>{item.description}</Text>

      <View style={styles.responsibleSection}>
        <Ionicons name="person-outline" size={14} color="#666" />
        <Text style={styles.responsibleText}>{item.responsable}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statItem, { backgroundColor: '#f8f9fa' }]}>
          <Text style={styles.statNumber}>{item.totalItems}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#e8f5e8' }]}>
          <Text style={[styles.statNumber, { color: '#4caf50' }]}>{item.activos}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#fff3e0' }]}>
          <Text style={[styles.statNumber, { color: '#ff9800' }]}>{item.mantenimiento}</Text>
          <Text style={styles.statLabel}>Mantenimiento</Text>
        </View>
        <View style={[styles.statItem, { backgroundColor: '#f3e5f5' }]}>
          <Text style={styles.statNumber}>{item.valor}</Text>
          <Text style={styles.statLabel}>Valor</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.updateInfo}>
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.updateText}>Actualizado: {item.actualizado}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="eye-outline" size={18} color="#2196f3" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#fff3e0' }]}>
            <Ionicons name="create-outline" size={18} color="#ff9800" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ffebee' }]}>
            <Ionicons name="trash-outline" size={18} color="#f44336" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <View style={[styles.headerIcon, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="cube" size={24} color="#2196f3" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Inventarios</Text>
              <Text style={styles.headerSubtitle}>Gestiona los inventarios del sistema</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar inventarios..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Inventory List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  filterButton: {
    padding: 8,
  },

  // Search Section
  searchSection: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },

  // Inventory Cards
  list: {
    padding: 20,
    paddingBottom: 100,
  },
  inventoryCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  cardLocation: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4caf50",
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  responsibleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  responsibleText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    marginHorizontal: 2,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  statLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  updateInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  updateText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#28a745",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
});
