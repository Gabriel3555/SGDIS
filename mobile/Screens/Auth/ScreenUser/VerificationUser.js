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

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.photoBox}>
        {item.photo ? (
          <Image source={{ uri: item.photo }} style={styles.photo} />
        ) : (
          <Ionicons name="image-outline" size={28} color="#aaa" />
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.plate}>{item.plate}</Text>
        <Text style={styles.item}>{item.item}</Text>
        <Text style={[styles.status, getStatusStyle(item.status)]}>{item.status}</Text>
        <Text style={styles.details}>
          {item.method} · {item.location}
        </Text>
        <Text style={styles.details}>
          Verified by {item.verifiedBy} · {item.date}
        </Text>
      </View>
      <TouchableOpacity>
        <Ionicons name="eye-outline" size={22} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const getStatusStyle = (status) => {
    switch (status) {
      case "Found":
        return { color: "green" };
      case "Moved":
        return { color: "blue" };
      case "Not Found":
        return { color: "red" };
      case "Damaged":
        return { color: "orange" };
      default:
        return { color: "#555" };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Item Verification</Text>
      <Text style={styles.subtitle}>Verify the location and status of items</Text>

      {/* Search box */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#777" />
        <TextInput
          style={styles.input}
          placeholder="Enter Plate Number"
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.barcodeButton}>
          <Ionicons name="barcode-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* List */}
      <Text style={styles.sectionTitle}>Verification History</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9fc", padding: 16 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 16 },
  searchBox: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
    elevation: 1,
  },
  input: { flex: 1, marginHorizontal: 8, fontSize: 14 },
  searchButton: {
    backgroundColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  searchText: { color: "#fff", fontSize: 13 },
  barcodeButton: {
    backgroundColor: "#333",
    padding: 6,
    borderRadius: 6,
  },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  list: { paddingBottom: 100 },
  row: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 10,
    elevation: 1,
  },
  photoBox: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  photo: { width: 40, height: 40, borderRadius: 20 },
  info: { flex: 1, marginLeft: 10 },
  plate: { fontSize: 12, fontWeight: "bold", color: "#333" },
  item: { fontSize: 14, color: "#000", marginVertical: 2 },
  status: { fontSize: 13, fontWeight: "600" },
  details: { fontSize: 11, color: "#666" },
});
