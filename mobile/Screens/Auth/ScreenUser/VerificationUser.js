// src/Screens/Verification.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const data = [
  {
    id: "1",
    plate: "SENA-001-2024",
    item: "Dell OptiPlex 7090 Computer",
    status: "Found",
    method: "Barcode",
    location: "Desk 1 - Main Office",
    verifiedBy: "Maria Garcia",
    date: "15/1/2024",
    photo: null,
  },
  {
    id: "2",
    plate: "SENA-002-2024",
    item: "HP LaserJet Pro M404n Printer",
    status: "Found",
    method: "Manual",
    location: "Auxiliary Desk - Main Office",
    verifiedBy: "Pedro Storage",
    date: "15/1/2024",
    photo: null,
  },
  {
    id: "3",
    plate: "SENA-003-2024",
    item: "Epson PowerLite X41+ Projector",
    status: "Moved",
    method: "Barcode",
    location: "Room 205 - Laboratory",
    verifiedBy: "Carlos Lopez",
    date: "14/1/2024",
    photo: null,
  },
  {
    id: "4",
    plate: "SENA-010-2024",
    item: "Samsung Galaxy Tab A8 Tablet",
    status: "Not Found",
    method: "Manual",
    location: "Not specified",
    verifiedBy: "Ana Rodriguez",
    date: "14/1/2024",
    photo: "https://via.placeholder.com/40",
  },
  {
    id: "5",
    plate: "SENA-007-2024",
    item: "LG 24-inch Monitor",
    status: "Damaged",
    method: "Barcode",
    location: "Laboratory - Station 3",
    verifiedBy: "Maria Garcia",
    date: "13/1/2024",
    photo: null,
  },
];

export default function Verification() {
  const [search, setSearch] = useState("");

  const filteredData = data.filter(item =>
    item.plate.toLowerCase().includes(search.toLowerCase()) ||
    item.item.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View style={styles.verificationCard}>
      <View style={styles.cardHeader}>
        <View style={styles.itemImage}>
          {item.photo ? (
            <Image source={{ uri: item.photo }} style={styles.photo} />
          ) : (
            <View style={[styles.photoPlaceholder, { backgroundColor: '#f5f5f5' }]}>
              <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
          )}
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTop}>
            <View style={styles.plateSection}>
              <Text style={styles.plateNumber}>{item.plate}</Text>
              <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
                <Ionicons name={getStatusIcon(item.status)} size={14} color="#fff" />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.viewButton}>
              <Ionicons name="eye-outline" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <Text style={styles.itemName}>{item.item}</Text>
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Ionicons name="scan-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.method}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.detailText}>{item.location}</Text>
            </View>
          </View>
          <View style={styles.verifierRow}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.verifierText}>
              Verificado por {item.verifiedBy} • {item.date}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Found":
        return { backgroundColor: "#4caf50" };
      case "Moved":
        return { backgroundColor: "#2196f3" };
      case "Not Found":
        return { backgroundColor: "#f44336" };
      case "Damaged":
        return { backgroundColor: "#ff9800" };
      default:
        return { backgroundColor: "#666" };
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Found":
        return "checkmark-circle";
      case "Moved":
        return "arrow-forward-circle";
      case "Not Found":
        return "close-circle";
      case "Damaged":
        return "warning";
      default:
        return "help-circle";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <View style={[styles.headerIcon, { backgroundColor: '#e8f5e8' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#4caf50" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Verificación</Text>
              <Text style={styles.headerSubtitle}>Verifica ubicación y estado de items</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.scanButton}>
            <Ionicons name="scan" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por placa o item..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.barcodeButton}>
          <Ionicons name="barcode-outline" size={20} color="#fff" />
          <Text style={styles.barcodeText}>Escanear</Text>
        </TouchableOpacity>
      </View>

      {/* Verification List */}
      <View style={styles.listSection}>
        <Text style={styles.sectionTitle}>Historial de Verificación</Text>
        <FlatList
          data={filteredData}
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
  scanButton: {
    padding: 8,
  },

  // Search Section
  searchSection: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
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
  barcodeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  barcodeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  // List Section
  listSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  list: {
    paddingBottom: 20,
  },

  // Verification Cards
  verificationCard: {
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
  itemImage: {
    marginRight: 16,
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  photoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  plateSection: {
    flex: 1,
  },
  plateNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  viewButton: {
    padding: 8,
  },
  itemName: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    lineHeight: 22,
  },
  detailsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  detailText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 4,
  },
  verifierRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  verifierText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});
